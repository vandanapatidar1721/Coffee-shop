const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const log = (label, message, data = {}) => {
    const time = new Date().toLocaleString('en-IN', { hour12: true });
    console.log(`[${time}] [${label}] ${message}`, Object.keys(data).length ? data : '');
};

const handleSignup = async (req, res) => {
    try {
        const { name, lastName, email, phoneNumber, password } = req.body;
        const loginName = email;

        log('SIGNUP', 'Request received', { email, name, lastName, phoneNumber });

        const emailTaken = await User.findOne({ email });
        if (emailTaken) {
            log('SIGNUP', 'Failed — email already registered', { email });
            return res.status(409).json({ message: 'This email is already registered.' });
        }

        const usernameTaken = await User.findOne({ username: loginName });
        if (usernameTaken) {
            log('SIGNUP', 'Failed — username taken', { email });
            return res.status(409).json({ message: 'This email is already registered.' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            username: loginName,
            password: hashed,
            name,
            lastName,
            email,
            phoneNumber
        });

        log('SIGNUP', 'Success — new account created', {
            userId: newUser._id.toString(),
            email: newUser.email,
            name: newUser.name
        });

        res.status(201).json({
            message: 'Account created! You can log in with your email and password.',
            user: {
                id: newUser._id.toString(),
                email: newUser.email,
                name: newUser.name
            }
        });
    } catch (err) {
        console.error('[SIGNUP] Error:', err.message);
        res.status(500).json({ message: err.message || 'Sign-up failed.' });
    }
};

const handleLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        log('LOGIN', 'Request received', { email: email || '(missing)' });

        if (!email || !password) {
            log('LOGIN', 'Failed — email or password missing');
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const emailLower = email.trim().toLowerCase();
        const user = await User.findOne({ email: emailLower });

        if (!user) {
            log('LOGIN', 'Failed — user not found', { email: emailLower });
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            log('LOGIN', 'Failed — wrong password', { email: emailLower });
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const userId = user._id.toString();
        const token = jwt.sign(
            { userId, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        log('LOGIN', 'Success — user logged in', {
            userId,
            email: user.email,
            name: user.name || ''
        });

        res.status(200).json({
            message: 'Login successful!',
            token,
            userId,
            email: user.email,
            name: user.name
        });
    } catch (err) {
        console.error('[LOGIN] Error:', err.message);
        res.status(500).json({ message: err.message || 'Login failed.' });
    }
};

module.exports = { handleSignup, handleLogin };
