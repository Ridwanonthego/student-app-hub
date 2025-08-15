

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ChatPart, GeminiBanglaPageProps } from './types';
import { createGeminiBanglaChat, sendGeminiBanglaChatMessage } from './gemini-service';
import { ChatBubble, ChatInput } from './components';
import { BackArrowIcon, SpinnerIcon } from '../../components/Icons';
import { supabase } from '../../supabase/client';
import { Chat } from '@google/genai';
import { User } from '@supabase/supabase-js';
import { Json } from '../../supabase/database.types';

const GeminiBanglaPage: React.FC<GeminiBanglaPageProps> = ({ onNavigateBack, apiKey, user }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const initializeChat = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch all user data concurrently
                const [
                    profileRes,
                    cvRes,
                    watchfinderRes,
                    nutriRes,
                    todoRes,
                    historyRes
                ] = await Promise.all([
                    supabase.from('profiles').select('full_name, username').eq('id', user.id).single(),
                    supabase.from('cv_data').select('raw_info').eq('id', user.id).maybeSingle(),
                    supabase.from('watchfinder_profiles').select('favorite_genres, favorite_actors, preferred_description').eq('id', user.id).maybeSingle(),
                    supabase.from('banglanutri_profiles').select('goal, exclusions').eq('id', user.id).maybeSingle(),
                    supabase.from('todo_tasks').select('title, status').eq('user_id', user.id).limit(5).order('created_at', { ascending: false }),
                    supabase.from('gemini_bangla_chat_history').select('history').eq('user_id', user.id).maybeSingle()
                ]);

                // 2. Build the context string
                let userContext = "";
                const profileData = profileRes.data as any;
                if (profileData) userContext += `User's Name: ${profileData.full_name || profileData.username}. `;
                
                const cvData = cvRes.data as any;
                if (cvData && cvData.raw_info) userContext += `Professional Summary: ${cvData.raw_info.substring(0, 150)}... `;

                const watchfinderData = watchfinderRes.data as any;
                if (watchfinderData) userContext += `Movie Tastes: Likes genres like ${watchfinderData.favorite_genres?.join(', ')}. `;
                
                const nutriData = nutriRes.data as any;
                if (nutriData) userContext += `Health Goal: To ${nutriData.goal} weight. They don't eat: ${nutriData.exclusions?.join(', ')}. `;
                
                const todoData = todoRes.data as any[];
                if (todoData && todoData.length > 0) userContext += `Recent Tasks: ${todoData.map(t => `${t.title}`).join(', ')}. `;
                
                // 3. Initialize chat with history and context
                let initialHistory: ChatMessage[] = [];
                const typedData = historyRes.data as unknown as { history: Json | null } | null;
                if (typedData?.history) {
                    initialHistory = typedData.history as unknown as ChatMessage[];
                }
                
                chatRef.current = createGeminiBanglaChat(apiKey, initialHistory, userContext.trim());

                if (initialHistory.length > 0) {
                    setMessages(initialHistory);
                } else {
                    setMessages([{ role: 'model', parts: [{ text: "স্বাগতম! আমি জেমিনি বাংলা। আজ আপনাকে কীভাবে সাহায্য করতে পারি?" }] }]);
                }
            } catch (err) {
                console.error("Failed to initialize chat:", err);
                setMessages([{ role: 'model', parts: [{ text: "চ্যাট শুরু করতে একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।" }] }]);
            } finally {
                setIsLoading(false);
            }
        };
        initializeChat();
    }, [apiKey, user.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    const saveHistory = async (newHistory: ChatMessage[]) => {
        // Only save conversations that have at least one user message
        if (newHistory.some(m => m.role === 'user')) {
             await (supabase.from('gemini_bangla_chat_history') as any).upsert([{
                user_id: user.id,
                history: newHistory as unknown as Json,
                updated_at: new Date().toISOString()
            }]);
        }
    };

    const handleSend = async (messageText: string, imageFile: File | null) => {
        if (!chatRef.current) return;
        setIsLoading(true);

        const userParts: ChatPart[] = [];
        if (imageFile) {
            const base64Image = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = error => reject(error);
                reader.readAsDataURL(imageFile);
            });
            userParts.push({ inlineData: { mimeType: imageFile.type, data: base64Image } });
        }
        if(messageText.trim()) {
            userParts.push({ text: messageText });
        }

        const userMessage: ChatMessage = { role: 'user', parts: userParts };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);

        try {
            const modelResponse = await sendGeminiBanglaChatMessage(chatRef.current, userParts);
            const modelMessage: ChatMessage = { role: 'model', parts: [{ text: modelResponse }] };
            const finalMessages = [...updatedMessages, modelMessage];
            setMessages(finalMessages);
            await saveHistory(finalMessages);
        } catch (error) {
            const errorMessage: ChatMessage = { role: 'model', parts: [{ text: "দুঃখিত, আমি এখন সংযোগ করতে পারছি না। অনুগ্রহ করে একটু পরে আবার চেষ্টা করুন।" }] };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-900 text-white flex flex-col font-poppins">
            <header className="flex-shrink-0 bg-zinc-800/80 backdrop-blur-sm p-4 flex items-center gap-4 border-b-2 border-teal-500/50">
                <button onClick={onNavigateBack} className="p-2 hover:bg-zinc-700 rounded-full">
                    <BackArrowIcon />
                </button>
                <div className="relative">
                    <div className="w-10 h-10 rounded-lg bg-teal-500 flex items-center justify-center font-bold border-2 border-teal-300">
                        GB
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-lime-400 rounded-full border-2 border-zinc-800"></div>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Gemini Bangla</h1>
                    <p className="text-sm text-zinc-400 font-semibold">আপনার বাংলা AI সহকারী</p>
                </div>
            </header>
            <main className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto">
                    {isLoading && messages.length === 0 ? (
                        <div className="flex justify-center pt-10"><SpinnerIcon className="w-10 h-10 text-teal-400"/></div>
                    ) : (
                        messages.map((msg, i) => <ChatBubble key={i} message={msg} />)
                    )}
                    {isLoading && messages.length > 0 && messages[messages.length-1].role === 'user' && (
                        <div className="flex items-start gap-4">
                           <div className="w-10 h-10 rounded-lg bg-teal-500 flex-shrink-0 flex items-center justify-center text-white font-bold">GB</div>
                           <div className="p-4 rounded-xl bg-zinc-800 border border-zinc-700">
                                <div className="flex gap-1.5 items-center">
                                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-pulse-fast"></span>
                                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-pulse-fast" style={{animationDelay: '0.2s'}}></span>
                                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-pulse-fast" style={{animationDelay: '0.4s'}}></span>
                                </div>
                           </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <ChatInput onSend={handleSend} isLoading={isLoading} />
            </main>
        </div>
    );
};

export default GeminiBanglaPage;
