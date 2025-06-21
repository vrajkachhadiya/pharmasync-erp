const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

// Middleware to check if user is medical store
const isMedicalStore = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'medical_store') {
      return res.status(403).json({ message: 'Access denied. Medical stores only.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking medical store status' });
  }
};

// Get medical store dashboard statistics
router.get('/stats', auth, isMedicalStore, async (req, res) => {
  try {
    const storeId = req.user.userId;
    
    // Get total products
    const totalProducts = await Product.countDocuments({ medicalStore: storeId });
    
    // Get low stock products (quantity < 10)
    const lowStockProducts = await Product.countDocuments({
      medicalStore: storeId,
      quantity: { $lt: 10 }
    });
    
    // Get expiring products (expiry date within next 3 months)
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    const expiringProducts = await Product.countDocuments({
      medicalStore: storeId,
      expiryDate: { $lte: threeMonthsFromNow }
    });

    // Get supplier distribution
    const supplierAggregation = await Product.aggregate([
      { $match: { medicalStore: storeId } },
      { $group: { _id: '$pharmaCompany', count: { $sum: 1 } } }
    ]);
    
    const supplierDistribution = supplierAggregation.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    // Get inventory status
    const inventoryStatus = {
      inStock: await Product.countDocuments({
        medicalStore: storeId,
        quantity: { $gte: 10 }
      }),
      lowStock: await Product.countDocuments({
        medicalStore: storeId,
        quantity: { $lt: 10, $gt: 0 }
      }),
      outOfStock: await Product.countDocuments({
        medicalStore: storeId,
        quantity: 0
      })
    };

    res.json({
      totalProducts,
      lowStockProducts,
      expiringProducts,
      supplierDistribution,
      inventoryStatus
    });
  } catch (error) {
    console.error('Error fetching medical store stats:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

module.exports = router; 