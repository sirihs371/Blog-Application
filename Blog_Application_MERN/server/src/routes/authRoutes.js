const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  next();
};
const tokenFor = user => jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'replace_this_with_a_long_random_secret', { expiresIn: '7d' });

router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters.'),
  body('email').isEmail().withMessage('Enter a valid email address.'),
  body('password').isLength({ min: 6 }).withMessage('Password must contain at least 6 characters.')
], validate, async (req, res, next) => {
  try {
    const name = req.body.name.trim();
    const email = req.body.email.toLowerCase().trim();
    if (await User.findOne({ email })) return res.status(409).json({ message: 'An account with this email already exists.' });
    const password = await bcrypt.hash(req.body.password, 12);
    const user = await User.create({ name, email, password });
    res.status(201).json({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) { next(e); }
});

router.post('/login', [
  body('email').isEmail().withMessage('Enter a valid email address.'),
  body('password').notEmpty().withMessage('Password is required.')
], validate, async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email.toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }
    res.json({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) { next(e); }
});

router.get('/me', auth, (req, res) => res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email } }));
module.exports = router;
