
export const isAuthorized = (allowedRoles = []) => {
  return (req, res, next) => {
    // Check if authUser exists (authentication succeeded)
    if (!req.authUser) {
      return next(new Error('Authentication required', { cause: 401 }));
    }

    // Check if user has required role
    if (!allowedRoles.includes(req.authUser.role)) {
      return next(new Error(
        `Role ${req.authUser.role} not authorized. Required: ${allowedRoles.join(', ')}`,
        { cause: 403 }
      ));
    }
        next();

};
};