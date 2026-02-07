const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const isSecure = process.env.EMAIL_PORT == 465;

    console.log(`Configuring email transporter: Host=${process.env.EMAIL_HOST}, Port=${process.env.EMAIL_PORT}, Secure=${isSecure}, User=${process.env.EMAIL_USER}`);

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: isSecure, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false // Helps with self-signed certs or strict firewall rules in some cloud envs
        },
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000,
        socketTimeout: 10000
    });

    const mailOptions = {
        from: `"Chat App" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.html,
    };

    console.log('Sending mail to:', options.email);
    const info = await transporter.sendMail(mailOptions);
    console.log('Mail info:', info.messageId);
};

module.exports = sendEmail;
