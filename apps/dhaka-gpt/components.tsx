
import React, { useState, useRef } from 'react';
import { ChatMessage, ChatPart } from './types';
import { SpinnerIcon, UserIcon, SendIcon, CameraIcon, CloseIcon } from '../../components/Icons';

const isImagePart = (part: ChatPart): part is { inlineData: { mimeType: string, data: string } } => {
    return 'inlineData' in part;
};

export const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isModel = message.role === 'model';
    
    return (
        <div className={`flex items-start gap-4 ${isModel ? '' : 'justify-end'}`}>
            {isModel && (
                 <div className="w-10 h-10 rounded-lg bg-teal-500 flex-shrink-0 flex items-center justify-center text-white font-bold">
                    GB
                </div>
            )}
            <div className={`p-1 rounded-xl max-w-lg ${isModel ? 'bg-zinc-800 border border-zinc-700' : 'bg-teal-600'}`}>
                <div className="p-3 space-y-2">
                {message.parts.map((part, index) => {
                    if (isImagePart(part)) {
                        return <img key={index} src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} className="rounded-md max-w-xs border-2 border-zinc-700" alt="User upload" />;
                    }
                    return <p key={index} className="whitespace-pre-wrap">{part.text}</p>;
                })}
                </div>
            </div>
            {!isModel && <div className="w-10 h-10 rounded-lg bg-zinc-700 flex-shrink-0 flex items-center justify-center border border-zinc-600"><UserIcon/></div>}
        </div>
    );
};

export const ChatInput: React.FC<{ onSend: (message: string, imageFile: File | null) => void; isLoading: boolean }> = ({ onSend, isLoading }) => {
    const [input, setInput] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const handleSend = () => {
        if ((input.trim() || imageFile) && !isLoading) {
            onSend(input, imageFile);
            setInput('');
            setImageFile(null);
            setImagePreview(null);
             if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    return (
        <div className="p-4 bg-zinc-800 border-t-2 border-teal-500/50">
            {imagePreview && (
                <div className="relative w-24 h-24 mb-2 p-1 border-2 border-zinc-600 rounded-md bg-zinc-900">
                    <img src={imagePreview} className="w-full h-full object-cover rounded-sm" alt="Preview"/>
                    <button onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 border-2 border-black">
                        <CloseIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
            <div className="flex items-center gap-2">
                 <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="p-3 bg-zinc-700 text-white rounded-lg border-2 border-zinc-600 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-500">
                    <CameraIcon/>
                </button>
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && !e.shiftKey ? (e.preventDefault(), handleSend()) : null}
                    placeholder="আপনার প্রশ্ন করুন..."
                    className="flex-grow bg-zinc-700 border-2 border-zinc-600 rounded-lg py-3 px-4 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-300/50"
                    disabled={isLoading}
                />
                <button onClick={handleSend} disabled={isLoading || (!input.trim() && !imageFile)} className="p-3 bg-teal-500 text-black font-bold rounded-lg border-2 border-teal-300 hover:bg-teal-600 disabled:bg-zinc-600 disabled:cursor-not-allowed">
                    {isLoading ? <SpinnerIcon /> : <SendIcon/>}
                </button>
            </div>
        </div>
    );
};