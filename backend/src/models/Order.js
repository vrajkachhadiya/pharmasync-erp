const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  isPaid: {
    type: Boolean,
    default: false
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  pharmaCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  medicalStore: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  deliveryDetails: {
    staffName: String,
    staffContact: String,
    trackingNumber: String,
    estimatedDelivery: Date,
    actualDelivery: Date
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'completed'],
    default: 'pending'
  },
  paymentHistory: [{
    amount: Number,
    date: Date,
    method: String,
    reference: String
  }],
  dueAmount: {
    type: Number,
    default: 0
  },
  notes: String
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await this.constructor.countDocuments();
    this.orderNumber = `ORD${year}${month}${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Calculate due amount
orderSchema.methods.calculateDueAmount = function() {
  const totalPaid = this.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
  this.dueAmount = this.totalAmount - totalPaid;
  this.paymentStatus = this.dueAmount === 0 ? 'completed' : 
                      this.dueAmount < this.totalAmount ? 'partial' : 'pending';
};

module.exports = mongoose.model('Order', orderSchema); 