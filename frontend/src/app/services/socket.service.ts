import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '@environments/environment';
import { Message, SendMessageData, TypingData } from '../models/message.model';

@Injectable({
    providedIn: 'root'
})
export class SocketService {
    private socket: Socket | null = null;
    private onlineUsersSubject = new BehaviorSubject<string[]>([]);
    public onlineUsers$ = this.onlineUsersSubject.asObservable();

    constructor() { }

    connect(userId: string): void {
        if (this.socket?.connected) {
            return;
        }

        this.socket = io(environment.socketUrl, {
            transports: ['websocket', 'polling'],
            autoConnect: true
        });

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket?.id);
            this.socket?.emit('join-user', userId);
        });

        this.socket.on('online-users', (users: string[]) => {
            this.onlineUsersSubject.next(users);
        });

        this.socket.on('user-status-change', (data: { userId: string; isOnline: boolean }) => {
            const currentUsers = this.onlineUsersSubject.value;
            if (data.isOnline) {
                if (!currentUsers.includes(data.userId)) {
                    this.onlineUsersSubject.next([...currentUsers, data.userId]);
                }
            } else {
                this.onlineUsersSubject.next(currentUsers.filter(id => id !== data.userId));
            }
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    sendMessage(data: SendMessageData): void {
        this.socket?.emit('send-message', data);
    }

    onMessageSent(): Observable<Message> {
        return new Observable(observer => {
            this.socket?.on('message-sent', (message: Message) => {
                observer.next(message);
            });
        });
    }

    onReceiveMessage(): Observable<Message> {
        return new Observable(observer => {
            this.socket?.on('receive-message', (message: Message) => {
                observer.next(message);
            });
        });
    }

    sendTyping(data: TypingData): void {
        this.socket?.emit('typing', data);
    }

    onUserTyping(): Observable<{ userId: string; isTyping: boolean }> {
        return new Observable(observer => {
            this.socket?.on('user-typing', (data: { userId: string; isTyping: boolean }) => {
                observer.next(data);
            });
        });
    }

    markMessagesSeen(messageIds: string[], senderId: string, seenBy: string): void {
        this.socket?.emit('message-seen', { messageIds, senderId, seenBy });
    }

    onMessagesSeen(): Observable<{ messageIds: string[]; seenBy: string; seenAt: Date }> {
        return new Observable(observer => {
            this.socket?.on('messages-seen', (data) => {
                observer.next(data);
            });
        });
    }

    onMessageDelivered(): Observable<{ messageId: string; deliveredAt: Date }> {
        return new Observable(observer => {
            this.socket?.on('message-delivered', (data) => {
                observer.next(data);
            });
        });
    }

    isUserOnline(userId: string): boolean {
        return this.onlineUsersSubject.value.includes(userId);
    }

    isConnected(): boolean {
        return !!this.socket?.connected;
    }
}
