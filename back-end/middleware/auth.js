const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Please log in to continue.' });
    }

    try {
        const decoded = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
        if (!decoded.userId) {
            return res.status(401).json({ message: 'Please log in to continue.' });
        }
        req.userId = decoded.userId;
        next();
    } catch {
        return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
};

module.exports = { requireAuth };
