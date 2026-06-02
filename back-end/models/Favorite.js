const mongoose = require('mongoose');

const favItemSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: String, default: '' },
        image: { type: String, default: '' }
    },
    { _id: false }
);

const favoriteSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, unique: true },
        items: { type: [favItemSchema], default: [] }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Favorite', favoriteSchema);
