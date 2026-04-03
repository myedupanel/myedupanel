// Test script to verify the new Gemini API key
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiKey() {
  console.log('Testing new Gemini API key...');
  
  try {
    // Load the API key from environment variables
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.log('GEMINI_API_KEY is not set in environment variables');
      return;
    }
    
    console.log('API Key found, testing connection...');
    console.log('Key length:', GEMINI_API_KEY.length);
    console.log('Key starts with:', GEMINI_API_KEY.substring(0, 10) + '...');
    
    // Initialize the Google Generative AI client
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Try a very simple model that should be available
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = "Say hello in one word";
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Success! Gemini API is working correctly.');
    console.log('Response:', text);
    
  } catch (error) {
    console.error('Error testing Gemini API:', error.message);
    console.log('Full error:', error);
    
    // Check if it's an authentication error
    if (error.message && error.message.includes('API_KEY_INVALID')) {
      console.log('The API key appears to be invalid. Please check the key and try again.');
    } else if (error.message && error.message.includes('404')) {
      console.log('Model not found. This might be due to region restrictions or model availability.');
    } else {
      console.log('There might be network connectivity issues or API restrictions.');
    }
  }
}

// Load environment variables
require('dotenv').config();

testGeminiKey();