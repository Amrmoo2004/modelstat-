import { verify_token } from "../utilities/security/token.js";
import { UserModel } from "../DB/model/user.model.js";
import { asynchandler } from "../utilities/response/response.js";
import jwt from "jsonwebtoken";


export const authUser = asynchandler(async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Invalid authorization format' });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token required' });

    // Decode without verification first to check the role
    const unverified = jwt.decode(token);
    if (!unverified) return res.status(401).json({ error: 'Invalid token format' });

    // Select secret based on role
    const secret = unverified.role === 'admin' 
      ? process.env.ACCESS_SYSTEM_TOKEN_SECRET 
      : process.env.ACCESS_USER_TOKEN_SECRET;

    console.log(`Verifying ${unverified.role} token with secret: ${secret.substring(0, 5)}...`);

    const decoded = verify_token(token, secret);
    
    const userExists = await UserModel.exists({ _id: decoded.id });
    if (!userExists) return res.status(401).json({ error: 'User not found' });

    req.authUser = decoded;
    next();
    
  } catch (error) {
    console.error('Authentication error:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(401).json({ 
      error: 'Authentication failed',
      details: error.message.includes('signature') 
        ? 'Token verification failed - possible secret mismatch' 
        : error.message
    });
  }
});