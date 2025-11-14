
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || import.meta.env.VITE_GEMINI_API_KEY;

// Lazy initialization - only create AI instance when needed and when API key exists
let aiInstance: GoogleGenAI | null = null;

const getAIInstance = (): GoogleGenAI | null => {
  if (!API_KEY) {
    return null;
  }
  if (!aiInstance) {
    try {
      aiInstance = new GoogleGenAI({ apiKey: API_KEY });
    } catch (error) {
      console.error("Failed to initialize GoogleGenAI:", error);
      return null;
    }
  }
  return aiInstance;
};

export const getTroubleshootingSteps = async (problemDescription: string): Promise<string> => {
  if (!API_KEY) {
    console.warn("API_KEY environment variable not set. AI Assistant will not work.");
    return Promise.resolve("AI Assistant is not available. Please configure the API Key in your environment variables.");
  }

  const ai = getAIInstance();
  if (!ai) {
    return Promise.resolve("AI Assistant is not available. Please configure the API Key.");
  }

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
        As an expert IT support technician, provide clear, step-by-step troubleshooting advice for the following problem.
        Format the response in Markdown. Use headings, bold text, and numbered lists to make it easy to follow.
        Do not include any preamble or sign-off, just the troubleshooting steps.

        Problem: "${problemDescription}"
        `,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Sorry, I encountered an error while trying to generate a solution. Please check the console for details.";
  }
};
