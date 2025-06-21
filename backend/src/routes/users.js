const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Get all users
router.get('/', auth, checkRole(['admin']), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get user by ID
router.get('/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// Update a user
router.put('/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    Object.assign(user, req.body);
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user' });
  }
});

// Delete a user
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is trying to delete their own profile
    if (user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this profile' });
    }

    // Delete all products associated with the user if they are a pharma company
    if (user.role === 'pharma') {
      await Product.deleteMany({ pharmaCompany: user._id });
    }

    // Delete all orders associated with the user
    await Order.deleteMany({
      $or: [
        { pharmaCompany: user._id },
        { medicalStore: user._id }
      ]
    });

    // Delete the user
    await user.deleteOne();

    res.json({ message: 'User and associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

module.exports = router; 