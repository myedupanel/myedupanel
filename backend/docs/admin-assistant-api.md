# Admin Assistant API Documentation

## Overview
The Admin Assistant API provides AI-powered responses to administrative questions within the school management system. It uses Google's Gemini AI to generate professional, context-aware responses with step-by-step guidance.

## Endpoint
```
POST /api/ai/admin-assistant
```

## Request Format
```json
{
  "question": "string"
}
```

## Response Format
```json
{
  "response": "string",
  "preview": {
    "title": "string",
    "steps": ["string", "string", "string"]
  }
}
```

## Example Request
```json
{
  "question": "How do I add a new student to the system?"
}
```

## Example Response
```json
{
  "response": "To add a new student, navigate to the Students section in the admin dashboard and click on the 'Add Student' button. Fill in all the required details including personal information, academic details, and parent information. You can also upload a photo if needed. Once all details are filled, click the 'Save' button to add the student to the system.",
  "preview": {
    "title": "Adding a New Student",
    "steps": [
      "Navigate to Students > Add Student",
      "Fill in student personal details",
      "Enter academic information",
      "Add parent/guardian information",
      "Upload student photo (optional)",
      "Click Save to complete"
    ]
  }
}
```

## Error Responses
- 400: Missing question parameter
- 405: Invalid HTTP method
- 500: AI service error

## Implementation Details
- Uses Google Gemini Pro model for natural language processing
- Response formatted specifically for educational administration context
- Includes preview sections for step-by-step task guidance
- Multilingual support - responds in the same language as the question
- Server-side implementation for security and performance