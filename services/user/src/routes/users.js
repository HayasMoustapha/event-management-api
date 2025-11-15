
/*
  Users route - basic CRUD
*/
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const {auth, authorizeRoles} = require('../middlewares/auth');

router.get('/users', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Get users failed' });
  }
});

router.get('/user/:id', auth, authorizeRoles("admin"), async (req, res) => {
 try {
   const user = await User.findById(req.params.id).select('-password');
   if (!user) return res.status(404).json({ message: 'User not found' });
   res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Get user failed' });
  }
});

router.put('/user/:id', auth, authorizeRoles("admin"), async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const updates = req.body;
    if (updates.password) delete updates.password;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'User update failed' });
  }
});

router.delete('/user/:id', auth, authorizeRoles("admin"), async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'User delete failed' });
  }
});

module.exports = router; 
