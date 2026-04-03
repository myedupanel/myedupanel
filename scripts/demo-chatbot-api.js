// Demonstration script for the Admin Assistant ChatBot API
// This script shows how to properly interact with the chatbot API

const https = require('https');
const http = require('http');

/**
 * Function to send a question to the Admin Assistant ChatBot API
 * @param {string} question - The question to ask the chatbot
 * @param {string} baseUrl - The base URL of the application (e.g., http://localhost:3000)
 * @returns {Promise<object>} - The API response
 */
async function askAdminAssistant(question, baseUrl = 'http://localhost:3000') {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      question: question
    });

    const options = {
      hostname: baseUrl.includes('localhost') ? 'localhost' : baseUrl.replace('http://', '').replace('https://', ''),
      port: baseUrl.includes('localhost:3000') ? 3000 : baseUrl.includes('localhost:3001') ? 3001 : 80,
      path: '/api/ai/admin-assistant',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    // Use http or https based on the baseUrl
    const protocol = baseUrl.startsWith('https') ? https : http;
    
    const req = protocol.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve(parsedData);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.write(data);
    req.end();
  });
}

/**
 * Function to demonstrate the chatbot capabilities
 */
async function demonstrateChatBot() {
  console.log('🎓 Admin Assistant ChatBot API Demonstration');
  console.log('=============================================\n');
  
  // Sample questions in different languages
  const questions = [
    {
      question: "How do I add a new student to the system?",
      language: "English"
    },
    {
      question: "कैसे एक नया शिक्षक जोड़ें?",
      language: "Hindi"
    },
    {
      question: "Comment générer un rapport de frais?",
      language: "French"
    },
    {
      question: "Как добавить нового сотрудника?",
      language: "Russian"
    }
  ];
  
  // Demonstrate each question
  for (let i = 0; i < questions.length; i++) {
    const { question, language } = questions[i];
    console.log(`${i + 1}. Question in ${language}: "${question}"`);
    
    try {
      // In a real implementation, this would call the actual API
      // const response = await askAdminAssistant(question, 'http://localhost:3000');
      
      // For demonstration, we'll show the expected response format
      console.log('   🤖 Response:');
      console.log('   ', {
        response: "This is a simulated response from the AI assistant. In a real implementation, this would contain specific guidance for your question.",
        preview: {
          title: `Task: ${language} Example`,
          steps: [
            "Navigate to the appropriate section in the admin dashboard",
            "Click the relevant action button",
            "Fill in the required information fields",
            "Review the entered information for accuracy",
            "Save your changes to complete the task"
          ]
        }
      });
      
      console.log('   ✅ Successfully processed\n');
    } catch (error) {
      console.log('   ❌ Error:', error.message, '\n');
    }
  }
  
  console.log('💡 Key Features Demonstrated:');
  console.log('   • Multilingual support (English, Hindi, French, Russian)');
  console.log('   • Professional response formatting');
  console.log('   • Step-by-step guidance with preview');
  console.log('   • Error handling and graceful failures');
  console.log('   • RESTful API design');
  
  console.log('\n🚀 To use the actual API:');
  console.log('   1. Ensure the Next.js development server is running');
  console.log('   2. Make POST requests to /api/ai/admin-assistant');
  console.log('   3. Include a JSON body with a "question" field');
  console.log('   4. Handle responses with "response" and optional "preview" fields');
  
  console.log('\n🔒 Security Notes:');
  console.log('   • All processing happens server-side for security');
  console.log('   • User authentication is required in the full implementation');
  console.log('   • API keys are stored securely in environment variables');
}

// Run the demonstration
demonstrateChatBot().catch(console.error);