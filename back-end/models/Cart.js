const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        image: { type: String, default: '' },
        quantity: { type: Number, default: 1 }
    },
    { _id: false }
);

const cartSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, unique: true },
        items: { type: [cartItemSchema], default: [] },
        total: { type: Number, default: 0 }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);
