import { GoogleGenAI } from "@google/genai";

export const initializeGemini = async () => {
  // Check if key is selected in the AI Studio environment
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
     const hasKey = await window.aistudio.hasSelectedApiKey();
     if (hasKey) {
       // Create a new instance to ensure we use the latest API key from process.env.API_KEY
       return new GoogleGenAI({ apiKey: process.env.API_KEY });
     }
  }
  return null;
};

export const promptGeminiTutor = async (userPrompt: string): Promise<string> => {
    const client = await initializeGemini();
    
    if (!client) {
        throw new Error("API Key not configured");
    }

    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: "You are an expert GRE Math Tutor. Provide clear, step-by-step explanations for math problems. Keep the tone encouraging and academic. If the user asks for a practice problem, generate a GRE-style quantitative reasoning question.",
            }
        });
        
        return response.text || "I couldn't generate a response. Please try again.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Sorry, I encountered an error contacting the AI Tutor.";
    }
};

// Define global interface for the injected aistudio object
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}