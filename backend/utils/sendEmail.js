const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Use 'gmail' service for simplicity and reliability with Gmail accounts
    console.log(`Configuring email transporter for Gmail User: ${process.env.EMAIL_USER}`);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        }
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
