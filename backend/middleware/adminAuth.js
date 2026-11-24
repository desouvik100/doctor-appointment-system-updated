
const User = require('../models/User');
const requireAdmin = async (req, res, next) => {
  try {
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { requireAdmin };