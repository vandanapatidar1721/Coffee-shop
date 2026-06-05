const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const connectDB = async () => {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/coffeeshop';

    await mongoose.connect(uri);
    console.log('MongoDB connected:', uri);

    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
        await User.create({
            username: 'admin',
            email: 'admin@coffeeshop.com',
            password: await bcrypt.hash('admin123', 10),
            name: 'Admin',
            lastName: 'User',
            phoneNumber: ''
        });
        console.log('Default admin user created (admin@coffeeshop.com / admin123)');
    }
};

module.exports = connectDB;
