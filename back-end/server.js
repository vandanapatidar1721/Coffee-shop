require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const contactRoutes = require('./routes/contactRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const cartRoutes = require('./routes/cartRoutes');
const favoritesRoutes = require('./routes/favoritesRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is missing in .env file');
    process.exit(1);
}

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/products', (req, res) => {
    const productsPath = path.join(__dirname, 'data', 'products.json');
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    res.json(products);
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Coffee shop API is running',
        database: 'MongoDB'
    });
});

app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api', authRoutes);

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err.message);
        console.error('Set MONGO_URI in .env (example: mongodb://localhost:27017/coffeeshop)');
        process.exit(1);
    }
};

startServer();
