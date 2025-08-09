import { verify_token } from "../utilities/security/token.js";
import { UserModel } from "../DB/model/user.model.js";
import { asynchandler } from "../utilities/response/response.js";



export const authUser = asynchandler(async (req, res, next) => {
  try {
    // 1. Extract token safely
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Invalid authorization format' });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token required' });


    const decoded = verify_token(token, process.env.ACCESS_USER_TOKEN_SECRET);
    
    const userExists = await UserModel.exists({ _id: decoded.id });
    if (!userExists) return res.status(401).json({ error: 'User not found' });

    req.authUser = { id: decoded.id, role: decoded.role };
    next();
    
  } catch (error) {
    console.error('Token verification failed:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Malformed token' });
    }
    
    res.status(401).json({ error: 'Invalid token' });
  }
});