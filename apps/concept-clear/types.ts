
export interface ConceptClearPageProps {
    onNavigateBack: () => void;
    apiKey: string;
}

export type ExplanationStyle = 'Simple' | 'Detailed' | 'Analogy-based' | 'Step-by-step process';
export type VisualType = 'COMPARISON_TABLE' | 'BAR_CHART' | 'PROCESS_DIAGRAM' | 'CONCEPT_MAP' | 'NONE';
export type ClarificationAction = 'simplify' | 'expand';

export interface KeyDefinition {
    term: string;
    definition: string;
}

export interface ExampleAnalogy {
    analogy: string;
    example: string;
}

export interface VisualData {
    type: VisualType;
    title: string;
    data: any; // Can be string[][] for table, or specific chart/diagram format
}

export interface Section {
    main_explanation: string;
    key_definitions: KeyDefinition[];
    visual_aid: VisualData;
    examples_and_analogies: ExampleAnalogy[];
    related_topics: string[];
}

export interface ClarificationModalState {
    isOpen: boolean;
    action: ClarificationAction;
    text: string;
    result: string | null;
    isLoading: boolean;
    error: string | null;
}

export interface TextSelectionPopupState {
    isVisible: boolean;
    top: number;
    left: number;
    text: string;
}
