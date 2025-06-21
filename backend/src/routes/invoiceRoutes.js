const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const Order = require('../models/Order');

// Simple test route
router.get('/', (req, res) => {
  res.json({ message: 'Invoice routes working' });
});

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

// Test order route
router.get('/check-order/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ 
      message: 'Order found',
      order: {
        id: order._id,
        orderNumber: order.orderNumber
      }
    });
  } catch (error) {
    console.error('Error checking order:', error);
    res.status(500).json({ message: 'Error checking order' });
  }
});

// Invoice route
router.get('/orders/:orderId', async (req, res) => {
  try {
    await invoiceController.generateInvoice(req, res);
  } catch (error) {
    console.error('Error in invoice route:', error);
    res.status(500).json({ message: 'Error generating invoice' });
  }
});

module.exports = router; 