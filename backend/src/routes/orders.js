const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const Order = require('../models/Order');
const Product = require('../models/Product');

// Get all orders (filtered by role)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'pharma') {
      query.pharmaCompany = req.user._id;
    } else if (req.user.role === 'medical_store') {
      query.medicalStore = req.user._id;
    }

    const orders = await Order.find(query)
      .populate('items.product')
      .populate('pharmaCompany', 'companyName email')
      .populate('medicalStore', 'companyName email');
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Get order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product')
      .populate('pharmaCompany', 'companyName email')
      .populate('medicalStore', 'companyName email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user has access to this order
    if (req.user.role !== 'admin' &&
        order.pharmaCompany._id.toString() !== req.user._id.toString() &&
        order.medicalStore._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order' });
  }
});

// Create new order
router.post("/", auth, checkRole(['medical_store']), async (req, res) => {
  try {
    const { pharmaCompany, items } = req.body;

    // Validate required fields
    if (!pharmaCompany || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Invalid order data" });
    }

    // Get product details and validate stock
    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.product}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
        });
      }

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.sellingPrice
      });

      totalAmount += product.sellingPrice * item.quantity;
    }

    // Generate order number
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await Order.countDocuments();
    const orderNumber = `ORD${year}${month}${(count + 1).toString().padStart(4, '0')}`;

    // Create order
    const order = new Order({
      orderNumber,
      pharmaCompany,
      medicalStore: req.user._id,
      items: orderItems,
      totalAmount,
      dueAmount: totalAmount,
      status: 'pending'
    });

    try {
      const savedOrder = await order.save();

      // Update product stock
      for (const item of items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity }
        });
      }

      res.status(201).json(savedOrder);
    } catch (saveError) {
      console.error('Error saving order:', {
        message: saveError.message,
        stack: saveError.stack,
        validationErrors: saveError.errors
      });
      return res.status(400).json({ 
        message: "Error saving order", 
        details: saveError.message 
      });
    }
  } catch (error) {
    console.error('Order creation error:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: "Error creating order",
      details: error.message 
    });
  }
});

// Update order status
router.patch('/:id/status', auth, checkRole(['pharma']), async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id)
      .populate('items.product');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.pharmaCompany.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    // If order is being confirmed, decrease product quantities
    if (status === 'confirmed' && order.status === 'pending') {
      for (const item of order.items) {
        const product = item.product;
        if (product.quantity < item.quantity) {
          return res.status(400).json({ 
            message: `Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}` 
          });
        }
        product.quantity -= item.quantity;
        await product.save();
      }
    }
    
    // If order is being cancelled, restore product quantities
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items) {
        const product = item.product;
        product.quantity += item.quantity;
        await product.save();
      }
    }

    order.status = status;
    if (status === 'delivered') {
      order.deliveryDetails.actualDelivery = new Date();
    }

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status' });
  }
});

// Add payment to order
router.post('/:id/payments', auth, checkRole(['medical_store']), async (req, res) => {
  try {
    const { amount, method, reference } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.medicalStore.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to add payment to this order' });
    }

    order.paymentHistory.push({
      amount,
      date: new Date(),
      method,
      reference
    });

    order.calculateDueAmount();
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error adding payment' });
  }
});

// Update delivery details
router.patch('/:id/delivery', auth, checkRole(['pharma']), async (req, res) => {
  try {
    const { staffName, staffContact, trackingNumber, estimatedDelivery } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.pharmaCompany.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    order.deliveryDetails = {
      ...order.deliveryDetails,
      staffName,
      staffContact,
      trackingNumber,
      estimatedDelivery: new Date(estimatedDelivery)
    };

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error updating delivery details' });
  }
});

// Update payment status for an item in an order
router.patch('/:orderId/items/:itemId/payment', auth, checkRole(['pharma']), async (req, res) => {
  try {
    const { isPaid } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.pharmaCompany.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    const item = order.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found in order' });
    }

    item.isPaid = isPaid;
    await order.save();

    res.json(order);
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Error updating payment status' });
  }
});

module.exports = router; 