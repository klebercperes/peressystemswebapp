
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you might want to handle this more gracefully.
  // For this example, we'll throw an error if the API key is not set.
  console.warn("API_KEY environment variable not set. AI Assistant will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const getTroubleshootingSteps = async (problemDescription: string): Promise<string> => {
  if (!API_KEY) {
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
