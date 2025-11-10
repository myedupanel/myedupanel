// test-gemini.js

// 1. .env file se key load karein (Agar aap Next.js use nahi kar rahe toh zaroori)
// Note: Agar aap Next.js use kar rahe hain, toh yeh line optional ho sakti hai, 
// lekin alag se test file chalane ke liye better hai.
require('dotenv').config();

// 2. Google GenAI SDK import karein
const { GoogleGenAI } = require('@google/genai');

// 3. API key ko Environment Variable se load karein
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  // Agar key nahi mili, toh error aayega
  throw new Error("GEMINI_API_KEY environment variable set nahi hai. Kripya .env file check karein.");
}

// 4. Client initialize karein
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

async function runTest() {
  try {
    console.log("Connecting to Gemini Pro...");
    
    // Model se simple query
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Lightest aur fastest model for testing
      contents: "Explain the main benefit of using environment variables in 1 short sentence.",
    });

    console.log("------------------------------------------");
    console.log("Response Received successfully! ✅");
    console.log("------------------------------------------");
    console.log("Model Output:", response.text);
    console.log("------------------------------------------");

  } catch (error) {
    console.error("❌ Gemini connection failed! Details:", error);
    if (error.message.includes('API_KEY_INVALID')) {
        console.error("💡 TIP: Aapki API key galat ho sakti hai. Kripya .env file mein key check karein.");
    }
  }
}

runTest();