# Admin Assistant ChatBot

A professional AI-powered chatbot for the admin dashboard with multilingual support, voice input/output, and step-by-step guidance.

## Features

- **Multilingual Support**: Responds in the same language as the user's question
- **Voice Input**: Speak questions using the microphone button
- **Voice Output**: Bot speaks responses using text-to-speech
- **Step-by-Step Guidance**: Provides actionable steps for admin tasks
- **Professional UI**: Futuristic animated robot interface
- **Contextual Previews**: Shows visual step previews for complex tasks
- **Admin-Only Access**: Only available to authenticated admin users

## How It Works

1. Click the floating chat icon in the bottom-right corner of the admin dashboard
2. Type or speak your question about admin tasks
3. The AI assistant provides a detailed response with steps
4. For applicable tasks, a preview section shows visual steps
5. The bot can speak the response aloud for hands-free operation
6. Say "bye" to close the chat window

## Technical Implementation

- Uses Google Gemini AI for natural language processing
- Leverages Web Speech API for voice recognition and synthesis
- Built with React and TypeScript
- Fully responsive design
- Secure server-side API implementation

## API Endpoints

- `/api/ai/admin-assistant` - Main endpoint for processing admin questions

## Supported Admin Tasks

- Student management (add, edit, view)
- Teacher management
- Class and timetable management
- Fee and payment processing
- Academic year operations
- Staff management
- Parent portal management
- Report generation
- System settings

For questions outside these domains, the bot will politely indicate it can only help with admin tasks.