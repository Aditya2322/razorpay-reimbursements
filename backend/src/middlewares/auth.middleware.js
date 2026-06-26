const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');

async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.auth;

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Please log in.',
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(payload.userId);

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found. Please log in again.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Session expired. Please log in again.',
      });
    }
    return res.status(401).json({
      status: 'error',
      message: 'Invalid session. Please log in again.',
    });
  }
}

module.exports = { authenticate };
