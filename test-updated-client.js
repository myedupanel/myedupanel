// Test the chatbot API endpoint with updated Gemini client
const { generateResponse } = require('./backend/helpers/geminiClient');

async function testChatbotAPI() {
  console.log('Testing chatbot API endpoint with updated Gemini client...');
  
  try {
    // Simulate the same question that was causing the issue
    const question = "how to add friends";
    
    // This is the prompt that would be sent to the AI
    const prompt = `You are a professional educational administration assistant AI. The user is an admin of a school management system. They are asking: "${question}"

Please provide a helpful, detailed response in the same language as the question. Your response should be:
1. Professional and clear
2. Specific to school administration tasks
3. Step-by-step instructions when applicable
4. If the question is about a specific admin task, include a preview section with:
   - A title for the task
   - 3-5 clear steps to accomplish it

Format your response as follows:
- Main response as plain text
- If applicable, add a "PREVIEW:" line followed by "Title: [task title]" and "Steps: [step1|step2|step3...]"

Example:
To add a new student, go to the Students section and click on "Add Student". Fill in all required details and save.
PREVIEW:
Title: Adding a New Student
Steps: Navigate to Students > Click "Add Student" > Fill student details > Upload photo (optional) > Click Save

If the question is outside the scope of school administration, politely respond that you can only help with admin tasks.

Question: ${question}`;
    
    console.log('Sending prompt to AI...');
    const response = await generateResponse(prompt);
    console.log('AI Response:', response);
    
  } catch (error) {
    console.error('Error testing chatbot API:', error);
  }
}

require('dotenv').config();
testChatbotAPI();