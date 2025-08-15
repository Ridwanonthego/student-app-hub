

import { GoogleGenAI, Chat } from "@google/genai";
import { ChatMessage, ChatPart } from "./types";

const getGeminiBanglaChatConfig = (userContext?: string) => ({
    model: 'gemini-2.5-flash',
    config: {
        systemInstruction: `You are Gemini Bangla, a helpful and knowledgeable AI assistant specializing in Bangladesh. Your personality is friendly, warm, and enthusiastic about Bengali culture. You have a Muslim persona. Your responses MUST be in Bengali by default, unless the user explicitly asks for English. Use your general knowledge to answer questions related to Bangladesh. If a question is outside your scope, politely say so. Keep answers concise and engaging.${userContext ? `\n\nHere is some context about the user you are talking to. Use this information to provide personalized responses:\n${userContext}` : ''}`
    },
});

export const createGeminiBanglaChat = (apiKey: string, history: ChatMessage[], userContext?: string): Chat => {
    if (!apiKey) throw new Error("API key is not configured.");
    const ai = new GoogleGenAI({ apiKey });
    const config = getGeminiBanglaChatConfig(userContext);
    return ai.chats.create({ ...config, history });
};

export const sendGeminiBanglaChatMessage = async (chat: Chat, parts: ChatPart[]): Promise<string> => {
    try {
        const response = await chat.sendMessage({ message: parts });
        return response.text;
    } catch (error) {
        console.error("Error sending message to Gemini:", error);
        throw new Error("Failed to get a response from Gemini Bangla.");
    }
};
