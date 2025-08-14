// token.js
import jwt from "jsonwebtoken";
import * as dotenv from 'dotenv';

dotenv.config();

export const generate_token = (payload = {}, secretKey, options = { expiresIn: "30m" }) => {
    if (!secretKey) {
        throw new Error('Secret key is required for token generation');
    }
    return jwt.sign(payload, secretKey, options);
};

export const verify_token = (token) => {
  const decoded = jwt.decode(token);
  
  if (!decoded || !decoded.tokenType) {
    throw new Error('Invalid token: missing tokenType');
  }

  const secret = decoded.tokenType === 'System'
    ? process.env.ACCESS_SYSTEM_TOKEN_SECRET
    : process.env.ACCESS_USER_TOKEN_SECRET;

  return jwt.verify(token, secret);
};
