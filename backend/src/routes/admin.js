const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking admin status' });
  }
};

// Get admin dashboard statistics
router.get('/stats', auth, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const activeUsers = await User.countDocuments({ role: { $ne: 'admin' }, isActive: true });
    const blockedUsers = await User.countDocuments({ role: { $ne: 'admin' }, isActive: false });
    
    const roleDistribution = {
      pharma: await User.countDocuments({ role: 'pharma' }),
      medical_store: await User.countDocuments({ role: 'medical_store' })
    };

    // Add usersByRole for charting (excluding admin)
    const usersByRole = await User.aggregate([
      { $match: { role: { $ne: 'admin' } } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    res.json({
      totalUsers,
      activeUsers,
      blockedUsers,
      roleDistribution,
      usersByRole
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

module.exports = router; 