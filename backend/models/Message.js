const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        trim: true
    },
    fileUrl: {
        type: String
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'file', 'audio', 'video', 'call_log'],
        default: 'text'
    },
    fileData: {
        type: Buffer // Store file binary data
    },
    fileName: {
        type: String // Store original filename
    },
    mimeType: {
        type: String // Store mime type for serving
    },
    delivered: {
        type: Boolean,
        default: false
    },
    deliveredAt: {
        type: Date
    },
    seen: {
        type: Boolean,
        default: false
    },
    seenAt: {
        type: Date
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    }
}, {
    timestamps: true
});

// Index for efficient querying of conversations
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
