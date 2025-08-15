

import { GoogleGenAI, Type } from "@google/genai";
import { Section, ExplanationStyle, ClarificationAction } from "./types";

const explanationSchema = {
    type: Type.OBJECT,
    properties: {
        main_explanation: {
            type: Type.STRING,
            description: "The core, detailed explanation of the topic. This should be comprehensive but clear."
        },
        key_definitions: {
            type: Type.ARRAY,
            description: "A list of key terms and their simple definitions.",
            items: {
                type: Type.OBJECT,
                properties: {
                    term: { type: Type.STRING },
                    definition: { type: Type.STRING }
                },
                required: ['term', 'definition']
            }
        },
        visual_aid: {
            type: Type.OBJECT,
            description: "Data for a visual representation. Choose the best format for the topic.",
            properties: {
                type: { type: Type.STRING, enum: ['COMPARISON_TABLE', 'BAR_CHART', 'PROCESS_DIAGRAM', 'CONCEPT_MAP', 'NONE'] },
                title: { type: Type.STRING },
                data: {
                    type: Type.STRING,
                    description: "A JSON string representing the data for the visual. For TABLE, an array of arrays. For CHART, {labels:[], datasets:[{label, data}]}. For DIAGRAM/MAP, an array of {id, content, connections:[]}. This string must be parsable."
                }
            },
            required: ['type', 'title', 'data']
        },
        examples_and_analogies: {
            type: Type.ARRAY,
            description: "A list of analogies and corresponding real-world examples to aid understanding.",
            items: {
                type: Type.OBJECT,
                properties: {
                    analogy: { type: Type.STRING },
                    example: { type: Type.STRING }
                },
                required: ['analogy', 'example']
            }
        },
        related_topics: {
            type: Type.ARRAY,
            description: "A list of 3-5 related topics for further exploration.",
            items: { type: Type.STRING }
        }
    },
    required: ['main_explanation', 'key_definitions', 'visual_aid', 'examples_and_analogies', 'related_topics']
};

export const getExplanation = async (topic: string, style: ExplanationStyle, apiKey: string): Promise<Section> => {
    if (!apiKey) throw new Error("API key is not configured.");
    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = `You are an expert educator. Your goal is to explain a topic in a structured, multi-faceted way. The user provides a topic and an explanation style. You MUST generate a response that perfectly fits the provided JSON schema.
    - Style: ${style}. 'Simple' is for a general audience. 'Detailed' is for someone with prior knowledge. 'Analogy-based' should lean heavily on comparisons. 'Step-by-step' is for processes.
    - Visual Aid: Choose the MOST appropriate visual type. For comparisons, use COMPARISON_TABLE. For quantitative data, use BAR_CHART. For sequences, use PROCESS_DIAGRAM. For hierarchical ideas, use CONCEPT_MAP. If none fit, use NONE. The data format must be valid JSON for the chosen type.
    - Content: All content must be accurate and directly related to the user's topic.
    Return ONLY the JSON object. Do not include any markdown or other text outside the JSON structure.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Explain the following topic: "${topic}"`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: explanationSchema
            }
        });

        const jsonText = response.text.trim();
        // A simple validation to ensure it's a JSON object
        if (jsonText.startsWith('{') && jsonText.endsWith('}')) {
             const result = JSON.parse(jsonText) as Section;
             if (result.visual_aid && typeof result.visual_aid.data === 'string') {
                try {
                    // Make sure data is not an empty string before parsing
                    if (result.visual_aid.data.trim()) {
                        result.visual_aid.data = JSON.parse(result.visual_aid.data);
                    } else {
                        result.visual_aid.data = null;
                    }
                } catch (e) {
                    console.error("Failed to parse visual_aid.data string:", e);
                    // Handle malformed JSON string from AI
                    result.visual_aid.data = null; 
                }
            }
             return result;
        } else {
            throw new Error("AI returned a non-JSON response. Please try again.");
        }
    } catch (error) {
        console.error("Error getting explanation from AI:", error);
        if (error instanceof Error && error.message.includes('SAFETY')) {
            throw new Error("The request was blocked due to safety settings. Please rephrase your topic.");
        }
        throw new Error("Failed to generate explanation. The AI may be experiencing issues.");
    }
};

export const getDeeperExplanation = async (topic: string, existingExplanation: string, apiKey: string): Promise<string> => {
    if (!apiKey) throw new Error("API key is not configured.");
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `You are an expert educator providing a more technical, in-depth explanation. The user has already seen a basic explanation of a topic. Now, provide a 'Deeper Dive'. This should include more complex concepts, jargon (with explanations), and a higher level of detail. Do not repeat the initial explanation. Respond only with the new, deeper explanation text.`;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Topic: "${topic}"\n\nInitial Explanation (for context, do not repeat):\n${existingExplanation}`,
        config: { systemInstruction }
    });
    return response.text;
};

export const getClarification = async (textToClarify: string, action: ClarificationAction, apiKey: string): Promise<string> => {
    if (!apiKey) throw new Error("API key is not configured.");
    const ai = new GoogleGenAI({ apiKey });
    const actionInstruction = action === 'simplify' 
        ? "Rephrase the following text in simpler, more accessible terms. Break it down for someone who is not an expert."
        : "Expand on the following text. Provide more context, detail, and explain any underlying concepts or implications.";
        
    const systemInstruction = `You are an expert educator. A user has selected a piece of text and wants clarification. Your task is to perform the requested action. Respond ONLY with the clarified text.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `${actionInstruction}\n\nText to clarify: "${textToClarify}"`,
        config: { systemInstruction }
    });
    return response.text;
};
