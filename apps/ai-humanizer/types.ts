
export type ActiveTab = 'welcome' | 'loading' | 'detector' | 'humanizer';

export interface AnalysisDetail {
    value: string;
}

export interface AnalysisResult {
    aiScore: number;
    summary: string;
    perplexity: AnalysisDetail;
    burstiness: AnalysisDetail;
    uniformity: AnalysisDetail;
}
