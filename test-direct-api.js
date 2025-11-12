// Test script to directly call the Gemini API
const axios = require('axios');

async function testDirectAPI() {
  console.log('Testing direct API call...');
  
  try {
    // Load the API key from environment variables
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.log('GEMINI_API_KEY is not set in environment variables');
      return;
    }
    
    console.log('API Key found, testing direct API call...');
    
    // Try different API versions and models
    const endpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent?key=${GEMINI_API_KEY}`
    ];
    
    for (const url of endpoints) {
      try {
        console.log(`Trying endpoint: ${url}`);
        
        const payload = {
          contents: [{
            parts: [{
              text: "Say hello in one word"
            }]
          }]
        };
        
        const response = await axios.post(url, payload, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Direct API call successful!');
        console.log('Response:', response.data);
        return; // Exit if successful
      } catch (error) {
        console.error(`Error with endpoint ${url}:`, error.response?.data || error.message);
      }
    }
    
    console.log('All endpoints failed. The API key may be invalid or there may be configuration issues.');
    
  } catch (error) {
    console.error('Error testing direct API:', error.message);
  }
}

// Load environment variables
require('dotenv').config();

testDirectAPI();