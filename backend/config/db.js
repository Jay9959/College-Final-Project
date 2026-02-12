const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 20000,
            socketTimeoutMS: 45000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        console.error('---------------------------------------------------');
        console.error('⚠️  CONNECTION FAILED: Check your MongoDB Atlas IP Whitelist');
        console.error('   Your current IP address needs to be whitelisted.');
        console.error('   Go to: https://cloud.mongodb.com/ > Network Access');
        console.error('---------------------------------------------------');
        process.exit(1);
    }
};

module.exports = connectDB;
