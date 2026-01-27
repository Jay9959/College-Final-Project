const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'mock_client_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_client_secret',
    callbackURL: "http://localhost:5000/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user exists
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
            return done(null, user);
        }

        // Check if user exists with same email, if so, link accounts
        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
            user.googleId = profile.id;
            await user.save();
            return done(null, user);
        }

        // Create new user
        user = await User.create({
            username: profile.displayName.replace(/\s+/g, '') + Math.floor(Math.random() * 1000), // Ensure unique username
            fullName: profile.displayName,
            email: profile.emails[0].value,
            password: 'social-login-' + Math.random().toString(36).slice(-8), // Dummy password
            googleId: profile.id,
            avatar: profile.photos[0]?.value,
            isOnline: true
        });
        done(null, user);
    } catch (err) {
        done(err, null);
    }
}));

// GitHub Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || 'mock_github_id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'mock_github_secret',
    callbackURL: "http://localhost:5000/api/auth/github/callback",
    scope: ['user:email']
}, async (accessToken, refreshToken, profile, done) => {
    // ...
    try {
        let email = profile.emails && profile.emails[0]?.value;
        const username = profile.username;

        // If email is private, we might not get it from GitHub without specific scope/API call
        // For now fallback to a generated email if missing
        if (!email) {
            email = `${username}@github.example.com`;
        }

        let user = await User.findOne({ githubId: profile.id });
        if (user) {
            return done(null, user);
        }

        user = await User.findOne({ email: email });
        if (user) {
            user.githubId = profile.id;
            await user.save();
            return done(null, user);
        }

        user = await User.create({
            username: profile.displayName.replace(/\s+/g, '') + Math.floor(Math.random() * 1000), // Ensure unique username
            fullName: profile.displayName,
            email: email,
            password: 'social-login-' + Math.random().toString(36).slice(-8),
            githubId: profile.id,
            avatar: profile.photos[0]?.value,
            isOnline: true
        });
        done(null, user);
    } catch (err) {
        done(err, null);
    }
}));

// Apple Strategy would go here (requires more complex setup with keys)
// For now we will focus on Google/GitHub as they are standard OAuth2
