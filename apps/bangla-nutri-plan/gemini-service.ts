

import { GoogleGenAI, Type } from "@google/genai";
import { WeeklyPlan, DailyPlan, Meal, UserProfile, AiGeneratedRecipe, AiNutritionalInfo, GroceryCategory, LoggedMeals, NutriProfile } from './types';

// --- Schemas for AI responses ---

const mealSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING, description: "Unique ID for the meal, e.g., 'd1-b' for Day 1 Breakfast." },
        name: { type: Type.STRING, description: "The Bengali or common name of the meal." },
        emoji: { type: Type.STRING, description: "An appropriate emoji for the meal." },
        description: { type: Type.STRING, description: "A brief, enticing description of the meal components." },
        calories: { type: Type.NUMBER, description: "Estimated total calories." },
        weight: { type: Type.NUMBER, description: "Estimated weight in grams." },
        isRiceMeal: { type: Type.BOOLEAN, description: "True if the meal includes rice." },
        breakdown: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: { item: { type: Type.STRING }, calories: { type: Type.NUMBER } },
                required: ['item', 'calories']
            }
        }
    },
    required: ['id', 'name', 'emoji', 'description', 'calories', 'weight', 'isRiceMeal', 'breakdown']
};

const dailyPlanSchema = {
    type: Type.OBJECT,
    properties: {
        day: { type: Type.NUMBER, description: "Day number (1-7)." },
        meals: { type: Type.ARRAY, description: "A list of 4 meals for the day.", items: mealSchema }
    },
    required: ['day', 'meals']
};

const weeklyPlanSchema = {
    type: Type.OBJECT,
    properties: {
        plan: { type: Type.ARRAY, description: "A 7-day meal plan.", items: dailyPlanSchema }
    },
    required: ['plan']
};

const groceryListSchema = {
    type: Type.OBJECT,
    properties: {
        categories: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    categoryName: { type: Type.STRING, description: "e.g., 'Vegetables', 'Proteins', 'Spices'." },
                    items: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['categoryName', 'items']
            }
        }
    },
    required: ['categories']
};

const nutritionalInfoSchema = {
    type: Type.OBJECT,
    properties: {
        dishName: { type: Type.STRING },
        calories: { type: Type.NUMBER },
        protein: { type: Type.NUMBER, description: "Protein in grams." },
        carbs: { type: Type.NUMBER, description: "Carbohydrates in grams." },
        fat: { type: Type.NUMBER, description: "Fat in grams." },
        summary: { type: Type.STRING, description: "A brief nutritional summary." }
    },
    required: ['dishName', 'calories', 'protein', 'carbs', 'fat', 'summary']
};

const recipeSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "A creative Bengali or English name for the dish." },
        description: { type: Type.STRING, description: "A short, enticing description." },
        ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
        instructions: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ['name', 'description', 'ingredients', 'instructions']
};


// --- Service Functions ---

const callGemini = async (apiKey: string, systemInstruction: string, userPrompt: string, schema?: any) => {
    if (!apiKey) throw new Error("API key is not configured.");
    const ai = new GoogleGenAI({ apiKey });
    try {
        const config: any = { systemInstruction };
        if (schema) {
            config.responseMimeType = "application/json";
            config.responseSchema = schema;
        }
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: config
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API Error:", error);
        if (error instanceof Error && (error.message.includes('API_KEY_INVALID') || error.message.includes('API key not valid'))) {
          throw new Error("The provided Gemini API Key is invalid or expired.");
        }
        throw new Error("Failed to communicate with the AI. Please try again later.");
    }
};

export const regenerateMealPlan = async (profile: Partial<NutriProfile>, apiKey: string): Promise<WeeklyPlan> => {
    const systemInstruction = `You are a Bangladeshi nutritionist. Create a 7-day healthy meal plan based on the user's profile. The plan must feature common Bangladeshi dishes and consist of 4 meals per day: breakfast, lunch, snack, and dinner. You must adhere to the user's dietary exclusions. Return ONLY the JSON object.`;
    const userPrompt = `Generate a meal plan for a user with these details: Age: ${profile.age}, Weight: ${profile.weight_kg}kg, Height: ${profile.height_cm}cm, Activity: ${profile.activity_level}, Goal: ${profile.goal} weight. Exclusions: ${profile.exclusions?.join(', ') || 'None'}.`;
    
    const responseText = await callGemini(apiKey, systemInstruction, userPrompt, weeklyPlanSchema);
    const result = JSON.parse(responseText);
    return result.plan;
};

export const generateGroceryList = async (plan: WeeklyPlan, apiKey: string): Promise<GroceryCategory[]> => {
    const systemInstruction = `You are a helpful assistant. Based on the provided 7-day meal plan, create a categorized grocery list. Combine similar items and provide reasonable quantities. Return ONLY the JSON object.`;
    const userPrompt = `Here is the meal plan:\n${JSON.stringify(plan)}`;
    
    const responseText = await callGemini(apiKey, systemInstruction, userPrompt, groceryListSchema);
    const result = JSON.parse(responseText);
    return result.categories;
};

export const getAiCoachTip = async (activeDayPlan: DailyPlan, loggedMeals: LoggedMeals, apiKey: string): Promise<string> => {
    const systemInstruction = `You are a friendly, encouraging nutrition coach. Provide a short, one-sentence tip in English based on the user's meal plan for the day and what they've already eaten.`;
    const userPrompt = `Today's plan: ${JSON.stringify(activeDayPlan.meals.map(m => m.name))}. Meals eaten so far: ${JSON.stringify(Object.keys(loggedMeals))}. Give me a tip.`;
    
    return await callGemini(apiKey, systemInstruction, userPrompt);
};

export const generateRecipeFromText = async (ingredients: string, apiKey: string): Promise<AiGeneratedRecipe> => {
    const systemInstruction = `You are a chef specializing in Bangladeshi cuisine. Create a simple, delicious recipe using the provided ingredients. Return ONLY the JSON object.`;
    const userPrompt = `I have these ingredients: ${ingredients}. Create a recipe.`;
    
    const responseText = await callGemini(apiKey, systemInstruction, userPrompt, recipeSchema);
    return JSON.parse(responseText);
};

export const generateRecipeFromImage = async (base64Image: string, apiKey: string): Promise<AiGeneratedRecipe> => {
    if (!apiKey) throw new Error("API key is not configured.");
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `You are a chef specializing in Bangladeshi cuisine. Identify the ingredients in the image and create a simple, delicious recipe using them. Return ONLY the JSON object.`;
    const imagePart = { inlineData: { mimeType: 'image/jpeg', data: base64Image } };
    const textPart = { text: "What recipe can I make with these ingredients?" };

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: { systemInstruction, responseMimeType: "application/json", responseSchema: recipeSchema }
    });
    
    return JSON.parse(response.text);
};

export const getNutritionalInfo = async (dishName: string, apiKey: string): Promise<AiNutritionalInfo> => {
    const systemInstruction = `You are a nutritionist. Provide an estimated nutritional breakdown for the given Bangladeshi dish. Return ONLY the JSON object.`;
    const userPrompt = `Analyze the nutritional content of: "${dishName}"`;

    const responseText = await callGemini(apiKey, systemInstruction, userPrompt, nutritionalInfoSchema);
    return JSON.parse(responseText);
};