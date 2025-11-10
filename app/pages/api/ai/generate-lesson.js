// File: pages/api/ai/generate-lesson.js (New AI Endpoint)

// Path ko sahi se adjust karein (Aapki file structure ke mutabik)
// Agar aapka backend folder pages ke bahar hai, toh path adjust karna hoga.
const { generateResponse } = require('../../../backend/helpers/geminiClient'); 
// Auth middleware hamesha zaroori hai
// const { authMiddleware, authorize } = require('../../../backend/middleware/authMiddleware'); 

export default async function handler(req, res) {
    // NOTE: Yahan aapko zaroor user authentication (authMiddleware) check lagana chahiye.
    // console.log("User authorized to use AI feature.");

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { topic, gradeLevel } = req.body; // Frontend se data liya
    
    // Input Validation
    if (!topic || !gradeLevel) {
        return res.status(400).json({ message: 'Topic and Grade Level are required.' });
    }

    try {
        // 1. Professional Prompt tayyar karein
        const prompt = `Act as an educational consultant for Grade ${gradeLevel}. Create three creative and differentiated lesson plan objectives for the topic: "${topic}". Present the output as a numbered list, starting each point with a strong verb.`;

        // 2. AI function ko call karein (Secure server-side call)
        const objectives = await generateResponse(prompt);

        // 3. Frontend ko response bhej dein
        res.status(200).json({ objectives: objectives });

    } catch (error) {
        console.error("Lesson Plan API Error:", error);
        res.status(500).json({ message: 'Failed to generate lesson plan ideas.' });
    }
}