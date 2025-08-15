

import { GoogleGenAI, Type } from "@google/genai";
import { WeeklyPlan, DailyPlan, LoggedMeals, AiNutritionalInfo, GroceryCategory, AiGeneratedRecipe, NutriProfile } from "./types";
import { weeklyPlanData } from "./data";

const groceryListSchema = {
    type: Type.OBJECT,
    properties: {
        categories: {
            type: Type.ARRAY,
            description: "A list of grocery categories.",
            items: {
                type: Type.OBJECT,
                properties: {
                    categoryName: { type: Type.STRING, description: "The name of the category, e.g., 'Produce', 'Protein (Fish & Meat)'." },
                    items: {
                        type: Type.ARRAY,
                        description: "List of items in this category.",
                        items: { type: Type.STRING, description: "e.g., 'Onions: 1 kg', 'Rui Maach: 500g'" }
                    }
                },
                required: ['categoryName', 'items'],
            }
        }
    },
    required: ['categories'],
};

export const generateGroceryList = async (mealPlan: WeeklyPlan, apiKey: string): Promise<GroceryCategory[]> => {
    if (!apiKey) throw new Error("API key is not configured.");
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = "You are a shopping assistant. Based on the provided 7-day Bangladeshi meal plan, generate a categorized grocery list. Consolidate ingredients and estimate quantities for one person for a week. The categories should be logical for a Bangladeshi grocery store (e.g., 'Produce', 'Protein (Fish & Meat)', 'Pantry & Spices', 'Dairy & Eggs'). Return ONLY the JSON object.";
    
    const simplifiedPlan = mealPlan.map(day => ({
        day: day.day,
        meals: day.meals.map(meal => meal.name).join(', ')
    }));

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a grocery list for this weekly plan: ${JSON.stringify(simplifiedPlan)}`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: groceryListSchema,
            },
        });
        const result = JSON.parse(response.text);
        return result.categories;
    } catch (e) {
        console.error("Error generating grocery list:", e);
        throw new Error("Could not generate the grocery list. The AI might be busy.");
    }
};

export const getAiCoachTip = async (dayPlan: DailyPlan, loggedMeals: LoggedMeals, apiKey: string): Promise<string> => {
    if (!apiKey) throw new Error("API key is not configured.");
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = "You are a friendly, encouraging nutrition coach for a Bangladeshi user. Your tone is supportive and culturally aware. Give a short, relevant, one or two-sentence tip based on the user's meal plan for the day and what they have already eaten. Keep it concise.";
    
    const loggedMealNames = dayPlan.meals.filter(m => loggedMeals[m.id]).map(m => m.name);
    const upcomingMealNames = dayPlan.meals.filter(m => !loggedMeals[m.id]).map(m => m.name);

    let prompt = `Today's plan is: ${dayPlan.meals.map(m => m.name).join(', ')}. `;
    if (loggedMealNames.length > 0) {
        prompt += `The user has already eaten: ${loggedMealNames.join(', ')}. `;
    } else {
        prompt += "The user hasn't eaten anything yet. ";
    }
    if (upcomingMealNames.length > 0) {
        prompt += `Upcoming meals are: ${upcomingMealNames.join(', ')}.`;
    }
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { systemInstruction }
        });
        return response.text.trim();
    } catch (e) {
        console.error("Error getting AI coach tip:", e);
        return "Remember to stay hydrated and enjoy your meals!";
    }
};

const recipeSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "The name of the recipe." },
        description: { type: Type.STRING, description: "A short, enticing description of the dish." },
        ingredients: {
            type: Type.ARRAY,
            description: "A list of required ingredients.",
            items: { type: Type.STRING }
        },
        instructions: {
            type: Type.ARRAY,
            description: "A list of step-by-step cooking instructions.",
            items: { type: Type.STRING }
        }
    },
    required: ['name', 'description', 'ingredients', 'instructions']
};

export const generateRecipeFromText = async (ingredients: string, apiKey: string): Promise<AiGeneratedRecipe> => {
    if (!apiKey) throw new Error("API key is not configured.");
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = "You are a creative Bangladeshi chef. Based on the ingredients provided, generate a single, delicious, and easy-to-follow Bangladeshi recipe. If the ingredients are sparse, you can suggest adding one or two common pantry staples. Return ONLY the JSON object.";
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Ingredients: "${ingredients}"`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: recipeSchema,
            }
        });
        return JSON.parse(response.text);
    } catch (e) {
        console.error("Error generating recipe from text:", e);
        throw new Error("Could not generate a recipe. Please check your ingredients or try again.");
    }
};

export const generateRecipeFromImage = async (base64Image: string, apiKey: string): Promise<AiGeneratedRecipe> => {
    if (!apiKey) throw new Error("API key is not configured.");
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = "You are a creative Bangladeshi chef. First, identify the key ingredients from the image of a fridge or pantry. Then, based on those ingredients, generate a single, delicious, and easy-to-follow Bangladeshi recipe. Return ONLY the JSON object.";
    
    const imagePart = { inlineData: { mimeType: 'image/jpeg', data: base64Image } };
    const textPart = { text: "What Bangladeshi recipe can I make with these ingredients?" };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [imagePart, textPart] },
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: recipeSchema,
            },
        });
        return JSON.parse(response.text);
    } catch (e) {
        console.error("Error generating recipe from image:", e);
        throw new Error("Sorry, I couldn't analyze the image. Please try a clearer picture.");
    }
};

const nutritionalInfoSchema = {
    type: Type.OBJECT,
    properties: {
        dishName: { type: Type.STRING },
        calories: { type: Type.NUMBER },
        protein: { type: Type.NUMBER },
        carbs: { type: Type.NUMBER },
        fat: { type: Type.NUMBER },
        summary: { type: Type.STRING, description: "A brief one-sentence summary of the nutritional value." }
    },
    required: ["dishName", "calories", "protein", "carbs", "fat", "summary"]
};

export const getNutritionalInfo = async (dishName: string, apiKey: string): Promise<AiNutritionalInfo> => {
    if (!apiKey) throw new Error("API key is not configured.");
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `You are a nutritionist. Provide an estimated nutritional breakdown for a standard single serving of the given Bangladeshi dish. Provide values for calories, protein (g), carbs (g), and fat (g). Also include a brief summary. Return ONLY the JSON object.`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Dish: "${dishName}"`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: nutritionalInfoSchema,
            }
        });
        return JSON.parse(response.text);
    } catch (e) {
        console.error("Error getting nutritional info:", e);
        throw new Error("Could not analyze the dish. Please check the name and try again.");
    }
};

const mealSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        emoji: { type: Type.STRING },
        description: { type: Type.STRING },
        calories: { type: Type.NUMBER },
        weight: { type: Type.NUMBER },
        isRiceMeal: { type: Type.BOOLEAN },
        breakdown: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    item: { type: Type.STRING },
                    calories: { type: Type.NUMBER }
                },
                required: ['item', 'calories']
            }
        }
    },
    required: ['id', 'name', 'emoji', 'description', 'calories', 'weight', 'isRiceMeal', 'breakdown']
};

const dailyPlanSchema = {
    type: Type.OBJECT,
    properties: {
        day: { type: Type.NUMBER },
        meals: { type: Type.ARRAY, items: mealSchema }
    },
    required: ['day', 'meals']
};

const weeklyPlanSchema = {
    type: Type.OBJECT,
    properties: {
        plan: {
            type: Type.ARRAY,
            description: "The complete 7-day meal plan.",
            items: dailyPlanSchema
        }
    },
    required: ['plan']
};

export const regenerateMealPlan = async (userProfile: NutriProfile, apiKey: string): Promise<WeeklyPlan> => {
    if (!apiKey) throw new Error("API key is not configured.");
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `You are a professional Bangladeshi nutritionist. The user wants to generate a new 7-day meal plan based on their profile and dietary exclusions.
You will be given the user's profile (age, weight, height, activity level, goal) and a list of exclusions. Your task is to generate a complete, suitable, and delicious 7-day Bangladeshi meal plan.
Ensure the new meals are nutritionally balanced and fit the user's goal.
Crucially, you MUST maintain the exact original JSON structure for the entire 7-day plan, including all fields like 'id', 'calories', 'weight', 'isRiceMeal', and 'breakdown'. Estimate the nutritional values accurately.
Return ONLY the JSON object containing the complete, updated 7-day plan.`;
    
    const prompt = `Here is the user's profile: ${JSON.stringify(userProfile)}. Please provide a complete 7-day plan in JSON format. Exclude the following items: ${userProfile.exclusions?.join(', ') || 'None'}.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: weeklyPlanSchema,
            },
        });
        const result = JSON.parse(response.text);
        return result.plan as WeeklyPlan;
    } catch (e) {
        console.error("Error regenerating meal plan:", e);
        throw new Error("Could not update the meal plan. The AI might be busy.");
    }
};
