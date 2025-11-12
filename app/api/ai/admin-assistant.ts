// File: app/api/ai/admin-assistant/route.ts

// Use CommonJS require for the geminiClient since it's a CommonJS module
const { generateResponse } = require('../../../backend/helpers/geminiClient');

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

        // 1. Professional Prompt tayyar karein for admin dashboard help
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

        // 2. AI function ko call karein (Secure server-side call)
        const aiResponse = await generateResponse(prompt);
        
        // 3. Parse the response to extract preview data if present
        let responseText = aiResponse;
        let previewData = null;
        
        if (aiResponse.includes('PREVIEW:')) {
            const parts = aiResponse.split('PREVIEW:');
            responseText = parts[0].trim();
            
            const previewSection = parts[1].trim();
            const titleMatch = previewSection.match(/Title: (.+)/);
            const stepsMatch = previewSection.match(/Steps: (.+)/);
            
            if (titleMatch && stepsMatch) {
                previewData = {
                    title: titleMatch[1].trim(),
                    steps: stepsMatch[1].split('|').map((step: string) => step.trim())
                };
            }
        }

        // 4. Frontend ko response bhej dein
        return new Response(
            JSON.stringify({ 
                response: responseText,
                preview: previewData
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