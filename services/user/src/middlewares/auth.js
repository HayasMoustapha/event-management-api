
/*
  Auth middleware
*/
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const dotenv = require('dotenv');
dotenv.config();

 // Middleware: Role-based authorization
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
      }
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
}

const auth = async function (req, res, next) {
  const token = req.header('Authorization') && req.header('Authorization').split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(payload.id).select('-password');
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = { auth, authorizeRoles }