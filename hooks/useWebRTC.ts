import { useState, useEffect, useRef, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { ChatUser } from '../apps/chat/types';

// Using a public STUN server from Google to help with NAT traversal.
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};

export const useWebRTC = (session: Session | null, onCallStart?: () => void) => {
    const [callState, setCallState] = useState<{
        status: 'idle' | 'outgoing' | 'incoming' | 'connected' | 'disconnected';
        peer: ChatUser | null;
        localStream: MediaStream | null;
    }>({ status: 'idle', peer: null, localStream: null });
    const [callDuration, setCallDuration] = useState(0);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const remoteAudioRef = useRef<HTMLAudioElement>(null);
    const ringtoneAudioRef = useRef<HTMLAudioElement>(null);
    const ringbackAudioRef = useRef<HTMLAudioElement>(null);
    const callTimerRef = useRef<number | null>(null);
    const iceCandidatesBuffer = useRef<RTCIceCandidateInit[]>([]);
    
    useEffect(() => {
        if (callState.status === 'connected') {
            callTimerRef.current = window.setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else {
            if (callTimerRef.current) {
                clearInterval(callTimerRef.current);
                callTimerRef.current = null;
            }
            if (callState.status === 'idle' || callState.status === 'disconnected') {
                setCallDuration(0);
            }
        }
        return () => {
            if (callTimerRef.current) clearInterval(callTimerRef.current);
        };
    }, [callState.status]);

    const playRingtone = useCallback(() => {
        if (ringtoneAudioRef.current) {
            ringtoneAudioRef.current.currentTime = 0;
            ringtoneAudioRef.current.play().catch(e => console.error("Ringtone playback failed", e));
        }
    }, []);

    const stopRingtone = useCallback(() => {
        if (ringtoneAudioRef.current) {
            ringtoneAudioRef.current.pause();
            ringtoneAudioRef.current.currentTime = 0;
        }
    }, []);
    
    const playRingback = useCallback(() => {
        if (ringbackAudioRef.current) {
            ringbackAudioRef.current.currentTime = 0;
            ringbackAudioRef.current.play().catch(e => console.error("Ringback playback failed", e));
        }
    }, []);

    const stopRingback = useCallback(() => {
        if (ringbackAudioRef.current) {
            ringbackAudioRef.current.pause();
            ringbackAudioRef.current.currentTime = 0;
        }
    }, []);
    
    const sendSignal = async (receiverId: string, type: string, payload: any) => {
        if (!session?.user?.id) return;
        await (supabase.from('webrtc_signals') as any).insert({
            sender_id: session.user.id,
            receiver_id: receiverId,
            signal_type: type,
            payload: payload
        });
    };
    
    const cleanupCall = useCallback(() => {
        stopRingtone();
        stopRingback();
        iceCandidatesBuffer.current = [];
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        if (callState.localStream) {
            callState.localStream.getTracks().forEach(track => track.stop());
        }
        setCallState({ status: 'disconnected', peer: callState.peer, localStream: null });
        setTimeout(() => setCallState({ status: 'idle', peer: null, localStream: null }), 2000);
    }, [callState.localStream, callState.peer, stopRingtone, stopRingback]);
    
    const processIceCandidatesBuffer = useCallback(async () => {
        if (peerConnection.current && peerConnection.current.remoteDescription && iceCandidatesBuffer.current.length > 0) {
            for (const candidate of iceCandidatesBuffer.current) {
                try {
                    await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error("Error adding buffered ICE candidate", e);
                }
            }
            iceCandidatesBuffer.current = [];
        }
    }, []);

    const initiateCall = async (peer: ChatUser) => {
        if (callState.status !== 'idle' || !session?.user) return;
        onCallStart?.();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setCallState({ status: 'outgoing', peer, localStream: stream });
            playRingback();

            const pc = new RTCPeerConnection(ICE_SERVERS);
            peerConnection.current = pc;
            
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            pc.onicecandidate = event => {
                if (event.candidate) {
                    sendSignal(peer.id, 'ice-candidate', { candidate: event.candidate });
                }
            };
            
            pc.ontrack = event => {
                if (remoteAudioRef.current) {
                    remoteAudioRef.current.srcObject = event.streams[0];
                    remoteAudioRef.current.play().catch(e => console.error("Remote audio playback failed in ontrack (caller)", e));
                }
            };

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            sendSignal(peer.id, 'offer', { offer });
            
        } catch (error) {
            console.error("Error initiating call:", error);
            cleanupCall();
        }
    };

    const answerCall = async () => {
        if (callState.status !== 'incoming' || !peerConnection.current || !callState.peer) return;
        stopRingtone();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setCallState(prev => ({ ...prev, status: 'connected', localStream: stream }));

            stream.getTracks().forEach(track => peerConnection.current!.addTrack(track, stream));

            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);

            sendSignal(callState.peer.id, 'answer', { answer });
        } catch (error) {
             console.error("Error answering call:", error);
            cleanupCall();
        }
    };

    const hangUp = () => {
        if (callState.peer) {
            sendSignal(callState.peer.id, 'hang-up', {});
        }
        cleanupCall();
    };

    const handleSignal = useCallback(async (payload: any) => {
        const signal = payload.new;
        if (!session?.user || signal.sender_id === session.user.id) return;
        
        const pc = peerConnection.current;

        switch (signal.signal_type) {
            case 'offer':
                if (callState.status !== 'idle') {
                    console.warn('Ignoring incoming offer, already in a call.');
                    // Optionally send a 'busy' signal back to the caller
                    return;
                }
                onCallStart?.();
                const { data: callerProfile } = await (supabase.from('profiles') as any).select('id, username, full_name, avatar_url').eq('id', signal.sender_id).single();
                if (!callerProfile) return;

                const newPc = new RTCPeerConnection(ICE_SERVERS);
                peerConnection.current = newPc;
                
                newPc.onicecandidate = event => {
                    if (event.candidate) {
                        sendSignal(signal.sender_id, 'ice-candidate', { candidate: event.candidate });
                    }
                };
                 newPc.ontrack = event => {
                    if (remoteAudioRef.current) {
                        remoteAudioRef.current.srcObject = event.streams[0];
                        remoteAudioRef.current.play().catch(e => console.error("Remote audio playback failed in ontrack (receiver)", e));
                    }
                };

                await newPc.setRemoteDescription(new RTCSessionDescription(signal.payload.offer));
                await processIceCandidatesBuffer();
                setCallState({ status: 'incoming', peer: callerProfile as ChatUser, localStream: null });
                playRingtone();
                break;
            
            case 'answer':
                if (pc) {
                    await pc.setRemoteDescription(new RTCSessionDescription(signal.payload.answer));
                    await processIceCandidatesBuffer();
                }
                stopRingback();
                setCallState(prev => ({...prev, status: 'connected' }));
                break;
            
            case 'ice-candidate':
                if (pc && pc.remoteDescription) {
                    await pc.addIceCandidate(new RTCIceCandidate(signal.payload.candidate));
                } else {
                    iceCandidatesBuffer.current.push(signal.payload.candidate);
                }
                break;
            
            case 'hang-up':
                cleanupCall();
                break;
        }
    }, [session?.user, cleanupCall, playRingtone, stopRingback, processIceCandidatesBuffer, onCallStart, callState.status]);

    useEffect(() => {
        if (!session?.user?.id) return;

        const channel = supabase.channel('webrtc_signals')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'webrtc_signals',
                filter: `receiver_id=eq.${session.user.id}`
            }, handleSignal)
            .subscribe();
            
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