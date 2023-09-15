const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/post');
const userInfoRoute = require('./routes/userInfo');
const healthRoutes = require('./routes/health');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const db = mongoose.connection;
require('./config/passport');
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(
    process.env.MONGO_URI,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
);

db.on('connected', function () {
    console.log('Database is connected');
});

db.on('error', function (err) {
    console.log('Database not connected, error:', err);
});

db.on('disconnected', function () {
    console.log('Database is disconnected');
});

app.use(cors({
    origin: '*'
}));

app.use(session({ secret: process.env.FB_SECRET_KEY, resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use('/api/auth', authRoutes);
app.use('/api/post', postRoutes);
app.use('/api/check', healthRoutes);
app.use('/api', userInfoRoute)


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
