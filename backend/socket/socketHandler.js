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
                const { senderId, receiverId, content, messageType = 'text', fileUrl } = data;

                // Save message to database
                const message = await Message.create({
                    sender: senderId,
                    receiver: receiverId,
                    content,
                    messageType,
                    fileUrl
                });

                // Populate sender and receiver info
                await message.populate('sender', 'username avatar');
                await message.populate('receiver', 'username avatar');

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
    });
};

module.exports = socketHandler;
