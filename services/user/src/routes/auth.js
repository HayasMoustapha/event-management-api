
/*
  Auth routes (register / login)
*/
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already used' });
    const user = new User({ name, email, password, role });
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log('New user registered');
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log('User logged in');
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
});

router.get('/auth/verify-token/:token', async (req, res) => {
  try { 
    const token = req.params.token
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('-password');
    res.status(200).json({ valid: true, user: user });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
}); 

module.exports = router;
 