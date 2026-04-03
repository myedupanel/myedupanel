const axios = require('axios');

async function testChatbotEndpoint() {
  try {
    console.log('Testing Admin Assistant ChatBot API endpoint...\n');
    
    // Test request to the chatbot API
    const response = await axios.post('http://localhost:3000/api/ai/admin-assistant', {
      question: 'How do I add a new student?'
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
      console.log('Headers:', error.response.headers);
    } else if (error.request) {
      console.log('No response received');
      console.log('Request:', error.request);
    } else {
      console.log('Message:', error.message);
    }
  }
}

testChatbotEndpoint();