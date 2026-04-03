// File: app/api/ai/generate-lesson/route.ts

// Use dynamic import to avoid module resolution issues
let generateResponse: any;

async function initializeGeminiClient() {
  if (!generateResponse) {
    const geminiClient = await import('../../../../backend/helpers/geminiClient');
    generateResponse = geminiClient.generateResponse;
  }
  return generateResponse;
}

// Handle POST requests
export async function POST(request: Request) {
  try {
    // Initialize the Gemini client
    await initializeGeminiClient();
    
    const { topic, gradeLevel } = await request.json();
    
    // Input Validation
    if (!topic || !gradeLevel) {
      return new Response(
        JSON.stringify({ message: 'Topic and Grade Level are required.' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 1. Professional Prompt tayyar karein
    const prompt = `Act as an educational consultant for Grade ${gradeLevel}. Create three creative and differentiated lesson plan objectives for the topic: "${topic}". Present the output as a numbered list, starting each point with a strong verb.`;

    // 2. AI function ko call karein (Secure server-side call)
    const objectives = await generateResponse(prompt);

    // 3. Frontend ko response bhej dein
    return new Response(
      JSON.stringify({ objectives: objectives }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error("Lesson Plan API Error:", error);
    return new Response(
      JSON.stringify({ message: 'Failed to generate lesson plan ideas.' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}