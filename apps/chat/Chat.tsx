

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../supabase/client';
import { ChatProps, ChatUser, ChatMessage } from './types';
import { SpinnerIcon, MessageSquareIcon, UsersIcon, CloseIcon, MaximizeIcon, MinimizeIcon, SendIcon, UserIcon, PhoneIcon } from '../../components/Icons';
import { RealtimeChannel, User } from '@supabase/supabase-js';

const TMDB_IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

const WatchInviteBubble: React.FC<{ message: ChatMessage; currentUserId: string; onAccept: (message: ChatMessage) => void }> = ({ message, currentUserId, onAccept }) => {
    const payload = message.payload as any;
    if (!payload || !payload.movie) return null;

    const { movie, status } = payload;
    const isReceiver = message.receiver_id === currentUserId;

    return (
        <div className="p-3 bg-zinc-700 rounded-lg max-w-xs md:max-w-md border-2 border-zinc-600">
            <p className="text-sm text-zinc-300 mb-2">{message.content}</p>
            <div className="flex gap-3 bg-zinc-800 p-2 rounded-md">
                <img src={`${TMDB_IMAGE_URL}${movie.poster_path}`} alt={movie.title} className="w-16 h-24 rounded-md object-cover" />
                <div>
                    <p className="font-bold text-white">{movie.title}</p>
                    {isReceiver ? (
                        status === 'pending' ? (
                            <button onClick={() => onAccept(message)} className="mt-2 bg-lime-500 text-black font-bold text-xs px-3 py-1 rounded-md hover:bg-lime-600">
                                Accept
                            </button>
                        ) : (
                            <p className="mt-2 text-green-400 font-bold text-sm">You accepted!</p>
                        )
                    ) : (
                         <p className={`mt-2 font-bold text-sm ${status === 'pending' ? 'text-yellow-400' : 'text-green-400'}`}>
                            {status === 'pending' ? 'Pending...' : 'Accepted!'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};


const Chat: React.FC<ChatProps> = ({ user, profile, initiateCall }) => {
    const [view, setView] = useState<'collapsed' | 'expanded' | 'fullscreen'>('collapsed');
    const [allUsers, setAllUsers] = useState<ChatUser[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState({ users: true, messages: false });
    const [unreadSenders, setUnreadSenders] = useState<Set<string>>(new Set());
    const presenceChannel = useRef<RealtimeChannel | null>(null);
    const messagesChannel = useRef<RealtimeChannel | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchUsers = useCallback(async () => {
        setLoading(prev => ({ ...prev, users: true }));
        try {
            const { data, error } = await (supabase
                .from('profiles') as any)
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
            const { data, error } = await (supabase
                .from('chat_messages') as any)
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

    // Fetch messages when a user is selected
    useEffect(() => {
        if (selectedUser) {
            fetchMessages(selectedUser.id);
        }
    }, [selectedUser, fetchMessages]);

    // Global listener for all incoming messages
    useEffect(() => {
        if (!user.id) return;

        const handleDbChange = (payload: any) => {
            const changedMessage = payload.new as ChatMessage;

            // --- Sound Notification ---
            // Only play sound for new, incoming messages from other users.
            if (payload.eventType === 'INSERT' && changedMessage.receiver_id === user.id) {
                const notificationSound = new Audio('https://res.cloudinary.com/dy80ftu9k/video/upload/v1755274938/Copy_of_Friday_at_10-19_PM_mx9m95.mp4');
                notificationSound.volume = 1.0;
                notificationSound.play().catch(e => console.error("Audio play failed", e));
            }
        
            // --- UI Update Logic ---
            // Is the message related to the currently selected chat?
            const isForCurrentChat = selectedUser &&
                ((changedMessage.sender_id === user.id && changedMessage.receiver_id === selectedUser.id) ||
                (changedMessage.sender_id === selectedUser.id && changedMessage.receiver_id === user.id));

            if (isForCurrentChat) {
                // Add new messages from the peer to the chat window.
                if (payload.eventType === 'INSERT' && changedMessage.sender_id !== user.id) {
                    setMessages(prev => [...prev, changedMessage]);
                }
                // Update messages (e.g., watch invite status change). This applies to both users' messages.
                else if (payload.eventType === 'UPDATE') {
                    setMessages(prev => prev.map(m => m.id === changedMessage.id ? changedMessage : m));
                }
            } else {
                // If the message is not for the current chat, but is for me, mark it as unread.
                if (payload.eventType === 'INSERT' && changedMessage.receiver_id === user.id) {
                    setUnreadSenders(prev => new Set(prev).add(changedMessage.sender_id));
                }
            }
        };

        const channel = supabase
            .channel(`public:chat_messages`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'chat_messages',
            }, handleDbChange)
            .subscribe();

        messagesChannel.current = channel;

        return () => {
            if (messagesChannel.current) {
                supabase.removeChannel(messagesChannel.current);
            }
        };
    }, [user.id, selectedUser, view]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedUser) return;
        const content = newMessage.trim();
        setNewMessage('');
        
        const optimisticMessage: ChatMessage = {
            id: Date.now(),
            sender_id: user.id,
            receiver_id: selectedUser.id,
            content,
            message_type: 'text',
            payload: null,
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
    
    const handleAcceptInvite = async (inviteMessage: ChatMessage) => {
        const payload = inviteMessage.payload as any;
        if (!payload || !payload.movie) return;

        // 1. Update original message to 'accepted'
        await (supabase
            .from('chat_messages') as any)
            .update({ payload: { ...payload, status: 'accepted' } })
            .eq('id', inviteMessage.id);
        
        // 2. Send confirmation message back
        await (supabase.from('chat_messages') as any).insert({
            sender_id: user.id,
            receiver_id: inviteMessage.sender_id,
            message_type: 'watch-accept',
            content: `Sounds great! I'd love to watch "${payload.movie.title}" with you.`
        });
    };

    const handleSelectUser = (userToSelect: ChatUser) => {
        setSelectedUser(userToSelect);
        setUnreadSenders(prev => {
            const newSet = new Set(prev);
            newSet.delete(userToSelect.id);
            return newSet;
        });
    };
    
    if (view === 'collapsed') {
        const unreadCount = unreadSenders.size;
        const onlineCount = onlineUsers.filter(id => id !== user.id).length;
        const showNotification = unreadCount > 0 || onlineCount > 0;
        const notificationNumber = unreadCount > 0 ? unreadCount : onlineCount;
        
        return (
            <button
                onClick={() => setView('expanded')}
                className="fixed bottom-6 right-6 bg-lime-400 text-black w-16 h-16 rounded-full border-2 border-black shadow-[4px_4px_0px_#000] flex items-center justify-center hover:bg-lime-500 transition-all z-50 group"
            >
                <MessageSquareIcon className="w-8 h-8"/>
                {showNotification && (
                    <span className={`absolute -top-1 -right-1 ${unreadCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-red-500'} text-white text-xs font-bold w-6 h-6 rounded-full border-2 border-black flex items-center justify-center`}>
                        {notificationNumber}
                    </span>
                )}
            </button>
        );
    }
    
    const combinedUsers = allUsers.map(u => ({ ...u, is_online: onlineUsers.includes(u.id) })).sort((a,b) => (b.is_online ? 1 : -1) - (a.is_online ? 1 : -1) || (a.username || '').localeCompare(b.username || ''));

    const viewClasses = {
        expanded: 'fixed inset-0 w-full h-full rounded-none sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[90vw] sm:max-w-2xl sm:h-[70vh] sm:max-h-[600px] sm:rounded-lg',
        fullscreen: 'fixed inset-0 w-full h-full rounded-none'
    }

    return (
        <div className={`${viewClasses[view]} bg-zinc-800 border-2 border-zinc-600 shadow-2xl flex flex-col font-poppins text-white z-50`}>
            <header className="flex-shrink-0 bg-zinc-900 p-3 flex justify-between items-center border-b-2 border-zinc-700">
                <div className="flex items-center gap-2">
                    {selectedUser ? (
                        <>
                            <button onClick={() => setSelectedUser(null)} className="sm:hidden p-1 hover:bg-zinc-700 rounded-full">&lt;</button>
                            <div className="relative">
                                {selectedUser.avatar_url ? <img src={selectedUser.avatar_url} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center"><UserIcon className="w-5 h-5"/></div>}
                                {selectedUser.is_online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-zinc-900"></div>}
                            </div>
                            <span className="font-bold">{selectedUser.username || 'Anonymous User'}</span>
                        </>
                    ) : (
                        <h2 className="text-lg font-bold flex items-center gap-2"><UsersIcon/> Users</h2>
                    )}
                </div>
                 <div className="flex items-center gap-2">
                    {selectedUser && (
                        <button onClick={() => initiateCall(selectedUser)} className="p-1.5 hover:bg-zinc-700 rounded-full text-lime-400" aria-label={`Call ${selectedUser.username}`}>
                            <PhoneIcon className="w-5 h-5"/>
                        </button>
                    )}
                    <button onClick={() => setView(view === 'expanded' ? 'fullscreen' : 'expanded')} className="p-1 hover:bg-zinc-700 rounded-full">{view === 'expanded' ? <MaximizeIcon /> : <MinimizeIcon />}</button>
                    <button onClick={() => setView('collapsed')} className="p-1 hover:bg-zinc-700 rounded-full"><CloseIcon /></button>
                </div>
            </header>
            <main className="flex-1 flex min-h-0">
                {/* User List */}
                <div className={`w-full sm:w-1/3 border-r-2 border-zinc-700 flex-col overflow-y-auto ${selectedUser ? 'hidden sm:flex' : 'flex'}`}>
                   {loading.users ? <SpinnerIcon className="m-auto text-lime-400"/> : combinedUsers.map(user => (
                       <div key={user.id} onClick={() => handleSelectUser(user)} className="p-3 flex items-center gap-3 hover:bg-zinc-700 cursor-pointer border-b border-zinc-700">
                           <div className="relative">
                               {user.avatar_url ? <img src={user.avatar_url} className="w-10 h-10 rounded-full"/> : <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center"><UserIcon /></div>}
                               {user.is_online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-800"></div>}
                           </div>
                           <div className="flex-grow">
                               <p className="font-bold text-sm">{user.username || 'Anonymous User'}</p>
                               <p className="text-xs text-zinc-400">{user.is_online ? 'Online' : 'Offline'}</p>
                           </div>
                           {unreadSenders.has(user.id) && <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse flex-shrink-0"></div>}
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
                                        {msg.message_type === 'text' && (
                                            <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.sender_id === user.id ? 'bg-lime-500 text-black' : 'bg-zinc-700 text-white'}`}>
                                                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                                            </div>
                                        )}
                                        {msg.message_type === 'watch-invite' && (
                                            <WatchInviteBubble message={msg} currentUserId={user.id} onAccept={handleAcceptInvite} />
                                        )}
                                        {msg.message_type === 'watch-accept' && (
                                             <div className="max-w-xs md:max-w-md p-3 rounded-lg bg-zinc-700 text-zinc-300 italic">
                                                <p className="text-sm">{msg.content}</p>
                                            </div>
                                        )}
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
