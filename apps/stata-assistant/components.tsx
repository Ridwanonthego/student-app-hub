

import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { v4 as uuidv4 } from 'uuid';
import { 
    CodeCell, WorkspacePanelProps, EditorPanelProps, CodeCellComponentProps, ActionsPanelProps,
    Dataset, DoFile, OutputContentType, Correction, ChartData, TableData, WebSearchOutput, RegressionOutput, DebugOutput, TargetedDebugModalProps
} from './types';
import {
    StataIcon, UploadIcon, TrashIcon, FileCodeIcon, PlusCircleIcon, SearchIcon, WebSearchIcon, DebugIcon,
    TargetedDebugIcon, RegressionIcon, UndoIcon, ExportIcon, ClearIcon, SpinnerIcon, ChartBarIcon, InfoIcon, WarningIcon, CheckIcon, CloseIcon
} from '../../components/Icons';
import { runWebSearch, debugScript, analyzeScript, processNaturalLanguageQuery, targetedDebug } from './gemini-service';

Chart.register(...registerables);

// --- Header & Clock ---
const Clock: React.FC = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);
    return (
        <div className="font-mono bg-[#ff79c6]/20 text-[#ff79c6] px-3 py-1.5 rounded-md text-lg">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
    );
};

export const Header: React.FC<{ isLoading: boolean }> = ({ isLoading }) => (
    <header className="relative bg-[#3a2d4a] border-b-2 border-[#5a4b6b] px-4 py-3 flex justify-center items-center">
        <div className="flex items-center gap-4">
            <StataIcon className="h-10 w-10 text-[#ff79c6]" />
            <div>
                <h1 className="text-2xl font-bold text-[#f8f8f2]">Stata Assistant (Econ students Only)</h1>
                <p className="text-sm text-[#d8c8e8]">AI-powered analysis for development economics research</p>
            </div>
        </div>
        <div className="absolute right-4">
             <Clock />
        </div>
        {isLoading && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#ff79c6]/20 overflow-hidden">
                <div className="h-full bg-[#ff79c6] w-1/3 animate-indeterminate"></div>
            </div>
        )}
        <style>{`
            .animate-indeterminate {
                animation: indeterminate 2s infinite linear;
            }
            @keyframes indeterminate {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(300%); }
            }
        `}</style>
    </header>
);

// --- Workspace Panel ---
export const WorkspacePanel: React.FC<WorkspacePanelProps> = ({ datasets, doFile, onUploadDta, onUploadDo, onRemoveDataset, onRemoveDoFile }) => {
    const dtaInputRef = useRef<HTMLInputElement>(null);
    const doInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="bg-[#3a2d4a] rounded-lg p-4 flex flex-col gap-4 h-full">
            <h2 className="text-xl font-bold border-b border-[#5a4b6b] pb-2">Workspace</h2>
            
            <div>
                <input type="file" multiple accept=".dta" ref={dtaInputRef} onChange={(e) => onUploadDta(e.target.files)} className="hidden" />
                <button onClick={() => dtaInputRef.current?.click()} className="w-full bg-[#4a3d5a] hover:bg-[#5a4b6b] text-[#d8c8e8] p-3 rounded-md flex items-center justify-center gap-2 transition-colors">
                    <UploadIcon /> Upload .dta File(s)
                </button>
                <p className="text-xs text-[#9a8ba8] mt-1 text-center">Load Stata datasets. You can select multiple files.</p>
            </div>

            <div>
                 <input type="file" accept=".do" ref={doInputRef} onChange={(e) => onUploadDo(e.target.files?.[0] ?? null)} className="hidden" />
                <button onClick={() => doInputRef.current?.click()} className="w-full bg-[#4a3d5a] hover:bg-[#5a4b6b] text-[#d8c8e8] p-3 rounded-md flex items-center justify-center gap-2 transition-colors">
                    <UploadIcon /> Upload .do File
                </button>
                <p className="text-xs text-[#9a8ba8] mt-1 text-center">Load a Stata script to populate the editor.</p>
            </div>

            {datasets.length > 0 && (
                <div className="bg-[#2a2135]/50 border border-[#5a4b6b] p-3 rounded-md">
                    <h3 className="font-semibold text-[#d8c8e8] mb-2">Active Datasets</h3>
                    <ul className="space-y-1">
                        {datasets.map(ds => (
                            <li key={ds.name} className="flex justify-between items-center text-sm text-[#f8f8f2] group">
                                <span className="truncate">{ds.name}</span>
                                <button onClick={() => onRemoveDataset(ds.name)} className="text-[#9a8ba8] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <TrashIcon />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {doFile && (
                 <div className="bg-[#2a2135]/50 border border-[#5a4b6b] p-3 rounded-md group">
                     <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-[#d8c8e8]">Active .do File</h3>
                        <button onClick={onRemoveDoFile} className="text-[#9a8ba8] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <TrashIcon />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-[#ff79c6]">
                        <FileCodeIcon />
                        <span className="truncate">{doFile.name}</span>
                    </div>
                </div>
            )}
            
            <div className="flex-1 bg-[#2a2135]/50 border border-[#5a4b6b] p-3 rounded-md">
                <h3 className="font-semibold text-[#ff79c6] mb-2">Quick Guide</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-[#c8b8d8]">
                    <li>Upload your Stata dataset(s) (`.dta`).</li>
                    <li>Upload your script (`.do`) or write code in the editor.</li>
                    <li>Use the "Debug" or "Analyze" buttons to check your work.</li>
                    <li>Ask questions or give commands in the prompt bar below.</li>
                </ol>
            </div>
        </div>
    );
};

// --- Editor Panel ---
const CodeCellComponent: React.FC<CodeCellComponentProps> = ({ cell, cellIndex, onContentChange, onDelete, onAddAfter, isCritical, isCorrected }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        const el = textareaRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
        }
    }, [cell.content]);
    
    const getBorderStyle = () => {
        if(isCritical) return 'border-red-500/80';
        if(isCorrected) return 'border-teal-500/70';
        return 'border-transparent group-hover:border-[#ff79c6]';
    };

    const getBgStyle = () => {
        if(isCritical) return 'bg-red-500/20';
        if(isCorrected) return 'bg-teal-900/40';
        return 'bg-[#2a2135]';
    }

    return (
        <div id={`cell-${cell.id}`} className={`group relative flex items-start gap-3 border-l-2 py-1 ${getBorderStyle()}`}>
             <span className="absolute -left-7 top-1 text-xs text-[#9a8ba8] select-none w-6 text-right">{cellIndex + 1}</span>
             <button onClick={() => onDelete(cell.id)} className="absolute -left-8 top-1/2 -translate-y-1/2 text-[#9a8ba8] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <TrashIcon />
            </button>
            <textarea
                ref={textareaRef}
                value={cell.content}
                onChange={(e) => onContentChange(cell.id, e.target.value)}
                placeholder="Enter Stata code here..."
                className={`w-full p-2 font-mono text-sm resize-none focus:outline-none text-[#f8f8f2] ${getBgStyle()}`}
                rows={1}
            />
             <button onClick={() => onAddAfter(cell.id)} className="absolute -right-8 top-1/2 -translate-y-1/2 text-[#9a8ba8] hover:text-[#ff79c6] opacity-0 group-hover:opacity-100 transition-opacity">
                <PlusCircleIcon />
            </button>
        </div>
    );
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ cells, setCells, onShowCell, criticalErrorCellIds, correctedCellIds }) => {
    
    const handleContentChange = (id: string, newContent: string) => {
        setCells(prev => prev.map(cell => cell.id === id ? {...cell, content: newContent} : cell));
    };

    const handleDeleteCell = (id: string) => {
        setCells(prev => {
            const newCells = prev.filter(cell => cell.id !== id);
            if(newCells.length === 0) return [{id: uuidv4(), content: ''}];
            return newCells;
        });
    };

    const handleAddAfter = (id: string) => {
        setCells(prev => {
            const index = prev.findIndex(cell => cell.id === id);
            const newCells = [...prev];
            newCells.splice(index + 1, 0, {id: uuidv4(), content: ''});
            return newCells;
        });
    };

    return (
        <div className="bg-[#3a2d4a] rounded-lg p-4 flex flex-col h-full min-h-0">
            <h2 className="text-xl font-bold border-b border-[#5a4b6b] pb-2 mb-4 flex-shrink-0">.do File Editor</h2>
            <div className="flex-1 overflow-y-auto pr-8 pl-8 space-y-1">
                {cells.map((cell, index) => (
                    <CodeCellComponent
                        key={cell.id}
                        cell={cell}
                        cellIndex={index}
                        onContentChange={handleContentChange}
                        onDelete={handleDeleteCell}
                        onAddAfter={handleAddAfter}
                        isCritical={criticalErrorCellIds.includes(cell.id)}
                        isCorrected={correctedCellIds.includes(cell.id)}
                    />
                ))}
            </div>
        </div>
    );
};


// --- Actions & Output Panel ---
const ActionButton: React.FC<{onClick: () => void, disabled: boolean, color: string, children: React.ReactNode}> = ({onClick, disabled, color, children}) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex-1 p-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-colors ${color} disabled:bg-[#5a4b6b] disabled:text-[#9a8ba8] disabled:cursor-not-allowed`}
    >
        {children}
    </button>
);

const ActionBar: React.FC<any> = ({ onDebug, onTargetedDebug, onAnalyze, onUndo, onExport, onClear, onSearch, onWebSearch, isLoading, canUndo }) => {
    const [prompt, setPrompt] = useState('');
    
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(prompt);
        setPrompt('');
    };
    
    const handleWebSearch = () => {
        onWebSearch(prompt);
        setPrompt('');
    };

    return (
        <div className="flex-shrink-0 space-y-3">
            <div className="grid grid-cols-3 gap-2">
                <ActionButton onClick={onDebug} disabled={isLoading} color="bg-[#ff79c6] text-black hover:bg-opacity-80">
                    <DebugIcon /> Debug
                </ActionButton>
                <ActionButton onClick={onTargetedDebug} disabled={isLoading} color="bg-[#bd93f9] text-black hover:bg-opacity-80">
                    <TargetedDebugIcon /> Targeted
                </ActionButton>
                <ActionButton onClick={onAnalyze} disabled={isLoading} color="bg-[#ffb86c] text-black hover:bg-opacity-80">
                    <RegressionIcon /> Analyze
                </ActionButton>
                <ActionButton onClick={onUndo} disabled={isLoading || !canUndo} color="bg-[#8be9fd] text-black hover:bg-opacity-80">
                    <UndoIcon /> Undo
                </ActionButton>
                <ActionButton onClick={onExport} disabled={isLoading} color="bg-[#50fa7b] text-black hover:bg-opacity-80">
                    <ExportIcon /> Export
                </ActionButton>
                <ActionButton onClick={onClear} disabled={isLoading} color="bg-[#6272a4] text-white hover:bg-opacity-80">
                    <ClearIcon /> Clear
                </ActionButton>
            </div>
             <form onSubmit={handleSearch} className="flex gap-2">
                <input
                    type="text"
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="e.g., 'Summarize the data' or 'Explain this code'"
                    className="flex-grow bg-[#2a2135] border-2 border-[#6272a4] rounded-md p-2 text-sm focus:outline-none focus:border-[#ff79c6] transition-colors"
                    disabled={isLoading}
                />
                 <button type="submit" disabled={isLoading || !prompt} className="p-2 rounded-md bg-[#ff79c6] text-black disabled:bg-[#5a4b6b] disabled:text-[#9a8ba8]">
                    <SearchIcon />
                </button>
                 <button type="button" onClick={handleWebSearch} disabled={isLoading || !prompt} className="p-2 rounded-md bg-[#bd93f9] text-black disabled:bg-[#5a4b6b] disabled:text-[#9a8ba8]">
                    <WebSearchIcon />
                </button>
            </form>
        </div>
    );
};

const CorrectionCard: React.FC<{correction: Correction, applyFix: any, showCell: any}> = ({correction, applyFix, showCell}) => (
     <div className="bg-[#4a3d5a]/50 border border-[#6272a4] rounded-lg p-3">
        <h4 className="font-bold flex justify-between items-center">
            <span>Issue Found</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${correction.isCritical ? 'bg-red-500/80 text-white' : 'bg-yellow-500/80 text-black'}`}>
                {correction.isCritical ? 'Critical' : 'Suggestion'}
            </span>
        </h4>
        <div className="bg-red-900/40 p-2 my-2 rounded-md">
            <p className="text-sm font-semibold">Critique:</p>
            <p className="text-sm text-red-300">{correction.critique}</p>
        </div>
        <div className="bg-teal-900/40 p-2 my-2 rounded-md">
            <p className="text-sm font-semibold">Suggested Code:</p>
            <pre className="text-sm text-teal-300 whitespace-pre-wrap font-mono"><code>{correction.suggestion}</code></pre>
        </div>
        <div className="flex gap-2 mt-2">
            <button onClick={() => showCell(correction.cellIdToFix)} className="text-xs bg-[#6272a4] hover:bg-opacity-80 px-2 py-1 rounded">Show</button>
            <button onClick={() => applyFix(correction.cellIdToFix, correction.suggestion)} className="text-xs bg-[#50fa7b] text-black hover:bg-opacity-80 px-2 py-1 rounded">Apply Fix</button>
        </div>
    </div>
);

const OutputDisplay: React.FC<{output: OutputContentType, applyFix: any, showCell: any}> = ({output, applyFix, showCell}) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    useEffect(() => {
        if(output.type === 'chart' && chartRef.current) {
            if(chartInstance.current) {
                chartInstance.current.destroy();
            }
            const ctx = chartRef.current.getContext('2d');
            if(ctx) {
                chartInstance.current = new Chart(ctx, {
                    type: output.content.type,
                    data: {
                        labels: output.content.labels,
                        datasets: output.content.datasets.map(ds => ({
                            ...ds,
                            backgroundColor: ds.backgroundColor || 'rgba(255, 121, 198, 0.5)',
                            borderColor: ds.borderColor || 'rgba(255, 121, 198, 1)',
                            borderWidth: 1
                        }))
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { labels: { color: '#f8f8f2' } } },
                        scales: {
                           x: { ticks: { color: '#d8c8e8' }, grid: { color: '#5a4b6b' } },
                           y: { ticks: { color: '#d8c8e8' }, grid: { color: '#5a4b6b' } }
                        }
                    }
                });
            }
        }

        return () => {
            if(chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }
        };
    }, [output]);

    switch (output.type) {
        case 'welcome': return <div className="text-center p-4"><div className="prose prose-invert text-left" dangerouslySetInnerHTML={{ __html: output.content.replace(/## (.*)/g, '<h2>$1</h2>').replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>') }} /></div>;
        case 'loading': return <div className="flex flex-col items-center justify-center h-full gap-3"><SpinnerIcon className="w-8 h-8 text-[#ff79c6]" /><p>{output.message}</p></div>;
        case 'error': return <div className="bg-red-900/50 border border-red-700 rounded p-4"><WarningIcon className="text-red-400 w-6 h-6 mx-auto mb-2" /> <p className="text-center font-bold text-red-300">{output.message}</p></div>
        case 'cleared': return <div className="text-center text-[#9a8ba8] p-4">Output cleared. Ready for your next command.</div>;
        case 'text': return <div className="whitespace-pre-wrap p-2">{output.content}</div>;
        
        case 'debug':
            const { overallCritique, corrections } = output.content;
            return (
                <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2"><DebugIcon/>Debugger Output</h3>
                    <div className="bg-[#bd93f9]/20 p-3 rounded-lg">
                        <p className="font-semibold mb-1">Overall Critique:</p>
                        <p className="text-sm">{overallCritique}</p>
                    </div>
                    {corrections.map((corr, i) => <CorrectionCard key={i} correction={corr} applyFix={applyFix} showCell={showCell} />)}
                </div>
            );
        
        case 'regression':
             return (
                <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2"><RegressionIcon />Regression Analysis</h3>
                    <div className="bg-[#2a2135] p-2 rounded-md overflow-x-auto">
                        <pre className="font-mono text-xs"><code>{output.content.stataTable}</code></pre>
                    </div>
                    <div className="bg-[#bd93f9]/20 p-3 rounded-lg">
                        <p className="font-semibold mb-1">Interpretation:</p>
                        <p className="text-sm">{output.content.interpretation}</p>
                    </div>
                </div>
            );

        case 'chart':
            return (
                 <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2"><ChartBarIcon />Data Visualization</h3>
                    <div className="h-64 bg-[#2a2135] p-2 rounded-md"><canvas ref={chartRef}></canvas></div>
                    <div className="bg-[#bd93f9]/20 p-3 rounded-lg">
                        <p className="font-semibold mb-1">Explanation:</p>
                        <p className="text-sm">{output.content.explanation}</p>
                    </div>
                </div>
            );

        case 'table':
            return (
                <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2"><InfoIcon />Data Summary</h3>
                    <div className="overflow-x-auto bg-[#2a2135] rounded-md">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#4a3d5a]">
                                <tr>{output.content.headers.map(h => <th key={h} className="p-2">{h}</th>)}</tr>
                            </thead>
                            <tbody>
                                {output.content.rows.map((row, i) => (
                                    <tr key={i} className="border-b border-[#5a4b6b]">{row.map((cell, j) => <td key={j} className="p-2">{cell}</td>)}</tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                     <div className="bg-[#bd93f9]/20 p-3 rounded-lg">
                        <p className="font-semibold mb-1">Explanation:</p>
                        <p className="text-sm">{output.content.explanation}</p>
                    </div>
                </div>
            );

        case 'web_search':
            return (
                <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2"><WebSearchIcon />Web Search Results</h3>
                    <div className="bg-[#bd93f9]/20 p-3 rounded-lg">
                        <p className="font-semibold mb-1">Answer:</p>
                        <p className="text-sm">{output.content.answer}</p>
                    </div>
                    <div>
                        <p className="font-semibold mb-1">Sources:</p>
                        <ul className="space-y-1">
                        {output.content.sources.map((source, i) => (
                            <li key={i} className="text-xs">
                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-[#8be9fd] hover:underline truncate block">
                                    {source.title || source.uri}
                                </a>
                            </li>
                        ))}
                        </ul>
                    </div>
                </div>
            );

        default: return <div className="text-center p-4">Ready for your command.</div>;
    }
};

export const ActionsPanel: React.FC<ActionsPanelProps> = (
    { isLoading, setIsLoading, setOutputContent, outputContent, getEditorContent, getDatasetSchema, applyFix, showCell, undo, canUndo, exportDoFile, setCriticalErrorCellIds, setCorrectedCellIds, apiKey }
) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const handleAction = async (actionFn: (code: string, schema: string, key: string) => Promise<any>, loadingMessage: string, type: OutputContentType['type']) => {
        setIsLoading(true);
        setOutputContent({ type: 'loading', message: loadingMessage });
        setCriticalErrorCellIds([]);
        setCorrectedCellIds([]);
        try {
            const result = await actionFn(getEditorContent(), getDatasetSchema(), apiKey);
            setOutputContent({ type: type as any, content: result });
            if (type === 'debug' && result.corrections) {
                setCriticalErrorCellIds(result.corrections.filter((c:any) => c.isCritical).map((c:any) => c.cellIdToFix));
            }
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : "An unknown error occurred.";
            setOutputContent({ type: 'error', message: errorMsg });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleQuery = async (query: string, useWebSearch: boolean) => {
        setIsLoading(true);
        setOutputContent({ type: 'loading', message: useWebSearch ? 'Searching the web...' : 'Processing your query...' });
        setCriticalErrorCellIds([]);
        setCorrectedCellIds([]);
        try {
            let result;
            let resultType: OutputContentType['type'];
            if(useWebSearch) {
                result = await runWebSearch(query, apiKey);
                resultType = 'web_search';
            } else {
                const response = await processNaturalLanguageQuery(query, getEditorContent(), getDatasetSchema(), apiKey);
                result = response.content;
                resultType = response.type;
            }
            setOutputContent({ type: resultType, content: result } as OutputContentType);

        } catch (e) {
             const errorMsg = e instanceof Error ? e.message : "An unknown error occurred.";
            setOutputContent({ type: 'error', message: errorMsg });
        } finally {
             setIsLoading(false);
        }
    }
    
    const handleTargetedDebugSubmit = async (context: string) => {
        setIsModalOpen(false);
        await handleAction((code, schema, key) => targetedDebug(code, context, key), "Running targeted debug...", 'debug');
    };

    return (
        <div className="bg-[#3a2d4a] rounded-lg p-4 flex flex-col h-full min-h-0">
            <ActionBar
                isLoading={isLoading}
                canUndo={canUndo}
                onDebug={() => handleAction(debugScript, "Debugging script...", 'debug')}
                onTargetedDebug={() => setIsModalOpen(true)}
                onAnalyze={() => handleAction(analyzeScript, "Analyzing script...", 'regression')}
                onUndo={undo}
                onExport={exportDoFile}
                onClear={() => setOutputContent({ type: 'cleared' })}
                onSearch={(q:string) => handleQuery(q, false)}
                onWebSearch={(q:string) => handleQuery(q, true)}
            />
            <div className="flex-1 mt-4 bg-[#2a2135] rounded-md p-4 overflow-y-auto">
                 <OutputDisplay output={outputContent} applyFix={applyFix} showCell={showCell} />
            </div>
             <TargetedDebugModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleTargetedDebugSubmit}
                isLoading={isLoading}
            />
        </div>
    );
};

export const TargetedDebugModal: React.FC<TargetedDebugModalProps> = ({isOpen, onClose, onSubmit, isLoading}) => {
    const [context, setContext] = useState('');

    if (!isOpen) return null;
    
    const handleSubmit = () => {
        if(context.trim()) {
            onSubmit(context);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#3a2d4a] border-2 border-[#5a4b6b] rounded-lg w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-[#5a4b6b] flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2"><TargetedDebugIcon /> Targeted Debug</h2>
                    <button onClick={onClose}><CloseIcon /></button>
                </header>
                <div className="p-4 space-y-3">
                    <p className="text-sm text-[#d8c8e8]">Paste the error message from Stata or describe the problem you're facing. The AI will analyze your current script in the context of this specific issue.</p>
                    <textarea
                        value={context}
                        onChange={e => setContext(e.target.value)}
                        placeholder="e.g., 'variable __000001 not found' or 'My loop isn't working as expected...'"
                        className="w-full h-40 bg-[#2a2135] border-2 border-[#6272a4] rounded-md p-2 text-sm focus:outline-none focus:border-[#ff79c6] resize-none"
                        disabled={isLoading}
                    />
                </div>
                <footer className="p-4 border-t border-[#5a4b6b] flex justify-end gap-3">
                    <button onClick={onClose} disabled={isLoading} className="px-4 py-2 bg-[#6272a4] rounded-md">Cancel</button>
                    <button onClick={handleSubmit} disabled={isLoading || !context.trim()} className="px-4 py-2 bg-[#bd93f9] text-black font-bold rounded-md disabled:bg-[#5a4b6b] disabled:text-[#9a8ba8]">
                        {isLoading ? <SpinnerIcon /> : "Run Targeted Debug"}
                    </button>
                </footer>
            </div>
        </div>
    );
}
