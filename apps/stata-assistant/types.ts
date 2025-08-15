
import React from 'react';

// Editor and Cell Types
export interface CodeCell {
  id: string;
  content: string;
}

export type EditorHistory = {
  cells: CodeCell[];
  cursorPosition: number | null;
};

// Data and File Types
export interface Dataset {
  name: string;
  // In a real app, this might hold schema info or the file object
}

export interface DoFile {
  name:string;
  content: string;
}

// AI Output Types
export interface Correction {
  cellIdToFix: string; // The ID of the cell that needs fixing
  critique: string;
  suggestion: string;
  isCritical: boolean;
}

export interface DebugOutput {
  overallCritique: string;
  corrections: Correction[];
}

export interface RegressionOutput {
  stataTable: string;
  interpretation: string;
}

export interface ChartData {
  type: 'bar' | 'line' | 'scatter';
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }[];
  explanation: string;
}

export interface TableData {
  headers: string[];
  rows: (string | number)[][];
  explanation: string;
}

export interface WebSearchSource {
    uri: string;
    title: string;
}

export interface WebSearchOutput {
  answer: string;
  sources: WebSearchSource[];
}

export type OutputContentType = 
  | { type: 'welcome'; content: string }
  | { type: 'loading'; message: string }
  | { type: 'error'; message: string }
  | { type: 'debug'; content: DebugOutput }
  | { type: 'regression'; content: RegressionOutput }
  | { type: 'chart'; content: ChartData }
  | { type: 'table'; content: TableData }
  | { type: 'text'; content: string }
  | { type: 'web_search'; content: WebSearchOutput }
  | { type: 'cleared' };

// Component Prop Types
export interface StataAssistantPageProps {
  onNavigateBack: () => void;
  apiKey: string;
}

export interface HeaderProps {
    isLoading: boolean;
}

export interface WorkspacePanelProps {
    datasets: Dataset[];
    doFile: DoFile | null;
    onUploadDta: (files: FileList | null) => void;
    onUploadDo: (file: File | null) => void;
    onRemoveDataset: (name: string) => void;
    onRemoveDoFile: () => void;
}

export interface EditorPanelProps {
    cells: CodeCell[];
    setCells: React.Dispatch<React.SetStateAction<CodeCell[]>>;
    onShowCell: (cellId: string) => void;
    criticalErrorCellIds: string[];
    correctedCellIds: string[];
}

export interface CodeCellComponentProps {
    cell: CodeCell;
    cellIndex: number;
    onContentChange: (id: string, newContent: string) => void;
    onDelete: (id: string) => void;
    onAddAfter: (id: string) => void;
    isCritical: boolean;
    isCorrected: boolean;
}

export interface ActionsPanelProps {
    isLoading: boolean;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setOutputContent: React.Dispatch<React.SetStateAction<OutputContentType>>;
    outputContent: OutputContentType;
    getEditorContent: () => string;
    getDatasetSchema: () => string;
    applyFix: (cellId: string, newCode: string) => void;
    showCell: (cellId: string) => void;
    undo: () => void;
    canUndo: boolean;
    exportDoFile: () => void;
    setCriticalErrorCellIds: React.Dispatch<React.SetStateAction<string[]>>;
    setCorrectedCellIds: React.Dispatch<React.SetStateAction<string[]>>;
    apiKey: string;
}

export interface TargetedDebugModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (context: string) => void;
    isLoading: boolean;
}
