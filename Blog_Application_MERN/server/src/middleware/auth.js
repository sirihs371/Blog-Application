const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please log in to continue.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'replace_this_with_a_long_random_secret');
    req.user = await User.findById(payload.id).select('_id name email');
    if (!req.user) return res.status(401).json({ message: 'User account not found.' });
    next();
  } catch {
    return res.status(401).json({ message: 'Session expired or invalid. Please log in again.' });
  }
};
