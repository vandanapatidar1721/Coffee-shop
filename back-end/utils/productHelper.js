const path = require('path');
const fs = require('fs');

let productsCache = null;

function loadProducts() {
    if (!productsCache) {
        const productsPath = path.join(__dirname, '..', 'data', 'products.json');
        productsCache = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    }
    return productsCache;
}

function findProduct(id, name) {
    const products = loadProducts();
    if (id != null && id !== '') {
        const byId = products.find((p) => String(p.id) === String(id));
        if (byId) return byId;
    }
    if (name) {
        const normalized = name.trim().toLowerCase();
        return products.find((p) => p.name.trim().toLowerCase() === normalized);
    }
    return null;
}

function resolveProduct({ id, name, price }) {
    const product = findProduct(id, name);
    if (!product) {
        return { valid: false, message: 'Product not found in menu.' };
    }
    const clientPrice = parseFloat(price);
    if (!Number.isNaN(clientPrice) && Math.abs(clientPrice - product.price) > 0.01) {
        return { valid: false, message: 'Product price does not match menu.' };
    }
    return {
        valid: true,
        product: {
            id: String(product.id),
            name: product.name,
            price: product.price,
            image: product.image || ''
        }
    };
}

module.exports = { loadProducts, findProduct, resolveProduct };
