const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  batchNumber: {
    type: String,
    required: true,
    unique: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  manufacturer: {
    type: String,
    required: true
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true
  },
  description: String,
  pharmaCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  stockAlerts: {
    lowStock: {
      type: Number,
      default: 10
    },
    outOfStock: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for efficient searching
productSchema.index({ name: 'text', manufacturer: 'text', category: 'text' });

// Virtual for checking if product is low in stock
productSchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.stockAlerts.lowStock;
});

// Virtual for checking if product is out of stock
productSchema.virtual('isOutOfStock').get(function() {
  return this.quantity <= this.stockAlerts.outOfStock;
});

module.exports = mongoose.model('Product', productSchema); 