const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/Users');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
dotenv.config();

passport.use(new FacebookStrategy({
    clientID: process.env.FB_CLIENT_ID,
    clientSecret: process.env.FB_SECRET_KEY,
    callbackURL: process.env.FB_CALLBACK_URL
    },
    async function (accessToken, refreshToken, profile, done) {

        const existingUser = await User.findOne({ username: profile.id });
        if (existingUser) {
            existingUser.accessToken = accessToken;
            return done(null, existingUser);
        }

        const newUser = new User({
            username: profile.id,
            name: profile.displayName,
            token: jwt.sign(profile.id, process.env.FB_SECRET_KEY)
        });
        newUser.accessToken = accessToken;
        await newUser.save();
        done(null, newUser);
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});
