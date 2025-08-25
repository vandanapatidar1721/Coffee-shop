const express = require('express');
const cors = require('cors');
const signupRoutes = require('./routes/signupRoutes.js');

const app = express();
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount signup route
app.use('/signup', signupRoutes);

// Start server
app.listen(PORT, () => {
    console.log({PORT});
});