const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const mongoose = require('mongoose');

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'govsim_secret_2024');

    // If DB is not connected, allow a minimal dev user so routes can operate in-memory
    if (mongoose.connection.readyState !== 1) {
      req.user = { _id: decoded.id };
      return next();
    }

    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch (e) { res.status(401).json({ message: 'Token invalid' }); }
};
