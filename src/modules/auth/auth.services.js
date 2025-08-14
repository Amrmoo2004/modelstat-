import { asynchandler } from "../utilities/response/response.js";
import { UserModel } from "../DB/model/user.model.js"; 
import { generatehash } from "../utilities/security/hash.js";
import { successResponse } from "../utilities/response/response.js";
import { comparehash } from "../utilities/security/hash.js";
import { encrypt} from "../utilities/security/enc.js";
import { decrypt } from "../utilities/security/dec.js";
import { generate_token } from "../utilities/security/token.js";
import { OAuth2Client } from 'google-auth-library';
import { login_Credentials } from "../utilities/login_Creadtinals/login.creadtnials.js";
import { mergeCarts } from "../utilities/cart/cartUtils.js";
import { emailevnt } from "../utilities/events/email.events.js";
import { setAuthCookies } from "../utilities/login_Creadtinals/login.creadtnials.js";

const providerEnum = {
  google: "google",
  local: "local"
}

export const roleEnum = {
  USER: 'user',
  ADMIN: 'admin'
} 

export const signup = asynchandler(async (req, res, next) => {
  const { username, email, password, phone ,confirmPassword} = req.body;
  
  
  if (!username || !email || !password || !phone|| !confirmPassword) {
    return next(new Error("All fields are required", { cause: 400 }));
  }

  const existingUser = await UserModel.findOne({ email });
  
  if (existingUser) {
      return next(new Error("Account already exists", { cause: 409 }));
    }
  const user = await UserModel.create({
    username,
    email,
    password: await generatehash({ plaintext: password, saltround: process.env.SALTROUNDS }),
    phone: await encrypt(phone, process.env.encryption_key)
  });


  await mergeCarts(user._id, req.sessionID);

  return successResponse(res, {
    message: "signup successful",
    userId: user._id
  }, 201);
});
export const login = asynchandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new Error("Email and password are required", { cause: 400 }));
  }

  const user = await UserModel.findOne({ email })
    .select('+password +tokenVersion');

  if (!user) {
    return next(new Error("Invalid credentials", { cause: 401 }));
  }

  const isValid = await comparehash(password, user.password);
  if (!isValid) {
    return next(new Error("Invalid credentials", { cause: 401 }));
  }

  const tokenType = user.role === roleEnum.ADMIN ? 'System' : 'User';

  const credentials = login_Credentials(user, res, tokenType);

  setAuthCookies(res, credentials);

  return successResponse(res, {
    user: {
      id: user._id,
      email: user.email,
      role: user.role
    },
    ...credentials,
    message: "Login successful"
  });
});



async function verifygoogleaccount(idToken) {  // Parameter name matches what we use below
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken,  // Using the parameter we received
    audience: process.env.web_client_id, // Make sure this matches your .env
  });
  return ticket.getPayload();
}

export const signupWithGmail = asynchandler(async (req, res, next) => {
  const { idtoken } = req.body; // Note: this is 'idtoken' (lowercase)
  
  // Pass the value correctly
  const payload = await verifygoogleaccount(idtoken); // Passing the value from request body
  const { picture, name, email, email_verified } = payload;

  if (!email_verified) {
    return next(new Error("Email not verified", { cause: 400 }));
  }

  const existinguser = await UserModel.findOne({ email });
  if (existinguser) {
    return next(new Error("User already exists", { cause: 409 }));
  }

  const newuser = await UserModel.create({
    fullname: name,
    email,
    confirmemail: new Date(),
    provider: providerEnum.google,
    picture,
  });
  await mergeCarts(user._id, req.sessionID); // Use 'user' instead of 'newUser'

  return successResponse(res, {
    message: "Google account verified successfully",
    user: {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    },
  }, 200);
});
export const loginWithGmail = asynchandler(async (req, res, next) => {
  const { idtoken } = req.body; // Note: this is 'idtoken' (lowercase)
  
  // Pass the value correctly
  const payload = await verifygoogleaccount(idtoken); // Passing the value from request body
  const { picture, name, email, isVerified: email_verified } = payload;

  if (!email_verified) {
    return next(new Error("Email not verified", { cause: 400 }));
  }

  let user = await UserModel.findOne({ email });
  if (!user) {
    user = await UserModel.create({
      fullname: name,
      email,
      confirmemail: new Date(),
      provider: providerEnum.google,
      picture,
    });
  }

    const credentials = login_Credentials(user, res, tokenType);

await mergeCarts(user._id, req.sessionID); 
  return successResponse(res, {
   credentials,
    message: "Login successful",
   
  });
});
export const verifyEmail = asynchandler(async (req, res, next) => {
  const { email, otp } = req.body;
  
  const user = await UserModel.findOne({ 
    email,
    otpExpires: { $gt: Date.now() }
  });

  if (!user) return next(new Error("Invalid OTP or expired", { cause: 400 }));
  if (user.otp !== otp) return next(new Error("Invalid OTP", { cause: 400 }));
  if (user.isVerified) return next(new Error("Account already verified", { cause: 400 }));

  // Mark as verified
  user.isVerified = true;
  user.verifiedAt = new Date();
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  return successResponse(res, {
    message: "Email verified successfully!"
  });
});
export const resendOtp = asynchandler(async (req, res, next) => {
  const { email } = req.body;
  
  const user = await UserModel.findOne({ email });
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  // Check if already verified
  if (user.isVerified) {
    return next(new Error("Account already verified", { cause: 400 }));
  }

  const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = newOtp;
  user.otpExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  emailevnt.emit("confirmemail", {
    to: email,
    subject: "New Verification Code",
    otp: newOtp,
    username: user.username
  });

  return successResponse(res, {
    message: "New verification code sent"
  });
});

export const sendForgotPassword = asynchandler(async (req, res, next) => {
  const { email } = req.body;
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const user = await UserModel.findOneAndUpdate(
    {
      email: email.toLowerCase().trim(), 
      provider: providerEnum.local,
      deletedAt: { $exists: false } 
    },
    {
      $set: {
        forgotPasswordOtp: await generatehash({ plaintext: otp, saltround: process.env.SALTROUNDS }),
        otpExpires: new Date(Date.now() + 900000) // 15 minutes
      },
      $inc: { otpAttempts: 1 }
    },
    { 
      new: true,
      runValidators: true,
      lean: true,
      select: '-password -__v -tokens'
    }
  );

  if (!user) {
    return next(new Error("No active local user found with this email", { cause: 404 }));
  }

  emailevnt.emit("forgotpassword", {
    to: user.email, 
    subject: "Password Reset OTP",
    otp: otp,
    expiresIn: "15 minutes"
  });

  return successResponse(res, {
    success: true,
    message: "Password reset OTP sent successfully!",
    data: {
      email: user.email, 
      otpExpiresIn: "15 minutes"
    }
  });
});

export const verifyPassword = asynchandler(async (req, res, next) => {
  const { email, otp, password, confirmPassword } = req.body;

  const user = await UserModel.findOne({
  email: { $regex: new RegExp(`^${email}$`, 'i') }, 
  provider: providerEnum.local,
  deletedAt: { $exists: false },
  forgotPasswordOtp: { $exists: true },
  otpExpires: { $gt: new Date() }
});

  if (!user) {
    return next(new Error("No account found with this email", { cause: 404 }));
  }
  if (!user.forgotPasswordOtp || !user.otpExpires) {
    return next(new Error("No password reset request found", { cause: 400 }));
  }

  if (user.otpExpires < new Date()) {
    return next(new Error("OTP has expired. Please request a new one", { cause: 400 }));
  }

  const isOtpValid = await comparehash(otp, user.forgotPasswordOtp);
  if (!isOtpValid) {
    return next(new Error("Invalid OTP", { cause: 400 }));
  }
  if (password !== confirmPassword) {
    return next(new Error("Passwords do not match", { cause: 400 }));
  }
  user.password = await generatehash({ plaintext: password});
  user.forgotPasswordOtp = undefined;
  user.otpExpires = undefined;
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Password updated successfully"
  });
});
