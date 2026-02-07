const User = require('../models/User'); // Fixed casing
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // Use case-sensitive search if needed, or stick to what was there. 
        // The previous code used simple findOne({ email }). 
        // The existing auth.js uses regex for case insensitivity. 
        // I'll stick to the user's implementation but fix the style.
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
        await user.save();

        const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`; // Changed FRONTEND_URL to CLIENT_URL as per .env

        // Use the existing transport config pattern or the 'service: gmail' fix we established
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER, // Changed from EMAIL to EMAIL_USER as per .env
                pass: process.env.EMAIL_PASS  // Changed from EMAIL_PASSWORD to EMAIL_PASS as per .env
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Password Reset",
            html: `<p>Click below to reset password:</p>
             <a href="${resetLink}">${resetLink}</a>`
        });

        res.status(200).json({ message: "Reset link sent to email" });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = forgotPassword;
