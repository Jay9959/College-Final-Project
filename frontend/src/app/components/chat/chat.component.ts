import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { SocketService } from '../../services/socket.service';
import { ChatService } from '../../services/chat.service';
import { User } from '../../models/user.model';
import { Message } from '../../models/message.model';
import { environment } from '@environments/environment';

@Component({
    selector: 'app-chat',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './chat.component.html',
    styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
    @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

    currentUser: User | null = null;
    users: User[] = [];
    selectedUser: User | null = null;
    messages: Message[] = [];
    newMessage = '';
    searchQuery = '';
    typingUsers: { [key: string]: boolean } = {};
    private typingTimeout: any;
    private subscriptions: Subscription[] = [];
    private shouldScrollToBottom = false;

    constructor(
        private authService: AuthService,
        private socketService: SocketService,
        private chatService: ChatService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.subscriptions.push(
            this.authService.currentUser$.subscribe(user => {
                this.currentUser = user;
                if (user && !this.socketService.isConnected()) {
                    this.socketService.connect(user._id);
                    this.loadUsers();
                    this.setupSocketListeners();
                }
            })
        );
    }

    ngAfterViewChecked(): void {
        if (this.shouldScrollToBottom) {
            this.scrollToBottom();
            this.shouldScrollToBottom = false;
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
        this.socketService.disconnect();
    }

    get filteredUsers(): User[] {
        if (!this.searchQuery) return this.users;
        return this.users.filter(u => u.username.toLowerCase().includes(this.searchQuery.toLowerCase()));
    }

    loadUsers(): void {
        this.chatService.getUsers().subscribe({
            next: (users) => this.users = users,
            error: (err) => console.error('Failed to load users:', err)
        });
    }

    selectUser(user: User): void {
        this.selectedUser = user;
        this.loadMessages(user._id);
        this.markMessagesAsRead(user._id);
    }

    loadMessages(userId: string): void {
        this.chatService.getMessages(userId).subscribe({
            next: (messages) => {
                this.messages = messages;
                this.shouldScrollToBottom = true;
            },
            error: (err) => console.error('Failed to load messages:', err)
        });
    }

    setupSocketListeners(): void {
        this.subscriptions.push(
            this.socketService.onMessageSent().subscribe(msg => {
                if (this.selectedUser && (msg.receiver._id === this.selectedUser._id || msg.sender._id === this.selectedUser._id)) {
                    this.messages.push(msg);
                    this.shouldScrollToBottom = true;
                }
            }),
            this.socketService.onReceiveMessage().subscribe(msg => {
                if (this.selectedUser && msg.sender._id === this.selectedUser._id) {
                    this.messages.push(msg);
                    this.shouldScrollToBottom = true;
                    this.markMessagesAsRead(msg.sender._id);
                    this.socketService.markMessagesSeen([msg._id], msg.sender._id, this.currentUser!._id);
                }
            }),
            this.socketService.onUserTyping().subscribe(data => this.typingUsers[data.userId] = data.isTyping),
            this.socketService.onMessagesSeen().subscribe(data => {
                this.messages.forEach(m => { if (data.messageIds.includes(m._id)) { m.seen = true; m.seenAt = data.seenAt; } });
            }),
            this.socketService.onMessageDelivered().subscribe(data => {
                const msg = this.messages.find(m => m._id === data.messageId);
                if (msg) { msg.delivered = true; msg.deliveredAt = data.deliveredAt; }
            })
        );
    }

    sendMessage(): void {
        if (!this.newMessage.trim() || !this.selectedUser || !this.currentUser) return;
        this.socketService.sendMessage({ senderId: this.currentUser._id, receiverId: this.selectedUser._id, content: this.newMessage.trim() });
        this.newMessage = '';
        this.socketService.sendTyping({ senderId: this.currentUser._id, receiverId: this.selectedUser._id, isTyping: false });
    }

    onTyping(): void {
        if (!this.selectedUser || !this.currentUser) return;
        if (this.typingTimeout) clearTimeout(this.typingTimeout);
        this.socketService.sendTyping({ senderId: this.currentUser._id, receiverId: this.selectedUser._id, isTyping: true });
        this.typingTimeout = setTimeout(() => {
            this.socketService.sendTyping({ senderId: this.currentUser!._id, receiverId: this.selectedUser!._id, isTyping: false });
        }, 2000);
    }

    markMessagesAsRead(senderId: string): void {
        this.chatService.markMessagesAsRead(senderId).subscribe();
    }

    isUserOnline(userId: string): boolean {
        return this.socketService.isUserOnline(userId);
    }

    formatTime(date: Date | string): string {
        return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    getAvatarUrl(avatarPath: string | undefined): string {
        if (!avatarPath) return '';
        if (avatarPath.startsWith('http')) return avatarPath;
        // Prepend backend URL if it's a relative path
        // Use environment.socketUrl as the base since it points to localhost:5000 (root)
        return `${environment.socketUrl}/${avatarPath}`;
    }

    scrollToBottom(): void {
        try { if (this.messagesContainer) this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight; } catch { }
    }

    onFileSelected(event: any): void {
        const file: File = event.target.files[0];
        if (file) {
            console.log('Uploading file:', file.name);
            this.authService.uploadAvatar(file).subscribe({
                next: (res) => {
                    console.log('Avatar upload response:', res);
                    this.currentUser = { ...this.currentUser!, avatar: res.avatar };
                },
                error: (err) => {
                    console.error('Avatar upload failed:', err);
                    alert('Failed to upload avatar: ' + (err.error?.message || err.message));
                }
            });
        }
    }

    onLogout(): void {
        this.authService.logout().subscribe({
            next: () => { this.socketService.disconnect(); this.router.navigate(['/login']); },
            error: () => { localStorage.clear(); this.router.navigate(['/login']); }
        });
    }

    onAvatarError(): void {
        if (this.currentUser) {
            this.currentUser.avatar = undefined;
        }
    }

    deselectUser(): void {
        this.selectedUser = null;
    }
}
