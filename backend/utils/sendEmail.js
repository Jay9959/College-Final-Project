const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. Validate Environment Variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('CRITICAL ERROR: EMAIL_USER or EMAIL_PASS is missing in environment variables.');
        throw new Error('Server email configuration is missing');
    }

    console.log(`Configuring email transporter for Gmail User: ${process.env.EMAIL_USER}`);

    // Switch to Port 587 with STARTTLS and Force IPv4 (fixes some timeout issues)
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // upgrade later with STARTTLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false
        },
        // Force IPv4 to avoid IPv6 routing issues
        family: 4,
        logger: true,
        debug: true,
        connectionTimeout: 10000,
        greetingTimeout: 10000
    });

    // 2. Verify Connection immediately
    try {
        await transporter.verify();
        console.log('SMTP Connection Verified Successfully');
    } catch (error) {
        console.error('SMTP Connection Verification Failed:', error);
        throw new Error(`Email server connection failed: ${error.message}`);
    }

    const mailOptions = {
        from: `"College Chat App" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.html,
    };

    console.log(`Sending email to: ${options.email}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
};

module.exports = sendEmail;
