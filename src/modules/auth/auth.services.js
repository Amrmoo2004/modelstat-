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

const providerEnum = {
  google: "google",
  local: "local"
}

export const roleEnum = {
  USER: 'user',
  ADMIN: 'admin'
} 

export const signup = asynchandler(async (req, res, next) => {
  const { username, email, password, phone } = req.body;
  
  
  if (!username || !email || !password || !phone) {
    return next(new Error("All fields are required", { cause: 400 }));
  }

  const existingUser = await UserModel.findOne({ email });
  
  if (existingUser) {
    if (existingUser.isVerified) {
      return next(new Error("Account already verified and exists", { cause: 409 }));
    }
    await UserModel.deleteOne({ _id: existingUser._id });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const user = await UserModel.create({
    username,
    email,
    password: await generatehash({ plaintext: password, saltround: process.env.SALTROUNDS }),
    phone: await encrypt(phone, process.env.encryption_key),
    otp,
    otpExpires: new Date(Date.now() + 15 * 60 * 1000)
  });

  emailevnt.emit("confirmemail", {
    to: email,
    subject: "Verify Your Email",
    otp,
    username
  });

  await mergeCarts(user._id, req.sessionID);

  return successResponse(res, {
    message: "Verification OTP sent to your email",
    userId: user._id
  }, 201);
});

export const login = asynchandler(async (req, res, next) => {
  const { email, password } = req.body;
 

  if (!email || !password) {
    return next(new Error("Email and password are required", { cause: 400 }));
  }

  const user = await UserModel.findOne({ 
    email,
    provider: providerEnum.local 
  }).select('+password ');

  

  // Authentication checks
  if (!user) return next(new Error("Invalid credentials", { cause: 401 }));
  if (!user.password) return next(new Error("Account not properly configured", { cause: 401 }));

  await mergeCarts(user._id, req.sessionID);
const tokenType = user.role === roleEnum.ADMIN ? 'System' : 'User';


const credentials = login_Credentials(user, res, tokenType);

  return successResponse(res, {
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