
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BackArrowIcon } from '../../components/Icons';
import * as I from './icons';
import { ConceptClearPageProps, Section, ExplanationStyle, TextSelectionPopupState, ClarificationModalState, ClarificationAction } from './types';
import { InputForm, LoadingSpinner, ErrorMessage, ExplanationDisplay, TextInteractionPopup, ClarificationModal } from './components';
import { getExplanation, getDeeperExplanation, getClarification } from './gemini-service';
import { INITIAL_TOPIC } from './constants';

const ConceptClearPage: React.FC<ConceptClearPageProps> = ({ onNavigateBack, apiKey }) => {
    // Core state
    const [topic, setTopic] = useState('');
    const [style, setStyle] = useState<ExplanationStyle>('Simple');
    const [explanation, setExplanation] = useState<Section | null>(null);
    const [deeperDiveContent, setDeeperDiveContent] = useState('');

    // Loading and error states
    const [isLoading, setIsLoading] = useState(false);
    const [isDeeperDiveLoading, setIsDeeperDiveLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Interactive state
    const [popupState, setPopupState] = useState<TextSelectionPopupState>({ isVisible: false, top: 0, left: 0, text: '' });
    const [modalState, setModalState] = useState<ClarificationModalState>({ isOpen: false, action: 'simplify', text: '', result: null, isLoading: false, error: null });
    const mainExplanationRef = useRef<HTMLDivElement>(null);
    
    const fetchExplanation = useCallback(async (currentTopic: string, currentStyle: ExplanationStyle) => {
        if (!currentTopic.trim()) return;
        setIsLoading(true);
        setError(null);
        setExplanation(null);
        setDeeperDiveContent('');
        try {
            const result = await getExplanation(currentTopic, currentStyle, apiKey);
            setExplanation(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [apiKey]);

    useEffect(() => {
        // Load initial example on mount, but do not run generation.
        setTopic(INITIAL_TOPIC);
    }, []);

    const handleSubmit = () => {
        fetchExplanation(topic, style);
    };

    const handleDigDeeper = async () => {
        if (!explanation) return;
        setIsDeeperDiveLoading(true);
        try {
            const result = await getDeeperExplanation(topic, explanation.main_explanation, apiKey);
            setDeeperDiveContent(result);
        } catch (e) {
            setError("Failed to get deeper explanation.");
        } finally {
            setIsDeeperDiveLoading(false);
        }
    };
    
    const handleSelectRelatedTopic = (newTopic: string) => {
        setTopic(newTopic);
        fetchExplanation(newTopic, style);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleMouseUp = () => {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();

        if (selectedText && mainExplanationRef.current?.contains(selection.anchorNode)) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setPopupState({
                isVisible: true,
                top: rect.top + window.scrollY - 45,
                left: rect.left + window.scrollX + (rect.width / 2) - 80,
                text: selectedText,
            });
        } else {
            setPopupState(prev => ({ ...prev, isVisible: false }));
        }
    };

    const handleClarificationAction = async (action: ClarificationAction) => {
        const textToClarify = popupState.text;
        setPopupState(prev => ({...prev, isVisible: false}));
        setModalState({ isOpen: true, action, text: textToClarify, result: null, isLoading: true, error: null });
        try {
            const result = await getClarification(textToClarify, action, apiKey);
            setModalState(prev => ({ ...prev, result, isLoading: false }));
        } catch(e) {
            const errorMsg = e instanceof Error ? e.message : 'An unknown error occurred.';
            setModalState(prev => ({...prev, error: errorMsg, isLoading: false}));
        }
    };

    return (
        <div className="bg-stone-100 min-h-screen font-dm-sans" onMouseUp={handleMouseUp}>
            <div className="max-w-3xl mx-auto p-4 sm:p-8">
                <button
                    onClick={onNavigateBack}
                    className="flex items-center gap-2 text-black font-bold mb-4 p-2 -ml-2 hover:bg-stone-200"
                >
                    <BackArrowIcon />
                    Back to Hub
                </button>
                <header className="bg-lime-400 border-2 border-black shadow-[8px_8px_0px_#000] p-6 flex items-center gap-4">
                    <I.BrainCircuitIcon className="w-10 h-10 text-black" />
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-black">Make Me Understand</h1>
                    </div>
                </header>
                <p className="text-center text-lg text-neutral-600 my-8">Your personal AI-powered learning companion.</p>

                <main>
                    <InputForm
                        topic={topic}
                        setTopic={setTopic}
                        style={style}
                        setStyle={setStyle}
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                    />

                    <div className="mt-12">
                        {isLoading && <LoadingSpinner />}
                        {error && <ErrorMessage message={error} />}
                        {explanation && (
                            <ExplanationDisplay
                                explanation={explanation}
                                onDigDeeper={handleDigDeeper}
                                onSelectRelated={handleSelectRelatedTopic}
                                deeperDiveContent={deeperDiveContent}
                                isDeeperDiveLoading={isDeeperDiveLoading}
                                mainExplanationRef={mainExplanationRef}
                            />
                        )}
                    </div>
                </main>

                <footer className="text-center text-neutral-500 mt-16 space-y-1">
                    <p>Powered by Google Gemini.</p>
                    <p className="text-xs">Explanations are AI-generated and may require verification.</p>
                </footer>
            </div>
            <TextInteractionPopup
                popupState={popupState}
                onAction={handleClarificationAction}
                onClose={() => setPopupState(prev => ({ ...prev, isVisible: false }))}
            />
            <ClarificationModal
                modalState={modalState}
                onClose={() => setModalState(prev => ({...prev, isOpen: false}))}
            />
        </div>
    );
};

export default ConceptClearPage;
