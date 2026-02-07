const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. Validate Environment Variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('CRITICAL ERROR: EMAIL_USER or EMAIL_PASS is missing in environment variables.');
        throw new Error('Server email configuration is missing');
    }

    console.log(`Configuring email transporter for Gmail User: ${process.env.EMAIL_USER}`);

    // Use built-in 'gmail' service with Connection Pooling
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        pool: true, // Use pooled connections
        maxConnections: 1, // Limit distinct connections to avoid blocks
        rateLimit: 1, // Limit sending rate
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        }
    });

    // SKIP explicit 'verify' call to avoid timeouts on initial connection check
    // Direct send is sometimes more reliable on restricted networks

    const mailOptions = {
        from: `"College Chat App" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.html,
    };

    console.log(`Sending email to: ${options.email}`);
    // Just send it - let sendMail handle the connection logic
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
};

module.exports = sendEmail;
