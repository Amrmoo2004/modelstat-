// token.js
import jwt from "jsonwebtoken";
import * as dotenv from 'dotenv';

dotenv.config();

export const generate_token = (payload = {}, secretKey, options = { expiresIn: "30m" }) => {
    if (!secretKey) {
        console.error('Token generation error: Missing secret key');
        throw new Error('Secret key is required for token generation');
    }
    console.log(`Generating token with secret: ${secretKey.substring(0, 5)}...`);
    return jwt.sign(payload, secretKey, options);
};

export const verify_token = (token, secretKey) => {
    if (!secretKey) {
        console.error('Token verification error: Missing secret key');
        throw new Error('Secret key is required for token verification');
    }
    console.log(`Verifying token with secret: ${secretKey.substring(0, 5)}...`);
    return jwt.verify(token, secretKey);
};