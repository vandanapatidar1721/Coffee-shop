const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        image: { type: String, default: '' },
        quantity: { type: Number, default: 1 }
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, index: true },
        items: { type: [orderItemSchema], default: [] },
        total: { type: Number, required: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
