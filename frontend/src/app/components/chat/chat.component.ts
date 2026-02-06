import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpEventType } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { SocketService } from '../../services/socket.service';
import { ChatService } from '../../services/chat.service';
import { ToastService } from '../../services/toast.service';
import { User } from '../../models/user.model';
import { Message } from '../../models/message.model';
import { environment } from '@environments/environment';
import { ThemeService, Theme } from '../../services/theme.service';
import QRCode from 'qrcode';

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

    // --- Permission Alert State ---
    showPermissionModal = false;
    permissionMessage = '';

    // --- Reply State ---
    replyingToMessage: Message | null = null;

    // --- Context Menu State ---
    showContextMenu = false;
    contextMenuPosition = { x: 0, y: 0 };
    contextMenuMessage: Message | null = null;
    reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

    // --- Full Emoji Picker State (for context menu) ---
    emojiPickerMessage: Message | null = null;

    private typingTimeout: any;
    private subscriptions: Subscription[] = [];
    private shouldScrollToBottom = false;

    // --- Contact Info State ---
    showContactInfo = false;

    // --- Custom Confirm Modal State ---
    showConfirmModal = false;
    confirmTitle = '';
    confirmMessage = '';
    confirmAction: () => void = () => { };

    // --- Message Info Modal State ---
    showMessageInfoModal = false;
    selectedMessageInfo: Message | null = null;

    // --- Link Device (QR) State ---
    showLinkDeviceModal = false;
    qrCodeDataUrl: string | null = null;
    qrCodeExpires: Date | null = null;
    qrLoading = false;

    openLinkDeviceModal() {
        this.showMoreMenu = false; // Close menu if open
        this.showLinkDeviceModal = true;
        this.generateLinkQr();
    }

    closeLinkDeviceModal() {
        this.showLinkDeviceModal = false;
        this.qrCodeDataUrl = null;
    }

    generateLinkQr() {
        this.qrLoading = true;
        this.authService.generateQrToken().subscribe({
            next: (res) => {
                const linkUrl = `${window.location.origin}/mobile-login?token=${res.token}`;
                console.log('Generated Mobile Link:', linkUrl);

                // Using QRCode library to generate data URL
                QRCode.toDataURL(linkUrl, {
                    width: 280,
                    margin: 2,
                    color: {
                        dark: '#111b21',
                        light: '#ffffff'
                    }
                })
                    .then(url => {
                        this.qrCodeDataUrl = url;
                        this.qrLoading = false;
                        // res.expiresIn is in seconds
                        this.qrCodeExpires = new Date(Date.now() + (res.expiresIn * 1000));
                    })
                    .catch(err => {
                        console.error('QR Generation failed', err);
                        this.qrLoading = false;
                        this.toastService.error('Failed to generate QR code');
                    });
            },
            error: (err) => {
                console.error('QR Token fetch failed', err);
                this.qrLoading = false;
                this.toastService.error('Failed to init mobile link');
            }
        });
    }

    constructor(
        private authService: AuthService,
        private socketService: SocketService,
        private chatService: ChatService,
        private themeService: ThemeService,
        private router: Router,
        public toastService: ToastService,
        private cdr: ChangeDetectorRef
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
        forkJoin({
            users: this.chatService.getUsers(),
            groups: this.chatService.getGroups()
        }).subscribe({
            next: ({ users, groups }) => {
                const mappedGroups: User[] = groups.map(g => ({
                    _id: g._id,
                    username: g.name,
                    fullName: g.name,
                    email: '',
                    avatar: g.avatar,
                    isOnline: true,
                    isGroup: true,
                    participants: g.members.map((m: any) => m._id || m)
                }));

                this.users = [...mappedGroups, ...users];

                // Restore last selected user from sessionStorage
                const savedUserId = sessionStorage.getItem('selectedUserId');
                if (savedUserId) {
                    const savedUser = this.users.find(u => u._id === savedUserId);
                    if (savedUser) {
                        this.selectUser(savedUser);
                    }
                }
            },
            error: (err) => console.error('Failed to load users/groups:', err)
        });
    }

    selectUser(user: User): void {
        this.selectedUser = user;
        // Persist selected user ID for page refresh
        sessionStorage.setItem('selectedUserId', user._id);
        // Clear unread count for this user
        user.unreadCount = 0;
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
                console.log('Socket: Message sent confirmed', msg);
                // Check if we have a temporary message for this
                // Since backend doesn't echo localId, we match by content and temporary ID status
                const tempMsgIndex = this.messages.findIndex(m =>
                    m.localId &&
                    m.localId.startsWith('temp-') &&
                    m.content === msg.content &&
                    m.receiver._id === msg.receiver._id
                );

                if (tempMsgIndex !== -1) {
                    // Update the existing temporary message with real data from server
                    this.messages[tempMsgIndex] = { ...this.messages[tempMsgIndex], ...msg, localId: undefined }; // Remove localId
                    this.cdr.detectChanges();
                } else {
                    // If no temp message found (or it was a message from another session/device), push it
                    if (this.selectedUser && (msg.receiver._id === this.selectedUser._id || msg.sender._id === this.selectedUser._id)) {
                        this.messages.push(msg);
                        this.shouldScrollToBottom = true;
                        this.cdr.detectChanges();
                    }
                }
            }),
            this.socketService.onReceiveMessage().subscribe(msg => {
                console.log('Socket: Message received', msg);
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
                    this.cdr.detectChanges();
                } else {
                    // Message from someone else (or not in chat)
                    // Increment unread count for this sender
                    const sender = this.users.find(u => u._id === msg.sender._id);
                    if (sender) {
                        sender.unreadCount = (sender.unreadCount || 0) + 1;
                    }
                    this.handleIncomingNotification(msg);
                }
            }),
            this.socketService.onUserTyping().subscribe(data => {
                this.typingUsers[data.userId] = data.isTyping;
                this.cdr.detectChanges();
            }),
            this.socketService.onMessagesSeen().subscribe(data => {
                this.messages.forEach(m => { if (data.messageIds.includes(m._id)) { m.seen = true; m.seenAt = data.seenAt; } });
                this.cdr.detectChanges();
            }),
            this.socketService.onMessageDelivered().subscribe(data => {
                const msg = this.messages.find(m => m._id === data.messageId);
                if (msg) { msg.delivered = true; msg.deliveredAt = data.deliveredAt; }
                this.cdr.detectChanges();
            }),
            this.socketService.onMessageReaction().subscribe(data => {
                const msg = this.messages.find(m => m._id === data.messageId);
                if (msg) {
                    if (!msg.reactions) msg.reactions = [];
                    const exist = msg.reactions.findIndex(r => r.userId === data.userId);
                    if (exist > -1) {
                        msg.reactions[exist].emoji = data.emoji;
                    } else {
                        msg.reactions.push({ emoji: data.emoji, userId: data.userId });
                    }
                    this.cdr.detectChanges();
                }
            })
        );
    }

    sendMessage(): void {
        if (!this.newMessage.trim() || !this.selectedUser || !this.currentUser) return;

        const content = this.newMessage.trim();
        const tempLocalId = 'temp-' + Date.now();

        // Optimistic UI Update: Create and show message immediately
        const tempMessage: Message = {
            _id: tempLocalId, // Temporary ID
            localId: tempLocalId,
            sender: this.currentUser,
            receiver: this.selectedUser,
            content: content,
            messageType: 'text',
            delivered: false,
            seen: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.messages.push(tempMessage);
        this.shouldScrollToBottom = true;

        // Store current reply for socket call
        const replyToId = this.replyingToMessage?._id;

        this.newMessage = '';
        this.replyingToMessage = null; // Clear reply bar after sending
        this.cdr.detectChanges(); // Force update view

        // Send to server
        this.socketService.sendMessage({
            senderId: this.currentUser._id,
            receiverId: this.selectedUser._id,
            content: content,
            replyToId: replyToId
        });

        this.socketService.sendTyping({ senderId: this.currentUser._id, receiverId: this.selectedUser._id, isTyping: false });
    }

    setReply(message: Message): void {
        this.replyingToMessage = message;
    }

    cancelReply(): void {
        this.replyingToMessage = null;
    }

    scrollToMessage(messageId: string): void {
        const element = document.getElementById('msg-' + messageId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('highlight-message');
            setTimeout(() => {
                element.classList.remove('highlight-message');
            }, 2000);
        }
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

    getProfileAvatar(user: any): string {
        if (!user || !user.avatar) return ''; // Or return diverse default avatar based on ID
        let url = this.getAvatarUrl(user.avatar);
        if (user._id === this.currentUser?._id) {
            url += `?v=${this.avatarVersion}`;
        }
        return url;
    }

    scrollToBottom(): void {
        try { if (this.messagesContainer) this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight; } catch { }
    }

    avatarVersion: number = Date.now();

    onFileSelected(event: any): void {
        const file: File = event.target.files[0];
        if (file) {
            console.log('Uploading file:', file.name);
            this.authService.uploadAvatar(file).subscribe({
                next: (res) => {
                    console.log('Avatar upload response:', res);
                    // Force a full update cycle
                    this.avatarVersion = Date.now();

                    if (this.currentUser) {
                        // Create a shallow copy to trigger OnPush if used, though default is CheckAlways. 
                        // The primary goal is to ensure the view sees a 'new' object reference or updated bind.
                        this.currentUser = { ...this.currentUser, avatar: res.avatar };
                    }

                    // Manually trigger change detection to ensure the view updates the image src immediately
                    this.cdr.detectChanges();
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

    // Profile Photo Upload (Wrapper for onFileSelected)
    onProfilePhotoSelected(event: any): void {
        this.onFileSelected(event);
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

        // --- Auto-Download / Media Permission Check (User Request) ---
        // Intepreting "Auto-download" settings as "Allow sending/uploading" preference
        const type = file.type;
        const settings = this.chatSettings.autoDownload;

        if (type.startsWith('image/')) {
            if (!settings.photos) {
                this.permissionMessage = 'Photos are disabled in Media Settings.';
                this.showPermissionModal = true;
                return;
            }
        } else if (type.startsWith('video/')) {
            if (!settings.videos) {
                this.permissionMessage = 'Videos are disabled in Media Settings.';
                this.showPermissionModal = true;
                return;
            }
        } else if (type.startsWith('audio/')) {
            if (!settings.audio) {
                this.permissionMessage = 'Audio is disabled in Media Settings.';
                this.showPermissionModal = true;
                return;
            }
        } else {
            // Treat everything else as Documents
            if (!settings.documents) {
                this.permissionMessage = 'Documents are disabled in Media Settings.';
                this.showPermissionModal = true;
                return;
            }
        }

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
        this.cdr.detectChanges();

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
                            this.cdr.detectChanges();
                        }
                    }
                } else if (event.type === HttpEventType.Response) {
                    // Upload complete
                    const res = event.body;
                    console.log('File uploaded:', res);

                    // Update the temp message with the real file URL from server
                    if (msgIndex !== -1) {
                        this.messages[msgIndex].fileUrl = res.fileUrl;
                        this.messages[msgIndex].uploadProgress = undefined; // Remove progress
                        this.messages[msgIndex].localId = undefined; // Mark as sent
                        this.cdr.detectChanges();
                    }

                    // Send socket message to notify receiver
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
                this.cdr.detectChanges();
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
        // When triggered from context menu, save the message for reaction
        if (this.contextMenuMessage) {
            this.emojiPickerMessage = this.contextMenuMessage;
        }
        this.showEmojiPicker = !this.showEmojiPicker;
    }

    closeEmojiPickerModal(): void {
        this.showEmojiPicker = false;
        this.emojiPickerMessage = null;
    }

    selectEmojiForReaction(emoji: string): void {
        if (this.emojiPickerMessage) {
            this.reactToMessage(emoji, this.emojiPickerMessage);
            this.closeEmojiPickerModal();
        } else {
            // Normal emoji picker - add to message
            this.newMessage += emoji;
            this.showEmojiPicker = false;
        }
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
        // --- Permission Check ---
        if (!this.chatSettings.autoDownload.audio) {
            this.permissionMessage = 'Audio is disabled in Media Settings. Cannot record voice notes.';
            this.showPermissionModal = true;
            return;
        }

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

            // Validate selected devices
            if (this.videoSettings.micDeviceId && !this.audioInputDevices.find(d => d.deviceId === this.videoSettings.micDeviceId)) {
                this.videoSettings.micDeviceId = '';
            }
            if (this.videoSettings.cameraDeviceId && !this.videoInputDevices.find(d => d.deviceId === this.videoSettings.cameraDeviceId)) {
                this.videoSettings.cameraDeviceId = '';
            }
            if (this.videoSettings.speakerDeviceId && !this.audioOutputDevices.find(d => d.deviceId === this.videoSettings.speakerDeviceId)) {
                this.videoSettings.speakerDeviceId = '';
            }
            this.saveSettings();
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

    // --- File Handling Helpers ---
    getFileExtension(filename: string | undefined): string {
        if (!filename) return 'FILE';
        return filename.split('.').pop()?.toUpperCase() || 'FILE';
    }

    getFileIconClass(filename: string | undefined): string {
        if (!filename) return 'generic';
        const ext = filename.split('.').pop()?.toLowerCase();
        if (!ext) return 'generic';

        if (['pdf'].includes(ext)) return 'pdf';
        if (['doc', 'docx'].includes(ext)) return 'doc';
        if (['xls', 'xlsx', 'csv'].includes(ext)) return 'xls';
        if (['ppt', 'pptx'].includes(ext)) return 'ppt';
        if (['txt'].includes(ext)) return 'txt';
        if (['zip', 'rar', '7z'].includes(ext)) return 'zip';
        return 'generic';
    }

    openFile(url: string | undefined): void {
        this.downloadFile(url);
    }

    async saveAsFile(url: string | undefined, filename: string | undefined) {
        if (!url) return;
        const fullUrl = this.getAvatarUrl(url);

        try {
            // 1. Fetch the file as a blob
            const response = await fetch(fullUrl);
            const blob = await response.blob();

            // 2. Try using the modern File System Access API (Chrome/Edge/Opera)
            // This forces a "Save As" dialog
            if ('showSaveFilePicker' in window) {
                try {
                    const handle = await (window as any).showSaveFilePicker({
                        suggestedName: filename || 'download',
                        types: [{
                            description: 'File',
                            accept: { '*/*': ['.' + (filename?.split('.').pop() || 'tmp')] }
                        }]
                    });
                    const writable = await handle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                    return; // Success
                } catch (err: any) {
                    if (err.name === 'AbortError') return; // User cancelled
                    console.warn('FilePicker failed, falling back to anchor', err);
                }
            }

            // 3. Fallback: Create Object URL
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename || 'download';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);

        } catch (err) {
            console.error('Download failed:', err);
            // 4. Last Resort: Direct Link
            const a = document.createElement('a');
            a.href = fullUrl;
            a.download = filename || 'download';
            a.target = '_blank';
            a.click();
        }
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

    selectGeneralSetting(settingKey: string, value: any) {
        (this.generalSettings as any)[settingKey] = value;
        if (settingKey === 'fontSize') {
            this.applyFontSize();
        }
        this.saveSettings();
        this.activeNotifDropdown = null;
    }

    selectPrivacySetting(settingKey: string, value: any) {
        (this.privacySettings as any)[settingKey] = value;
        this.saveSettings();
        this.activeNotifDropdown = null;
    }

    selectVideoSetting(settingKey: string, value: any) {
        (this.videoSettings as any)[settingKey] = value;
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

    closePermissionModal() {
        this.showPermissionModal = false;
        this.permissionMessage = '';
    }

    // --- Attachment Menu ---
    showAttachmentMenu = false;
    @ViewChild('documentInput') documentInput!: ElementRef<HTMLInputElement>;
    @ViewChild('photoInput') photoInput!: ElementRef<HTMLInputElement>;
    @ViewChild('audioInput') audioInput!: ElementRef<HTMLInputElement>;
    @ViewChild('cameraInput') cameraInput!: ElementRef<HTMLInputElement>;

    toggleAttachmentMenu(): void {
        this.showAttachmentMenu = !this.showAttachmentMenu;
        // Close emoji picker if open
        if (this.showAttachmentMenu) {
            this.showEmojiPicker = false;
        }
    }

    selectAttachmentType(type: string): void {
        this.showAttachmentMenu = false;

        switch (type) {
            case 'document':
                this.documentInput?.nativeElement.click();
                break;
            case 'photos':
                this.photoInput?.nativeElement.click();
                break;
            case 'camera':
                this.cameraInput?.nativeElement.click();
                break;
            case 'audio':
                this.audioInput?.nativeElement.click();
                break;
            case 'contact':
                this.toastService.show('Contact sharing coming soon!');
                break;
            case 'poll':
                this.openPollModal();
                break;
            case 'event':
                this.toastService.show('Event creation coming soon!');
                break;
            case 'sticker':
                this.toastService.show('Sticker creation coming soon!');
                break;
        }
    }

    // --- Call Menu ---
    showCallMenu = false;

    toggleCallMenu(): void {
        this.showCallMenu = !this.showCallMenu;
        // Close attachment menu if open
        if (this.showCallMenu) {
            this.showAttachmentMenu = false;
            this.showEmojiPicker = false;
        }
    }

    handleCallOption(option: string): void {
        this.showCallMenu = false;
        switch (option) {
            case 'groupCall':
                this.toastService.show('Group call coming soon!');
                break;
            case 'callLink':
                this.toastService.show('Call link copied!');
                break;
            case 'scheduleCall':
                this.toastService.show('Schedule call coming soon!');
                break;
        }
    }

    // --- Chat Search ---
    showChatSearch = false;
    chatSearchQuery = '';
    searchResultCount = 0;
    currentSearchIndex = 0;
    searchResultIndices: number[] = [];

    toggleChatSearch(): void {
        this.showChatSearch = !this.showChatSearch;
        if (!this.showChatSearch) {
            this.closeChatSearch();
        }
        // Close other menus
        this.showCallMenu = false;
        this.showMoreMenu = false;
    }

    closeChatSearch(): void {
        this.showChatSearch = false;
        this.chatSearchQuery = '';
        this.searchResultCount = 0;
        this.currentSearchIndex = 0;
        this.searchResultIndices = [];
    }

    onChatSearch(): void {
        if (!this.chatSearchQuery.trim()) {
            this.searchResultCount = 0;
            this.currentSearchIndex = 0;
            this.searchResultIndices = [];
            return;
        }

        const query = this.chatSearchQuery.toLowerCase();
        this.searchResultIndices = [];

        this.messages.forEach((msg, index) => {
            if (msg.content && msg.content.toLowerCase().includes(query)) {
                this.searchResultIndices.push(index);
            }
        });

        this.searchResultCount = this.searchResultIndices.length;
        this.currentSearchIndex = 0;

        if (this.searchResultCount > 0) {
            this.scrollToSearchResult();
        }
    }

    scrollToSearchResult(): void {
        if (this.searchResultIndices.length === 0) return;
        const msgIndex = this.searchResultIndices[this.currentSearchIndex];
        const messageElements = document.querySelectorAll('.message');
        if (messageElements[msgIndex]) {
            messageElements[msgIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight the message briefly
            messageElements[msgIndex].classList.add('search-highlight');
            setTimeout(() => {
                messageElements[msgIndex].classList.remove('search-highlight');
            }, 2000);
        }
    }

    prevSearchResult(): void {
        if (this.currentSearchIndex > 0) {
            this.currentSearchIndex--;
            this.scrollToSearchResult();
        }
    }

    nextSearchResult(): void {
        if (this.currentSearchIndex < this.searchResultCount - 1) {
            this.currentSearchIndex++;
            this.scrollToSearchResult();
        }
    }

    // --- More Menu ---
    showMoreMenu = false;

    toggleMoreMenu(): void {
        this.showMoreMenu = !this.showMoreMenu;
        // Close other menus
        if (this.showMoreMenu) {
            this.showCallMenu = false;
            this.showAttachmentMenu = false;
        }
    }

    mutedChats: Set<string> = new Set();

    handleMoreOption(option: string): void {
        this.showMoreMenu = false;
        switch (option) {
            case 'newGroup':
                this.openNewGroupModal();
                break;
            case 'selectMessages':
                this.enableSelectMode();
                break;
            case 'muteNotifications':
                this.toggleMuteChat();
                break;
            case 'clearChat':
                this.clearChat();
                break;
        }
    }

    // --- Group Info ---
    showGroupInfo = false;
    showExitGroupConfirm = false;
    showInviteModal = false;
    showAddMembersModal = false;
    groupInviteLink = '';

    openGroupInfo(): void {
        if (this.selectedUser?.isGroup) {
            this.showGroupInfo = true;
        }
    }

    closeGroupInfo(): void {
        this.showGroupInfo = false;
    }

    openInviteModal(): void {
        if (this.selectedUser) {
            this.groupInviteLink = `https://chat.app/join/${this.selectedUser._id}`;
            this.showInviteModal = true;
        }
    }

    closeInviteModal(): void {
        this.showInviteModal = false;
    }

    copyInviteLink(): void {
        navigator.clipboard.writeText(this.groupInviteLink);
        this.toastService.show('Invite link copied!');
    }

    exitGroup(): void {
        this.showExitGroupConfirm = true;
    }

    closeExitGroupConfirm(): void {
        this.showExitGroupConfirm = false;
    }

    confirmExitGroup(): void {
        if (!this.selectedUser) return;

        const groupName = this.selectedUser.fullName || this.selectedUser.username;
        // Remove from local users list
        const index = this.users.findIndex(u => u._id === this.selectedUser?._id);
        if (index !== -1) {
            this.users.splice(index, 1);
        }
        this.selectedUser = null;
        this.showGroupInfo = false;
        this.showExitGroupConfirm = false;
        this.toastService.show(`You left "${groupName}"`);
    }

    openAddMembersModal(): void {
        if (!this.selectedUser) return;
        this.selectedParticipants.clear();
        this.showAddMembersModal = true;
    }

    closeAddMembersModal(): void {
        this.showAddMembersModal = false;
        this.selectedParticipants.clear();
    }

    getUsersNotInGroup(): User[] {
        if (!this.selectedUser) return [];
        const participantIds = new Set(this.selectedUser.participants || []);
        const curUser = this.currentUser;
        if (!curUser) return [];

        const currentUserId = curUser._id?.toString();
        const currentUsername = curUser.username?.toLowerCase();
        const currentEmail = curUser.email?.toLowerCase();

        return this.users.filter(u => {
            if (u.isGroup) return false;

            const isMe = (u._id?.toString() === currentUserId) ||
                (u.username?.toLowerCase() === currentUsername) ||
                (u.email?.toLowerCase() === currentEmail);

            return !isMe && !participantIds.has(u._id);
        });
    }

    confirmAddMembers(): void {
        if (this.selectedParticipants.size === 0) {
            this.toastService.show('Select at least one member');
            return;
        }

        if (this.selectedUser && this.selectedUser.isGroup) {
            const newMembers = Array.from(this.selectedParticipants);

            this.chatService.addGroupMembers(this.selectedUser._id, newMembers).subscribe({
                next: (updatedGroup) => {
                    if (this.selectedUser) {
                        // Update local state
                        this.selectedUser.participants = updatedGroup.members.map((m: any) => m._id || m);
                        this.toastService.show(`${newMembers.length} members added via backend`);
                    }
                    this.closeAddMembersModal();
                },
                error: (err) => {
                    console.error('Failed to add members:', err);
                    this.toastService.show('Failed to add members');
                }
            });
        }
    }

    getParticipantInfo(userId: string): User | undefined {
        return this.users.find(u => u._id === userId);
    }

    // --- New Group ---
    showNewGroupModal = false;
    newGroupStep: 1 | 2 = 1;
    newGroupName = '';
    selectedParticipants: Set<string> = new Set();
    groupSearchQuery = '';
    newGroupIconPreview: string | null = null;
    selectedGroupIconFile: File | null = null;

    openNewGroupModal(): void {
        this.showNewGroupModal = true;
        this.newGroupStep = 1;
        this.selectedParticipants.clear();
        this.newGroupName = '';
        this.groupSearchQuery = '';
        this.newGroupIconPreview = null;
        this.selectedGroupIconFile = null;
    }

    closeNewGroupModal(): void {
        this.showNewGroupModal = false;
    }

    get filteredGroupUsers(): User[] {
        const curUser = this.currentUser;
        const q = this.groupSearchQuery.toLowerCase().trim();

        return this.users.filter(u => {
            if (u.isGroup) return false;

            // Strict check to exclude Jay (current user)
            const isMe = (u._id?.toString() === curUser?._id?.toString()) ||
                (u.username?.toLowerCase() === curUser?.username?.toLowerCase()) ||
                (u.email?.toLowerCase() === curUser?.email?.toLowerCase());

            if (isMe) return false;

            const matchesSearch = !q ||
                (u.fullName && u.fullName.toLowerCase().includes(q)) ||
                (u.username && u.username.toLowerCase().includes(q));

            return matchesSearch;
        });
    }

    toggleParticipant(userId: string): void {
        if (this.selectedParticipants.has(userId)) {
            this.selectedParticipants.delete(userId);
        } else {
            this.selectedParticipants.add(userId);
        }
    }

    nextGroupStep(): void {
        if (this.selectedParticipants.size === 0) {
            this.toastService.show('Select at least one participant');
            return;
        }
        this.newGroupStep = 2;
    }

    onGroupIconSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.selectedGroupIconFile = file;
            const reader = new FileReader();
            reader.onload = () => {
                this.newGroupIconPreview = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    createGroup(): void {
        if (!this.newGroupName.trim()) {
            this.toastService.show('Enter a group name');
            return;
        }

        const members = Array.from(this.selectedParticipants);
        const avatar = this.newGroupIconPreview || undefined;

        this.chatService.createGroup({
            name: this.newGroupName,
            members: members,
            avatar: avatar
        }).subscribe({
            next: (savedGroup) => {
                const newGroup: User = {
                    _id: savedGroup._id,
                    username: savedGroup.name,
                    fullName: savedGroup.name,
                    email: '',
                    avatar: savedGroup.avatar,
                    isOnline: true,
                    isGroup: true,
                    participants: savedGroup.members.map((m: any) => m._id || m)
                };

                this.users.unshift(newGroup);
                this.selectUser(newGroup);
                this.toastService.show(`Group "${this.newGroupName}" created!`);
                this.closeNewGroupModal();
            },
            error: (err) => {
                console.error('Create group failed:', err);
                this.toastService.show('Failed to create group');
            }
        });
    }

    toggleMuteChat(): void {
        if (!this.selectedUser) return;
        const userId = this.selectedUser._id;
        if (this.mutedChats.has(userId)) {
            this.mutedChats.delete(userId);
            this.toastService.show('Notifications unmuted');
        } else {
            this.mutedChats.add(userId);
            this.toastService.show('Notifications muted');
        }
    }

    clearChat(): void {
        if (!this.selectedUser) return;

        const userName = this.selectedUser.fullName || this.selectedUser.username;
        if (confirm(`Clear all messages with ${userName}?\n\nThis will only remove messages from your view.`)) {
            const messageCount = this.messages.length;
            this.messages = [];
            this.toastService.show(`${messageCount} message(s) cleared`);
            this.cdr.detectChanges();
        }
    }

    // --- Message Selection Mode ---
    isSelectMode = false;
    selectedMessages = new Set<string>();

    enableSelectMode(): void {
        this.isSelectMode = true;
        this.selectedMessages.clear();
        this.toastService.show('Select messages to delete, copy or forward');
    }

    cancelSelectMode(): void {
        this.isSelectMode = false;
        this.selectedMessages.clear();
    }

    toggleMessageSelection(message: Message): void {
        if (this.selectedMessages.has(message._id)) {
            this.selectedMessages.delete(message._id);
        } else {
            this.selectedMessages.add(message._id);
        }
    }

    copySelectedMessages(): void {
        if (this.selectedMessages.size === 0) return;

        const selectedMsgs = this.messages.filter(m => this.selectedMessages.has(m._id));
        const textToCopy = selectedMsgs
            .map(m => m.content || '[Media]')
            .join('\n');

        navigator.clipboard.writeText(textToCopy).then(() => {
            this.toastService.show('Messages copied!');
            this.cancelSelectMode();
        }).catch(() => {
            this.toastService.show('Failed to copy messages');
        });
    }

    forwardSelectedMessages(): void {
        if (this.selectedMessages.size === 0) return;
        this.toastService.show('Forward feature coming soon!');
        // TODO: Implement forward dialog
    }

    deleteSelectedMessages(): void {
        if (this.selectedMessages.size === 0) return;

        const count = this.selectedMessages.size;
        this.confirmTitle = 'Delete Messages?';
        this.confirmMessage = `Are you sure you want to delete ${count} selected message(s)? This action cannot be undone.`;
        this.confirmAction = () => {
            this.messages = this.messages.filter(m => !this.selectedMessages.has(m._id));
            this.toastService.show(`${count} message(s) deleted`);
            this.cancelSelectMode();
            this.cdr.detectChanges();
        };
        this.showConfirmModal = true;
    }

    // --- Poll Creation ---
    showPollModal = false;
    pollQuestion = '';
    pollOptions: string[] = ['', ''];
    pollAllowMultiple = false;

    openPollModal(): void {
        this.showPollModal = true;
        this.pollQuestion = '';
        this.pollOptions = ['', ''];
        this.pollAllowMultiple = false;
    }

    closePollModal(): void {
        this.showPollModal = false;
    }

    addPollOption(): void {
        if (this.pollOptions.length < 10) {
            this.pollOptions.push('');
        }
    }

    removePollOption(index: number): void {
        if (this.pollOptions.length > 2) {
            this.pollOptions.splice(index, 1);
        }
    }

    canSendPoll(): boolean {
        const hasQuestion = this.pollQuestion.trim().length > 0;
        const validOptions = this.pollOptions.filter(o => o.trim().length > 0);
        return hasQuestion && validOptions.length >= 2;
    }

    sendPoll(): void {
        if (!this.canSendPoll() || !this.selectedUser || !this.currentUser) return;

        const validOptions = this.pollOptions.filter(o => o.trim().length > 0);

        // Create poll message content
        const pollContent = JSON.stringify({
            type: 'poll',
            question: this.pollQuestion.trim(),
            options: validOptions.map(opt => ({
                text: opt.trim(),
                votes: []
            })),
            allowMultiple: this.pollAllowMultiple,
            createdBy: this.currentUser._id
        });

        // Create a local message for optimistic UI
        const tempLocalId = 'temp-' + Date.now();
        const tempMessage: Message = {
            _id: tempLocalId,
            localId: tempLocalId,
            sender: this.currentUser,
            receiver: this.selectedUser,
            content: pollContent,
            messageType: 'poll' as any,
            delivered: false,
            seen: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.messages.push(tempMessage);
        this.shouldScrollToBottom = true;
        this.cdr.detectChanges();

        // Send via socket
        this.socketService.sendMessage({
            senderId: this.currentUser._id,
            receiverId: this.selectedUser._id,
            content: pollContent,
            messageType: 'poll'
        });

        this.closePollModal();
        this.toastService.show('Poll sent!');
    }

    // Helper to parse poll data
    getPollData(message: Message): any {
        try {
            if (!message.content) return null;
            return JSON.parse(message.content);
        } catch {
            return null;
        }
    }

    trackByIndex(index: number, item: any): number {
        return index;
    }

    // Track poll votes: { messageId: selectedOptionIndex }
    pollVotes: Map<string, number> = new Map();

    isPollOptionSelected(messageId: string, optionIndex: number): boolean {
        return this.pollVotes.get(messageId) === optionIndex;
    }

    votePollOption(message: Message, optionIndex: number): void {
        const poll = this.getPollData(message);
        if (!poll) return;

        const isAlreadySelected = this.pollVotes.get(message._id) === optionIndex;

        // Toggle vote
        if (isAlreadySelected) {
            this.pollVotes.delete(message._id);
        } else {
            // If multiple not allowed, remove previous vote
            if (!poll.allowMultiple) {
                this.pollVotes.set(message._id, optionIndex);
            } else {
                // TODO: For multiple, we'd need a Set per messageId
                this.pollVotes.set(message._id, optionIndex);
            }
        }

        // Update the poll data in the message
        if (this.currentUser) {
            poll.options.forEach((opt: any, i: number) => {
                opt.votes = opt.votes || [];
                const userIndex = opt.votes.indexOf(this.currentUser!._id);

                if (i === optionIndex) {
                    if (userIndex === -1) {
                        opt.votes.push(this.currentUser!._id);
                    } else if (isAlreadySelected) {
                        opt.votes.splice(userIndex, 1);
                    }
                } else if (!poll.allowMultiple) {
                    // Remove from other options if multiple not allowed
                    if (userIndex > -1) {
                        opt.votes.splice(userIndex, 1);
                    }
                }
            });

            // Update message content
            message.content = JSON.stringify(poll);
        }

        this.toastService.show(isAlreadySelected ? 'Vote removed' : 'Vote recorded!');
        this.cdr.detectChanges();
    }

    getTotalPollVotes(message: Message): number {
        const poll = this.getPollData(message);
        if (!poll) return 0;

        const uniqueVoters = new Set();
        poll.options.forEach((opt: any) => {
            if (opt.votes) {
                opt.votes.forEach((v: string) => uniqueVoters.add(v));
            }
        });
        return uniqueVoters.size;
    }

    // --- Forward Feature ---
    showForwardModal = false;
    forwardSearchQuery = '';

    get filteredForwardUsers(): User[] {
        if (!this.forwardSearchQuery.trim()) return this.users;
        const q = this.forwardSearchQuery.toLowerCase();
        return this.users.filter(u =>
            (u.fullName && u.fullName.toLowerCase().includes(q)) ||
            (u.username && u.username.toLowerCase().includes(q))
        );
    }

    openForwardModal(): void {
        if (this.selectedMessages.size === 0) {
            this.toastService.show('Select messages to forward first');
            return;
        }
        this.showForwardModal = true;
    }

    closeForwardModal(): void {
        this.showForwardModal = false;
        this.forwardSearchQuery = '';
    }

    forwardToUser(user: User): void {
        const messagesToForward = this.messages.filter(m => this.selectedMessages.has(m._id));

        messagesToForward.forEach(msg => {
            this.socketService.sendMessage({
                senderId: this.currentUser!._id,
                receiverId: user._id,
                content: msg.content,
                messageType: msg.messageType
            });
        });

        this.closeForwardModal();
        this.cancelSelectMode();
        this.toastService.show(`Forwarded ${messagesToForward.length} message(s) to ${user.fullName || user.username}`);
    }

    // --- Context Menu & Reactions ---
    onMessageContextMenu(event: MouseEvent, message: Message): void {
        event.preventDefault();
        this.contextMenuMessage = message;

        // Improved positioning with edge detection
        const menuWidth = 240;
        const menuHeight = 400; // Estimated max height
        const margin = 10;

        let x = event.clientX;
        let y = event.clientY;

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Check right edge
        if (x + menuWidth + margin > windowWidth) {
            x = windowWidth - menuWidth - margin;
        }

        // Check bottom edge
        if (y + menuHeight + margin > windowHeight) {
            y = windowHeight - menuHeight - margin;
        }

        this.contextMenuPosition = { x, y };
        this.showContextMenu = true;

        // Add listener to close menu on click anywhere else
        const closeMenu = () => {
            this.closeContextMenu();
            document.removeEventListener('click', closeMenu);
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 10);
    }

    closeContextMenu(): void {
        this.showContextMenu = false;
        this.contextMenuMessage = null;
    }

    reactToMessage(emoji: string, message: Message): void {
        if (!this.currentUser) return;

        if (!message.reactions) message.reactions = [];

        const existingIndex = message.reactions.findIndex(r => r.userId === this.currentUser!._id);

        if (existingIndex > -1) {
            if (message.reactions[existingIndex].emoji === emoji) {
                // Toggle off if same emoji
                message.reactions.splice(existingIndex, 1);
            } else {
                // Update if different emoji
                message.reactions[existingIndex].emoji = emoji;
            }
        } else {
            message.reactions.push({ emoji, userId: this.currentUser._id });
        }

        // Send via socket
        this.socketService.sendReaction({
            messageId: message._id,
            emoji: emoji,
            userId: this.currentUser._id,
            receiverId: this.selectedUser!._id
        });

        this.closeContextMenu();
        this.cdr.detectChanges();
    }

    copyMessageText(message: Message): void {
        if (!message.content) return;
        navigator.clipboard.writeText(message.content).then(() => {
            this.toastService.show('Message copied!');
        });
        this.closeContextMenu();
    }

    deleteMessage(message: Message): void {
        this.confirmTitle = 'Delete Message?';
        this.confirmMessage = 'Are you sure you want to delete this message? This action cannot be undone.';
        this.confirmAction = () => {
            this.messages = this.messages.filter(m => m._id !== message._id);
            this.toastService.show('Message deleted');
        };
        this.showConfirmModal = true;
        this.closeContextMenu();
    }

    closeConfirmModal(): void {
        this.showConfirmModal = false;
    }

    executeConfirmAction(): void {
        this.confirmAction();
        this.closeConfirmModal();
    }

    forwardMessage(message: Message): void {
        this.selectedMessages.clear();
        this.selectedMessages.add(message._id);
        this.openForwardModal();
        this.closeContextMenu();
    }

    starMessage(message: Message): void {
        message.isStarred = !message.isStarred;
        this.toastService.show(message.isStarred ? 'Message starred' : 'Message unstarred');
        // TODO: Persist to backend
        this.closeContextMenu();
    }

    pinMessage(message: Message): void {
        message.isPinned = !message.isPinned;
        this.toastService.show(message.isPinned ? 'Message pinned' : 'Message unpinned');
        // TODO: Persist to backend
        this.closeContextMenu();
    }

    viewMessageInfo(message: Message): void {
        this.selectedMessageInfo = message;
        this.showMessageInfoModal = true;
        this.closeContextMenu();
    }

    closeMessageInfoModal(): void {
        this.showMessageInfoModal = false;
        this.selectedMessageInfo = null;
    }

    handleImageError(event: any): void {
        event.target.style.display = 'none';
        const parent = event.target.parentElement;
        if (parent) {
            const fallback = parent.querySelector('.avatar-fallback');
            if (fallback) {
                fallback.style.display = 'flex';
            }
        }
    }

    // --- Contact Info Methods ---
    openContactInfo(): void {
        this.showContactInfo = true;
    }

    closeContactInfo(): void {
        this.showContactInfo = false;
    }

    blockUser(): void {
        this.toastService.show(`Blocked ${this.selectedUser?.fullName || this.selectedUser?.username}`);
        this.closeContactInfo();
    }

}
