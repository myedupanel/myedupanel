// File: backend/helpers/geminiClient.js

// Load environment variables explicitly for server-side execution
if (typeof process.env.NODE_ENV === 'undefined' || process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// 1. Zaroori SDK import karein
const { GoogleGenAI } = require('@google/genai');

// 2. API Key ko Environment Variable se load karein (Secure!)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

// 3. Client ka instance banayein
let ai;
if (GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
} else {
    // Agar key nahi mili, toh server ko fail nahi karenge, bas AI function ko disable kar denge
    console.error("CRITICAL: GEMINI_API_KEY is missing. AI features will be disabled.");
    ai = null; 
}

const MODEL_NAME = "gemini-2.5-flash"; // Fast and reliable model

/**
 * AI se response generate karne ka main function.
 * @param {string} prompt - Aapka sawal.
 */
async function generateResponse(prompt) {
    if (!ai) return "AI Service is disabled due to missing API Key.";
    if (!prompt) return "Error: Prompt missing.";
    
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
        });
        // Sirf clean text response return karein
        return response.text; 

    } catch (error) {
        console.error("❌ Gemini API Call Failed:", error);
        return "Sorry, I couldn't generate a summary right now.";
    }
}

module.exports = { 
    generateResponse 
};