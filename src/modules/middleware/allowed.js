
export const isAuthorized = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {  
      return next(new Error('Authentication required', { cause: 401 }));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new Error(
        `Role ${req.user.role} not authorized. Required: ${allowedRoles.join(', ')}`,
        { cause: 403 }
      ));
    }
    next();  
  };  
};