import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { User } from '../models/user.model';
import { Message } from '../models/message.model';

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    getUsers(): Observable<User[]> {
        return this.http.get<User[]>(`${this.apiUrl}/users`);
    }

    getUserById(userId: string): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}/users/${userId}`);
    }

    getMessages(userId: string): Observable<Message[]> {
        return this.http.get<Message[]>(`${this.apiUrl}/messages/${userId}`);
    }

    markMessagesAsRead(senderId: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/messages/read/${senderId}`, {});
    }

    getUnreadCount(): Observable<{ _id: string; count: number }[]> {
        return this.http.get<{ _id: string; count: number }[]>(`${this.apiUrl}/messages/unread/count`);
    }

    uploadFile(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<any>(`${this.apiUrl}/messages/upload`, formData, {
            reportProgress: true,
            observe: 'events'
        });
    }
}
