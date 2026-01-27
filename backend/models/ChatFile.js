const mongoose = require('mongoose');

const chatFileSchema = new mongoose.Schema({
    filename: String,
    mimetype: String,
    data: Buffer,
    size: Number,
    uploader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('ChatFile', chatFileSchema);
