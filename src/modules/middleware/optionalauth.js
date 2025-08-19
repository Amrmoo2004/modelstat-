import { verify_token } from "../utilities/security/token.js";
import { asynchandler } from "../utilities/response/response.js";
import { UserModel } from '../DB/model/user.model.js';

export const optionalAuth = asynchandler(async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
      return next();
    }

    const decoded = verify_token(token);
    
    const user = await UserModel.findById(decoded.id || decoded.userId || decoded._id);
    
    if (user) {
      req.user = user; 
    }
    
    next();
  } catch (error) {
    console.log('Optional auth - Invalid token, continuing as guest');
    next();
  }
});