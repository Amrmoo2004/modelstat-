import { generate_token } from "../security/token.js";

export const login_Credentials = (user, res, tokenType) => {
  const accessSecret = user.role === 'admin' 
    ? process.env.ACCESS_SYSTEM_TOKEN_SECRET
    : process.env.ACCESS_USER_TOKEN_SECRET;

  const refreshSecret = user.role === 'admin'
    ? process.env.REFRESH_SYSTEM_TOKEN_SECRET
    : process.env.REFRESH_USER_TOKEN_SECRET;

  console.log(`Generating ${user.role} token with secret: ${accessSecret.substring(0, 5)}...`);

  const tokenPayload = { 
    id: user._id.toString(),
    role: user.role
  };

  return {
    access_token: generate_token(tokenPayload, accessSecret, { expiresIn: '30m' }),
    refresh_token: generate_token(tokenPayload, refreshSecret, { expiresIn: '7d' }),
    token_type: 'Bearer'
  };
};