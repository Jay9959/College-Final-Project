export interface User {
    _id: string;
    username: string;
    fullName?: string;
    email: string;
    avatar?: string;
    about?: string;
    isOnline: boolean;
    lastSeen?: Date;
    token?: string;
}

export interface AuthResponse {
    _id: string;
    username: string;
    fullName?: string;
    email: string;
    avatar?: string;
    about?: string;
    isOnline: boolean;
    token: string;
}
