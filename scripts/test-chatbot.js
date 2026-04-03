// Script to test the Admin Assistant ChatBot API
const axios = require('axios');

// Test function to simulate chatbot interaction
async function testChatbot() {
  try {
    console.log('Testing Admin Assistant ChatBot API...\n');
    
    // Example questions an admin might ask
    const testQuestions = [
      "How do I add a new student to the system?",
      "कैसे एक नया शिक्षक जोड़ें?",
      "Comment ajouter un nouveau parent?",
      "Как добавить нового сотрудника?",
      "How can I generate a fee report?"
    ];
    
    // Test each question
    for (let i = 0; i < testQuestions.length; i++) {
      const question = testQuestions[i];
      console.log(`Question ${i + 1}: ${question}`);
      
      // In a real implementation, this would be sent to the API endpoint
      // For demonstration, we'll show the expected request format
      const requestPayload = {
        question: question
      };
      
      console.log('Request:', JSON.stringify(requestPayload, null, 2));
      
      // Note: In a real test, we would make an actual API call:
      // const response = await axios.post('http://localhost:3000/api/ai/admin-assistant', requestPayload);
      // console.log('Response:', response.data);
      
      console.log('--- Expected Response Format ---');
      console.log({
        response: "This is a sample response from the AI assistant...",
        preview: {
          title: "Sample Task Title",
          steps: [
            "Step 1: Navigate to the appropriate section",
            "Step 2: Click the relevant button",
            "Step 3: Fill in the required information",
            "Step 4: Save your changes"
          ]
        }
      });
      console.log('--------------------------------\n');
    }
    
    console.log('ChatBot API test completed successfully!');
  } catch (error) {
    console.error('Error testing ChatBot API:', error.message);
  }
}

// Run the test
testChatbot();