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
    content?: string;
    fileUrl?: string;
    messageType: 'text' | 'image' | 'file' | 'audio' | 'video';
    delivered: boolean;
    deliveredAt?: Date;
    seen: boolean;
    seenAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    // Frontend only props
    uploadProgress?: number;
    localId?: string;
}

export interface SendMessageData {
    senderId: string;
    receiverId: string;
    content?: string;
    fileUrl?: string;
    messageType?: 'text' | 'image' | 'file' | 'audio' | 'video';
}

export interface TypingData {
    senderId: string;
    receiverId: string;
    isTyping: boolean;
}
