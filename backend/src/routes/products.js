const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const Product = require('../models/Product');

// Get all products
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    // If user is a pharma company and accessing their own products page
    if (req.user.role === 'pharma' && req.query.own === 'true') {
      query.pharmaCompany = req.user._id;
    }
    const products = await Product.find(query).populate('pharmaCompany', 'companyName');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product' });
  }
});

// Create a new product
router.post('/', auth, checkRole(['pharma']), async (req, res) => {
  try {
    const product = new Product({
      ...req.body,
      pharmaCompany: req.user._id,
    });
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error creating product' });
  }
});

// Update a product
router.put('/:id', auth, checkRole(['pharma']), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.pharmaCompany.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }
    Object.assign(product, req.body);
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error updating product' });
  }
});

// Delete a product
router.delete('/:id', auth, checkRole(['pharma']), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.pharmaCompany.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }
    await product.remove();
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product' });
  }
});

module.exports = router; 