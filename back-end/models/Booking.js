const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        userId: { type: String, default: '' },
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        date: { type: String, required: true },
        time: { type: String, required: true },
        guests: { type: String, required: true },
        discountPercent: { type: Number, default: 30 },
        status: { type: String, default: 'confirmed' }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
