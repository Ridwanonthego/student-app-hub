import { GoogleGenAI, Type } from "@google/genai";
import { CvData, CvStyle, ColorTheme, CvRating } from './types';

const cvGenerationSchema = {
    type: Type.OBJECT,
    properties: {
        personName: {
            type: Type.STRING,
            description: "The full name of the person extracted from the text."
        },
        cvHtml: {
            type: Type.STRING,
            description: "The full HTML code for the generated CV, styled with inline CSS and Tailwind classes."
        }
    },
    required: ['personName', 'cvHtml']
};

export const generateCvWithAI = async (
    rawInfo: string,
    style: CvStyle,
    color: ColorTheme,
    apiKey: string,
    imageUrl?: string
): Promise<CvData> => {
    if (!apiKey) {
        throw new Error("API key is not configured.");
    }
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `
You are an AI CV Architect. Your task is to convert raw, unstructured text into a professional, well-designed CV.
The user will provide a 'brain dump' of their information. You must parse this, extract relevant details (contact info, summary, experience, education, skills), and discard irrelevant noise (like LinkedIn UI text).
Proactively enhance sparse content to ensure a complete, professional result. For example, if a summary is missing, generate one based on the experience provided.

You MUST return a JSON object with two keys: "personName" (the person's full name) and "cvHtml" (the complete, styled HTML for the CV).
The CV HTML should be a single block of code, using Tailwind CSS classes for structure and layout. ALL styling (colors, fonts, etc.) MUST be applied using inline 'style' attributes.

**CV Requirements:**
1.  **Style:** Apply the "${style}" style.
    *   'Modern': Clean, sans-serif fonts (like Inter, Helvetica), two-column layout.
    *   'Classic': Serif fonts (like Garamond, Times New Roman), single-column layout, more traditional.
    *   'Creative': Asymmetrical layout, unique fonts, more visual flair.
2.  **Color Theme:** Use the "${color}" theme. Apply this color to headers, links, and other accent elements.
3.  **Profile Image:** If a URL is provided, include an '<img>' tag for it: ${imageUrl || 'Not provided'}.
4.  **Skills:** Represent skills as distinct "pills" or tags. Each skill pill must have the class "skill-pill".
5.  **Structure:** The HTML must be well-formed and contained within a single parent '<div>'. Do not include '<html>' or '<body>' tags.
`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Here is the user's brain dump: "${rawInfo}"`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: cvGenerationSchema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating CV:", error);
        if (error instanceof Error && (error.message.includes('API_KEY_INVALID') || error.message.includes('API key not valid'))) {
          throw new Error("The provided Gemini API Key is invalid.");
        }
        throw new Error("The AI failed to generate the CV. It might be due to an invalid request or a temporary service issue.");
    }
};

const cvRefinementSchema = {
    type: Type.OBJECT,
    properties: {
        cvHtml: {
            type: Type.STRING,
            description: "The full, updated HTML code for the refined CV."
        }
    },
    required: ['cvHtml']
};

export const refineCvWithAI = async (
    currentCvHtml: string,
    refinePrompt: string,
    apiKey: string,
): Promise<{ cvHtml: string }> => {
    if (!apiKey) {
        throw new Error("API key is not configured.");
    }
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `
You are an AI CV Editor. Your task is to refine an existing CV based on a user's request.
You will be given the current CV's HTML and a prompt for changes.
You MUST analyze the existing HTML structure, including Tailwind classes and inline styles, and apply the user's changes intelligently while preserving the overall design.
For example, if the user asks to "change the theme to blue," you must find all the accent color styles in the HTML and replace them with an appropriate shade of blue.
If the user asks to "make the summary more concise," you must rewrite the summary section without altering the rest of the document's HTML structure.

**Strict Output Requirement:**
You MUST return a JSON object with a single key: "cvHtml". The value should be the complete, updated HTML for the CV. Do not include any other text, explanations, or properties.
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Current CV HTML:\n\`\`\`html\n${currentCvHtml}\n\`\`\`\n\nUser's refine request: "${refinePrompt}"`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: cvRefinementSchema,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error refining CV:", error);
        if (error instanceof Error && (error.message.includes('API_KEY_INVALID') || error.message.includes('API key not valid'))) {
            throw new Error("The provided Gemini API Key is invalid.");
        }
        throw new Error("The AI failed to refine the CV.");
    }
};

export const cleanAndFormatText = async (rawText: string, apiKey: string): Promise<string> => {
    if (!apiKey) throw new Error("API key is not configured.");
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `You are a text formatting expert. A user has pasted a 'brain dump' of their career information. Your task is to clean it up, organize it into logical sections (like 'Contact', 'Summary', 'Experience', 'Education', 'Skills', 'Projects'), and format it nicely with clear headings and bullet points. Discard any irrelevant text (e.g., social media UI elements, ads, navigation links). The output should be clean, readable, formatted text, not a CV. Just the organized information.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Clean and format this text:\n\n---\n${rawText}\n---`,
        config: { systemInstruction }
    });
    return response.text;
};

const cvRatingSchema = {
    type: Type.OBJECT,
    properties: {
        score: { type: Type.NUMBER, description: "A rating from 1 to 10 for the CV's effectiveness." },
        feedback: { type: Type.STRING, description: "One paragraph of overall constructive feedback." },
        pros: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 3 strengths of the CV." },
        cons: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 3 areas for improvement." }
    },
    required: ["score", "feedback", "pros", "cons"]
};

export const rateCv = async (cvHtml: string, apiKey: string): Promise<CvRating> => {
    if (!apiKey) throw new Error("API key is not configured.");
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `You are an expert HR manager and CV analyst. You will be given the HTML of a CV. Analyze it based on content, structure, and clarity. Provide a score out of 10, overall feedback, 3 pros, and 3 cons. Return ONLY the JSON object.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Please rate this CV:\n\n---\n${cvHtml}\n---`,
        config: { 
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: cvRatingSchema
        }
    });
    return JSON.parse(response.text.trim()) as CvRating;
};

export const importAndFormatLinkedIn = async (url: string, apiKey: string): Promise<string> => {
    if (!apiKey) throw new Error("API key is not configured.");
    
    // This is a MOCK of scraped text. Direct scraping is not feasible on the client-side.
    const mockScrapedText = `
        John Doe. 3rd+ degree connection. Message. Follow.
        Senior Software Engineer at Google.
        Mountain View, California.
        About
        I'm a passionate software engineer with over 10 years of experience building scalable web applications. My expertise lies in front-end development with React and backend services with Node.js.
        Experience
        - Google, Senior Software Engineer, Jan 2020 - Present. Led the development of the new Google Photos interface.
        - Facebook, Software Engineer, Jun 2016 - Dec 2019. Worked on the Messenger team.
        Education
        - Stanford University, M.S. in Computer Science, 2014 - 2016.
        - University of California, Berkeley, B.S. in Electrical Engineering & Computer Sciences, 2010 - 2014.
        Skills
        - React.js, Node.js, TypeScript, Python, Google Cloud Platform (GCP).
    `;

    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `You are a text formatting expert. A user has provided text that was scraped from a LinkedIn profile. Your task is to clean this text, removing all UI elements (like 'Message', 'Follow', '3rd+ degree connection', etc.) and organizing the valuable information into logical sections (like 'Contact', 'Summary', 'Experience', 'Education', 'Skills'). The output should be clean, readable, formatted text ready to be used as a 'brain dump' for a CV generator.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Clean and format this scraped LinkedIn text:\n\n---\n${mockScrapedText}\n---`,
        config: { systemInstruction }
    });
    return response.text;
};
