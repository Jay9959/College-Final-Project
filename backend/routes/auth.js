const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken, protect } = require('../middleware/auth');
const passport = require('passport');
const sendEmail = require('../utils/sendEmail');

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
const LoginHistory = require('../models/LoginHistory');

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email OR username (input field named 'email' carries the identifier)
        // We use the input 'email' as a generic identifier field
        const identifier = email.trim();

        // Find user by email OR username (case-insensitive)
        const user = await User.findOne({
            $or: [
                { email: { $regex: new RegExp(`^${identifier}$`, 'i') } },
                { username: { $regex: new RegExp(`^${identifier}$`, 'i') } }
            ]
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

        // --- NEW: Save to separate Login History Table ---
        await LoginHistory.create({
            user: user._id,
            email: user.email,
            username: user.username,
            ipAddress: req.ip || req.connection.remoteAddress,
            deviceInfo: req.headers['user-agent']
        });
        // ------------------------------------------------

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

// @route   POST /api/auth/forgot-password
// @desc    Send OTP for password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Please provide an email address' });
        }

        const user = await User.findOne({
            email: { $regex: new RegExp(`^${email}$`, 'i') }
        });

        console.log('Forgot Password request for:', email, 'User found:', !!user);

        if (!user) {
            return res.status(404).json({ message: 'This email is not registered. Please sign up first.' });
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash OTP before saving (optional but recommended, for now storing plain for simplicity as per request)
        // Storing plain OTP for now to keep it simple as requested, but ideally should be hashed
        user.resetPasswordOtp = otp;
        user.resetPasswordOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save();
        console.log('OTP generated and saved for user');

        const message = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4a90e2;">Reset Password OTP</h2>
                <p>You requested a password reset. Here is your OTP code:</p>
                <h1 style="background: #f4f4f4; padding: 10px; text-align: center; letter-spacing: 5px;">${otp}</h1>
                <p>This OTP is valid for 10 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            </div>
        `;

        try {
            console.log('Attempting to send email...');
            await sendEmail({
                email: user.email,
                subject: 'Password Reset OTP',
                html: message
            });
            console.log('Email sent successfully');

            res.status(200).json({ message: 'OTP sent to email' });
        } catch (err) {
            user.resetPasswordOtp = undefined;
            user.resetPasswordOtpExpires = undefined;
            await user.save();
            console.error('Email send error:', err);
            // Return the specific error message to the frontend for debugging
            return res.status(500).json({ message: 'Email could not be sent: ' + (err.message || 'Unknown error') });
        }
    } catch (error) {
        console.error('Forgot Password error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP
// @access  Public
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({
            email: { $regex: new RegExp(`^${email}$`, 'i') },
            resetPasswordOtp: otp,
            resetPasswordOtpExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        res.status(200).json({ message: 'OTP Verified', email });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/reset-password
// @desc    Reset Password
// @access  Public
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, password } = req.body;
        const user = await User.findOne({
            email: { $regex: new RegExp(`^${email}$`, 'i') },
            resetPasswordOtp: otp,
            resetPasswordOtpExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        user.password = password; // Will be hashed by pre-save hook
        user.resetPasswordOtp = undefined;
        user.resetPasswordOtpExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset Password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// QR Code Token Storage (In-Memory)
const qrTokens = new Map();

// @route   POST /api/auth/qr/generate
// @desc    Generate a short-lived QR token for session transfer
// @access  Private
router.post('/qr/generate', protect, (req, res) => {
    try {
        // Generate 6 character random token
        const token = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Store in memory with 2 minute expiration
        qrTokens.set(token, {
            userId: req.user._id,
            expires: Date.now() + 2 * 60 * 1000
        });

        // Cleanup old tokens occasionally (simple strategy)
        if (qrTokens.size > 100) {
            for (const [key, val] of qrTokens.entries()) {
                if (val.expires < Date.now()) qrTokens.delete(key);
            }
        }

        res.json({ token, expiresIn: 120 });
    } catch (error) {
        console.error('QR Generate error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/qr/verify
// @desc    Verify QR token and login
// @access  Public
router.post('/qr/verify', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'Token is required' });
        }

        const session = qrTokens.get(token);

        if (!session) {
            return res.status(400).json({ message: 'Invalid or expired QR code' });
        }

        if (session.expires < Date.now()) {
            qrTokens.delete(token);
            return res.status(400).json({ message: 'QR code has expired' });
        }

        // Token is valid, find user
        const user = await User.findById(session.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Login the user (same as standard login)
        user.isOnline = true;
        await user.save();

        // Remove token to prevent reuse
        qrTokens.delete(token);

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            isOnline: user.isOnline,
            token: generateToken(user._id)
        });

    } catch (error) {
        console.error('QR Verify error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
