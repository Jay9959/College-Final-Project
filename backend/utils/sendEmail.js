const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. Validate Environment Variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('CRITICAL ERROR: EMAIL_USER or EMAIL_PASS is missing in environment variables.');
        throw new Error('Server email configuration is missing');
    }

    // Use Brevo SMTP (Reliable, No blocking)
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: false, // true for 465, false for 587
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false
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
