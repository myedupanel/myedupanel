// File: app/api/ai/admin-assistant/route.ts

// Fallback implementation for local chatbot functionality
// This provides the same interface as the AI version but uses local knowledge base

// Knowledge base for the chatbot (same as in the frontend component)
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
  },
  {
    keywords: ['timetable', 'schedule', 'class'],
    response: 'To create or modify a timetable, navigate to the Timetable section. You can assign teachers to periods and manage class schedules.',
    preview: {
      title: 'Managing Timetable',
      steps: [
        'Go to Timetable section',
        'Select class or teacher',
        'Drag and drop to assign periods',
        'Set subject for each period',
        'Save the timetable'
      ]
    }
  },
  {
    keywords: ['academic year', 'new', 'create'],
    response: 'To create a new academic year, go to Academic Years section and click "Add New Year". Set the start and end dates.',
    preview: {
      title: 'Creating Academic Year',
      steps: [
        'Navigate to Academic Years',
        'Click "Add New Year"',
        'Set start and end dates',
        'Configure academic parameters',
        'Activate the new academic year'
      ]
    }
  },
  {
    keywords: ['report', 'generate', 'view'],
    response: 'To generate reports, go to the Reports section. You can create various reports like student performance, fee collection, and attendance.',
    preview: {
      title: 'Generating Reports',
      steps: [
        'Go to Reports section',
        'Select report type',
        'Set date range and filters',
        'Click Generate Report',
        'Download or print the report'
      ]
    }
  },
  {
    keywords: ['attendance', 'mark', 'record'],
    response: 'To mark attendance, go to the Attendance section. Select the class and date, then mark each student as present or absent.',
    preview: {
      title: 'Marking Attendance',
      steps: [
        'Navigate to Attendance section',
        'Select class and date',
        'Mark students present/absent',
        'Add remarks if needed',
        'Save attendance records'
      ]
    }
  },
  {
    keywords: ['parent', 'guardian', 'add'],
    response: 'To add a parent or guardian, go to the Parents section and click "Add Parent". Link them to students after creating their profile.',
    preview: {
      title: 'Adding Parent/Guardian',
      steps: [
        'Go to Parents section',
        'Click "Add Parent" button',
        'Enter parent details',
        'Link to student profile',
        'Save parent information'
      ]
    }
  },
  {
    keywords: ['staff', 'employee', 'add'],
    response: 'To add administrative staff, go to the Staff section and click "Add Staff". Enter their employment details and access permissions.',
    preview: {
      title: 'Adding Staff Member',
      steps: [
        'Navigate to Staff section',
        'Click "Add Staff" button',
        'Enter employment details',
        'Set access permissions',
        'Save staff profile'
      ]
    }
  },
  {
    keywords: ['settings', 'configure', 'setup'],
    response: 'To configure system settings, go to the Settings section. You can customize school information, academic parameters, and user permissions.',
    preview: {
      title: 'System Configuration',
      steps: [
        'Go to Settings section',
        'Select configuration category',
        'Modify required settings',
        'Save changes',
        'Verify updated settings'
      ]
    }
  }
];

// Function to find the best matching response
const getBotResponse = (question: string): { response: string; preview?: { title: string; steps: string[] } } => {
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
  
  // Default responses for unmatched queries
  const defaultResponses = [
    "I can help you with common administrative tasks like adding students, recording fees, managing timetables, and more. Please ask a specific question.",
    "I'm here to assist with school administration tasks. You can ask about students, teachers, fees, timetables, attendance, and reports.",
    "For best results, please ask specific questions about administrative tasks. For example: 'How do I add a new student?' or 'How to record fee payment?'",
    "I specialize in educational administration. You can ask me about managing students, teachers, fees, academic years, and other school operations."
  ];
  
  const randomResponse = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  
  return {
    response: randomResponse
  };
};

// Handle POST requests
export async function POST(request: Request) {
  try {
    const { question } = await request.json();
    
    // Input Validation
    if (!question) {
      return new Response(
        JSON.stringify({ message: 'Question is required.' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get response from local knowledge base
    const botResponse = getBotResponse(question);

    // Return the response in the same format as the AI version
    return new Response(
      JSON.stringify({ 
        response: botResponse.response,
        preview: botResponse.preview
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error("Admin Assistant API Error:", error);
    return new Response(
      JSON.stringify({ message: 'Failed to generate response.' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}