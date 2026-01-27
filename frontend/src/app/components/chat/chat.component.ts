import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpEventType } from '@angular/common/http';
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
    mediaRecorder: MediaRecorder | null = null;
    audioChunks: Blob[] = [];

    async startRecording(): Promise<void> {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('Audio recording not supported or permission denied.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            this.isRecording = true;

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
                this.uploadAudio(audioFile);
                this.isRecording = false;
                stream.getTracks().forEach(track => track.stop()); // Stop mic
            };

            this.mediaRecorder.start();
            console.log('Recording started');
        } catch (err) {
            console.error('Error accessing microphone:', err);
        }
    }

    stopRecording(): void {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
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
}
