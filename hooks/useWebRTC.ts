
import { useState, useEffect, useRef, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { ChatUser } from '../apps/chat/types';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};

const LOG_PREFIX = '[WebRTC]';

export const useWebRTC = (session: Session | null, onCallStart?: () => void) => {
    const [callState, setCallState] = useState<{
        status: 'idle' | 'outgoing' | 'incoming' | 'connected' | 'disconnected';
        peer: ChatUser | null;
    }>({ status: 'idle', peer: null });

    const [callDuration, setCallDuration] = useState(0);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localStream = useRef<MediaStream | null>(null);
    const remoteStream = useRef<MediaStream | null>(null);
    const remoteAudioRef = useRef<HTMLAudioElement>(null);
    const ringtoneAudioRef = useRef<HTMLAudioElement>(null);
    const ringbackAudioRef = useRef<HTMLAudioElement>(null);
    const callTimerRef = useRef<number | null>(null);
    const iceCandidatesBuffer = useRef<RTCIceCandidateInit[]>([]);
    const isProcessingCallAction = useRef(false);

    // Use a ref to get the latest callState inside callbacks without causing re-subscriptions
    const callStateRef = useRef(callState);
    useEffect(() => {
        callStateRef.current = callState;
    }, [callState]);

    const playRingtone = useCallback(() => {
        if (ringtoneAudioRef.current) {
            console.log(LOG_PREFIX, 'Attempting to play ringtone...');
            ringtoneAudioRef.current.currentTime = 0;
            const playPromise = ringtoneAudioRef.current.play();
            if (playPromise) {
                playPromise.catch(e => console.error(`${LOG_PREFIX} Ringtone playback failed`, e));
            }
        }
    }, []);

    const stopRingtone = useCallback(() => {
        if (ringtoneAudioRef.current) {
            console.log(LOG_PREFIX, 'Stopping ringtone.');
            ringtoneAudioRef.current.pause();
            ringtoneAudioRef.current.currentTime = 0;
        }
    }, []);

    const playRingback = useCallback(() => {
        if (ringbackAudioRef.current) {
            console.log(LOG_PREFIX, 'Attempting to play ringback...');
            ringbackAudioRef.current.currentTime = 0;
            const playPromise = ringbackAudioRef.current.play();
            if(playPromise) {
                playPromise.catch(e => console.error(`${LOG_PREFIX} Ringback playback failed`, e));
            }
        }
    }, []);

    const stopRingback = useCallback(() => {
        if (ringbackAudioRef.current) {
            console.log(LOG_PREFIX, 'Stopping ringback.');
            ringbackAudioRef.current.pause();
            ringbackAudioRef.current.currentTime = 0;
        }
    }, []);

    const sendSignal = async (receiverId: string, type: string, payload: any) => {
        if (!session?.user?.id) return;
        console.log(`${LOG_PREFIX} Sending signal: ${type} to ${receiverId}`);
        await (supabase.from('webrtc_signals') as any).insert({
            sender_id: session.user.id,
            receiver_id: receiverId,
            signal_type: type,
            payload: payload
        });
    };

    const cleanupCall = useCallback(() => {
        console.log(`${LOG_PREFIX} Cleaning up call resources.`);
        stopRingtone();
        stopRingback();
        
        if (callTimerRef.current) clearInterval(callTimerRef.current);
        callTimerRef.current = null;
        setCallDuration(0);

        if (peerConnection.current) {
            peerConnection.current.onicecandidate = null;
            peerConnection.current.ontrack = null;
            peerConnection.current.onconnectionstatechange = null;
            peerConnection.current.close();
            peerConnection.current = null;
        }

        if (localStream.current) {
            localStream.current.getTracks().forEach(track => track.stop());
            localStream.current = null;
        }

        if (remoteStream.current) {
            remoteStream.current.getTracks().forEach(track => track.stop());
            remoteStream.current = null;
        }

        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
        }
        
        iceCandidatesBuffer.current = [];
        isProcessingCallAction.current = false;

        setCallState(prev => ({ status: 'disconnected', peer: prev.peer }));
        setTimeout(() => setCallState({ status: 'idle', peer: null }), 2000);
    }, [stopRingtone, stopRingback]);
    
    const createPeerConnection = useCallback((peerId: string) => {
        console.log(LOG_PREFIX, 'Creating new RTCPeerConnection');
        const pc = new RTCPeerConnection(ICE_SERVERS);

        pc.onicecandidate = event => {
            if (event.candidate) {
                console.log(LOG_PREFIX, 'Generated ICE candidate:', event.candidate.candidate.substring(0, 30) + '...');
                sendSignal(peerId, 'ice-candidate', { candidate: event.candidate });
            } else {
                console.log(LOG_PREFIX, 'All ICE candidates have been sent.');
            }
        };

        pc.ontrack = event => {
            console.log(LOG_PREFIX, 'Received remote track:', event.track.kind);
            if (!remoteStream.current) {
                remoteStream.current = new MediaStream();
                if(remoteAudioRef.current) {
                    remoteAudioRef.current.srcObject = remoteStream.current;
                }
            }
            remoteStream.current.addTrack(event.track);
            remoteAudioRef.current?.play().catch(e => console.error(`${LOG_PREFIX} Remote audio playback failed in ontrack`, e));
        };
        
        pc.onconnectionstatechange = () => {
             if (pc) {
                console.log(`${LOG_PREFIX} Connection state changed: ${pc.connectionState}`);
                if (pc.connectionState === 'connected') {
                    stopRingback();
                    stopRingtone();
                    setCallState(prev => ({ ...prev, status: 'connected' }));
                }
                if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected' || pc.connectionState === 'closed') {
                    cleanupCall();
                }
            }
        };
        
        pc.onsignalingstatechange = () => {
            if (pc) {
                console.log(`${LOG_PREFIX} Signaling state changed: ${pc.signalingState}`);
            }
        };

        return pc;
    }, [cleanupCall, stopRingback, stopRingtone]);

    const initiateCall = async (peer: ChatUser) => {
        if (callStateRef.current.status !== 'idle' || !session?.user || isProcessingCallAction.current) return;
        isProcessingCallAction.current = true;
        
        console.log(`${LOG_PREFIX} Initiating call to ${peer.username} (${peer.id})`);
        onCallStart?.();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log(LOG_PREFIX, 'Got local audio stream.');
            localStream.current = stream;

            setCallState({ status: 'outgoing', peer });
            playRingback();

            const pc = createPeerConnection(peer.id);
            peerConnection.current = pc;
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            console.log(LOG_PREFIX, 'Created offer and set local description.');
            
            await sendSignal(peer.id, 'offer', { offer });
            
        } catch (error) {
            console.error(`${LOG_PREFIX} Error initiating call:`, error);
            cleanupCall();
        } finally {
            isProcessingCallAction.current = false;
        }
    };

    const answerCall = async () => {
        if (callStateRef.current.status !== 'incoming' || !peerConnection.current || !callStateRef.current.peer || isProcessingCallAction.current) {
            if (isProcessingCallAction.current) console.warn(LOG_PREFIX, 'Answer already in progress.');
            else console.error(`${LOG_PREFIX} Cannot answer call in current state:`, callStateRef.current.status);
            return;
        }
        
        isProcessingCallAction.current = true;
        console.log(`${LOG_PREFIX} Answering call from ${callStateRef.current.peer.username}.`);
        stopRingtone();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log(LOG_PREFIX, 'Got local audio stream for answering.');
            localStream.current = stream;
            stream.getTracks().forEach(track => peerConnection.current!.addTrack(track, stream));
            
            if (peerConnection.current.signalingState !== 'have-remote-offer') {
                throw new Error(`Invalid state for answering. Expected 'have-remote-offer', got '${peerConnection.current.signalingState}'.`);
            }

            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            console.log(LOG_PREFIX, 'Created answer and set local description.');

            await sendSignal(callStateRef.current.peer.id, 'answer', { answer });
        } catch (error) {
            console.error(`${LOG_PREFIX} Error answering call:`, error);
            cleanupCall();
        } finally {
             isProcessingCallAction.current = false;
        }
    };

    const hangUp = () => {
        console.log(LOG_PREFIX, 'Hanging up call.');
        if (callStateRef.current.peer) {
            sendSignal(callStateRef.current.peer.id, 'hang-up', {});
        }
        cleanupCall();
    };

    const handleSignal = useCallback(async (payload: any) => {
        const signal = payload.new;
        if (!session?.user || signal.sender_id === session.user.id) return;

        console.log(`${LOG_PREFIX} Received signal: ${signal.signal_type} from ${signal.sender_id}`);

        try {
            switch (signal.signal_type) {
                case 'offer':
                    const currentStatus = callStateRef.current.status;
                    if (currentStatus !== 'idle' && currentStatus !== 'disconnected') {
                        console.warn(LOG_PREFIX, `Ignoring incoming offer, current status is '${currentStatus}'.`);
                        return;
                    }

                    isProcessingCallAction.current = true;
                    onCallStart?.();
                    const { data: callerProfile } = await (supabase.from('profiles') as any).select('id, username, full_name, avatar_url').eq('id', signal.sender_id).single();
                    if (!callerProfile) {
                        console.error(`${LOG_PREFIX} Could not find profile for caller ID: ${signal.sender_id}`);
                        isProcessingCallAction.current = false;
                        return;
                    }

                    const pc = createPeerConnection(signal.sender_id);
                    peerConnection.current = pc;

                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(signal.payload.offer));
                        console.log(LOG_PREFIX, `Set remote description from offer. New state: ${pc.signalingState}`);
                    } catch (e) {
                        console.error(LOG_PREFIX, 'Failed to set remote description from offer:', e);
                        cleanupCall();
                        return;
                    }
                    
                    console.log(LOG_PREFIX, `Processing ${iceCandidatesBuffer.current.length} buffered ICE candidates.`);
                    for (const candidate of iceCandidatesBuffer.current) {
                        try {
                            await pc.addIceCandidate(new RTCIceCandidate(candidate));
                        } catch(e) {
                            console.warn(LOG_PREFIX, 'Failed to add buffered ICE candidate:', e);
                        }
                    }
                    iceCandidatesBuffer.current = [];
                    
                    setCallState({ status: 'incoming', peer: callerProfile as ChatUser });
                    playRingtone();
                    isProcessingCallAction.current = false;
                    break;
                
                case 'answer':
                    if (peerConnection.current && peerConnection.current.signalingState === 'have-local-offer') {
                        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal.payload.answer));
                        console.log(LOG_PREFIX, 'Set remote description from answer.');
                    } else {
                         console.warn(LOG_PREFIX, `Ignoring answer, not in have-local-offer state. Current state: ${peerConnection.current?.signalingState}`);
                    }
                    break;
                
                case 'ice-candidate':
                    if (peerConnection.current && peerConnection.current.remoteDescription) {
                        await peerConnection.current.addIceCandidate(new RTCIceCandidate(signal.payload.candidate));
                    } else {
                        console.log(LOG_PREFIX, 'Buffering ICE candidate.');
                        iceCandidatesBuffer.current.push(signal.payload.candidate);
                    }
                    break;
                
                case 'hang-up':
                    cleanupCall();
                    break;
            }
        } catch (error) {
            console.error(`${LOG_PREFIX} Error handling signal "${signal.signal_type}":`, error);
        }
    }, [session?.user, createPeerConnection, cleanupCall, playRingtone, onCallStart]);
    
    useEffect(() => {
        if (callState.status === 'connected') {
            callTimerRef.current = window.setInterval(() => setCallDuration(prev => prev + 1), 1000);
        }
        return () => {
            if (callTimerRef.current) clearInterval(callTimerRef.current);
        };
    }, [callState.status]);

    useEffect(() => {
        if (!session?.user?.id) return;
        const channel = supabase.channel(`webrtc_signals:${session.user.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'webrtc_signals',
                filter: `receiver_id=eq.${session.user.id}`
            }, handleSignal)
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log(LOG_PREFIX, 'Subscribed to signaling channel.');
                }
                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.error(`${LOG_PREFIX} Signaling channel error:`, err);
                }
            });
            
        return () => {
            supabase.removeChannel(channel);
        };
    }, [session?.user?.id, handleSignal]);

    return {
        callState,
        duration: callDuration,
        initiateCall,
        answerCall,
        hangUp,
        remoteAudioRef,
        ringtoneAudioRef,
        ringbackAudioRef,
    };
};
