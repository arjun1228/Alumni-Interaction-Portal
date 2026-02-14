import { GoogleGenAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const sendMessageToMentor = async (message: string) => {
  try {
    if (!API_KEY) {
      console.warn("API Key is missing.");
      return "I'm currently running in demo mode without an API connection. Please configure the API_KEY to enable live AI responses.";
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: "You are an expert AI Career Mentor for a university alumni portal. Your goal is to help students and graduates with career development.\n\nKey Responsibilities:\n1. Resume Review: If a user pastes a resume, analyze it for clarity, impact, and keywords. Suggest improvements.\n2. Interview Prep: Conduct mock interviews or provide common questions for specific roles (e.g., Software Engineer, PM).\n3. Skill Gaps: Recommend skills based on current market trends.\n4. Tone: Encouraging, professional, and concise.\n\nAlways tailor your advice to the user's context if provided.",
      }
    });

    return response.text || "I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "I'm having a bit of trouble connecting to the career database. Please check your internet connection or verify the API key.";
  }
};