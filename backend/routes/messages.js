const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ChatFile = require('../models/ChatFile');

// Configure Multer (Memory Storage)
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// @route   POST /api/messages/upload
// @desc    Upload a file for chat (Stored in MongoDB)
// @access  Private
router.post('/upload', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        // Create new ChatFile document
        const newFile = new ChatFile({
            filename: req.file.originalname,
            mimetype: req.file.mimetype,
            data: req.file.buffer,
            size: req.file.size,
            uploader: req.user._id
        });

        const savedFile = await newFile.save();

        // Return a URL that points to the file serving route
        // We use a relative path that the frontend will prepend with base URL
        const fileUrl = `api/messages/file/${savedFile._id}`;

        res.json({
            message: 'File uploaded successfully',
            fileUrl: fileUrl,
            filename: req.file.originalname,
            mimetype: req.file.mimetype
        });
    } catch (error) {
        console.error('Upload file error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/messages/file/:id
// @desc    Serve a file from MongoDB
// @access  Public (or Private if you want strict security)
router.get('/file/:id', async (req, res) => {
    try {
        const file = await ChatFile.findById(req.params.id);
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        res.set('Content-Type', file.mimetype);
        res.send(file.data);
    } catch (error) {
        console.error('File serve error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/messages/:userId
// @desc    Get chat history with a specific user
// @access  Private
router.get('/:userId', protect, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: req.user._id, receiver: req.params.userId },
                { sender: req.params.userId, receiver: req.user._id }
            ]
        })
            .sort({ createdAt: 1 })
            .populate('sender', 'username avatar')
            .populate('receiver', 'username avatar');

        res.json(messages);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

// @route   PUT /api/messages/read/:senderId
// @desc    Mark all messages from a sender as read
// @access  Private
router.put('/read/:senderId', protect, async (req, res) => {
    try {
        const result = await Message.updateMany(
            {
                sender: req.params.senderId,
                receiver: req.user._id,
                seen: false
            },
            {
                $set: {
                    seen: true,
                    seenAt: new Date()
                }
            }
        );

        res.json({
            message: 'Messages marked as read',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

// @route   PUT /api/messages/delivered/:messageId
// @desc    Mark a message as delivered
// @access  Private
router.put('/delivered/:messageId', protect, async (req, res) => {
    try {
        const message = await Message.findByIdAndUpdate(
            req.params.messageId,
            {
                delivered: true,
                deliveredAt: new Date()
            },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        res.json(message);
    } catch (error) {
        console.error('Mark delivered error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

// @route   GET /api/messages/unread/count
// @desc    Get unread message count per user
// @access  Private
router.get('/unread/count', protect, async (req, res) => {
    try {
        const unreadCounts = await Message.aggregate([
            {
                $match: {
                    receiver: req.user._id,
                    seen: false
                }
            },
            {
                $group: {
                    _id: '$sender',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json(unreadCounts);
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

module.exports = router;
