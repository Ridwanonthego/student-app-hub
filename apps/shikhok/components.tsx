

import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { BackArrowIcon, CloseIcon, DownloadIcon, SparklesIcon } from '../../components/Icons';
import { ShikhokButtonProps, SourceDocument, SourceType, MainView, NotebookGuide, ChatMessage, WebSearchResult, Language, OverlayView } from './types';
import { UI_TEXT, WELCOME_MESSAGE, ACTION_CARDS } from './constants';
import * as I from './icons';

// --- Shared Components ---

export const ShikhokButton: React.FC<ShikhokButtonProps> = ({ onClick, disabled, children, className = '', variant = 'primary' }) => {
    const baseStyle = "w-full font-semibold py-2.5 px-4 border rounded-lg transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2";
    const colorStyle = variant === 'primary' 
        ? 'bg-slate-800 text-white hover:bg-slate-700 border-slate-800 focus:ring-slate-500' 
        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 focus:ring-slate-400';
    const disabledStyle = "disabled:bg-slate-200 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed";

    return (
        <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${colorStyle} ${disabledStyle} ${className}`}>
            {children}
        </button>
    );
};

const SkeletonLoader: React.FC = () => (
    <div className="animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
        </div>
        <div className="h-8 bg-slate-200 rounded w-1/4 mt-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="h-24 bg-slate-200 rounded-lg"></div>
            <div className="h-24 bg-slate-200 rounded-lg"></div>
            <div className="h-24 bg-slate-200 rounded-lg"></div>
        </div>
    </div>
);


// --- Main Layout Components ---

export const TopBar: React.FC<{ onBack: () => void; language: Language; setLanguage: (lang: Language) => void; isApiKeySet: boolean; }> = ({ onBack, language, setLanguage, isApiKeySet }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    return (
        <header className="relative bg-white h-16 border-b border-slate-200 z-30 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
                 <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-800"><BackArrowIcon /></button>
                <I.BookOpenIcon className="w-10 h-10 text-slate-800" />
                <h1 className="text-2xl font-extrabold tracking-tighter text-slate-900">{UI_TEXT[language].appName}</h1>
            </div>
            <div className="flex items-center gap-6">
                <div className="relative">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2 font-semibold text-slate-600 hover:text-slate-900">
                        {UI_TEXT[language].language}
                        <svg className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {isMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 shadow-xl rounded-lg w-36">
                            <button onClick={() => { setLanguage('en'); setIsMenuOpen(false); }} className="w-full text-left p-2.5 hover:bg-slate-100 font-semibold text-slate-700">English</button>
                            <button onClick={() => { setLanguage('bn'); setIsMenuOpen(false); }} className="w-full text-left p-2.5 hover:bg-slate-100 font-semibold text-slate-700">Bangla</button>
                        </div>
                    )}
                </div>
                <div className="w-10 h-10 bg-slate-200 rounded-full border border-slate-300"></div>
            </div>
        </header>
    );
};

export const LeftPanel: React.FC<{ sources: SourceDocument[]; onAddSource: () => void; }> = ({ sources, onAddSource }) => {
    const getIcon = (type: SourceType) => {
        const props = { className: "w-6 h-6 flex-shrink-0 text-slate-500" };
        switch (type) {
            case 'file': return <I.TxtFileIcon {...props} />;
            case 'paste': return <I.PasteIcon {...props} />;
            case 'url': return <I.LinkIcon {...props} />;
            case 'research': return <I.ResearchIcon {...props} />;
        }
    };
    return (
        <aside className="w-80 bg-slate-50 border-r border-slate-200 p-6 flex-col hidden md:flex">
            <h2 className="text-lg font-bold mb-4 text-slate-500 uppercase tracking-wider">Sources</h2>
            <div className="flex-grow space-y-2 overflow-y-auto pr-2 -mr-2">
                {sources.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 border-2 border-dashed border-slate-300 rounded-lg p-4">
                        <p className="font-semibold">{UI_TEXT.en.noSources}</p>
                        <p className="text-sm">{UI_TEXT.en.clickToAdd}</p>
                    </div>
                ) : (
                    sources.map(source => (
                        <div key={source.id} className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3 hover:border-slate-400 hover:bg-slate-100/50 transition-colors">
                            {getIcon(source.type)}
                            <p className="font-semibold truncate text-sm text-slate-700" title={source.name}>{source.name}</p>
                        </div>
                    ))
                )}
            </div>
            <div className="mt-6">
                <ShikhokButton onClick={onAddSource} disabled={sources.length >= 50} className="font-semibold">
                    <I.PlusIcon className="w-5 h-5"/> {UI_TEXT['en'].addSource}
                </ShikhokButton>
            </div>
        </aside>
    );
};

// --- Main Content Views ---

const WelcomeScreen: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <I.BookOpenIcon className="w-24 h-24 mb-6 text-slate-800" />
        <h2 className="text-5xl font-extrabold mb-4 text-slate-900">{WELCOME_MESSAGE.title}</h2>
        <p className="max-w-lg text-lg text-slate-600 leading-relaxed">{WELCOME_MESSAGE.text}</p>
    </div>
);

const NotebookGuideView: React.FC<{ guide: NotebookGuide; onActionClick: (id: string) => void; onQuestionClick: (q: string) => void; language: Language }> = ({ guide, onActionClick, onQuestionClick, language }) => (
    <div className="p-8 space-y-10">
        <div>
            <h3 className="text-3xl font-bold flex items-center gap-3 mb-4 text-slate-900"><SparklesIcon className="w-8 h-8 text-amber-500"/> {UI_TEXT[language].summary}</h3>
            <div className="prose max-w-none text-lg leading-relaxed text-slate-700">
                <p>{guide.summary}</p>
            </div>
        </div>
        <div>
            <h3 className="text-3xl font-bold flex items-center gap-3 mb-4 text-slate-900"><I.LightbulbIcon className="w-8 h-8 text-amber-500"/> {UI_TEXT[language].suggestedQuestions}</h3>
            <div className="space-y-3">
                {guide.suggestedQuestions.map((q, i) => (
                    <button key={i} onClick={() => onQuestionClick(q)} className="w-full text-left bg-white border border-slate-200 rounded-lg p-4 font-semibold text-lg text-slate-800 hover:border-slate-400 hover:bg-slate-50 transition-colors">
                        {q}
                    </button>
                ))}
            </div>
        </div>
        <div>
            <h3 className="text-3xl font-bold mb-4 text-slate-900">{UI_TEXT[language].actions}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ACTION_CARDS.map(action => {
                    const Icon = I[action.icon as keyof typeof I] as React.FC<{className?: string}>;
                    return (
                        <button key={action.id} onClick={() => onActionClick(action.id)} className="bg-white border border-slate-200 rounded-lg p-4 text-left hover:border-slate-400 hover:bg-slate-50 transition-colors group">
                            <Icon className="w-8 h-8 mb-2 text-slate-500 group-hover:text-amber-500 transition-colors" />
                            <h4 className="font-bold text-lg text-slate-800">{action.title}</h4>
                            <p className="text-slate-500 text-sm">{action.description}</p>
                        </button>
                    )
                })}
            </div>
        </div>
    </div>
);

const ChatView: React.FC<{ messages: ChatMessage[], isLoading: boolean, onSend: (msg: string) => void, language: Language }> = ({ messages, isLoading, onSend, language }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        if (input.trim()) {
            onSend(input.trim());
            setInput('');
        }
    };
    
    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {messages.map(msg => <ChatMessageBubble key={msg.id} message={msg} />)}
                {isLoading && <ChatMessageBubble message={{id: 'loading', role: 'ai', content: '...'}} isLoading={true} />}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-slate-200 bg-white">
                <div className="relative">
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder={UI_TEXT[language].askFollowUp}
                        className="w-full p-4 pr-16 bg-slate-100 border-2 border-slate-200 rounded-lg resize-none focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-300/50"
                        rows={1}
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} disabled={!input.trim() || isLoading} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-800 text-white rounded-full flex items-center justify-center hover:bg-slate-700 disabled:bg-slate-400 transition-colors">
                        <I.SendIcon className="w-6 h-6"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

const ChatMessageBubble: React.FC<{ message: ChatMessage, isLoading?: boolean }> = ({ message, isLoading }) => {
    const isUser = message.role === 'user';
    const bubbleClass = isUser ? 'bg-slate-800 text-white rounded-br-none' : 'bg-slate-200 text-slate-800 rounded-bl-none';
    const wrapperClass = isUser ? 'justify-end' : 'justify-start';

    return (
        <div className={`flex items-end gap-3 ${wrapperClass}`}>
            {!isUser && <div className="w-10 h-10 bg-amber-400 rounded-full border border-slate-300 flex items-center justify-center font-bold text-sm flex-shrink-0">AI</div>}
            <div className={`max-w-2xl`}>
                <div className={`${bubbleClass} p-4 rounded-xl`}>
                    {isLoading ? (
                        <div className="flex gap-1.5 items-center">
                            <span className="w-2.5 h-2.5 bg-slate-500 rounded-full animate-pulse-fast"></span>
                            <span className="w-2.5 h-2.5 bg-slate-500 rounded-full animate-pulse-fast" style={{animationDelay: '0.2s'}}></span>
                            <span className="w-2.5 h-2.5 bg-slate-500 rounded-full animate-pulse-fast" style={{animationDelay: '0.4s'}}></span>
                        </div>
                    ) : (
                        <p className="leading-relaxed">{message.content}</p>
                    )}
                </div>
                {!isUser && message.citations && message.citations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {message.citations.map((cite, i) => (
                             <div key={i} className="relative group bg-amber-200 text-sm font-semibold border border-amber-300 text-amber-800 px-2 py-0.5 rounded-full cursor-pointer">
                                {cite.sourceName}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-slate-800 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    {cite.snippet}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-8 border-x-transparent border-t-8 border-t-slate-800"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
             {isUser && <div className="w-10 h-10 bg-slate-300 rounded-full border border-slate-300 flex-shrink-0"></div>}
        </div>
    );
};

export const MainContent: React.FC<any> = ({ mainView, setMainView, notebookGuide, chatHistory, isLoadingGuide, isLoadingChat, onAskQuestion, onActionClick, sources, language }) => {
    
    if (sources.length === 0) {
        return <WelcomeScreen />;
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-shrink-0 border-b border-slate-200 px-4">
                <button
                    onClick={() => setMainView('guide')}
                    className={`px-4 py-3 font-semibold text-lg relative transition-colors ${mainView === 'guide' ? 'text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    {UI_TEXT[language].notebookGuide}
                    {mainView === 'guide' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800"></span>}
                </button>
                 <button
                    onClick={() => setMainView('chat')}
                    className={`px-4 py-3 font-semibold text-lg relative transition-colors ${mainView === 'chat' ? 'text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    {UI_TEXT[language].chat}
                    {mainView === 'chat' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800"></span>}
                </button>
            </div>
            <div className="flex-grow overflow-y-auto">
                {mainView === 'guide' && (
                    isLoadingGuide ? <div className="p-8"><SkeletonLoader /></div> :
                    notebookGuide ? <NotebookGuideView guide={notebookGuide} onActionClick={onActionClick} onQuestionClick={(q) => { setMainView('chat'); onAskQuestion(q); }} language={language} /> : null
                )}
                 {mainView === 'chat' && <ChatView messages={chatHistory} isLoading={isLoadingChat} onSend={onAskQuestion} language={language}/>}
            </div>
        </div>
    );
};

// --- Modals ---

export const AddSourceModal: React.FC<any> = ({ isOpen, onClose, onAddSources, onResearch, isLoadingResearch }) => {
    const [view, setView] = useState<'file'|'paste'|'url'|'research'>('file');
    const [pasteText, setPasteText] = useState('');
    const [url, setUrl] = useState('');
    const [researchTopic, setResearchTopic] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        
        Array.from(files).forEach(file => {
             const reader = new FileReader();
             reader.onload = (event) => {
                 onAddSources([{
                     id: uuidv4(),
                     name: file.name,
                     type: 'file',
                     content: event.target?.result as string
                 }]);
             };
             reader.readAsText(file);
        });
        onClose();
    };
    
    const handleAddPaste = () => {
        if (!pasteText.trim()) return;
        onAddSources([{
            id: uuidv4(),
            name: `Pasted Text`,
            type: 'paste',
            content: pasteText
        }]);
        onClose();
    }
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-2xl border border-slate-200 shadow-2xl rounded-xl" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900">Add Source</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><CloseIcon/></button>
                </header>
                <div className="p-6">
                    <div className="flex gap-2 mb-4 p-1 bg-slate-100 rounded-lg">
                        {(['file', 'paste', 'url', 'research'] as const).map(v => (
                            <button key={v} onClick={() => setView(v)} className={`flex-1 p-2 font-semibold capitalize rounded-md transition-colors ${view === v ? 'bg-white shadow' : 'text-slate-600 hover:bg-white/50'}`}>{v}</button>
                        ))}
                    </div>
                    {view === 'file' && <div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept=".txt,.md"/>
                        <div onClick={() => fileInputRef.current?.click()} className="h-40 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors">
                            <p className="font-bold text-slate-700">Click to upload files</p>
                            <p className="text-sm text-slate-500">Supports .txt, .md</p>
                        </div>
                    </div>}
                    {view === 'paste' && <div>
                        <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} placeholder="Paste your content here..." className="w-full h-40 p-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400" />
                        <ShikhokButton onClick={handleAddPaste} disabled={!pasteText.trim()} className="mt-2">Add Pasted Text</ShikhokButton>
                    </div>}
                     {view === 'research' && <div>
                        <input type="text" value={researchTopic} onChange={e => setResearchTopic(e.target.value)} placeholder="Enter a topic to find sources..." className="w-full p-3 border-2 border-slate-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-slate-400" />
                        <ShikhokButton onClick={() => onResearch(researchTopic)} disabled={isLoadingResearch || !researchTopic.trim()}>
                            {isLoadingResearch ? "Finding..." : "Find Sources"}
                        </ShikhokButton>
                    </div>}
                </div>
            </div>
        </div>
    );
};

export const SourceSelectionModal: React.FC<any> = ({ isOpen, onClose, results, onAddSelectedSources }) => {
    const [selected, setSelected] = useState<string[]>(results.map((r: any) => r.link));

    if (!isOpen) return null;

    const toggleSelection = (link: string) => {
        setSelected(prev => prev.includes(link) ? prev.filter(l => l !== link) : [...prev, link]);
    };

    const handleAdd = () => {
        const sourcesToAdd = results
            .filter((r: WebSearchResult) => selected.includes(r.link))
            .map((r: WebSearchResult) => ({
                id: uuidv4(),
                name: r.title,
                type: 'research',
                content: `${r.title}\nURL: ${r.link}\n\n${r.snippet}`
            } as SourceDocument));
        onAddSelectedSources(sourcesToAdd);
    };

    return (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-3xl border border-slate-200 shadow-2xl rounded-xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900">Sources Found</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><CloseIcon/></button>
                </header>
                <div className="p-6 space-y-3 overflow-y-auto flex-grow">
                    {results.map((r: WebSearchResult) => (
                        <div key={r.link} onClick={() => toggleSelection(r.link)} className={`flex gap-4 p-3 border rounded-lg cursor-pointer transition-all ${selected.includes(r.link) ? 'border-slate-500 bg-slate-50 ring-2 ring-slate-300' : 'border-slate-200 hover:border-slate-400'}`}>
                            <div className="w-6 h-6 border-2 border-slate-400 rounded flex items-center justify-center flex-shrink-0 mt-1 transition-colors ${selected.includes(r.link) ? 'bg-slate-800 border-slate-800' : 'bg-white'}">
                                {selected.includes(r.link) && <I.CheckboxCheckedIcon className="w-5 h-5 text-white"/>}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">{r.title}</h4>
                                <p className="text-sm text-slate-600 line-clamp-2">{r.snippet}</p>
                                <p className="text-xs text-blue-600 truncate">{r.link}</p>
                            </div>
                        </div>
                    ))}
                </div>
                 <footer className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
                     <ShikhokButton onClick={onClose} variant="secondary">Cancel</ShikhokButton>
                     <ShikhokButton onClick={handleAdd} disabled={selected.length === 0}>Add {selected.length} Sources</ShikhokButton>
                </footer>
            </div>
        </div>
    );
};

export const ErrorBanner: React.FC<{ error: string | null; onClose: () => void; }> = ({ error, onClose }) => {
    if (!error) return null;
    return (
        <div className="fixed bottom-6 right-6 bg-red-600 text-white p-4 border-2 border-red-800 shadow-lg rounded-lg flex items-center gap-4 z-50">
            <p className="font-bold">{error}</p>
            <button onClick={onClose}><CloseIcon className="w-6 h-6"/></button>
        </div>
    );
};

export const ProgressBar: React.FC<{ isLoading: boolean; message: string; }> = ({ isLoading, message }) => {
    if (!isLoading) return null;
    return (
        <div className="fixed top-16 left-0 w-full z-50">
            <div className="bg-slate-800/80 backdrop-blur-sm text-white text-center py-1.5 text-sm font-semibold flex items-center justify-center gap-2">
                <SparklesIcon className="w-4 h-4 text-amber-400 animate-pulse"/>
                <span>{message}</span>
            </div>
            <div className="h-1 bg-amber-400/20 overflow-hidden">
                <div className="h-full bg-amber-400 w-1/2 animate-indeterminate"></div>
            </div>
             <style>{`
                .animate-indeterminate { animation: indeterminate 2s infinite linear; }
                @keyframes indeterminate { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
            `}</style>
        </div>
    );
};

// --- Overlay Views ---
const OverlayContainer: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; }> = ({ title, onClose, children, footer }) => (
    <div className="absolute inset-0 bg-white z-20 flex flex-col">
        <header className="flex-shrink-0 bg-slate-50 h-16 border-b border-slate-200 flex items-center justify-between px-6">
            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
            <button onClick={onClose} className="p-2 text-slate-500 rounded-md hover:bg-slate-200"><CloseIcon /></button>
        </header>
        <div className="flex-grow p-8 overflow-y-auto">
            {children}
        </div>
        {footer && <footer className="flex-shrink-0 p-4 border-t border-slate-200 flex justify-end">{footer}</footer>}
    </div>
);

export const BriefingView: React.FC<{ content: string | null; isLoading: boolean; onClose: () => void; onDownload: () => void; }> = ({ content, isLoading, onClose, onDownload }) => (
    <OverlayContainer title="Briefing Document" onClose={onClose} footer={<ShikhokButton onClick={onDownload}><DownloadIcon/> Download</ShikhokButton>}>
        {isLoading && <SkeletonLoader />}
        {content && <div className="prose max-w-none prose-slate" dangerouslySetInnerHTML={{__html: content.replace(/\n/g, '<br />')}}></div>}
    </OverlayContainer>
);

export const MindMapView: React.FC<{ content: string | null; isLoading: boolean; onClose: () => void; }> = ({ content, isLoading, onClose }) => (
    <OverlayContainer title="Mind Map" onClose={onClose}>
        {isLoading && <SkeletonLoader />}
        {content && <pre className="whitespace-pre-wrap font-mono text-sm p-4 bg-slate-50 rounded-lg">{content}</pre>}
    </OverlayContainer>
);

export const PodcastView: React.FC<{ content: string | null; isLoading: boolean; onClose: () => void; }> = ({ content, isLoading, onClose }) => (
    <OverlayContainer title="Podcast Script" onClose={onClose}>
        {isLoading && <SkeletonLoader />}
        {content && <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed p-4 bg-slate-50 rounded-lg">{content}</pre>}
    </OverlayContainer>
);

export const NotesView: React.FC<{ notes: string; setNotes: (notes: string) => void; onClose: () => void; }> = ({ notes, setNotes, onClose }) => {
    const [saved, setSaved] = useState(false);
    const handleSave = () => {
        // Here we just show a visual confirmation as the state is managed in the parent
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }
    return (
        <OverlayContainer title="My Notes" onClose={onClose} footer={<ShikhokButton onClick={handleSave}>{saved ? 'Saved!' : 'Save'}</ShikhokButton>}>
            <p className="text-sm text-slate-600 mb-2 border-l-4 border-amber-400 pl-2">Notes are saved in this session only and will be lost on refresh.</p>
            <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full h-full p-4 border-2 border-slate-300 rounded-lg focus:outline-none resize-none focus:ring-2 focus:ring-slate-400"
                placeholder="Start typing your notes here..."
            />
        </OverlayContainer>
    );
};
