import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../services/socket.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-call-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './call-modal.component.html',
    styleUrl: './call-modal.component.css'
})
export class CallModalComponent implements OnInit, OnDestroy {
    @Input() currentUser: any;
    @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
    @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

    // State
    callActive = false;
    incomingCall = false;
    callerName = '';
    callerId = '';
    callerSignal: any;
    callType: 'video' | 'audio' = 'video';

    audioEnabled = true;
    videoEnabled = true;

    // WebRTC
    private peerConnection!: RTCPeerConnection;
    private localStream!: MediaStream;
    private remoteStream!: MediaStream;

    private subscriptions: Subscription[] = [];

    // Config
    private rtcConfig: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

    constructor(private socketService: SocketService) { }

    ngOnInit(): void {
        // Listen for incoming calls
        this.subscriptions.push(
            this.socketService.onCallMade().subscribe(data => {
                if (!this.callActive) { // Only accept if not already in call
                    this.incomingCall = true;
                    this.callerName = data.name || 'Unknown User';
                    this.callerId = data.from;
                    this.callerSignal = data.signal;
                    this.callType = data.callType || 'video'; // Default to video if missing
                } else {
                    // Busy? For simple implementation, just ignore or auto-reject
                    this.socketService.rejectCall({ to: data.from });
                }
            }),

            this.socketService.onAnswerMade().subscribe(async data => {
                if (this.peerConnection) {
                    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
                    this.startTime = Date.now();
                }
            }),

            this.socketService.onIceCandidate().subscribe(async data => {
                if (this.peerConnection) {
                    try {
                        await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
                    } catch (e) {
                        console.error('Error adding received ice candidate', e);
                    }
                }
            }),

            this.socketService.onCallRejected().subscribe(() => {
                alert('User rejected the call');

                // The other person rejected me -> It's a "Missed Call" for them? Or just "Call Rejected"?
                // User screenshot says "Missed video call".
                // Usually if I call and they don't answer, it's missed.
                // If they reject, it's also effectively missed/declined.

                this.socketService.emitCallLog({
                    to: this.callerId, // I am calling, so 'to' is the person I called (callerId was set to userToCallId in startCall)
                    type: 'missed',
                    callType: this.callType
                });

                this.resetCall();
            }),

            this.socketService.onCallEnded().subscribe(() => {
                this.resetCall();
            })
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
        this.resetCall();
    }

    // --- Actions ---

    // Initiate an outgoing call
    async startCall(userToCallId: string, userName: string, type: 'video' | 'audio' = 'video') {
        this.callActive = true;
        this.callerId = userToCallId; // Used for "endCall" target
        this.callType = type;

        await this.setupMedia();
        this.createPeerConnection(userToCallId);

        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);

        this.socketService.callUser({
            userToCall: userToCallId,
            signalData: offer,
            from: this.currentUser._id,
            name: this.currentUser.username,
            callType: type
        });
    }

    // Answer an incoming call
    async acceptCall() {
        this.incomingCall = false;
        this.callActive = true;
        this.startTime = Date.now();

        await this.setupMedia();

        // Small delay to ensure DOM is ready
        setTimeout(async () => {
            this.createPeerConnection(this.callerId);

            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(this.callerSignal));
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);

            this.socketService.answerCall({
                signal: answer,
                to: this.callerId
            });
        }, 100);
    }

    declineCall() {
        this.socketService.rejectCall({ to: this.callerId });
        this.incomingCall = false;
        this.resetCall();
    }

    hangup() {
        this.socketService.endCall({ to: this.callerId });

        // Calculate duration if needed, or just send 'ended'
        const duration = this.calculateDuration();
        this.socketService.emitCallLog({
            to: this.callerId,
            type: 'ended',
            duration: duration,
            callType: this.callType
        });

        this.resetCall();
    }

    toggleAudio() {
        this.audioEnabled = !this.audioEnabled;
        this.localStream.getAudioTracks().forEach(track => track.enabled = this.audioEnabled);
    }

    toggleVideo() {
        this.videoEnabled = !this.videoEnabled;
        this.localStream.getVideoTracks().forEach(track => track.enabled = this.videoEnabled);
    }

    // --- Helpers ---

    startTime: number | null = null;

    private calculateDuration(): string {
        if (!this.startTime) return '0s';
        const end = Date.now();
        const diff = Math.floor((end - this.startTime) / 1000);
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        return `${mins}m ${secs}s`;
    }

    private async setupMedia() {
        try {
            const constraints = {
                audio: true,
                video: this.callType === 'video'
            };
            console.log('Requesting media with constraints:', constraints);
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('Media stream obtained:', this.localStream.getTracks());

            if (this.localVideo && this.callType === 'video') {
                console.log('Setting local video srcObject');
                this.localVideo.nativeElement.srcObject = this.localStream;
                // Explicitly play the video to ensure it displays
                try {
                    await this.localVideo.nativeElement.play();
                    console.log('Local video playing');
                } catch (playErr) {
                    console.error('Error playing local video:', playErr);
                }
            }
        } catch (err) {
            console.error('Error accessing media devices:', err);
            alert('Could not access camera/microphone. Please check permissions.');
        }
    }

    private createPeerConnection(targetUserId: string) {
        this.peerConnection = new RTCPeerConnection(this.rtcConfig);

        // Add local tracks to connection
        this.localStream.getTracks().forEach(track => {
            this.peerConnection.addTrack(track, this.localStream);
        });

        // Handle incoming tracks
        this.peerConnection.ontrack = (event) => {
            console.log('Received remote track:', event.track.kind);

            // Only set srcObject if not already set to prevent interrupting playback
            if (!this.remoteStream) {
                this.remoteStream = event.streams[0];

                if (this.remoteVideo) {
                    console.log('Setting remote video srcObject');
                    this.remoteVideo.nativeElement.srcObject = this.remoteStream;

                    // Explicitly play the remote video
                    this.remoteVideo.nativeElement.play().catch((err: any) => {
                        console.error('Error playing remote video:', err);
                    });
                }
            } else {
                console.log('Remote stream already set, track will be added automatically');
            }
        };

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socketService.sendIceCandidate({
                    target: targetUserId,
                    candidate: event.candidate
                });
            }
        };

        this.peerConnection.onconnectionstatechange = () => {
            console.log('Connection state:', this.peerConnection.connectionState);
            if (this.peerConnection.connectionState === 'disconnected' || this.peerConnection.connectionState === 'failed') {
                this.resetCall();
            }
        };
    }

    private resetCall() {
        this.callActive = false;
        this.incomingCall = false;
        this.callerId = '';
        this.callerName = '';

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }

        if (this.peerConnection) {
            this.peerConnection.close();
        }
    }
}
