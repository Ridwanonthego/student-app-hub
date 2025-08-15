import React, { useState, useEffect, useRef } from 'react';
import { PhoneIcon, PhoneHangUpIcon } from './Icons';
import { ChatUser } from '../apps/chat/types';

export const CallCapsule: React.FC<{
    callState: {
        status: 'idle' | 'outgoing' | 'incoming' | 'connected' | 'disconnected';
        peer: ChatUser | null;
    };
    duration: number;
    onAnswer: () => void;
    onHangUp: () => void;
    onDecline: () => void;
}> = ({ callState, duration, onAnswer, onHangUp, onDecline }) => {
    const capsuleRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 20, y: 80 });
    const isDragging = useRef(false);
    const offset = useRef({ x: 0, y: 0 });

    const onMouseDown = (e: React.MouseEvent) => {
        if (!capsuleRef.current) return;
        isDragging.current = true;
        offset.current = {
            x: e.clientX - capsuleRef.current.offsetLeft,
            y: e.clientY - capsuleRef.current.offsetTop
        };
    };

    const onMouseUp = () => {
        isDragging.current = false;
    };

    const onMouseMove = (e: MouseEvent) => {
        if (!isDragging.current || !capsuleRef.current) return;
        e.preventDefault();
        setPosition({
            x: e.clientX - offset.current.x,
            y: e.clientY - offset.current.y
        });
    };

    useEffect(() => {
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }, []);
    
    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const getStatusInfo = () => {
        switch (callState.status) {
            case 'outgoing': return { color: 'bg-yellow-500', text: `Ringing ${callState.peer?.username}...` };
            case 'incoming': return { color: 'bg-yellow-500', text: `Incoming call from ${callState.peer?.username}` };
            case 'connected': return { color: 'bg-green-500', text: `In call with ${callState.peer?.username} (${formatDuration(duration)})` };
            case 'disconnected': return { color: 'bg-red-500', text: 'Call ended' };
            default: return { color: 'bg-zinc-500', text: 'Idle' };
        }
    };
    const { color, text } = getStatusInfo();

    return (
        <div
            ref={capsuleRef}
            style={{ top: `${position.y}px`, left: `${position.x}px` }}
            className="fixed z-[100] bg-zinc-800/80 backdrop-blur-md border-2 border-zinc-600 rounded-full text-white shadow-2xl transition-all duration-300 cursor-grab active:cursor-grabbing"
            onMouseDown={onMouseDown}
        >
            <div className="flex items-center gap-3 p-2">
                <div className={`w-3 h-3 rounded-full ${color} transition-colors`}></div>
                <span className="font-bold text-sm">{text}</span>
                {callState.status === 'incoming' && (
                    <>
                        <button onClick={onAnswer} className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600"><PhoneIcon className="w-5 h-5"/></button>
                        <button onClick={onDecline} className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"><PhoneHangUpIcon className="w-5 h-5"/></button>
                    </>
                )}
                 {(callState.status === 'outgoing' || callState.status === 'connected') && (
                     <button onClick={onHangUp} className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"><PhoneHangUpIcon className="w-5 h-5"/></button>
                 )}
            </div>
        </div>
    );
};
