// Test script that simulates the frontend chatbot API call
const axios = require('axios');

// Create an axios instance that mimics the frontend api.ts utility
const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// Add a request interceptor that mimics the frontend behavior
api.interceptors.request.use(
  (config) => {
    // Add '/api' prefix to the request URL if it's not already there.
    const needsApiPrefix = !config.url?.startsWith('/api');
    if (needsApiPrefix && config.url) {
      config.url = `/api${config.url}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

async function testFrontendChatbot() {
  try {
    console.log('Testing Frontend ChatBot API Call Simulation...\n');
    
    // This is what the frontend ChatBot.tsx component is doing
    const response = await api.post('/ai/admin-assistant', {
      question: 'How do I add a new teacher?'
    });
    
    console.log('✅ API Response:');
    console.log('Status:', response.status);
    console.log('Response:', response.data.response);
    console.log('Preview:', response.data.preview);
    
  } catch (error) {
    console.log('❌ API Error:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else if (error.request) {
      console.log('No response received');
      console.log('Request:', error.request);
    } else {
      console.log('Message:', error.message);
    }
  }
}

testFrontendChatbot();