const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const dotenv = require('dotenv');
const User = require('../models/Users');
dotenv.config();

const verifyToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).send('Unauthorized');

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).send('Unauthorized');

    jwt.verify(token, process.env.FB_SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Failed to authenticate token.' });
        }
        req.userId = decoded.id;
        next();
    });
};

router.get('/user-info', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ "name": user.name, "username": user.username, "createdAt": user.createdAt });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


module.exports = router;