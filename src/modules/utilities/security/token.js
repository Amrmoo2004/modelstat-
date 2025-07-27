import jwt from "jsonwebtoken";
import * as dotenv from 'dotenv';
import { asynchandler } from "../response/response.js";
dotenv.config({  });


export const generate_token = (payload = {}, secretKey = process.env.GET_seckey, options = { expiresIn: "1h" }) => {
    if (!payload || !secretKey) {
throw new Error("Both payload and secret key are required for token generation") 
    }
    return jwt.sign(payload, secretKey, options);
};

export const verify_token =asynchandler( (token,  secretkey=process.env.verify_seckey) => {
   
    return jwt.verify(token, secretkey);
});
