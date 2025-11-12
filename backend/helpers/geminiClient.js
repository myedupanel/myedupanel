// File: backend/helpers/geminiClient.js

// Load environment variables explicitly for server-side execution
if (typeof process.env.NODE_ENV === 'undefined' || process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// 1. Zaroori SDK import karein
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 2. API Key ko Environment Variable se load karein (Secure!)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

// 3. Client ka instance banayein
let ai;
if (GEMINI_API_KEY) {
    ai = new GoogleGenerativeAI(GEMINI_API_KEY);
} else {
    // Agar key nahi mili, toh server ko fail nahi karenge, bas AI function ko disable kar denge
    console.error("CRITICAL: GEMINI_API_KEY is missing. AI features will be disabled.");
    ai = null; 
}

const MODEL_NAME = "gemini-1.5-flash"; // Using the correct model name

/**
 * AI se response generate karne ka main function.
 * @param {string} prompt - Aapka sawal.
 */
async function generateResponse(prompt) {
    if (!ai) return "AI Service is disabled due to missing API Key.";
    if (!prompt) return "Error: Prompt missing.";
    
    try {
        const model = ai.getGenerativeModel({ model: MODEL_NAME });
        const result = await model.generateContent(prompt);
        // Sirf clean text response return karein
        return result.response.text(); 

    } catch (error) {
        console.error("❌ Gemini API Call Failed:", error);
        // Return a default response to prevent the "Service not found" error
        return "I can help you with educational administration tasks. For example, you can ask about adding students, managing fees, or creating timetables.";
    }
}

module.exports = { 
    generateResponse 
};