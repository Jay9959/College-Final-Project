const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken, protect } = require('../middleware/auth');
const passport = require('passport');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({
                message: userExists.email === email ? 'Email already registered' : 'Username already taken'
            });
        }

        // Create new user
        const user = await User.create({
            username,
            email,
            password
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                token: generateToken(user._id)
            });
        }
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email OR username (input field named 'email' carries the identifier)
        // We use the input 'email' as a generic identifier field
        const user = await User.findOne({
            $or: [{ email: email }, { username: email }]
        }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Update user online status
        user.isOnline = true;
        await user.save();

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            isOnline: user.isOnline,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
// Helper for Mock Login (Development Mode)
const handleMockLogin = async (res, provider) => {
    try {
        const mockEmail = `mock_${provider.toLowerCase()}@example.com`;
        const mockUsername = `Mock${provider}User`;

        let user = await User.findOne({ email: mockEmail });
        if (!user) {
            user = await User.create({
                username: mockUsername + Math.floor(Math.random() * 1000),
                email: mockEmail,
                password: 'mock-pass-' + Math.random(),
                isOnline: true,
                avatar: `https://ui-avatars.com/api/?name=${provider}&background=random`
            });
        }

        const token = generateToken(user._id);
        const frontendUrl = process.env.CLIENT_URL || 'http://localhost:4200';
        return res.redirect(`${frontendUrl}/login?token=${token}`);
    } catch (error) {
        console.error('Mock login error:', error);
        res.status(500).json({ message: 'Mock login failed' });
    }
};

// Google Auth Routes
router.get('/google', (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'mock_client_id') {
        console.log('Using Mock Google Login');
        return handleMockLogin(res, 'Google');
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', session: false }),
    (req, res) => {
        const token = generateToken(req.user._id);
        const frontendUrl = process.env.CLIENT_URL || 'http://localhost:4200';
        res.redirect(`${frontendUrl}/login?token=${token}`);
    }
);

// GitHub Auth Routes
router.get('/github', (req, res, next) => {
    if (!process.env.GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID === 'mock_github_id') {
        console.log('Using Mock GitHub Login');
        return handleMockLogin(res, 'GitHub');
    }
    passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
});

router.get('/github/callback',
    passport.authenticate('github', { failureRedirect: '/login', session: false }),
    (req, res) => {
        const token = generateToken(req.user._id);
        const frontendUrl = process.env.CLIENT_URL || 'http://localhost:4200';
        res.redirect(`${frontendUrl}/login?token=${token}`);
    }
);

// Apple Auth Routes
router.get('/apple', (req, res) => {
    // Always mock Apple for now
    console.log('Using Mock Apple Login');
    return handleMockLogin(res, 'Apple');
});

router.post('/logout', async (req, res) => {
    try {
        const { userId } = req.body;

        if (userId) {
            await User.findByIdAndUpdate(userId, {
                isOnline: false,
                lastSeen: new Date()
            });
        }

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            isOnline: user.isOnline,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error('Get Me error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
