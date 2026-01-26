const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

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
