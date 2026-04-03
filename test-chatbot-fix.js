// Test script to verify the chatbot fix
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testChatbot() {
  console.log('Testing chatbot fix...');
  
  // Test the Gemini client
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.log('GEMINI_API_KEY is not set');
      return;
    }
    
    const ai = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Try with a known working model
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash-001" });
    const result = await model.generateContent('How to add friends?');
    console.log('Response from Gemini:', result.response.text());
  } catch (error) {
    console.error('Error testing Gemini client:', error);
    
    // Try with an alternative model
    try {
      console.log('Trying alternative model...');
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
      const ai = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = ai.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent('How to add friends?');
      console.log('Response from Gemini (alternative model):', result.response.text());
    } catch (error2) {
      console.error('Error with alternative model:', error2);
    }
  }
}

testChatbot();