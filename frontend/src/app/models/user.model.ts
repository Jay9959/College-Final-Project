export interface User {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
    isOnline: boolean;
    lastSeen?: Date;
    token?: string;
}

export interface AuthResponse {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
    isOnline: boolean;
    token: string;
}
