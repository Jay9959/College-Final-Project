import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '@environments/environment';
import { User, AuthResponse } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = environment.apiUrl;
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient) {
        this.loadUserFromStorage();
    }

    private loadUserFromStorage(): void {
        const userJson = sessionStorage.getItem('user');
        if (userJson) {
            try {
                const user = JSON.parse(userJson);
                this.currentUserSubject.next(user);
            } catch {
                sessionStorage.removeItem('user');
                sessionStorage.removeItem('token');
            }
        }
    }

    register(username: string, email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, {
            username,
            email,
            password
        }).pipe(
            tap(response => this.handleAuthResponse(response))
        );
    }

    login(email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, {
            email,
            password
        }).pipe(
            tap(response => this.handleAuthResponse(response))
        );
    }

    private handleAuthResponse(response: AuthResponse): void {
        const user: User = {
            _id: response._id,
            username: response.username,
            email: response.email,
            avatar: response.avatar,
            isOnline: response.isOnline,
            token: response.token
        };
        sessionStorage.setItem('user', JSON.stringify(user));
        sessionStorage.setItem('token', response.token);
        this.currentUserSubject.next(user);
        this.currentUserSubject.next(user);
    }

    uploadAvatar(file: File): Observable<{ message: string, avatar: string }> {
        const formData = new FormData();
        formData.append('avatar', file);

        return this.http.post<{ message: string, avatar: string }>(`${this.apiUrl}/users/upload-avatar`, formData)
            .pipe(
                tap(response => {
                    const currentUser = this.currentUserSubject.value;
                    if (currentUser) {
                        const updatedUser = { ...currentUser, avatar: response.avatar };
                        sessionStorage.setItem('user', JSON.stringify(updatedUser)); // Update local storage
                        this.currentUserSubject.next(updatedUser); // Update observable
                    }
                })
            );
    }

    logout(): Observable<any> {
        const user = this.currentUserSubject.value;
        return this.http.post(`${this.apiUrl}/auth/logout`, {
            userId: user?._id
        }).pipe(
            tap(() => {
                sessionStorage.removeItem('user');
                sessionStorage.removeItem('token');
                this.currentUserSubject.next(null);
            })
        );
    }

    isLoggedIn(): boolean {
        return !!sessionStorage.getItem('token');
    }

    getToken(): string | null {
        return sessionStorage.getItem('token');
    }

    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }

    getProfile(): Observable<AuthResponse> {
        return this.http.get<AuthResponse>(`${this.apiUrl}/auth/me`).pipe(
            tap(response => this.handleAuthResponse(response))
        );
    }
    forgotPassword(email: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email });
    }

    verifyOtp(email: string, otp: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/verify-otp`, { email, otp });
    }

    resetPassword(email: string, otp: string, password: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/reset-password`, { email, otp, password });
    }
}
