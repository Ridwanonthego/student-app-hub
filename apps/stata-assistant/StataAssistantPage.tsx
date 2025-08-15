

import React, { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { StataAssistantPageProps, Dataset, DoFile, CodeCell, OutputContentType } from './types';
import { useEditorState } from './hooks';
import { INITIAL_CODE, WELCOME_MESSAGE } from './constants';
import { Header, WorkspacePanel, EditorPanel, ActionsPanel, TargetedDebugModal } from './components';
import { BackArrowIcon, StataIcon } from '../../components/Icons';

const StataAssistantPage: React.FC<StataAssistantPageProps> = ({ onNavigateBack, apiKey }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [doFile, setDoFile] = useState<DoFile | null>(null);
    const { cells, setCells, undo, canUndo, splitCodeIntoCells } = useEditorState([{ id: uuidv4(), content: INITIAL_CODE }]);
    const [outputContent, setOutputContent] = useState<OutputContentType>({ type: 'welcome', content: WELCOME_MESSAGE });
    const [isTargetedDebugModalOpen, setTargetedDebugModalOpen] = useState(false);
    
    // State for highlighting cells
    const [criticalErrorCellIds, setCriticalErrorCellIds] = useState<string[]>([]);
    const [correctedCellIds, setCorrectedCellIds] = useState<string[]>([]);

    const editorPanelRef = useRef<HTMLDivElement>(null);

    const handleUploadDta = (files: FileList | null) => {
        if (!files) return;
        const newDatasets = Array.from(files).map(file => ({ name: file.name }));
        setDatasets(prev => [...prev, ...newDatasets]);
    };

    const handleUploadDo = (file: File | null) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            setDoFile({ name: file.name, content });
            setCells(splitCodeIntoCells(content));
        };
        reader.readAsText(file);
    };

    const handleRemoveDataset = (name: string) => {
        setDatasets(prev => prev.filter(ds => ds.name !== name));
    };

    const handleRemoveDoFile = () => {
        setDoFile(null);
        setCells([{ id: uuidv4(), content: INITIAL_CODE }]);
    };
    
    const getEditorContent = useCallback(() => {
        return cells.map(cell => cell.content).join('\n\n');
    }, [cells]);

    const getDatasetSchema = useCallback((): string => {
        if (datasets.length === 0) return "No datasets loaded.";
        return `The following datasets are loaded and available: ${datasets.map(d => d.name).join(', ')}. The AI should assume it can read variable names and basic structure from these files.`;
    }, [datasets]);

    const applyFix = (cellId: string, newCode: string) => {
        setCells(prevCells => prevCells.map(cell => cell.id === cellId ? { ...cell, content: newCode } : cell));
        setCorrectedCellIds(prev => [...prev, cellId]);
        setCriticalErrorCellIds(prev => prev.filter(id => id !== cellId));
        setTimeout(() => setCorrectedCellIds(prev => prev.filter(id => id !== cellId)), 2000); // Remove highlight after 2s
    };

    const showCell = (cellId: string) => {
        const cellElement = document.getElementById(`cell-${cellId}`);
        cellElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        cellElement?.classList.add('animate-pulse-once');
        setTimeout(() => cellElement?.classList.remove('animate-pulse-once'), 1000);
    };

    const exportDoFile = () => {
        const content = getEditorContent();
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doFile?.name || 'script.do';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="font-nunito bg-[#2a2135] text-[#f8f8f2] min-h-screen">
            {/* Desktop View */}
            <div className="hidden lg:flex lg:flex-col h-screen">
                <style>{`
                    .animate-pulse-once {
                        animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1);
                    }
                `}</style>
                <button
                    onClick={onNavigateBack}
                    className="absolute z-50 top-4 left-4 bg-[#4a3d5a] p-2 rounded-full text-[#ff79c6] hover:bg-[#5a4b6b] transition-colors"
                    aria-label="Back to Hub"
                >
                    <BackArrowIcon />
                </button>
                <Header isLoading={isLoading} />
                <main className="flex-1 grid grid-cols-[384px_1fr_1fr] gap-4 p-4 overflow-hidden">
                    <div className="flex flex-col">
                        <WorkspacePanel
                            datasets={datasets}
                            doFile={doFile}
                            onUploadDta={handleUploadDta}
                            onUploadDo={handleUploadDo}
                            onRemoveDataset={handleRemoveDataset}
                            onRemoveDoFile={handleRemoveDoFile}
                        />
                    </div>
                    <div className="flex flex-col min-h-0">
                        <EditorPanel
                            cells={cells}
                            setCells={setCells}
                            onShowCell={showCell}
                            criticalErrorCellIds={criticalErrorCellIds}
                            correctedCellIds={correctedCellIds}
                        />
                    </div>
                    <div className="flex flex-col min-h-0">
                        <ActionsPanel
                            apiKey={apiKey}
                            isLoading={isLoading}
                            setIsLoading={setIsLoading}
                            setOutputContent={setOutputContent}
                            outputContent={outputContent}
                            getEditorContent={getEditorContent}
                            getDatasetSchema={getDatasetSchema}
                            applyFix={applyFix}
                            showCell={showCell}
                            undo={undo}
                            canUndo={canUndo}
                            exportDoFile={exportDoFile}
                            setCriticalErrorCellIds={setCriticalErrorCellIds}
                            setCorrectedCellIds={setCorrectedCellIds}
                        />
                    </div>
                </main>
            </div>

            {/* Mobile Fallback View */}
            <div className="flex lg:hidden flex-col items-center justify-center min-h-screen text-center p-8 bg-[#2a2135]">
                <StataIcon className="w-20 h-20 text-[#ff79c6] mb-6"/>
                <h1 className="text-3xl font-extrabold text-white mb-2">Desktop Experience Recommended</h1>
                <p className="text-lg text-[#d8c8e8] max-w-md mb-8">
                    This Stata Assistant is designed for a larger screen. Please switch to a desktop or laptop for the best experience.
                </p>
                <button
                    onClick={onNavigateBack}
                    className="px-6 py-3 font-bold border-2 border-[#ff79c6] bg-[#4a3d5a] text-[#ff79c6] flex items-center gap-2 rounded-lg"
                >
                    <BackArrowIcon />
                    Back to Hub
                </button>
            </div>
        </div>
    );
};

export default StataAssistantPage;
