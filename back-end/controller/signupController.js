// Temporary in-memory storage
const users = [];

const handleSignup = (req, res) => {
    const { name, lastName, email, phoneNumber } = req.body;

    console.log('Received signup data:', req.body);

    // Validation
    if (!name || !lastName || !email || !phoneNumber) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    // Check if email already exists
    const userExists = users.find(user => user.email === email);
    if (userExists) {
        return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    // Create new user
    const newUser = { name, lastName, email, phoneNumber };
    users.push(newUser);

    console.log('Current users:', users);

    res.status(201).json({
        message: 'Sign-up successful!',
        user: newUser
    });
};

module.exports = { handleSignup };