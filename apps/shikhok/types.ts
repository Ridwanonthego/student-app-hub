

import React from 'react';

export type Language = 'en' | 'bn';
export type SourceType = 'file' | 'paste' | 'url' | 'research';
export type MainView = 'welcome' | 'guide' | 'chat';
export type OverlayView = 'briefing' | 'mindmap' | 'podcast' | 'notes' | null;
export type AddSourceModalView = 'file' | 'paste' | 'url' | 'research';

export interface SourceDocument {
    id: string;
    name: string;
    type: SourceType;
    content: string;
}

export interface Citation {
    sourceName: string;
    snippet: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'ai';
    content: string;
    citations?: Citation[];
}

export interface NotebookGuide {
    summary: string;
    suggestedQuestions: string[];
}

export interface WebSearchResult {
    title: string;
    link: string;
    snippet: string;
}

export interface ShikhokState {
    isApiKeySet: boolean;
    language: Language;
    sources: SourceDocument[];
    mainView: MainView;
    chatHistory: ChatMessage[];
    notebookGuide: NotebookGuide | null;
    overlayView: OverlayView;
    generatedOutput: string | null;
    userNotes: string;
    modals: {
        addSource: boolean;
        selectSources: boolean;
    };
    loading: {
        guide: boolean;
        chat: boolean;
        research: boolean;
        output: boolean;
    };
    loadingMessage: string;
    error: string | null;
    searchResults: WebSearchResult[];
}

// Props
export interface ShikhokPageProps {
  onNavigateBack: () => void;
  apiKey: string;
}

// Components
export interface ShikhokButtonProps {
    onClick: () => void;
    disabled?: boolean;
    children: React.ReactNode;
    className?: string;
    variant?: 'primary' | 'secondary';
}
