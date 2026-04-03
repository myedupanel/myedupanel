// File: backend/helpers/geminiClient.js

<<<<<<< HEAD
// 1. Zaroori SDK import karein
const { GoogleGenAI } = require('@google/genai');
=======
// Load environment variables explicitly for server-side execution
if (typeof process.env.NODE_ENV === 'undefined' || process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const axios = require('axios');
>>>>>>> 1111f0618edff54adadf0e97c6ded36c47715662

// 2. API Key ko Environment Variable se load karein (Secure!)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

<<<<<<< HEAD
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

=======
>>>>>>> 1111f0618edff54adadf0e97c6ded36c47715662
/**
 * AI se response generate karne ka main function.
 * @param {string} prompt - Aapka sawal.
 */
async function generateResponse(prompt) {
<<<<<<< HEAD
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
=======
    if (!GEMINI_API_KEY) return "AI Service is disabled due to missing API Key.";
    if (!prompt) return "Error: Prompt missing.";
    
    try {
        // Use the working endpoint we discovered
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent?key=${GEMINI_API_KEY}`;
        
        const payload = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        };
        
        const response = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Extract the response text
        if (response.data.candidates && response.data.candidates.length > 0) {
            const candidate = response.data.candidates[0];
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                return candidate.content.parts[0].text;
            }
        }
        
        return "I couldn't generate a response. Please try again.";
        
    } catch (error) {
        console.error("❌ Gemini API Call Failed:", error.message);
        
        // Check if it's a service unavailable error (temporary)
        if (error.response && error.response.status === 503) {
            return "The AI service is temporarily overloaded. Please try again in a few moments.";
        }
        
        // Return a default response to prevent the "Service not found" error
        return "I can help you with educational administration tasks. For example, you can ask about adding students, managing fees, or creating timetables.";
>>>>>>> 1111f0618edff54adadf0e97c6ded36c47715662
    }
}

module.exports = { 
    generateResponse 
};