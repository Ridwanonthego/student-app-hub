
import React, { useState, useEffect, useRef } from 'react';
import { BestPracticesModalProps, ColorTheme, ColorThemePickerProps, ControlButtonProps, CvDisplayPanelProps, CvRating, CvRatingModalProps, LogEntry, LogPanelProps } from './types';
import { CloseIcon, DocumentIcon, HelpIcon, DownloadIcon, SparklesIcon, SpinnerIcon, WarningIcon, CheckIcon, InfoIcon, StarOutlineIcon } from '../../components/Icons';

const ControlButton: React.FC<ControlButtonProps> = ({ onClick, disabled, className, children }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-2 font-bold border-2 border-black transition-all duration-150 flex items-center justify-center gap-2
            ${disabled
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : `bg-white text-black shadow-[4px_4px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none ${className}`
            }`}
    >
        {children}
    </button>
);

export const ColorThemePicker: React.FC<ColorThemePickerProps> = ({ selectedTheme, onChange, disabled }) => {
    const themes: { name: ColorTheme, color: string }[] = [
        { name: 'Slate', color: 'bg-slate-600' },
        { name: 'Ocean', color: 'bg-sky-600' },
        { name: 'Forest', color: 'bg-emerald-600' },
        { name: 'Ruby', color: 'bg-red-600' },
        { name: 'Gold', color: 'bg-amber-500' },
    ];
    return (
        <div className="flex flex-wrap gap-3">
            {themes.map(theme => (
                <button
                    key={theme.name}
                    onClick={() => onChange(theme.name)}
                    disabled={disabled}
                    className={`w-10 h-10 border-2 border-black transition-all ${theme.color} 
                        ${selectedTheme === theme.name ? 'ring-4 ring-offset-2 ring-indigo-600' : ''}
                        ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                    aria-label={`Select ${theme.name} theme`}
                />
            ))}
        </div>
    );
};

export const CvDisplayPanel: React.FC<CvDisplayPanelProps> = ({ cvs, activeStyle, onStyleChange, isLoading, error, onRefine, isRefining, onUpdateCvHtml, onDownload, onRate, isRating }) => {
    const [refinePrompt, setRefinePrompt] = useState('');
    const [isDirectEditing, setIsDirectEditing] = useState(false);
    const cvContentRef = useRef<HTMLDivElement>(null);
    const editingStyleRef = useRef<HTMLStyleElement | null>(null);

    const activeCv = cvs?.[activeStyle];

    useEffect(() => {
        // When switching styles, exit editing mode
        setIsDirectEditing(false);
    }, [activeStyle]);

    useEffect(() => {
        if (isDirectEditing) {
            const style = document.createElement('style');
            style.innerHTML = `
                .skill-pill:hover::after {
                    content: '✕';
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background-color: red;
                    color: white;
                    border-radius: 50%;
                    width: 18px;
                    height: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    cursor: pointer;
                    font-weight: bold;
                }
                .skill-pill {
                    position: relative;
                }
            `;
            document.head.appendChild(style);
            editingStyleRef.current = style;

            const handleClick = (e: MouseEvent) => {
                const target = e.target as HTMLElement;
                if (target.matches('.skill-pill, .skill-pill *')) {
                    const pill = target.closest('.skill-pill');
                    pill?.remove();
                }
            };

            cvContentRef.current?.addEventListener('click', handleClick);

            return () => {
                if (style.parentElement) {
                    document.head.removeChild(style);
                }
                cvContentRef.current?.removeEventListener('click', handleClick);
            };
        } else if (editingStyleRef.current) {
            if (editingStyleRef.current.parentElement) {
                document.head.removeChild(editingStyleRef.current);
            }
            editingStyleRef.current = null;
        }
    }, [isDirectEditing]);


    const handleToggleEdit = () => {
        if (isDirectEditing && cvContentRef.current) {
            onUpdateCvHtml(cvContentRef.current.innerHTML, activeStyle);
        }
        setIsDirectEditing(!isDirectEditing);
    };

    const handleRefineSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!refinePrompt || isRefining) return;
        await onRefine(refinePrompt);
        setRefinePrompt('');
    };
    
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                    <SpinnerIcon className="w-16 h-16 text-indigo-600" />
                    <p className="mt-4 text-lg font-semibold">Generating your CVs...</p>
                    <p className="mt-1">The AI is crafting your professional story.</p>
                </div>
            );
        }
        if (error && !activeCv) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center text-red-600 p-4">
                    <WarningIcon className="w-12 h-12" />
                    <h3 className="mt-2 text-xl font-bold">An Error Occurred</h3>
                    <p className="mt-1 text-sm text-gray-700">{error}</p>
                </div>
            );
        }
        if (activeCv) {
            return (
                <div
                    ref={cvContentRef}
                    id="cv-content"
                    contentEditable={isDirectEditing}
                    suppressContentEditableWarning={true}
                    className={`bg-white shadow-lg w-full max-w-4xl p-8 md:p-12 text-black ${isDirectEditing ? 'ring-2 ring-indigo-400 outline-none' : ''}`}
                    dangerouslySetInnerHTML={{ __html: activeCv.cvHtml }}
                />
            );
        }
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-4">
                <DocumentIcon className="w-24 h-24 text-gray-300" />
                <h3 className="mt-4 text-2xl font-bold">Your CVs will appear here</h3>
                <p className="mt-1 max-w-sm">Fill in your details and click "Generate CV" to create three distinct designs.</p>
            </div>
        );
    };

    const tabs: { name: 'Modern' | 'Classic' | 'Creative' }[] = [
        { name: 'Modern' }, { name: 'Classic' }, { name: 'Creative' }
    ];

    return (
        <div className="bg-gray-200 border-l-2 border-r-2 border-black flex-1 flex flex-col p-4 sm:p-6 h-full overflow-hidden">
             <div className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <div className="flex bg-gray-300 border-2 border-black p-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.name}
                            onClick={() => onStyleChange(tab.name)}
                            disabled={!cvs}
                            className={`px-4 py-1.5 font-bold transition-colors ${
                                activeStyle === tab.name
                                ? 'bg-black text-white'
                                : 'bg-transparent text-black hover:bg-gray-400'
                            } ${!cvs ? 'cursor-not-allowed' : ''}`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <ControlButton onClick={onRate} disabled={!activeCv || isLoading || isRating}>
                        {isRating ? <SpinnerIcon /> : <StarOutlineIcon className="w-5 h-5" />} Rate My CV
                    </ControlButton>
                    <ControlButton onClick={handleToggleEdit} disabled={!activeCv || isLoading}>
                        {isDirectEditing ? "Save Edits" : "Edit Text"}
                    </ControlButton>
                    <ControlButton onClick={onDownload} disabled={!activeCv || isLoading}>
                        <DownloadIcon /> Download PDF
                    </ControlButton>
                </div>
            </div>

            <div className="flex-1 bg-gray-300 border-2 border-black flex justify-center p-4 sm:p-8 overflow-y-auto min-h-0">
                {renderContent()}
            </div>

            {activeCv && (
                 <form onSubmit={handleRefineSubmit} className="flex-shrink-0 mt-4">
                    <label htmlFor="refine-prompt" className="sr-only">Refine Prompt</label>
                    <div className="relative">
                        <input
                            id="refine-prompt"
                            type="text"
                            value={refinePrompt}
                            onChange={(e) => setRefinePrompt(e.target.value)}
                            placeholder="Want changes? e.g., 'Make the summary more concise.'"
                            className="w-full p-3 bg-white border-2 border-black focus:border-indigo-600 focus:ring-indigo-600 focus:outline-none pr-32"
                            disabled={isRefining || isDirectEditing}
                        />
                         <button
                            type="submit"
                            disabled={isRefining || isDirectEditing || !refinePrompt}
                            className="absolute right-1 top-1 bottom-1 px-4 font-bold border-2 border-black transition-all duration-150 flex items-center justify-center gap-2 bg-indigo-600 text-white shadow-[2px_2px_0px_#000] hover:shadow-none active:translate-x-0.5 active:translate-y-0.5 disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
                        >
                            {isRefining ? <SpinnerIcon /> : <SparklesIcon />}
                            Refine
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export const BestPracticesModal: React.FC<BestPracticesModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const practices = [
        { title: "Tailor for the Job", content: "Customize your CV for each job application. Highlight the skills and experiences that are most relevant to the job description. A targeted CV has a much higher chance of getting noticed." },
        { title: "Quantify Your Achievements", content: "Instead of just listing your duties, show your impact with numbers. For example, 'Increased sales by 20% in 6 months' is more powerful than 'Responsible for sales.'" },
        { title: "Use Action Verbs", content: "Start your bullet points with strong action verbs like 'Managed,' 'Developed,' 'Led,' 'Accelerated,' or 'Designed.' This makes your experience sound more dynamic and impressive." },
        { title: "Keep it Concise", content: "Recruiters spend only a few seconds on each CV. Aim for a one-page CV if you have less than 10 years of experience. Be clear, concise, and to the point. Remove any fluff or irrelevant information." },
        { title: "Proofread Meticulously", content: "Typos and grammatical errors can be a major red flag. Read your CV multiple times, use a spell checker, and consider asking someone else to review it for you before sending it out." },
        { title: "Include a Professional Summary", content: "Start with a brief 2-3 sentence summary that highlights your key qualifications and career goals. This is your elevator pitch and should grab the reader's attention immediately." },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white border-2 border-black shadow-[8px_8px_0px_#000] w-full max-w-2xl max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="p-4 border-b-2 border-black flex-shrink-0 flex justify-between items-center sticky top-0 bg-white">
                    <h2 className="text-2xl font-bold flex items-center gap-2"><HelpIcon className="w-8 h-8"/> CV Best Practices</h2>
                    <button onClick={onClose} className="p-2 -mr-2" aria-label="Close modal"><CloseIcon /></button>
                </header>
                <div className="p-6 overflow-y-auto">
                    <p className="text-lg text-gray-600 mb-6">Expert advice to guarantee your CV gets noticed.</p>
                    <div className="space-y-6">
                        {practices.map((p, i) => (
                            <div key={i}>
                                <h3 className="font-bold text-xl mb-1 text-indigo-700">{p.title}</h3>
                                <p className="text-gray-800">{p.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <footer className="p-4 border-t-2 border-black flex-shrink-0 flex justify-end bg-white sticky bottom-0">
                    <ControlButton onClick={onClose} className="bg-indigo-600 text-white">Got it</ControlButton>
                </footer>
            </div>
        </div>
    );
};

const LogIcon: React.FC<{type: LogEntry['type']}> = ({type}) => {
    switch (type) {
        case 'success': return <CheckIcon className="text-green-500 w-5 h-5" />;
        case 'error': return <WarningIcon className="text-red-500 w-5 h-5" />;
        case 'info':
        default:
            return <InfoIcon className="text-blue-500 w-5 h-5" />;
    }
}

export const LogPanel: React.FC<LogPanelProps> = ({ logs }) => {
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if(logContainerRef.current) {
            logContainerRef.current.scrollTop = 0;
        }
    }, [logs]);

    return (
        <div className="bg-white w-full p-4 flex flex-col h-full overflow-hidden">
            <h2 className="text-xl font-bold border-b-2 border-black pb-2 mb-2 flex-shrink-0">Log</h2>
            <div ref={logContainerRef} className="flex-1 overflow-y-auto space-y-3 text-sm pr-2">
                {logs.length === 0 && <p className="text-gray-500">Logs will appear here...</p>}
                {logs.map((log, index) => (
                    <div key={index} className="flex gap-2 items-start">
                        <LogIcon type={log.type} />
                        <div className="flex-1">
                            <span className="font-mono text-gray-500 text-xs">{log.timestamp}</span>
                            <p className="leading-tight">{log.message}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const CvRatingModal: React.FC<CvRatingModalProps> = ({ isOpen, onClose, rating, isRating }) => {
    if (!isOpen) return null;

    const getScoreColor = (score: number) => {
        if (score >= 8.5) return 'text-green-500 border-green-500';
        if (score >= 7) return 'text-yellow-500 border-yellow-500';
        return 'text-red-500 border-red-500';
    }

    return (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white border-2 border-black shadow-[8px_8px_0px_#000] w-full max-w-3xl max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="p-4 border-b-2 border-black flex-shrink-0 flex justify-between items-center sticky top-0 bg-white">
                    <h2 className="text-2xl font-bold flex items-center gap-2"><StarOutlineIcon /> CV Analysis Report</h2>
                    <button onClick={onClose} className="p-2 -mr-2" aria-label="Close modal"><CloseIcon /></button>
                </header>
                <div className="p-6 overflow-y-auto">
                    {isRating && !rating && (
                         <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-16">
                            <SpinnerIcon className="w-16 h-16 text-indigo-600" />
                            <p className="mt-4 text-lg font-semibold">Analyzing your CV...</p>
                        </div>
                    )}
                    {rating && (
                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="md:w-1/3 flex flex-col items-center text-center">
                                <h3 className="font-bold text-gray-600">Overall Score</h3>
                                <div className={`w-32 h-32 rounded-full border-8 flex items-center justify-center mt-2 ${getScoreColor(rating.score)}`}>
                                    <span className={`text-5xl font-extrabold ${getScoreColor(rating.score).split(' ')[0]}`}>{rating.score.toFixed(1)}</span>
                                </div>
                                <h4 className="font-bold mt-6 mb-2">Overall Feedback</h4>
                                <p className="text-sm text-gray-700">{rating.feedback}</p>
                            </div>
                            <div className="md:w-2/3 space-y-4">
                                <div>
                                    <h4 className="font-bold text-lg text-green-600 mb-2">Recruiter's Highlights (Pros)</h4>
                                    <ul className="list-disc list-inside space-y-1 text-gray-800">
                                        {rating.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-red-600 mb-2">Points of Concern (Cons)</h4>
                                     <ul className="list-disc list-inside space-y-1 text-gray-800">
                                        {rating.cons.map((con, i) => <li key={i}>{con}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                 <footer className="p-4 border-t-2 border-black flex-shrink-0 flex justify-end bg-white sticky bottom-0">
                    <ControlButton onClick={onClose} className="bg-indigo-600 text-white">Close Report</ControlButton>
                </footer>
            </div>
        </div>
    )
}
