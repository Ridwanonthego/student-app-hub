
import { GoogleGenAI, Type } from "@google/genai";
import { AITaskParseResult } from './types';

const taskParserSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "The core action or item of the to-do. Be concise. Exclude dates, times, and priority words."
        },
        category: {
            type: Type.STRING,
            description: "A single-word category. Examples: 'Work', 'Personal', 'Grocery', 'Appointment', 'Finance', 'General'. If it's a shopping item, ALWAYS use 'Grocery'."
        },
        dueDate: {
            type: Type.STRING,
            description: "The due date and time in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ). If no specific date/time is mentioned, return an empty string."
        },
        priority: {
            type: Type.STRING,
            description: "The priority level. Must be one of: 'High', 'Medium', 'Low'. Infer from words like 'ASAP', 'urgent', 'important' (High), or 'sometime', 'eventually' (Low). Default to 'Medium'."
        }
    },
    required: ["title", "category", "dueDate", "priority"]
};

export const parseTaskWithAI = async (rawText: string, apiKey: string): Promise<AITaskParseResult> => {
    if (!apiKey) throw new Error("API key is not configured.");
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are a smart to-do list assistant. Your job is to parse a user's natural language input into a structured JSON object. The current date is ${new Date().toISOString()}. Analyze the text for a title, category, due date, and priority.
    - **Title**: Extract the main task, removing all extra details.
    - **Category**: Classify the task into a single category. If it involves buying something, ALWAYS classify it as 'Grocery'.
    - **dueDate**: Convert any mention of dates or times (e.g., 'next Tuesday at 3pm', 'tomorrow', 'in 2 hours') into a precise ISO 8601 string. If no date/time is mentioned, the value MUST be an empty string.
    - **Priority**: Infer priority. 'ASAP', 'urgent' means 'High'. 'Sometime', 'maybe' means 'Low'. Otherwise, default to 'Medium'.
    Return ONLY the JSON object.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Parse this task: "${rawText}"`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: taskParserSchema
            }
        });
        const result = JSON.parse(response.text.trim());
        // Handle empty string for date
        if (result.dueDate === "") {
            result.dueDate = null;
        }
        return result;
    } catch (error) {
        console.error("Error parsing task with AI:", error);
        throw new Error("The AI assistant failed to understand the task. Please try rephrasing.");
    }
};
