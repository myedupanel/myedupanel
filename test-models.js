// Test script to list available models
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  console.log('Listing available models...');
  
  try {
    // Load the API key from environment variables
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.log('GEMINI_API_KEY is not set in environment variables');
      return;
    }
    
    console.log('API Key found, initializing client...');
    
    // Initialize the Google Generative AI client
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Note: The listModels method may not be available in all versions
    // Let's try a different approach by directly testing a known model
    
    console.log('Testing with gemini-1.5-flash...');
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      // Try to get model info (this might not work in all versions)
      console.log('Model initialized successfully');
      
      // Try to generate content
      const result = await model.generateContent("Hello, what models are you?");
      console.log('Response:', await result.response.text());
    } catch (error) {
      console.error('Error with gemini-1.5-flash:', error.message);
    }
    
  } catch (error) {
    console.error('Error initializing GoogleGenerativeAI:', error.message);
  }
}

// Load environment variables
require('dotenv').config();

listModels();