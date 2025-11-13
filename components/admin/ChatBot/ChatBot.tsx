"use client";

import React, { useState, useRef, useEffect } from 'react';
import styles from './ChatBot.module.scss';
import { FiMessageSquare, FiX, FiSend, FiMic } from 'react-icons/fi';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  preview?: {
    title: string;
    steps: string[];
  };
}

// Knowledge base for the chatbot
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

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I am your admin assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<any>(null);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    // Initialize speech synthesis
    synthRef.current = window.speechSynthesis;
    
    // Initialize speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US'; // Default language
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputValue(transcript);
          setIsListening(false);
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsBotThinking(true);
    
    // Simulate bot thinking delay
    setTimeout(() => {
      // Get bot response
      const botResponse = getBotResponse(inputValue);
      
      // Add bot message
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse.response,
        sender: 'bot',
        timestamp: new Date(),
        preview: botResponse.preview
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // Speak the response
      speakText(botResponse.response);
      
      setIsBotThinking(false);
    }, 1000); // 1 second delay to simulate thinking
  };

  const speakText = (text: string) => {
    if (synthRef.current) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      synthRef.current.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLanguageChange = (language: string) => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  };

  return (
    <div className={styles.chatBotContainer}>
      {!isOpen ? (
        <div className={styles.minimizedBot} onClick={toggleChat}>
          <FiMessageSquare className={styles.botIcon} />
        </div>
      ) : (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <div className={styles.headerInfo}>
              <div className={styles.botAvatar}>A</div>
              <div className={styles.botTitle}>Admin Assistant</div>
            </div>
            <button className={styles.closeButton} onClick={toggleChat}>
              <FiX />
            </button>
          </div>
          
          <div className={styles.chatMessages}>
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`${styles.message} ${
                  message.sender === 'user' ? styles.userMessage : styles.botMessage
                }`}
              >
                {message.text}
                {message.preview && (
                  <div className={styles.preview}>
                    <div className={styles.previewTitle}>{message.preview.title}</div>
                    <ul className={styles.previewSteps}>
                      {message.preview.steps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            
            {isBotThinking && (
              <div className={styles.typingIndicator}>
                <div className={styles.dot}></div>
                <div className={styles.dot}></div>
                <div className={styles.dot}></div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          <div className={styles.chatInputArea}>
            <input
              type="text"
              className={styles.inputField}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question..."
              disabled={isBotThinking}
            />
            <button 
              className={`${styles.voiceButton} ${isListening ? styles.listening : ''}`}
              onClick={toggleListening}
              disabled={isBotThinking}
            >
              <FiMic />
            </button>
            <button 
              className={styles.sendButton}
              onClick={handleSend}
              disabled={isBotThinking || !inputValue.trim()}
            >
              <FiSend />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;