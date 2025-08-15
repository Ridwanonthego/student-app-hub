

import { GoogleGenAI, Type } from "@google/genai";
import { Media, GeminiMediaSuggestion, TasteProfile } from './types';
import { getMediaByTitleAndYear } from './services';


// --- Gemini API Service ---

const mediaRecommendationSchema = {
  type: Type.OBJECT,
  properties: {
    media: {
      type: Type.ARRAY,
      description: 'A list of movie or TV series suggestions.',
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'The title of the movie or series.' },
          year: { type: Type.STRING, description: 'The release year of the movie or series.' },
          type: { type: Type.STRING, description: "The type of media, must be either 'movie' or 'tv series'." },
        },
        required: ['title', 'year', 'type'],
      },
    },
  },
  required: ['media'],
};

const formatTasteProfileForAI = (profile: TasteProfile): string => {
    let profileText = "The user has a specific taste profile. Please adhere to it.\n\n";
    if (profile.preferredDescription?.trim()) {
        profileText += `- They describe their general taste as: "${profile.preferredDescription.trim()}". Prioritize this description.\n`;
    }
    if (profile.favoriteGenres?.length > 0) {
        profileText += `- They LOVE these genres: ${profile.favoriteGenres.join(', ')}.\n`;
    }
    if (profile.excludedGenres?.length > 0) {
        profileText += `- They HATE these genres: ${profile.excludedGenres.join(', ')}.\n`;
    }
    if (profile.favoriteActors?.length > 0) {
        profileText += `- They are fans of these actors/directors: ${profile.favoriteActors.join(', ')}.\n`;
    }
    if (profile.favoriteKeywords?.length > 0) {
        profileText += `- They are looking for content with these themes/keywords: ${profile.favoriteKeywords.join(', ')}.\n`;
    }
    if (profile.preferredDecades?.length > 0) {
        profileText += `- They prefer content from these decades: ${profile.preferredDecades.join(', ')}.\n`;
    }
    if (profile.likedItems?.length > 0) {
        profileText += `- They LIKED these specific movies/shows, so find similar ones: ${profile.likedItems.map(i => i.title).join(', ')}.\n`;
    }
    if (profile.dislikedItems?.length > 0) {
        profileText += `- They DISLIKED these specific movies/shows, so avoid similar ones: ${profile.dislikedItems.map(i => i.title).join(', ')}.\n`;
    }
    return profileText.trim() ? profileText : "";
};

export const getMediaRecommendationsFromAI = async (prompt: string, tasteProfile: TasteProfile | undefined, apiKey: string): Promise<Media[]> => {
  if (!apiKey) {
    throw new Error("API key is not configured.");
  }
  
  const ai = new GoogleGenAI({ apiKey });

  try {
    const systemInstruction = `You are a movie and TV series detective. Your goal is to identify and recommend movies, TV series, or anime based on the user's request. The request could be a direct query, a mood, a genre, or even a vague plot description. If the user provides a taste profile, you MUST use it to refine your suggestions. For each item you find, provide its title, original release year, and its type ('movie' or 'tv series'). Return ONLY the JSON object with the media list, nothing else.`;
    
    let contents = `Based on the following request, suggest some movies or TV series. Request: "${prompt}"`;
    if (tasteProfile) {
        const profileString = formatTasteProfileForAI(tasteProfile);
        if (profileString) {
            contents = `Given the user's taste profile:\n${profileString}\n\nNow, based on the following new request, suggest some movies or TV series. Request: "${prompt}"`;
        }
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: mediaRecommendationSchema,
      },
    });

    const jsonText = response.text;
    const aiResponse: { media: GeminiMediaSuggestion[] } = JSON.parse(jsonText);
    
    if (!aiResponse.media || aiResponse.media.length === 0) {
        return [];
    }

    const mediaPromises = aiResponse.media.slice(0, 5).map(suggestion => getMediaByTitleAndYear(suggestion.title, suggestion.year, suggestion.type));
    const mediaItems = (await Promise.all(mediaPromises)).filter((item): item is Media => item !== null);

    return mediaItems;

  } catch (error) {
    console.error("Error getting recommendations from AI:", error);
    if (error instanceof Error && (error.message.includes('API_KEY_INVALID') || error.message.includes('API key not valid'))) {
      throw new Error("The provided Gemini API Key is invalid. Please check it.");
    }
    if (error instanceof Error && error.message.includes('SAFETY')) {
        throw new Error("The request was blocked for safety reasons. Please modify your prompt.");
    }
    throw new Error("The AI assistant is currently unavailable. Please check your network or API key.");
  }
};

export const getFavoritesFromAI = async (tasteProfile: TasteProfile, apiKey: string): Promise<Media[]> => {
    if (!apiKey) throw new Error("API key not configured.");
    const ai = new GoogleGenAI({ apiKey });
    
    try {
        const systemInstruction = `You are a movie and TV series expert. Based on the user's detailed taste profile, provide a list of 5 highly personalized recommendations. For each item, provide its title, original release year, and its type ('movie' or 'tv series'). Return ONLY the JSON object.`;
        
        const profileString = formatTasteProfileForAI(tasteProfile);
        if (!profileString.trim() || Object.values(tasteProfile).every(v => Array.isArray(v) ? v.length === 0 : !v)) return [];

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Here is the user's taste profile:\n${profileString}\nPlease provide 5 recommendations.`,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: mediaRecommendationSchema,
            },
        });

        const jsonText = response.text;
        const aiResponse: { media: GeminiMediaSuggestion[] } = JSON.parse(jsonText);
        
        if (!aiResponse.media || aiResponse.media.length === 0) return [];
        
        const mediaPromises = aiResponse.media.slice(0, 5).map(suggestion => getMediaByTitleAndYear(suggestion.title, suggestion.year, suggestion.type));
        const mediaItems = (await Promise.all(mediaPromises)).filter((item): item is Media => item !== null);
        
        return mediaItems;

    } catch(error) {
        console.error("Error getting favorite recommendations from AI:", error);
        return [];
    }
}
