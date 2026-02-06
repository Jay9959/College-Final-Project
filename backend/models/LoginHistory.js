const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    email: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    loginTime: {
        type: Date,
        default: Date.now
    },
    ipAddress: {
        type: String,
        default: ''
    },
    deviceInfo: {
        type: String,
        default: ''
    }
});

module.exports = mongoose.model('LoginHistory', loginHistorySchema);
