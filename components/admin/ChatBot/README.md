# Admin Assistant ChatBot

A professional self-contained chatbot for the admin dashboard with multilingual support, voice input/output, and step-by-step guidance - no external API required.

## Features

- **Multilingual Support**: Responds in the same language as the user's question
- **Voice Input**: Speak questions using the microphone button
- **Voice Output**: Bot speaks responses using text-to-speech
- **Step-by-Step Guidance**: Provides actionable steps for admin tasks
- **Professional UI**: Futuristic animated robot interface
- **Contextual Previews**: Shows visual step previews for complex tasks
- **Admin-Only Access**: Only available to authenticated admin users
- **No External Dependencies**: Works completely offline with local knowledge base

## How It Works

1. Click the floating chat icon in the bottom-right corner of the admin dashboard
2. Type or speak your question about admin tasks
3. The assistant provides a detailed response with steps from its local knowledge base
4. For applicable tasks, a preview section shows visual steps
5. The bot can speak the response aloud for hands-free operation
6. Say "bye" to close the chat window

## Technical Implementation

- Self-contained rule-based system with local knowledge base
- Leverages Web Speech API for voice recognition and synthesis
- Built with React and TypeScript
- Fully responsive design
- No external API dependencies

## API Endpoints

- `/api/ai/admin-assistant` - Local endpoint for processing admin questions (no external AI)

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

For questions outside these domains, the bot will provide helpful guidance on what it can assist with.