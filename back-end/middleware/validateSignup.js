const validateSignup = (req, res, next) => {
    const { name, lastName, email, phoneNumber, password } = req.body;

    if (!name || !lastName || !email || !phoneNumber || !password) {
        return res.status(400).json({
            message: 'Name, last name, email, phone number, and password are required.'
        });
    }

    const emailLower = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
        return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    if (password.length < 6) {
        return res.status(400).json({
            message: 'Password must be at least 6 characters.'
        });
    }

    req.body.email = emailLower;
    req.body.name = name.trim();
    req.body.lastName = lastName.trim();
    req.body.phoneNumber = phoneNumber.trim();

    next();
};

module.exports = validateSignup;
