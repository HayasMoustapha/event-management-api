
/*
  Auth middleware
*/
const dotenv = require('dotenv');
const axios = require('axios');
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
    const response = await axios.get(`${process.env.USER_SERVICE_URL}/auth/verify-token/${token}`)
    const { user } = response.data
    req.user = user
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  } 
}

module.exports = { auth, authorizeRoles }