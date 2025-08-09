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

const providerEnum = {
  google: "google",
  local: "local"
}

export const roleEnum = {
  USER: 'user',
  ADMIN: 'admin'
} 

export const signup = asynchandler(async (req, res, next) => {
  const { username, email, password ,phone  } = req.body;
  
  if (!username || !email || !password||!phone) {
    return next(new Error("All fields are required", { cause: 400 }));
  }

  const existinguser = await UserModel.findOne({ email });
  if (existinguser) {
    return next(new Error("User already exists", { cause: 409 }));
  }

  const hashpassword = await generatehash({ plaintext: password, hash: 10 });
const encryptphone = await encrypt(password , process.env.encryption_key);
  const user = await UserModel.create({
    username,
    email,
    password: hashpassword
    , phone: encryptphone
  });
await mergeCarts(user._id, req.sessionID); // Use 'user' instead of 'newUser'

  return successResponse(res, {
    id: user._id,
    username: user.username,
    email: user.email
  }, 201);
});

export const login = asynchandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return next(new Error("Email and password are required", { cause: 400 }));
  }

  // Find user with password field explicitly included
  const user = await UserModel.findOne({ 
    email,
    provider: providerEnum.local 
  }).select('+password');

  // Authentication checks
  if (!user) return next(new Error("Invalid credentials", { cause: 401 }));
  if (!user.password) return next(new Error("Account not properly configured", { cause: 401 }));
  
  // Password verification
  const isPasswordValid = await comparehash(password, user.password);
  if (!isPasswordValid) return next(new Error("Invalid credentials", { cause: 401 }));

  // Post-authentication flow
  await mergeCarts(user._id, req.sessionID);
  const tokenType = user.role === roleEnum.ADMIN ? 'System' : 'Bearer';

  // In your auth.services.js login function:
const credentials = login_Credentials(user, res);
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
  const { picture, name, email, email_verified } = payload;

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

  // Corrected token type determination
  const tokenType = user.role === 'admin' ? 'System' : 'Bearer';

  const accessTokenSecret = tokenType === 'System' 
    ? process.env.ACCESS_SYSTEM_TOKEN_SECRET
    : process.env.ACCESS_USER_TOKEN_SECRET;
  
  const refreshTokenSecret = tokenType === 'System'
    ? process.env.REFRESH_SYSTEM_TOKEN_SECRET
    : process.env.REFRESH_USER_TOKEN_SECRET;

  const tokenPayload = { 
    id: user._id.toString(), // Ensure consistent ID format
    role: user.role,
    // Add other necessary claims
  };

  const access_token = generate_token(
    tokenPayload, 
    accessTokenSecret, 
    { }
  );

  const refresh_token = generate_token(
    tokenPayload,
    refreshTokenSecret,
    { expiresIn: '7d' }
  );

  // Set secure HTTP-only cookies
  res.cookie('refresh_token', refresh_token, { 
    httpOnly: true, 
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
await mergeCarts(user._id, req.sessionID); // Use 'user' instead of 'newUser'
  return successResponse(res, {
    access_token,
    refresh_token,
    token_type: tokenType, // Send back the token type
    message: "Login successful",
   
  });
});