// Simple test for Gemini client
const { generateResponse } = require('./backend/helpers/geminiClient');

async function test() {
  console.log('Testing Gemini client...');
  try {
    const response = await generateResponse('Say hello in one word');
    console.log('Response:', response);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

require('dotenv').config();
test();