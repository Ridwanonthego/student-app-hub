import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { Section, ExplanationStyle, TextSelectionPopupState, ClarificationModalState, VisualData } from './types';
import * as I from './icons';
import { BackArrowIcon, CloseIcon, DownloadIcon } from '../../components/Icons';

Chart.register(...registerables);

// --- Form & Input Components ---

interface InputFormProps {
    topic: string;
    setTopic: (topic: string) => void;
    style: ExplanationStyle;
    setStyle: (style: ExplanationStyle) => void;
    onSubmit: () => void;
    isLoading: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({ topic, setTopic, style, setStyle, onSubmit, isLoading }) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white border-2 border-black shadow-[8px_8px_0px_#000] p-6 space-y-4">
            <div>
                <label htmlFor="topic-input" className="font-bold text-lg">What do you want to understand?</label>
                <textarea
                    id="topic-input"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Explain photosynthesis, what is blockchain?, or how do black holes form?"
                    className="mt-2 w-full p-3 bg-stone-100 text-black border-2 border-black focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_#d946ef] transition-shadow"
                    rows={3}
                    disabled={isLoading}
                />
            </div>
            <div>
                <label htmlFor="style-select" className="font-bold text-lg">Explanation Style</label>
                <select
                    id="style-select"
                    value={style}
                    onChange={(e) => setStyle(e.target.value as ExplanationStyle)}
                    className="mt-2 w-full p-3 bg-stone-100 text-black border-2 border-black focus:outline-none focus:bg-white"
                    disabled={isLoading}
                >
                    <option value="Simple">Simple</option>
                    <option value="Detailed">Detailed</option>
                    <option value="Analogy-based">Analogy-based</option>
                    <option value="Step-by-step process">Step-by-step process</option>
                </select>
            </div>
            <button
                type="submit"
                disabled={isLoading || !topic.trim()}
                className="w-full bg-lime-400 text-black font-bold text-lg p-4 border-2 border-black shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] active:shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:bg-neutral-400 disabled:text-neutral-600 disabled:shadow-none disabled:cursor-not-allowed"
            >
                {isLoading ? 'Generating...' : 'Make Me Understand'}
            </button>
        </form>
    );
};

// --- State Display Components ---

export const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
        <I.BrainCircuitIcon className="w-16 h-16 text-black animate-bounce" />
        <div className="text-center">
            <p className="text-xl font-bold">Thinking...</p>
            <p className="text-neutral-600">Analyzing your topic and crafting the perfect explanation. This might take a moment.</p>
        </div>
    </div>
);

export const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
    <div className="bg-yellow-300 border-2 border-black shadow-[4px_4px_0px_#ef4444] p-6 my-8">
        <h3 className="font-bold text-xl">An Error Occurred</h3>
        <p>{message}</p>
    </div>
);

// --- Explanation Display Components ---

interface SectionCardProps {
    title: string;
    icon: React.ReactNode;
    color: 'lime' | 'cyan' | 'fuchsia';
    children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, icon, color, children }) => {
    const colorClasses = {
        lime: 'bg-lime-400',
        cyan: 'bg-cyan-400',
        fuchsia: 'bg-fuchsia-400'
    };

    return (
        <div className="bg-white border-2 border-black shadow-[8px_8px_0px_#000]">
            <header className={`p-4 border-b-2 border-black flex items-center gap-3 ${colorClasses[color]}`}>
                <div className="w-8 h-8">{icon}</div>
                <h3 className="text-xl font-bold text-black">{title}</h3>
            </header>
            <div className="p-6">
                {children}
            </div>
        </div>
    );
};

const Visualizer: React.FC<{ visual: VisualData }> = ({ visual }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    useEffect(() => {
        if (!chartRef.current || visual.type !== 'BAR_CHART' || !visual.data.labels) return;

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        if (ctx) {
            chartInstance.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: visual.data.labels,
                    datasets: visual.data.datasets.map((ds: any) => ({
                        ...ds,
                        backgroundColor: '#d946ef',
                        borderColor: '#000000',
                        borderWidth: 2,
                    }))
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: visual.data.datasets.length > 1 } },
                    scales: {
                        x: { ticks: { font: { weight: 'bold' } }, grid: { display: false } },
                        y: { ticks: { font: { weight: 'bold' } }, grid: { display: false } }
                    }
                }
            });
        }
    }, [visual]);

    if (!visual || visual.type === 'NONE' || !visual.data) {
        return <p className="text-neutral-500">No visual aid available for this topic.</p>;
    }

    switch (visual.type) {
        case 'COMPARISON_TABLE':
            return (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border-2 border-black">
                        <thead>
                            <tr className="bg-yellow-300">
                                {visual.data[0]?.map((header: string, i: number) => <th key={i} className="p-3 border-2 border-black text-left font-bold text-black">{header}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {visual.data.slice(1).map((row: string[], i: number) => (
                                <tr key={i}>
                                    {row.map((cell: string, j: number) => <td key={j} className="p-3 border-2 border-black text-black">{cell}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        case 'BAR_CHART':
            return <div className="h-64"><canvas ref={chartRef}></canvas></div>;
        case 'PROCESS_DIAGRAM':
             return (
                <ol className="relative border-l-2 border-black ml-4">
                    {visual.data.map((item: any, index: number) => (
                        <li key={item.id || index} className="mb-10 ml-8">
                            <span className="absolute flex items-center justify-center w-8 h-8 bg-fuchsia-400 -left-4 border-2 border-black font-bold">{index + 1}</span>
                            <div className="bg-stone-100 p-4 border-2 border-black">
                                <p className="font-bold text-black">{item.content}</p>
                            </div>
                        </li>
                    ))}
                </ol>
             );
        default:
            return <p className="text-neutral-500">Visual type '{visual.type}' not yet implemented.</p>;
    }
};

export const ExplanationDisplay: React.FC<{ explanation: Section | null; onDigDeeper: () => void; onSelectRelated: (topic: string) => void; deeperDiveContent: string; isDeeperDiveLoading: boolean; mainExplanationRef: React.RefObject<HTMLDivElement>; }> = ({ explanation, onDigDeeper, onSelectRelated, deeperDiveContent, isDeeperDiveLoading, mainExplanationRef }) => {
    if (!explanation) return null;

    return (
        <div className="space-y-12">
            <SectionCard title="Main Explanation" icon={<I.LightbulbIcon />} color="lime">
                <div ref={mainExplanationRef} className="prose max-w-none text-base text-black">
                    <p>{explanation.main_explanation}</p>
                </div>
            </SectionCard>

            <SectionCard title="Key Definitions" icon={<I.BookOpenIcon />} color="cyan">
                <div className="space-y-4">
                    {explanation.key_definitions.map((def, i) => (
                        <div key={i}>
                            <p className="font-bold text-black">{def.term}</p>
                            <p className="text-black">{def.definition}</p>
                        </div>
                    ))}
                </div>
            </SectionCard>
            
            <SectionCard title="Visual Aid" icon={<I.ChartBarIcon />} color="cyan">
                <Visualizer visual={explanation.visual_aid} />
            </SectionCard>

            <SectionCard title="Examples & Analogies" icon={<I.QuoteIcon />} color="cyan">
                <div className="space-y-6">
                    {explanation.examples_and_analogies.map((item, i) => (
                        <div key={i} className="bg-stone-100 p-4 border-2 border-black">
                            <p className="border-l-4 border-fuchsia-400 pl-3 italic mb-2 text-black">"{item.analogy}"</p>
                            <p className="text-black"><strong className="font-bold">Example:</strong> {item.example}</p>
                        </div>
                    ))}
                </div>
            </SectionCard>

            <div>
                <button
                    onClick={onDigDeeper}
                    disabled={isDeeperDiveLoading}
                    className="w-full bg-fuchsia-400 text-white font-bold text-lg p-4 border-2 border-black shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] active:shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:bg-neutral-400 disabled:shadow-none"
                >
                    {isDeeperDiveLoading ? 'Digging...' : 'Dig Deeper'}
                </button>
                {deeperDiveContent && (
                    <SectionCard title="Deeper Dive" icon={<I.LightbulbIcon />} color="fuchsia">
                        <div className="prose max-w-none text-black" dangerouslySetInnerHTML={{__html: deeperDiveContent.replace(/\n/g, '<br/>')}}></div>
                    </SectionCard>
                )}
            </div>

            <SectionCard title="Related Topics" icon={<I.ShapesIcon />} color="cyan">
                <div className="flex flex-wrap gap-3">
                    {explanation.related_topics.map((topic, i) => (
                        <button
                            key={i}
                            onClick={() => onSelectRelated(topic)}
                            className="bg-white text-black font-bold p-3 border-2 border-black hover:bg-yellow-300 active:translate-x-0.5 active:translate-y-0.5 transition-all"
                        >
                            {topic}
                        </button>
                    ))}
                </div>
            </SectionCard>
        </div>
    );
};

// --- Interactive Modals & Popups ---

export const TextInteractionPopup: React.FC<{ popupState: TextSelectionPopupState, onAction: (action: 'simplify' | 'expand') => void, onClose: () => void }> = ({ popupState, onAction, onClose }) => {
    if (!popupState.isVisible) return null;

    return (
        <div
            className="absolute bg-black text-white p-1 border-2 border-lime-400 shadow-[3px_3px_0px_#000] flex items-center gap-1 z-50"
            style={{ top: popupState.top, left: popupState.left }}
        >
            <button onClick={() => onAction('simplify')} className="flex items-center gap-1 px-2 py-1 hover:bg-neutral-700 font-bold"><I.SparklesIcon className="w-4 h-4"/> Simplify</button>
            <div className="w-px h-4 bg-lime-400"></div>
            <button onClick={() => onAction('expand')} className="flex items-center gap-1 px-2 py-1 hover:bg-neutral-700 font-bold"><I.ExpandIcon className="w-4 h-4"/> Expand</button>
            <div className="w-px h-4 bg-lime-400"></div>
            <button onClick={onClose} className="px-1 py-1 hover:bg-neutral-700"><CloseIcon className="w-4 h-4"/></button>
        </div>
    );
};

export const ClarificationModal: React.FC<{ modalState: ClarificationModalState, onClose: () => void }> = ({ modalState, onClose }) => {
    if (!modalState.isOpen) return null;

    const title = modalState.action === 'simplify' ? 'Simplified Explanation' : 'Expanded Explanation';
    const Icon = modalState.action === 'simplify' ? I.SparklesIcon : I.ExpandIcon;

    return (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-stone-100 w-full max-w-2xl border-4 border-black shadow-[10px_10px_0px_#000] flex flex-col max-h-[80vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="bg-fuchsia-400 p-4 border-b-4 border-black flex justify-between items-center">
                    <h2 className="text-2xl font-bold flex items-center gap-3"><Icon className="w-8 h-8"/> {title}</h2>
                    <button onClick={onClose} className="text-black"><CloseIcon className="w-8 h-8"/></button>
                </header>
                <div className="p-6 overflow-y-auto">
                    {modalState.isLoading && <LoadingSpinner />}
                    {modalState.error && <ErrorMessage message={modalState.error} />}
                    {modalState.result && <p className="text-lg text-black">{modalState.result}</p>}
                </div>
            </div>
        </div>
    );
};