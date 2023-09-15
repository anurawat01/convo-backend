const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/Users');
const router = express.Router();
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const passport = require('passport');
require('../config/passport');
dotenv.config();


router.get('/facebook', passport.authenticate('facebook'));

router.get('/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/api/auth/facebook/error' }),
    (req, res) => {
        const token = req.user.accessToken;
        res.send(`<script>
            window.opener.postMessage({ token: "${token}", status: "success" }, "*");
            window.close();
        </script>`);
    }
);

router.get('/facebook/error', (req, res) => {
    res.send('Error logging in via Facebook..')
});

router.post('/register', async (req, res) => {
    try {
        const { name, username, password } = req.body;
        if (!name || !username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = new User({ name, username, password: hashedPassword });
        await user.save();
        res.json({ message: 'User registered' });
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user._id }, process.env.FB_SECRET_KEY);
        res.json({ token });
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});


module.exports = router;
