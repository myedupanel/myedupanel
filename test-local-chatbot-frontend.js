// Test the frontend chatbot logic
const fs = require('fs');

// Extract the knowledge base and getBotResponse function from the ChatBot.tsx file
// This is a simplified version for testing purposes

const knowledgeBase = [
  {
    keywords: ['student', 'add', 'new', 'create'],
    response: 'To add a new student, go to the Students section and click on "Add Student". Fill in all required details and save.',
    preview: {
      title: 'Adding a New Student',
      steps: [
        'Navigate to Students section',
        'Click "Add Student" button',
        'Fill in student details',
        'Upload photo (optional)',
        'Click Save to complete'
      ]
    }
  },
  {
    keywords: ['teacher', 'add', 'new', 'create'],
    response: 'To add a new teacher, go to the Teachers section and click on "Add Teacher". Enter their personal and professional details.',
    preview: {
      title: 'Adding a New Teacher',
      steps: [
        'Navigate to Teachers section',
        'Click "Add Teacher" button',
        'Enter teacher details',
        'Assign subjects and classes',
        'Save the teacher profile'
      ]
    }
  },
  {
    keywords: ['fee', 'payment', 'record', 'add'],
    response: 'To record a fee payment, go to the Fee Counter section. Select the student and enter the payment details.',
    preview: {
      title: 'Recording Fee Payment',
      steps: [
        'Go to Fee Counter section',
        'Search for the student',
        'Select fee type and amount',
        'Enter payment method details',
        'Generate receipt and save'
      ]
    }
  }
];

// Function to find the best matching response (simplified version)
const getBotResponse = (question) => {
  const lowerQuestion = question.toLowerCase();
  
  // Find the best matching response based on keyword matches
  let bestMatch = null;
  let maxMatches = 0;
  
  for (const item of knowledgeBase) {
    let matchCount = 0;
    for (const keyword of item.keywords) {
      if (lowerQuestion.includes(keyword)) {
        matchCount++;
      }
    }
    
    if (matchCount > maxMatches) {
      maxMatches = matchCount;
      bestMatch = item;
    }
  }
  
  // Return the best match or a default response
  if (bestMatch) {
    return {
      response: bestMatch.response,
      preview: bestMatch.preview
    };
  }
  
  // Default response for unmatched queries
  return {
    response: "I can help you with common administrative tasks like adding students, recording fees, and managing teachers. Please ask a specific question."
  };
};

// Test the function
console.log('Testing frontend chatbot logic...\n');

const testQuestions = [
  'How do I add a new student?',
  'What are the steps to record a fee payment?',
  'How can I create a new teacher profile?',
  'How do I generate reports?',
  'What is the weather today?'
];

testQuestions.forEach((question, index) => {
  console.log(`Test ${index + 1}: ${question}`);
  const result = getBotResponse(question);
  console.log(`Response: ${result.response}`);
  if (result.preview) {
    console.log(`Preview: ${result.preview.title}`);
    console.log('Steps:');
    result.preview.steps.forEach((step, i) => {
      console.log(`  ${i + 1}. ${step}`);
    });
  }
  console.log('---\n');
});

console.log('Frontend chatbot logic test completed!');