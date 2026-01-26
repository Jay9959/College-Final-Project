export interface Message {
    _id: string;
    sender: {
        _id: string;
        username: string;
        avatar?: string;
    };
    receiver: {
        _id: string;
        username: string;
        avatar?: string;
    };
    content: string;
    messageType: 'text' | 'image' | 'file';
    delivered: boolean;
    deliveredAt?: Date;
    seen: boolean;
    seenAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface SendMessageData {
    senderId: string;
    receiverId: string;
    content: string;
    messageType?: string;
}

export interface TypingData {
    senderId: string;
    receiverId: string;
    isTyping: boolean;
}
