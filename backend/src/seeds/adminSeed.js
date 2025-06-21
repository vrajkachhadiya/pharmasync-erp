require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmasync');
    console.log('Connected to MongoDB successfully');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@pharmasync.com' });
    
    if (existingAdmin) {
      await User.deleteOne({ email: 'admin@pharmasync.com' });
    }

    // Create admin user
    const adminUser = new User({
      email: 'admin@pharmasync.com',
      password: 'admin123',  // This will be hashed automatically by the User model
      role: 'admin',
      companyName: 'PharmaSync Admin',
      contactNumber: '1234567890',
      address: {
        street: 'Admin Street',
        city: 'Admin City',
        state: 'Admin State',
        pincode: '123456'
      },
      isActive: true
    });

    await adminUser.save();
    
    // Verify the user was created
    const verifyAdmin = await User.findOne({ email: 'admin@pharmasync.com' });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createAdminUser(); 