const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    console.log('Creating transporter with user:', process.env.EMAIL_USER);
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
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
