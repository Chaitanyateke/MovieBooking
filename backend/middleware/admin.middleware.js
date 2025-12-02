module.exports = function (req, res, next) {
  // The auth.middleware has already run and decoded the token into req.user
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  next();
};