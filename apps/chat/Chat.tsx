

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../supabase/client';
import { ChatProps, ChatUser, ChatMessage } from './types';
import { SpinnerIcon, MessageSquareIcon, UsersIcon, CloseIcon, MaximizeIcon, MinimizeIcon, SendIcon, UserIcon } from '../../components/Icons';
import { RealtimeChannel, User } from '@supabase/supabase-js';

const Chat: React.FC<ChatProps> = ({ user, profile }) => {
    const [view, setView] = useState<'collapsed' | 'expanded' | 'fullscreen'>('collapsed');
    const [allUsers, setAllUsers] = useState<ChatUser[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState({ users: true, messages: false });
    const presenceChannel = useRef<RealtimeChannel | null>(null);
    const messagesChannel = useRef<RealtimeChannel | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const notificationSoundRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchUsers = useCallback(async () => {
        setLoading(prev => ({ ...prev, users: true }));
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .neq('id', user.id);
            if (error) throw error;
            setAllUsers((data as any) || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(prev => ({ ...prev, users: false }));
        }
    }, [user.id]);

    useEffect(() => {
        fetchUsers();
        
        const channel: RealtimeChannel = supabase.channel('online-users', {
            config: {
                presence: {
                    key: user.id,
                },
            },
        });

        channel.on('presence', { event: 'sync' }, () => {
            const presenceState = channel.presenceState();
            const onlineIds = Object.keys(presenceState);
            setOnlineUsers(onlineIds);
        });

        channel.on('presence', { event: 'join' }, ({ key }) => {
            setOnlineUsers(prev => [...new Set([...prev, key])]);
        });

        channel.on('presence', { event: 'leave' }, ({ key }) => {
            setOnlineUsers(prev => prev.filter(id => id !== key));
        });

        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({ online_at: new Date().toISOString() });
            }
        });
        
        presenceChannel.current = channel;

        return () => {
            if (presenceChannel.current) {
                supabase.removeChannel(presenceChannel.current);
            }
        };
    }, [fetchUsers, user.id]);
    
    const fetchMessages = useCallback(async (peerId: string) => {
        setLoading(prev => ({ ...prev, messages: true }));
        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .or(`and(sender_id.eq.${user.id},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${user.id})`)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages((data as any) || []);
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setLoading(prev => ({ ...prev, messages: false }));
        }
    }, [user.id]);

    useEffect(() => {
        if (!selectedUser) return;
        
        fetchMessages(selectedUser.id);

        const channelId = [user.id, selectedUser.id].sort().join('-');
        const channel = supabase.channel(`chat-${channelId}`);

        channel.on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `receiver_id=eq.${user.id}`
        }, payload => {
            const newMessage = payload.new as any;
            if (newMessage.sender_id === selectedUser.id) {
                setMessages(prev => [...prev, newMessage]);
                notificationSoundRef.current?.play().catch(e => console.log("Audio play failed", e));
            }
        }).subscribe();
        
        messagesChannel.current = channel;

        return () => {
            if(messagesChannel.current) {
                supabase.removeChannel(messagesChannel.current);
            }
        }
    }, [selectedUser, user.id, fetchMessages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedUser) return;
        const content = newMessage.trim();
        setNewMessage('');
        
        const optimisticMessage: ChatMessage = {
            id: Date.now(),
            sender_id: user.id,
            receiver_id: selectedUser.id,
            content,
            created_at: new Date().toISOString(),
            sender: { ...profile, id: user.id } as any,
        }
        setMessages(prev => [...prev, optimisticMessage]);

        const { error } = await (supabase.from('chat_messages') as any).insert([{
            sender_id: user.id,
            receiver_id: selectedUser.id,
            content
        }]);

        if (error) {
            console.error("Error sending message:", error);
            // Optionally remove optimistic message on error
            setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
        }
    };
    
    if (view === 'collapsed') {
        const onlineCount = onlineUsers.filter(id => id !== user.id).length;
        return (
            <button
                onClick={() => setView('expanded')}
                className="fixed bottom-6 right-6 bg-lime-400 text-black w-16 h-16 rounded-full border-2 border-black shadow-[4px_4px_0px_#000] flex items-center justify-center hover:bg-lime-500 transition-all z-50 group"
            >
                <MessageSquareIcon className="w-8 h-8"/>
                {onlineCount > 0 && 
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full border-2 border-black flex items-center justify-center">{onlineCount}</span>
                }
            </button>
        );
    }
    
    const combinedUsers = allUsers.map(u => ({ ...u, is_online: onlineUsers.includes(u.id) })).sort((a,b) => (b.is_online ? 1 : -1) - (a.is_online ? 1 : -1) || a.username.localeCompare(b.username));

    const viewClasses = {
        expanded: 'fixed bottom-5 right-5 w-[90vw] max-w-2xl h-[70vh] max-h-[600px] rounded-lg',
        fullscreen: 'fixed inset-0 w-full h-full rounded-none'
    }

    return (
        <div className={`${viewClasses[view]} bg-zinc-800 border-2 border-zinc-600 shadow-2xl flex flex-col font-poppins text-white z-50`}>
            <audio ref={notificationSoundRef} src="https://res.cloudinary.com/dy80ftu9k/video/upload/v1754454026/nature-216798-trimmed_1_yaivbb.mp3" preload="auto"></audio>
            <header className="flex-shrink-0 bg-zinc-900 p-3 flex justify-between items-center border-b-2 border-zinc-700">
                <div className="flex items-center gap-2">
                    {selectedUser ? (
                        <>
                            <button onClick={() => setSelectedUser(null)} className="sm:hidden p-1 hover:bg-zinc-700 rounded-full">&lt;</button>
                            <div className="relative">
                                {selectedUser.avatar_url ? <img src={selectedUser.avatar_url} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center"><UserIcon className="w-5 h-5"/></div>}
                                {selectedUser.is_online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-zinc-900"></div>}
                            </div>
                            <span className="font-bold">{selectedUser.full_name || selectedUser.username}</span>
                        </>
                    ) : (
                        <h2 className="text-lg font-bold flex items-center gap-2"><UsersIcon/> Users</h2>
                    )}
                </div>
                 <div className="flex items-center gap-2">
                    <button onClick={() => setView(view === 'expanded' ? 'fullscreen' : 'expanded')} className="p-1 hover:bg-zinc-700 rounded-full">{view === 'expanded' ? <MaximizeIcon /> : <MinimizeIcon />}</button>
                    <button onClick={() => setView('collapsed')} className="p-1 hover:bg-zinc-700 rounded-full"><CloseIcon /></button>
                </div>
            </header>
            <main className="flex-1 flex min-h-0">
                {/* User List */}
                <div className={`w-full sm:w-1/3 border-r-2 border-zinc-700 flex-col overflow-y-auto ${selectedUser ? 'hidden sm:flex' : 'flex'}`}>
                   {loading.users ? <SpinnerIcon className="m-auto text-lime-400"/> : combinedUsers.map(user => (
                       <div key={user.id} onClick={() => setSelectedUser(user)} className="p-3 flex items-center gap-3 hover:bg-zinc-700 cursor-pointer border-b border-zinc-700">
                           <div className="relative">
                               {user.avatar_url ? <img src={user.avatar_url} className="w-10 h-10 rounded-full"/> : <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center"><UserIcon /></div>}
                               {user.is_online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-800"></div>}
                           </div>
                           <div>
                               <p className="font-bold text-sm">{user.full_name || user.username}</p>
                               <p className="text-xs text-zinc-400">@{user.username}</p>
                           </div>
                       </div>
                   ))}
                </div>
                 {/* Chat Window */}
                <div className={`w-full sm:w-2/3 flex-col ${!selectedUser ? 'hidden sm:flex' : 'flex'}`}>
                    {selectedUser ? (
                        <>
                            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                                {loading.messages ? <SpinnerIcon className="m-auto text-lime-400"/> : messages.map(msg => (
                                    <div key={msg.id} className={`flex items-end gap-2 ${msg.sender_id === user.id ? 'justify-end' : ''}`}>
                                        <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.sender_id === user.id ? 'bg-lime-500 text-black' : 'bg-zinc-700 text-white'}`}>
                                            <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="p-2 border-t-2 border-zinc-700 flex items-center gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type a message..."
                                    className="flex-grow bg-zinc-700 border-2 border-zinc-600 rounded-full py-2 px-4 text-sm focus:outline-none focus:border-lime-400"
                                />
                                <button onClick={handleSendMessage} className="p-2 bg-lime-400 text-black rounded-full hover:bg-lime-500 disabled:bg-zinc-600" disabled={!newMessage.trim()}>
                                    <SendIcon/>
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-center p-4">
                            <MessageSquareIcon className="w-12 h-12 mb-4" />
                            <h3 className="font-bold">Select a user to start chatting</h3>
                            <p className="text-sm">Your conversations will appear here.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Chat;
