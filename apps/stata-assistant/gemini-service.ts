
import { GoogleGenAI, Type } from "@google/genai";
import { DebugOutput, RegressionOutput, WebSearchOutput, TableData, ChartData, WebSearchSource } from './types';

// --- Schemas for AI Responses ---

const debugSchema = {
    type: Type.OBJECT,
    properties: {
        overallCritique: { type: Type.STRING, description: "A high-level summary of the script's quality and purpose." },
        corrections: {
            type: Type.ARRAY,
            description: "A list of specific errors or suggestions.",
            items: {
                type: Type.OBJECT,
                properties: {
                    cellIdToFix: { type: Type.STRING, description: "The ID of the code cell containing the issue. The provided script will have cell IDs in comments like /* a1b2c3d4 */." },
                    critique: { type: Type.STRING, description: "A detailed explanation of the error or suggestion." },
                    suggestion: { type: Type.STRING, description: "The corrected or improved Stata code." },
                    isCritical: { type: Type.BOOLEAN, description: "True if this is a syntax error that would prevent the code from running." }
                },
                required: ['cellIdToFix', 'critique', 'suggestion', 'isCritical']
            }
        }
    },
    required: ['overallCritique', 'corrections']
};

const regressionSchema = {
    type: Type.OBJECT,
    properties: {
        stataTable: { type: Type.STRING, description: "A string formatted exactly like a Stata regression output table." },
        interpretation: { type: Type.STRING, description: "A detailed, paragraph-form interpretation of the regression results, explaining the coefficients, significance, and R-squared value." }
    },
    required: ['stataTable', 'interpretation']
};

const queryResponseSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, description: "The type of response, must be one of: 'table', 'chart', or 'text'." },
        content: {
            type: Type.OBJECT,
            description: "An object containing the data for the response. Its structure depends on the 'type' field.",
            properties: {
                 // for table
                headers: { type: Type.ARRAY, items: { type: Type.STRING } },
                rows: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } } },
                 // for chart
                chartType: { type: Type.STRING, description: "e.g., 'bar', 'line'" },
                labels: { type: Type.ARRAY, items: { type: Type.STRING } },
                datasets: {
                    type: Type.ARRAY, items: {
                        type: Type.OBJECT, properties: {
                            label: { type: Type.STRING },
                            data: { type: Type.ARRAY, items: { type: Type.NUMBER } }
                        }
                    }
                },
                // for text
                text: { type: Type.STRING },
                // common
                explanation: { type: Type.STRING, description: "A brief explanation of the generated content." }
            }
        }
    },
    required: ['type', 'content']
};


// --- Service Functions ---

export const debugScript = async (codeWithCellIds: string, dataSchema: string, apiKey: string): Promise<DebugOutput> => {
    if (!apiKey) throw new Error("API key is not configured.");
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = "You are a Stata debugging expert. The user provides a Stata script with cell IDs in comments (e.g., /* a1b2c3d4 */) and a description of their loaded data. Analyze the script, identify errors and potential improvements, and map each issue to its corresponding cell ID. Return ONLY the JSON object.";
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `DATA SCHEMA: ${dataSchema}\n\nSTATA SCRIPT:\n${codeWithCellIds}`,
        config: { systemInstruction, responseMimeType: "application/json", responseSchema: debugSchema }
    });
    return JSON.parse(response.text) as DebugOutput;
};

export const targetedDebug = async (codeWithCellIds: string, userContext: string, apiKey: string): Promise<DebugOutput> => {
    if (!apiKey) throw new Error("API key is not configured.");
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = "You are a Stata debugging expert. The user provides a script with cell IDs, and a specific problem or error message. Focus your analysis on solving that particular issue within the context of the whole script. Return ONLY the JSON object.";
     const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `USER PROBLEM: "${userContext}"\n\nSTATA SCRIPT:\n${codeWithCellIds}`,
        config: { systemInstruction, responseMimeType: "application/json", responseSchema: debugSchema }
    });
    return JSON.parse(response.text) as DebugOutput;
}

export const analyzeScript = async (code: string, dataSchema: string, apiKey: string): Promise<RegressionOutput> => {
    if (!apiKey) throw new Error("API key is not configured.");
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = "You are a Stata econometrics expert. Simulate running the final regression command in the provided script. Generate a realistic Stata regression table and a detailed interpretation of the results. Assume the provided data schema. Return ONLY the JSON object.";
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `DATA SCHEMA: ${dataSchema}\n\nSTATA SCRIPT:\n${code}`,
        config: { systemInstruction, responseMimeType: "application/json", responseSchema: regressionSchema }
    });
    return JSON.parse(response.text) as RegressionOutput;
};

export const processNaturalLanguageQuery = async (query: string, code: string, dataSchema: string, apiKey: string): Promise<{type: 'table' | 'chart' | 'text', content: TableData | ChartData | string}> => {
    if (!apiKey) throw new Error("API key is not configured.");
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `You are a Stata data analysis assistant. The user has provided a query about their data, along with their current script and data schema. Determine the best way to answer: as a data table, a chart, or plain text. Generate the content and return it in the specified JSON format. For charts, provide the data needed to render it.
    - If the user asks for a summary, use a table.
    - If they ask for a comparison or trend, use a chart.
    - If they ask for an explanation, use text.
    Return ONLY the JSON object.`;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `QUERY: "${query}"\n\nDATA SCHEMA: ${dataSchema}\n\nSTATA SCRIPT:\n${code}`,
        config: { systemInstruction, responseMimeType: "application/json", responseSchema: queryResponseSchema }
    });
    
    const parsed = JSON.parse(response.text);

    if (parsed.type === 'table') {
        return { type: 'table', content: { headers: parsed.content.headers, rows: parsed.content.rows, explanation: parsed.content.explanation } };
    }
    if (parsed.type === 'chart') {
        return { type: 'chart', content: { type: parsed.content.chartType, labels: parsed.content.labels, datasets: parsed.content.datasets, explanation: parsed.content.explanation } };
    }
    return { type: 'text', content: parsed.content.text || parsed.content.explanation };
};

export const runWebSearch = async (query: string, apiKey: string): Promise<WebSearchOutput> => {
    if (!apiKey) throw new Error("API key is not configured.");
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = "You are a research assistant specializing in Stata. The user has a question. Use Google Search to find the most relevant and authoritative answer (e.g., from Stata's official documentation, Statalist, or academic sites). Synthesize the information into a clear answer and provide the source links. Do not answer if you can't find relevant sources.";
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Stata question: "${query}"`,
        config: { systemInstruction, tools: [{ googleSearch: {} }] }
    });

    const groundingMeta = response.candidates?.[0]?.groundingMetadata;
    const chunks: any[] = groundingMeta?.groundingChunks || [];
    const sources: WebSearchSource[] = chunks.map((chunk: any) => ({
        uri: chunk.web?.uri || '',
        title: chunk.web?.title || 'Untitled'
    })).filter(s => s.uri);
    
    // Deduplicate sources by URI
    const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());

    return {
        answer: response.text,
        sources: uniqueSources
    };
};