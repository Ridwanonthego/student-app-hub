

import { GoogleGenAI, Type } from "@google/genai";
import { SourceDocument, ChatMessage, NotebookGuide, WebSearchResult, Citation } from './types';

const languagePrompt = (lang: 'en' | 'bn') => lang === 'bn' ? ' The user prefers responses in Bengali.' : ' The user prefers responses in English.';

export const researchTopic = async (topic: string, lang: 'en' | 'bn', apiKey: string): Promise<WebSearchResult[]> => {
    if (!apiKey) throw new Error("API key is not configured.");
    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Find relevant, high-quality web articles for the topic: "${topic}".${languagePrompt(lang)}`,
            config: { tools: [{ googleSearch: {} }] }
        });

        const groundingMeta = response.candidates?.[0]?.groundingMetadata;
        if (!groundingMeta?.groundingChunks) throw new Error("Could not find any distinct sources for this topic.");

        const chunks: any[] = groundingMeta.groundingChunks;
        const sources: WebSearchResult[] = chunks.map((chunk: any) => ({
            title: chunk.web?.title || 'Untitled Source',
            link: chunk.web?.uri || '',
            snippet: chunk.retrievedContext?.text || 'No snippet available.'
        })).filter(s => s.link);

        const uniqueSources = Array.from(new Map(sources.map(item => [item.link, item])).values());
        return uniqueSources.slice(0, 5); // Return top 5 unique sources
    } catch (e) {
        console.error("Error researching topic:", e);
        throw new Error("Failed to research the topic using Google Search.");
    }
};

const guideSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "A concise, one-paragraph summary of all provided documents." },
        suggestedQuestions: {
            type: Type.ARRAY,
            description: "A list of three insightful questions that can be answered from the documents.",
            items: { type: Type.STRING }
        }
    },
    required: ["summary", "suggestedQuestions"]
};

export const generateInitialGuide = async (sources: SourceDocument[], lang: 'en' | 'bn', apiKey: string): Promise<NotebookGuide> => {
    if (!apiKey) throw new Error("API key is not configured.");
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `You are a research assistant. Synthesize the provided documents into a single summary paragraph and generate three relevant follow-up questions. ${languagePrompt(lang)} Return ONLY the JSON object.`;
    const sourceText = sources.map((s, i) => `--- DOCUMENT ${i+1}: ${s.name} ---\n${s.content}`).join('\n\n');

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: sourceText,
        config: { systemInstruction, responseMimeType: "application/json", responseSchema: guideSchema }
    });
    return JSON.parse(response.text.trim()) as NotebookGuide;
};

const chatSchema = {
    type: Type.OBJECT,
    properties: {
        answer: { type: Type.STRING, description: "The detailed answer to the user's question." },
        citations: {
            type: Type.ARRAY,
            description: "A list of citations supporting the answer.",
            items: {
                type: Type.OBJECT,
                properties: {
                    sourceName: { type: Type.STRING, description: "The name of the source document." },
                    snippet: { type: Type.STRING, description: "The exact quote or relevant text snippet from the source." }
                },
                required: ['sourceName', 'snippet']
            }
        }
    },
    required: ['answer', 'citations']
};


export const answerQuestion = async (question: string, sources: SourceDocument[], history: ChatMessage[], lang: 'en' | 'bn', apiKey: string): Promise<ChatMessage> => {
    if (!apiKey) throw new Error("API key is not configured.");
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `You are a helpful research assistant. Answer the user's question based *only* on the provided documents. Ground your entire answer in the sources. Provide citations for the information you use. ${languagePrompt(lang)} Return ONLY the JSON object.`;
    const sourceText = sources.map((s) => `--- DOCUMENT: ${s.name} ---\n${s.content}`).join('\n\n');
    const historyText = history.map(h => `${h.role}: ${h.content}`).join('\n');
    const contents = `DOCUMENTS:\n${sourceText}\n\nCHAT HISTORY:\n${historyText}\n\nUSER QUESTION: ${question}`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: { systemInstruction, responseMimeType: "application/json", responseSchema: chatSchema }
    });
    
    const parsed = JSON.parse(response.text.trim());
    return {
        id: Date.now().toString(),
        role: 'ai',
        content: parsed.answer,
        citations: parsed.citations as Citation[]
    };
};


const generateOutput = async (systemInstruction: string, sources: SourceDocument[], lang: 'en' | 'bn', apiKey: string): Promise<string> => {
    if (!apiKey) throw new Error("API key is not configured.");
    const ai = new GoogleGenAI({ apiKey });
    const sourceText = sources.map((s, i) => `--- DOCUMENT ${i+1}: ${s.name} ---\n${s.content}`).join('\n\n');
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: sourceText,
        config: { systemInstruction: `${systemInstruction} ${languagePrompt(lang)}` }
    });
    return response.text;
}

export const generateBriefing = (sources: SourceDocument[], lang: 'en' | 'bn', apiKey: string) => {
    const instruction = "Generate a professional briefing document from the provided sources. Use markdown for formatting (e.g., # Title, ## Section, - Bullet). Include citations like [Source 1], [Source 2], etc., corresponding to the document order.";
    return generateOutput(instruction, sources, lang, apiKey);
}

export const generateMindMap = (sources: SourceDocument[], lang: 'en' | 'bn', apiKey: string) => {
    const instruction = "Generate a text-based mind map from the provided sources. Use nested bullet points (-, --, ---) in markdown to show the hierarchy of concepts. Start with a central theme.";
    return generateOutput(instruction, sources, lang, apiKey);
}

export const generatePodcastScript = (sources: SourceDocument[], lang: 'en' | 'bn', apiKey: string) => {
    const instruction = "Generate a short podcast script discussing the key findings from the provided sources. The script should be between a 'Host' and an 'Expert'. Format it like 'Host: [dialogue]' and 'Expert: [dialogue]'. Include a title for the episode. Include citations like [Source 1] where the Expert mentions specific info.";
    return generateOutput(instruction, sources, lang, apiKey);
}