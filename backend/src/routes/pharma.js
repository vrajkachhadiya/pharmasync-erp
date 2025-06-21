const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { auth, checkRole } = require('../middleware/auth');
const User = require('../models/User');
const Order = require('../models/Order');

// Middleware to check if user is pharma
const isPharma = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'pharma') {
      return res.status(403).json({ message: 'Access denied. Pharma companies only.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking pharma status' });
  }
};

// Get pharma dashboard statistics
router.get('/stats', auth, isPharma, async (req, res) => {
  try {
    const pharmaId = req.user.userId;
    
    // Get total products
    const totalProducts = await Product.countDocuments({ pharmaCompany: pharmaId });
    
    // Get low stock products (quantity < 10)
    const lowStockProducts = await Product.countDocuments({
      pharmaCompany: pharmaId,
      quantity: { $lt: 10 }
    });
    
    // Get expiring products (expiry date within next 3 months)
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    const expiringProducts = await Product.countDocuments({
      pharmaCompany: pharmaId,
      expiryDate: { $lte: threeMonthsFromNow }
    });

    // Get category distribution
    const categoryAggregation = await Product.aggregate([
      { $match: { pharmaCompany: pharmaId } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    const categoryDistribution = categoryAggregation.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    // Get stock status
    const stockStatus = {
      inStock: await Product.countDocuments({
        pharmaCompany: pharmaId,
        quantity: { $gte: 10 }
      }),
      lowStock: await Product.countDocuments({
        pharmaCompany: pharmaId,
        quantity: { $lt: 10, $gt: 0 }
      }),
      outOfStock: await Product.countDocuments({
        pharmaCompany: pharmaId,
        quantity: 0
      })
    };

    res.json({
      totalProducts,
      lowStockProducts,
      expiringProducts,
      categoryDistribution,
      stockStatus
    });
  } catch (error) {
    console.error('Error fetching pharma stats:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

// Get all unique medical stores who placed orders for this pharma's products
router.get('/ordered-medicals', auth, checkRole(['pharma']), async (req, res) => {
  try {
    
    const orders = await Order.find({ 
      pharmaCompany: req.user._id,
      status: 'pending'
    })
    .populate('medicalStore', 'companyName contactNumber address')
    .populate('items.product', 'name batchNumber expiryDate')
    .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching ordered medicals:', error);
    res.status(500).json({ message: 'Error fetching ordered medicals' });
  }
});

// Update order status
router.patch('/orders/:orderId/status', auth, checkRole(['pharma']), async (req, res) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findOne({
      _id: req.params.orderId,
      pharmaCompany: req.user._id
    }).populate('items.product');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // If order is being confirmed, update product quantities
    if (status === 'confirmed') {
      for (const item of order.items) {
        const product = item.product;
        if (product.quantity < item.quantity) {
          return res.status(400).json({ 
            message: `Insufficient stock for product ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}` 
          });
        }
        product.quantity -= item.quantity;
        await product.save();
      }
    }

    order.status = status;
    await order.save();

    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status' });
  }
});

module.exports = router; 