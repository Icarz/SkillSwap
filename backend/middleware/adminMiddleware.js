module.exports = (req, res, next) => {
  // Check if user is authenticated and has admin role
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ 
    error: "Forbidden - Admin access required" 
  });
};