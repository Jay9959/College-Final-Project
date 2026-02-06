const Message = require('../models/Message');
const User = require('../models/User');

// Store online users: { odId: socketId }
const onlineUsers = new Map();

const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // User joins with their userId
        socket.on('join-user', async (userId) => {
            try {
                onlineUsers.set(userId, socket.id);
                socket.userId = userId;

                // Update user online status in database
                await User.findByIdAndUpdate(userId, {
                    isOnline: true,
                    socketId: socket.id
                });

                // Broadcast online status to all connected clients
                io.emit('user-status-change', {
                    userId,
                    isOnline: true
                });

                // Send current online users list to the newly connected user
                const onlineUsersList = Array.from(onlineUsers.keys());
                socket.emit('online-users', onlineUsersList);

                console.log(`User ${userId} joined. Online users:`, onlineUsersList);
            } catch (error) {
                console.error('Join user error:', error);
            }
        });

        // Handle sending messages
        socket.on('send-message', async (data) => {
            try {
                const { senderId, receiverId, content, messageType = 'text', fileUrl, replyToId } = data;

                // Save message to database
                const message = await Message.create({
                    sender: senderId,
                    receiver: receiverId,
                    content,
                    messageType,
                    fileUrl,
                    replyTo: replyToId || null
                });

                // Populate sender and receiver info
                await message.populate('sender', 'username avatar');
                await message.populate('receiver', 'username avatar');

                if (message.replyTo) {
                    await message.populate({
                        path: 'replyTo',
                        populate: { path: 'sender', select: 'username avatar fullName' }
                    });
                }

                // Check if receiver is online
                const receiverSocketId = onlineUsers.get(receiverId);

                if (receiverSocketId) {
                    // Send message to receiver
                    io.to(receiverSocketId).emit('receive-message', message);

                    // Mark as delivered since receiver is online
                    message.delivered = true;
                    message.deliveredAt = new Date();
                    await message.save();

                    // Notify sender about delivery
                    socket.emit('message-delivered', {
                        messageId: message._id,
                        deliveredAt: message.deliveredAt
                    });
                }

                // Send confirmation back to sender
                socket.emit('message-sent', message);

            } catch (error) {
                console.error('Send message error:', error);
                socket.emit('message-error', { error: 'Failed to send message' });
            }
        });

        // Handle typing indicator
        socket.on('typing', (data) => {
            const { senderId, receiverId, isTyping } = data;
            const receiverSocketId = onlineUsers.get(receiverId);

            if (receiverSocketId) {
                io.to(receiverSocketId).emit('user-typing', {
                    userId: senderId,
                    isTyping
                });
            }
        });

        // Handle message seen
        socket.on('message-seen', async (data) => {
            try {
                const { messageIds, senderId, seenBy } = data;

                // Update messages as seen in database
                await Message.updateMany(
                    { _id: { $in: messageIds } },
                    {
                        seen: true,
                        seenAt: new Date()
                    }
                );

                // Notify the original sender that messages were seen
                const senderSocketId = onlineUsers.get(senderId);
                if (senderSocketId) {
                    io.to(senderSocketId).emit('messages-seen', {
                        messageIds,
                        seenBy,
                        seenAt: new Date()
                    });
                }
            } catch (error) {
                console.error('Message seen error:', error);
            }
        });

        // Handle message reactions
        socket.on('message-reaction', async (data) => {
            try {
                const { messageId, emoji, userId, receiverId } = data;

                // TODO: Update in database if needed
                // For now, just broadcast to the receiver
                const receiverSocketId = onlineUsers.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('receive-reaction', {
                        messageId,
                        emoji,
                        userId
                    });
                }
            } catch (error) {
                console.error('Message reaction error:', error);
            }
        });

        // Call Log (Missed/Ended)
        socket.on('call-log', async (data) => {
            console.log('SERVER: Received call-log event:', data);
            const { to, type, duration, callType } = data; // type: 'missed' | 'ended'

            if (!socket.userId) {
                console.error('SERVER: Socket userId not found!');
                return;
            }

            const senderId = socket.userId;
            console.log(`SERVER: Sender: ${senderId}, Receiver: ${to}, Type: ${type}`);

            try {
                let content = '';
                if (type === 'missed') {
                    content = `Missed ${callType || 'video'} call`;
                } else if (type === 'ended') {
                    content = `Call ended • ${duration || '0s'}`;
                }

                const newMessage = new Message({
                    sender: senderId,
                    receiver: to,
                    messageType: 'call_log',
                    content: content,
                    delivered: onlineUsers.has(to),
                    deliveredAt: onlineUsers.has(to) ? new Date() : null
                });

                await newMessage.save();
                console.log('SERVER: Call log saved successfully:', newMessage._id);

                const populatedMessage = await Message.findById(newMessage._id)
                    .populate('sender', 'username avatar fullName')
                    .populate('receiver', 'username avatar fullName');

                // Emit to sender
                socket.emit('message', populatedMessage);

                // Emit to receiver
                const receiverSocketId = onlineUsers.get(to);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('message', populatedMessage);
                    console.log('SERVER: Call log sent to receiver');
                } else {
                    console.log('SERVER: Receiver is not online');
                }

            } catch (error) {
                console.error('Error saving call log:', error);
            }
        });

        // Handle disconnect
        socket.on('disconnect', async () => {
            try {
                const userId = socket.userId;

                if (userId) {
                    onlineUsers.delete(userId);

                    // Update user offline status in database
                    await User.findByIdAndUpdate(userId, {
                        isOnline: false,
                        lastSeen: new Date(),
                        socketId: ''
                    });

                    // Broadcast offline status to all connected clients
                    io.emit('user-status-change', {
                        userId,
                        isOnline: false,
                        lastSeen: new Date()
                    });

                    console.log(`User ${userId} disconnected`);
                }
            } catch (error) {
                console.error('Disconnect error:', error);
            }
        });

        // Handle reconnection
        socket.on('reconnect-user', async (userId) => {
            if (userId) {
                onlineUsers.set(userId, socket.id);
                socket.userId = userId;

                await User.findByIdAndUpdate(userId, {
                    isOnline: true,
                    socketId: socket.id
                });

                io.emit('user-status-change', {
                    userId,
                    isOnline: true
                });
            }
        });

        // --- Call Signaling Events ---

        // 1. Initiate Call (Offer)
        socket.on('call-user', (data) => {
            const { userToCall, signalData, from, name } = data;
            const receiverSocketId = onlineUsers.get(userToCall);

            if (receiverSocketId) {
                io.to(receiverSocketId).emit('call-made', {
                    signal: signalData,
                    from,
                    name
                });
            } else {
                // Notify caller that user is offline/unavailable
                socket.emit('call-failed', { reason: 'User is offline' });
            }
        });

        // 2. Answer Call
        socket.on('make-answer', (data) => {
            const { to, signal } = data;
            const callerSocketId = onlineUsers.get(to);

            if (callerSocketId) {
                io.to(callerSocketId).emit('answer-made', {
                    signal: signal,
                    from: socket.userId // Optional: verify sender
                });
            }
        });

        // 3. ICE Candidates
        socket.on('ice-candidate', (data) => {
            const { to, candidate } = data;
            const peerSocketId = onlineUsers.get(to);

            if (peerSocketId) {
                io.to(peerSocketId).emit('ice-candidate-received', {
                    candidate,
                    from: socket.userId
                });
            }
        });

        // 4. Reject Call
        socket.on('reject-call', (data) => {
            const { to } = data;
            const callerSocketId = onlineUsers.get(to);
            if (callerSocketId) {
                io.to(callerSocketId).emit('call-rejected', {
                    from: socket.userId
                });
            }
        });

        // 5. End Call
        socket.on('end-call', (data) => {
            const { to } = data;
            const peerSocketId = onlineUsers.get(to);
            if (peerSocketId) {
                io.to(peerSocketId).emit('call-ended', {
                    from: socket.userId
                });
            }
        });
    });
};

module.exports = socketHandler;
