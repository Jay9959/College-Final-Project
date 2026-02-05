import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpEventType } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { SocketService } from '../../services/socket.service';
import { ChatService } from '../../services/chat.service';
import { ToastService } from '../../services/toast.service';
import { User } from '../../models/user.model';
import { Message } from '../../models/message.model';
import { environment } from '@environments/environment';
import { ThemeService, Theme } from '../../services/theme.service';

import { CallModalComponent } from '../call-modal/call-modal.component';

@Component({
    selector: 'app-chat',
    standalone: true,
    imports: [CommonModule, FormsModule, CallModalComponent],
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
    showSettings = false;
    settingsView: 'main' | 'chats' | 'general' | 'account' | 'security' | 'request-info' | 'privacy' | 'video-voice' | 'app-lock' | 'media-quality' | 'media-auto-download' | 'notifications' | 'profile' = 'main';
    generalSettings = {
        startAtLogin: false,
        minimizeToTray: true,
        language: 'English',
        fontSize: '100% (default)'
    };
    securitySettings = {
        showNotifications: false
    };
    privacySettings = {
        lastSeen: 'Everyone',
        profilePhoto: 'Everyone',
        about: 'Everyone',
        status: 'My contacts',
        readReceipts: true,
        defaultTimer: 'Off',
        groups: 'Everyone',
        appLock: false,
        blockUnknownMessages: false
    };
    notificationSettings = {
        showBanner: 'Always',
        showTaskbarBadge: 'Always',
        messageNotifications: true,
        showPreviews: true,
        reactionNotifications: true,
        statusReactions: true,
        callNotifications: true,
        incomingCallSounds: true,
        incomingSounds: true,
        outgoingSounds: false,
        messageTone: 'Default',
        groupTone: 'Default'
    };
    videoSettings = {
        cameraDeviceId: '',
        micDeviceId: '',
        speakerDeviceId: ''
    };
    chatSettings = {
        theme: 'System default', // Will be synced with ThemeService
        wallpaper: {
            color: '#0b141a',
            image: null as string | null, // Added image property
            doodles: true
        },
        mediaQuality: 'Standard',
        autoDownload: {
            photos: true,
            audio: true,
            videos: true,
            documents: true
        },
        spellCheck: true,
        replaceEmoji: true,
        enterIsSend: true
    };

    // --- App Lock State ---
    isAppLocked = false;
    showSetPasswordModal = false;
    showPasswordSetModal = false;
    appLockPassword = ''; // In a real app, hash this!
    tempPassword = '';
    tempConfirmPassword = '';

    // --- Wallpaper Picker State ---
    showWallpaperModal = false;

    // Predefined Wallpapers Colors (Inspired by WhatsApp)
    wallpaperColors = [
        '#0b141a', // Default Dark
        '#ffffff', // Default Light
        '#e9edef', // WhatsApp Default
        '#d1d7db',
        '#aeac99',
        '#7acba5',
        '#c7e9fa',
        '#adbdcc',
        '#d6d0f0',
        '#cecece',
        '#f2fce5',
        '#fef3bd',
        '#fee2e9',
        '#e1f9f2',
        '#ffe9e6',
        '#fff6d6',
        '#f3f6f9',
        '#2a3942', // Darker slate
        '#622f42', // Deep mauve
        '#1f2c34', // Dark blue-grey
    ];

    notificationTones = ['Default', 'Alert 1', 'Alert 2', 'Alert 3', 'Alert 4', 'Alert 5', 'Alert 6'];
    private notificationAudio = new Audio();

    tempWallpaper: { color: string, image: string | null, doodles: boolean } = {
        color: '#0b141a',
        image: null,
        doodles: true
    };

    currentTheme: Theme = 'system';
    availableDevices: { kind: string, label: string, deviceId: string }[] = [];
    activeNotifDropdown: string | null = null;

    // --- Profile Editing State ---
    isEditingName = false;
    isEditingAbout = false;
    tempProfileName = '';
    tempProfileAbout = '';

    private typingTimeout: any;
    private subscriptions: Subscription[] = [];
    private shouldScrollToBottom = false;

    constructor(
        private authService: AuthService,
        private socketService: SocketService,
        private chatService: ChatService,
        private themeService: ThemeService,
        private router: Router,
        private toastService: ToastService
    ) {
        this.currentTheme = this.themeService.getTheme();
    }

    ngOnInit(): void {
        this.loadSettings();
        if (this.notificationSettings.messageNotifications && "Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission();
        }
        this.applyFontSize();

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

    loadSettings() {
        const savedGeneral = localStorage.getItem('generalSettings');
        if (savedGeneral) {
            this.generalSettings = JSON.parse(savedGeneral);
        }

        const savedSecurity = localStorage.getItem('securitySettings');
        if (savedSecurity) {
            this.securitySettings = JSON.parse(savedSecurity);
        }

        const savedPrivacy = localStorage.getItem('privacySettings');
        if (savedPrivacy) {
            this.privacySettings = JSON.parse(savedPrivacy);
        }

        const savedVideo = localStorage.getItem('videoSettings');
        if (savedVideo) {
            this.videoSettings = JSON.parse(savedVideo);
        }


        const savedChat = localStorage.getItem('chatSettings');
        if (savedChat) {
            this.chatSettings = JSON.parse(savedChat);
        }

        const savedNotif = localStorage.getItem('notificationSettings');
        if (savedNotif) {
            this.notificationSettings = { ...this.notificationSettings, ...JSON.parse(savedNotif) };
        }

        // Sync theme from Service (Source of Truth)
        const currentServiceTheme = this.themeService.getTheme();
        this.currentTheme = currentServiceTheme;

        // Map service theme to UI display text if needed, or just use directly
        if (currentServiceTheme === 'dark') this.chatSettings.theme = 'Dark';
        else if (currentServiceTheme === 'light') this.chatSettings.theme = 'Light';
        else if (currentServiceTheme === 'system') this.chatSettings.theme = 'System default';


        // Load App Lock Password
        const savedPassword = localStorage.getItem('appLockPassword');
        if (savedPassword) {
            this.appLockPassword = savedPassword;
            // If password exists, assume locked on reload for security (optional, but good practice)
            // Or check a "locked" flag if we want to persist the exact state
            const wasLocked = localStorage.getItem('isAppLocked') === 'true';
            if (wasLocked) {
                this.isAppLocked = true;
            }
        }
    }

    saveSettings() {
        localStorage.setItem('generalSettings', JSON.stringify(this.generalSettings));
        localStorage.setItem('securitySettings', JSON.stringify(this.securitySettings));
        localStorage.setItem('privacySettings', JSON.stringify(this.privacySettings));
        localStorage.setItem('videoSettings', JSON.stringify(this.videoSettings));
        localStorage.setItem('chatSettings', JSON.stringify(this.chatSettings));
        localStorage.setItem('notificationSettings', JSON.stringify(this.notificationSettings));
    }

    // --- Wallpaper Methods ---

    onWallpaperFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.tempWallpaper.image = e.target.result;
                this.tempWallpaper.color = '#0b141a'; // Fallback color
            };
            reader.readAsDataURL(file);
        }
    }

    openWallpaperModal() {
        // Initialize temp with current settings
        if (typeof this.chatSettings.wallpaper === 'string') {
            // Handle legacy string value if exists
            this.tempWallpaper = { color: '#0b141a', image: null, doodles: true };
        } else {
            // Ensure image property exists
            this.tempWallpaper = {
                color: this.chatSettings.wallpaper.color || '#0b141a',
                image: (this.chatSettings.wallpaper as any).image || null,
                doodles: this.chatSettings.wallpaper.doodles
            };
        }
        this.showWallpaperModal = true;
        this.showSettings = false; // Hide main settings temporarily
    }

    closeWallpaperModal() {
        this.showWallpaperModal = false;
        this.showSettings = true; // Re-open settings
    }

    selectWallpaperColor(color: string) {
        this.tempWallpaper.color = color;
        this.tempWallpaper.image = null; // Clear image when color selected
    }

    saveWallpaper() {
        this.chatSettings.wallpaper = { ...this.tempWallpaper };
        this.saveSettings();
        this.showWallpaperModal = false;
        this.showSettings = true;
    }

    toggleSecurityNotifications() {
        this.saveSettings();
        const status = this.securitySettings.showNotifications ? 'enabled' : 'disabled';
        this.toastService.show(`Security notifications ${status}`);
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
                console.log('ChatComponent: Loaded messages:', messages);
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
                // If checking the chat with this user
                if (this.selectedUser && msg.sender._id === this.selectedUser._id) {
                    this.messages.push(msg);
                    this.shouldScrollToBottom = true;
                    this.markMessagesAsRead(msg.sender._id);
                    this.socketService.markMessagesSeen([msg._id], msg.sender._id, this.currentUser!._id);

                    // Play 'Incoming Sound' if enabled (even if chat is open, usually a soft sound)
                    if (this.notificationSettings.incomingSounds) {
                        this.playNotificationSound('message'); // Or a generic 'in-chat' sound
                    }
                } else {
                    // Message from someone else (or not in chat)
                    this.handleIncomingNotification(msg);
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


    @ViewChild('callModal') callModal!: CallModalComponent;

    isUserOnline(userId: string): boolean {
        return this.socketService.isUserOnline(userId);
    }

    onVideoCall(): void {
        if (!this.selectedUser || !this.currentUser) return;
        this.callModal.startCall(this.selectedUser._id, this.selectedUser.fullName || this.selectedUser.username, 'video');
    }

    onVoiceCall(): void {
        if (!this.selectedUser || !this.currentUser) return;
        this.callModal.startCall(this.selectedUser._id, this.selectedUser.fullName || this.selectedUser.username, 'audio');
    }

    formatTime(date: Date | string): string {
        return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    getAvatarUrl(avatarPath: string | undefined): string {
        if (!avatarPath) return '';
        if (avatarPath.startsWith('http')) return avatarPath;

        // Normalize path: replace backslashes with forward slashes
        const normalizedPath = avatarPath.replace(/\\/g, '/');

        // Prepend backend URL
        return `${environment.socketUrl}/${normalizedPath}`;
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
            next: () => {
                this.socketService.disconnect();
                this.toastService.success('Logged out successfully');
                this.router.navigate(['/login']);
            },
            error: () => { sessionStorage.clear(); this.router.navigate(['/login']); }
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

    // --- Functional Features ---

    // File / Image Upload
    // File Preview State
    previewFile: File | null = null;
    previewUrl: string | null = null;

    // File / Image Upload
    isUploading = false;
    uploadProgress = 0;
    onChatFileSelected(event: any): void {
        const file: File = event.target.files[0];
        if (!file || !this.selectedUser || !this.currentUser) return;

        // Reset previous preview
        this.previewFile = file;
        this.previewUrl = null;

        // If image or video, create preview URL
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.previewUrl = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    cancelPreview(): void {
        this.previewFile = null;
        this.previewUrl = null;
    }

    confirmSendFile(): void {
        if (!this.previewFile || !this.selectedUser || !this.currentUser) return;

        const file = this.previewFile;
        // Determine type
        let type = 'file';
        if (file.type.startsWith('image/')) {
            type = 'image';
        } else if (file.type.startsWith('video/')) {
            type = 'video';
        } else if (file.type.startsWith('audio/')) {
            type = 'audio';
        }

        // Create a temporary local message to show progress
        const tempLocalId = 'temp-' + Date.now();
        const tempMessage: Message = {
            _id: tempLocalId,
            sender: this.currentUser,
            receiver: this.selectedUser,
            content: type === 'image' ? 'Image' : (type === 'video' ? 'Video' : file.name),
            messageType: type as any,
            fileUrl: this.previewUrl || '', // Use preview URL for immediate display
            delivered: false,
            seen: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            uploadProgress: 0,
            localId: tempLocalId
        };

        // Add to messages list immediately
        this.messages.push(tempMessage);
        this.shouldScrollToBottom = true;

        // Close modal immediately
        this.cancelPreview();

        this.chatService.uploadFile(file).subscribe({
            next: (event: any) => {
                const msgIndex = this.messages.findIndex(m => m.localId === tempLocalId);
                if (msgIndex === -1 && event.type !== HttpEventType.Response) return; // Msg removed?

                if (event.type === HttpEventType.UploadProgress) {
                    if (event.total) {
                        const progress = Math.round(100 * event.loaded / event.total);
                        if (msgIndex !== -1) {
                            this.messages[msgIndex].uploadProgress = progress;
                        }
                    }
                } else if (event.type === HttpEventType.Response) {
                    // Upload complete
                    const res = event.body;
                    console.log('File uploaded:', res);

                    // Remove temp message - socket event will bring the real one
                    // OR better: keep it until socket event replaces it?
                    // For now, let's remove it right before sending socket event to avoid duplication
                    // if the socket event adds a new one.
                    this.messages = this.messages.filter(m => m.localId !== tempLocalId);

                    this.socketService.sendMessage({
                        senderId: this.currentUser!._id,
                        receiverId: this.selectedUser!._id,
                        content: type === 'image' ? 'Image' : (type === 'video' ? 'Video' : file.name),
                        fileUrl: res.fileUrl,
                        messageType: type as any
                    });
                }
            },
            error: (err) => {
                console.error('Upload failed:', err);
                alert('Failed to send file');
                // Remove temp message on error
                this.messages = this.messages.filter(m => m.localId !== tempLocalId);
            }
        });
    }

    // Emoji Picker
    showEmojiPicker = false;
    emojis = [
        '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎',
        '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰',
        '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒',
        '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾',
        '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲',
        '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸',
        '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️',
        '🗯️', '💭', '💤',
        '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉',
        '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟',
        '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩',
        '🦮', '🐕‍🦺', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔', '🐾', '🐉', '🐲',
        '🌵', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🎍', '🎋', '🍃', '🍂', '🍁', '🍄', '🐚', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '🌞', '🌝', '🌛', '🌜',
        '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌙', '🌎', '🌍', '🌏', '🪐', '💫', '⭐', '🌟', '✨', '⚡', '☄️', '💥', '🔥', '🌪️', '🌈', '☀️', '🌤️', '⛅', '🌥️', '☁️',
        '🌦️', '🌧️', '🌨️', '🌩️', '⚡', '❄️', '☃️', '⛄', '🌬️', '💨', '💧', '💦', '☔', '☂️', '🌊', '🌫️',
        '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠',
        '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝',
        '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩',
        '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🍵', '🧃', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊', '🥄', '🍴', '🍽️', '🥣', '🥡', '🥢', '🧂',
        '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️',
        '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️',
        '🎫', '🎟️', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩',
        '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛺', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝',
        '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🛰️', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '⛽', '🚧',
        '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻',
        '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎', '⚖️',
        '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️',
        '🔭', '🔬', '🕳️', '💊', '💉', '🩸', '🧬', '🩺', '🩹', '🌡️', '🧼', '🪒', '🚽', '🚰', '🚿', '🛁', '🛀', '🧹', '🧺', '🧻', '🧽', '🔑', '🗝️', '🛋️', '🪑', '🛌', '🛏️', '🚪',
        '📢', '📣', '🔔', '🔕', '🎵', '🎶',
        '🏧', '🚮', '🚰', '♿', '🚹', '🚺', '🚻', '🚼', '🚾', '🛂', '🛃', '🛄', '🛅', '⚠️', '🚸', '⛔', '🚫', '🚳', '🚭', '🚯', '🚱', '🚷', '📵', '🔞', '☢️', '☣️', '⬆️', '↗️',
        '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️', '↕️', '↔️', '↩️', '↪️', '⤴️', '⤵️', '🔃', '🔄', '🔙', '🔚', '🔛', '🔜', '🔝', '🛐', '⚛️', '🕉️', '✡️', '☸️', '☯️', '✝️', '☦️', '☪️',
        '☮️', '🕎', '🔯', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '⛎', '🔀', '🔁', '🔂', '▶️', '⏩', '⏭️', '⏯️', '◀️', '⏪', '⏮️', '🔼', '⏫', '🔽',
        '⏬', '⏸️', '⏹️', '⏺️', '⏏️', '🎦', '🔅', '🔆', '📶', '📳', '📴', '♀️', '♂️', '⚧️', '✖️', '➕', '➖', '➗', '♾️', '‼️', '⁉️', '❓', '❔', '❕', '❗', '〰️', '💱', '💲', '⚕️',
        '♻️', '⚜️', '🔱', '📛', '🔰', '⭕', '✅', '☑️', '✔️', '❌', '❎', '➰', '➿', '〽️', '✳️', '✴️', '❇️', '™️', '©️', '®️', '〰️', '🔗'
    ];

    toggleEmojiPicker(): void {
        this.showEmojiPicker = !this.showEmojiPicker;
    }

    addEmoji(emoji: string): void {
        this.newMessage += emoji;
        this.showEmojiPicker = false; // Close after pick? user preference
    }

    // Voice Recording
    isRecording = false;
    isInitializing = false; // Guard against multiple clicks
    mediaRecorder: MediaRecorder | null = null;
    audioChunks: Blob[] = [];

    async startRecording(): Promise<void> {
        if (this.isRecording || this.isInitializing) return; // Prevent double start

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            // ... (keep the existing error logic I added in previous step) ...
            if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                alert(
                    '⚠️ Browser Security Block:\n\n' +
                    'Microphone is blocked because you are using an IP address (' + window.location.hostname + ') without HTTPS.\n\n' +
                    'SOLUTIONS:\n' +
                    '1. Use "http://https://college-final-project-1.onrender.com" instead (if on this PC).\n' +
                    '2. OR go to "chrome://flags" -> Enable "Insecure origins treated as secure"\n' +
                    '   and add: ' + window.location.origin
                );
            } else {
                alert('Audio recording not supported or permission denied. Please allow microphone access.');
            }
            return;
        }

        this.isInitializing = true;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Double check if user cancelled while waiting
            if (!this.isInitializing) {
                stream.getTracks().forEach(t => t.stop());
                return;
            }

            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            this.isRecording = true;
            this.isInitializing = false;

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                if (!this.isRecording) return; // Guard against duplicate stops

                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                // Only upload if we have data
                if (audioBlob.size > 0) {
                    const audioFile = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
                    this.uploadAudio(audioFile);
                }

                this.isRecording = false;
                stream.getTracks().forEach(track => track.stop()); // Stop mic
                this.mediaRecorder = null; // Cleanup
            };

            this.mediaRecorder.start();
            console.log('Recording started');
        } catch (err) {
            console.error('Error accessing microphone:', err);
            this.isInitializing = false;
            this.isRecording = false;
        }
    }


    stopRecording(): void {
        if (this.mediaRecorder && this.isRecording && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            // isRecording sets to false inside onstop to ensure sync
        }
    }

    uploadAudio(file: File): void {
        if (!this.selectedUser || !this.currentUser) return;
        this.chatService.uploadFile(file).subscribe({
            next: (res) => {
                this.socketService.sendMessage({
                    senderId: this.currentUser!._id,
                    receiverId: this.selectedUser!._id,
                    content: 'Voice Message',
                    fileUrl: res.fileUrl,
                    messageType: 'audio'
                });
            },
            error: (err) => console.error('Audio upload failed', err)
        });
    }
    // --- Settings & Themes ---
    openSettings(view: 'main' | 'chats' | 'general' | 'account' | 'security' | 'request-info' | 'privacy' | 'video-voice' | 'app-lock' | 'media-quality' | 'media-auto-download' | 'notifications' | 'profile' = 'main') {
        this.showSettings = true;
        this.settingsView = view;
        if (view === 'video-voice') {
            this.loadMediaDevices();
        }
    }

    closeSettings() {
        this.showSettings = false;
    }

    navigateToSettings(view: 'main' | 'chats' | 'general' | 'account' | 'security' | 'request-info' | 'privacy' | 'video-voice' | 'app-lock' | 'media-quality' | 'media-auto-download' | 'notifications' | 'profile') {
        this.settingsView = view;
        this.showSettings = true;
        if (view === 'video-voice') {
            this.loadMediaDevices();
        }
    }

    selectTheme(theme: Theme) {
        this.themeService.setTheme(theme);
        this.currentTheme = theme;

        // Update chatSettings display
        if (theme === 'dark') this.chatSettings.theme = 'Dark';
        else if (theme === 'light') this.chatSettings.theme = 'Light';
        else if (theme === 'system') this.chatSettings.theme = 'System default';

        this.saveSettings();
    }

    applyFontSize() {
        const size = this.generalSettings.fontSize;
        let zoomLevel = '100%';

        if (size === '125%') zoomLevel = '125%';
        if (size === '150%') zoomLevel = '150%';

        // Apply to body
        (document.body.style as any).zoom = zoomLevel;
    }

    async loadMediaDevices() {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true, video: true }); // Request permissions
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.availableDevices = devices.map(d => ({
                kind: d.kind,
                label: d.label || `${d.kind} (${d.deviceId.slice(0, 5)}...)`,
                deviceId: d.deviceId
            }));
        } catch (err) {
            console.error('Error fetching devices', err);
        }
    }

    get audioInputDevices() { return this.availableDevices.filter(d => d.kind === 'audioinput'); }
    get audioOutputDevices() { return this.availableDevices.filter(d => d.kind === 'audiooutput'); }
    get videoInputDevices() { return this.availableDevices.filter(d => d.kind === 'videoinput'); }

    // --- App Lock Logic ---

    // Triggered when user toggles "Enable app lock"
    toggleAppLock(event: any) {
        if (this.privacySettings.appLock) {
            // User wants to enable it -> Show set password modal
            // Reset temp vars
            this.tempPassword = '';
            this.tempConfirmPassword = '';
            this.showSetPasswordModal = true;
        } else {
            // User wants to disable it -> Remove password
            this.appLockPassword = '';
            localStorage.removeItem('appLockPassword');
            localStorage.removeItem('isAppLocked');
            this.saveSettings();
        }
    }

    closeSetPasswordModal() {
        this.showSetPasswordModal = false;
        // Revert toggle if they cancelled
        if (!this.appLockPassword) {
            this.privacySettings.appLock = false;
        }
    }

    confirmSetPassword() {
        if (!this.tempPassword || !this.tempConfirmPassword) {
            alert('Please enter a password.');
            return;
        }
        if (this.tempPassword.length < 6) {
            alert('Password must be at least 6 characters.');
            return;
        }
        if (this.tempPassword !== this.tempConfirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        // Save password
        this.appLockPassword = this.tempPassword;
        localStorage.setItem('appLockPassword', this.appLockPassword);

        this.showSetPasswordModal = false;
        this.showPasswordSetModal = true; // Show success
        this.saveSettings();
    }

    // --- Media Auto-Download Logic ---
    shouldShowMedia(message: Message): boolean {
        // If it's my own message, always show
        if (message.sender._id === this.currentUser?._id) return true;

        // If manually downloaded, show
        if (message.isManuallyDownloaded) return true;

        const type = message.messageType;
        const settings = this.chatSettings.autoDownload;

        if (type === 'image' && settings.photos) return true;
        if (type === 'video' && settings.videos) return true;
        if (type === 'audio' && settings.audio) return true;
        if (type === 'file' && settings.documents) return true;

        // Note: Voice messages (audio with specific flag usually, but here just 'audio')
        // WhatsApp says "Voice messages are always automatically downloaded". 
        // If we want to strictly follow that, we need to distinguish voice notes from audio files.
        // For now, treat all 'audio' as subject to the toggle, or we can force true if we had a way to know.
        // Let's stick to the toggle for now as per user request for "Audio" toggle.

        return false;
    }

    downloadMedia(message: Message) {
        message.isManuallyDownloaded = true;
        // In a real app, this might trigger a fetch if the URL was a placeholder. 
        // Here we just reveal the content.
    }

    downloadFile(fileUrl?: string) {
        if (!fileUrl) return;
        const url = this.getAvatarUrl(fileUrl);
        window.open(url, '_blank');
    }

    resetAutoDownloadSettings() {
        this.chatSettings.autoDownload = {
            photos: true,
            audio: true,
            videos: true,
            documents: true
        };
        this.saveSettings();
    }

    // --- Notification Logic ---

    handleIncomingNotification(msg: Message) {
        // 1. Play Sound
        if (this.notificationSettings.messageNotifications) {
            // Differentiate Group vs Private if possible. detailed group logic depends on message structure.
            // For now assuming private 'message' tone.
            this.playNotificationSound('message');
        }

        // 2. Show System Notification
        if (this.notificationSettings.messageNotifications && this.notificationSettings.showBanner !== 'Never') {
            this.showBrowserNotification(msg);
        }
    }

    playNotificationSound(type: 'message' | 'group') {
        const tone = type === 'group' ? this.notificationSettings.groupTone : this.notificationSettings.messageTone;
        if (tone === 'None') return;

        // Map 'Alert 1' etc to generic sounds or a default
        // Using a generic pleasant notification sound for 'Default' or any Alert for now
        // In a real app, you'd map names to specific asset URLs
        let soundUrl = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'; // Default Bell

        // Example mapping (placeholders)
        if (tone === 'Alert 1') soundUrl = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';
        if (tone === 'Alert 2') soundUrl = 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3';

        this.notificationAudio.src = soundUrl;
        this.notificationAudio.play().catch((e: any) => console.warn('Audio play failed', e));
    }

    // --- Custom Dropdown Methods ---

    toggleNotifDropdown(dropdownName: string, event: Event) {
        event.stopPropagation();
        if (this.activeNotifDropdown === dropdownName) {
            this.activeNotifDropdown = null;
        } else {
            this.activeNotifDropdown = dropdownName;
        }
    }

    selectNotifSetting(settingKey: string, value: any) {
        (this.notificationSettings as any)[settingKey] = value;
        this.saveSettings();
        this.activeNotifDropdown = null;
    }

    @HostListener('document:click')
    closeNotifDropdowns() {
        this.activeNotifDropdown = null;
    }

    showBrowserNotification(msg: Message) {
        if (!("Notification" in window)) return;

        if (Notification.permission === "granted") {
            const title = msg.sender.username || 'New Message';
            const body = this.notificationSettings.showPreviews ? msg.content || 'Sent a file' : 'New Message';

            const notification = new Notification(title, {
                body: body,
                icon: 'assets/icons/icon-128x128.png', // Ensure this exists or use logic
                silent: true // We play our own sound
            });

            notification.onclick = () => {
                window.focus();
                // Logic to select user could go here
                notification.close();
            };
        }
    }

    // --- Profile Methods ---
    startEditName() {
        this.isEditingName = true;
        this.tempProfileName = this.currentUser?.username || '';
    }

    saveName() {
        if (!this.tempProfileName.trim() || this.tempProfileName === this.currentUser?.username) {
            this.isEditingName = false;
            return;
        }

        this.authService.updateProfile({ username: this.tempProfileName }).subscribe({
            next: (updatedUser) => {
                this.isEditingName = false;
                this.toastService.show('Name updated successfully');
            },
            error: (err) => {
                console.error('Failed to update name', err);
                this.toastService.show('Failed to update name', 'error');
            }
        });
    }

    cancelEditName() {
        this.isEditingName = false;
    }

    startEditAbout() {
        this.isEditingAbout = true;
        this.tempProfileAbout = this.currentUser?.about || '';
    }

    saveAbout() {
        if (this.tempProfileAbout === this.currentUser?.about) {
            this.isEditingAbout = false;
            return;
        }

        this.authService.updateProfile({ about: this.tempProfileAbout }).subscribe({
            next: (updatedUser) => {
                this.isEditingAbout = false;
                this.toastService.show('About updated successfully');
            },
            error: (err) => {
                console.error('Failed to update about', err);
                this.toastService.show('Failed to update about', 'error');
            }
        });
    }

    cancelEditAbout() {
        this.isEditingAbout = false;
    }

    refreshProfile() {
        this.authService.getProfile().subscribe();
    }

    closePasswordSetModal() {
        this.showPasswordSetModal = false;
    }

    lockApp() {
        this.isAppLocked = true;
        localStorage.setItem('isAppLocked', 'true');
        this.showPasswordSetModal = false; // Just in case
    }

    unlockApp() {
        // We'll bind the input in the UI to a temp variable, say 'tempPassword' or a new one
        // For simplicity, let's reuse 'tempPassword' for the unlock input too, 
        // OR better, use a dedicated one to avoid confusion.
        if (this.tempPassword === this.appLockPassword) {
            this.isAppLocked = false;
            localStorage.removeItem('isAppLocked');
            this.tempPassword = ''; // Clear input
        } else {
            alert('Incorrect password');
        }
    }

    // Helper for the locked screen input
    unlockPasswordInput = '';
    isPasswordVisible = false;

    togglePasswordVisibility() {
        this.isPasswordVisible = !this.isPasswordVisible;
    }

    attemptUnlock() {
        if (this.unlockPasswordInput === this.appLockPassword) {
            this.isAppLocked = false;
            localStorage.removeItem('isAppLocked');
            this.unlockPasswordInput = '';
            this.isPasswordVisible = false; // Reset visibility
        } else {
            // Shake effect or error
            alert('Incorrect password'); // Simple fallback
        }
    }

    // --- Theme Modal Logic ---
    showThemeModal = false;
    tempTheme = 'System default';

    openThemeModal() {
        this.tempTheme = this.chatSettings.theme;
        this.showThemeModal = true;
    }

    closeThemeModal() {
        this.showThemeModal = false;
    }

    applyTheme() {
        let themeToSet: Theme = 'system';
        if (this.tempTheme === 'Dark') themeToSet = 'dark';
        else if (this.tempTheme === 'Light') themeToSet = 'light';
        else if (this.tempTheme === 'System default') themeToSet = 'system';

        this.selectTheme(themeToSet);
        this.closeThemeModal();
    }
}
