const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const Message = require('../models/Message');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { name, description, members, avatar } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Group name is required' });
        }

        // Members should be an array of user IDs
        let groupMembers = [req.user._id]; // Add admin by default
        if (members && Array.isArray(members)) {
            groupMembers = [...new Set([...groupMembers, ...members])];
        }

        const newGroup = new Group({
            name,
            description,
            admin: req.user._id,
            members: groupMembers,
            avatar: avatar || ''
        });

        const savedGroup = await newGroup.save();

        // Populate members details for the response
        const populatedGroup = await Group.findById(savedGroup._id)
            .populate('members', 'username avatar isOnline')
            .populate('admin', 'username avatar');

        res.status(201).json(populatedGroup);
    } catch (error) {
        console.error('Create group error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/groups
// @desc    Get user's groups
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const groups = await Group.find({ members: req.user._id })
            .populate('members', 'username avatar isOnline')
            .populate('admin', 'username avatar')
            .populate('lastMessage')
            .sort({ updatedAt: -1 });

        res.json(groups);
    } catch (error) {
        console.error('Get groups error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/groups/:groupId/add
// @desc    Add members to a group
// @access  Private
router.put('/:groupId/add', protect, async (req, res) => {
    try {
        const { members } = req.body; // Array of user IDs
        const groupId = req.params.groupId;

        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if requester is admin (optional, depending on requirements)
        // if (group.admin.toString() !== req.user._id.toString()) {
        //     return res.status(401).json({ message: 'Not authorized to add members' });
        // }

        // Add new members
        const newMembers = members.filter(memberId => !group.members.includes(memberId));
        group.members.push(...newMembers);

        await group.save();

        const updatedGroup = await Group.findById(groupId)
            .populate('members', 'username avatar')
            .populate('admin', 'username avatar');

        res.json(updatedGroup);

    } catch (error) {
        console.error('Add members error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/groups/:groupId/leave
// @desc    Leave a group
// @access  Private
router.put('/:groupId/leave', protect, async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Remove user from members
        group.members = group.members.filter(member => member.toString() !== req.user._id.toString());

        // If group is empty, maybe delete it? or if admin leaves, assign new admin?
        // For now, if admin leaves and there are other members, reassign first member as admin
        if (group.admin.toString() === req.user._id.toString() && group.members.length > 0) {
            group.admin = group.members[0];
        }

        await group.save();

        res.json({ message: 'Left group successfully', groupId });

    } catch (error) {
        console.error('Leave group error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/groups/:groupId/messages
// @desc    Get messages for a group
// @access  Private
router.get('/:groupId/messages', protect, async (req, res) => {
    try {
        const messages = await Message.find({ group: req.params.groupId })
            .populate('sender', 'username avatar')
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        console.error('Get group messages error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
