"use client";

import React, { useState, useRef, useEffect } from 'react';
import styles from './ChatBot.module.scss';
import { FiMessageSquare, FiX, FiSend, FiMic } from 'react-icons/fi';
import api from '@/backend/utils/api';

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

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
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
    
    // Add welcome message
    setMessages([
      {
        id: '1',
        text: 'Hello! I am your admin assistant. How can I help you today?',
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSend = async () => {
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
    
    try {
      // Send message to AI API
      const response = await api.post('/ai/admin-assistant', {
        question: inputValue
      });
      
      const botText = response.data.response || "Sorry, I couldn't process that request.";
      
      // Check if response contains preview data
      let previewData = undefined;
      if (response.data.preview) {
        previewData = {
          title: response.data.preview.title,
          steps: response.data.preview.steps
        };
      }
      
      // Add bot message
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botText,
        sender: 'bot',
        timestamp: new Date(),
        preview: previewData
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // Speak the response
      speakText(botText);
    } catch (error: any) {
      console.error('Error getting AI response:', error);
      let errorMessage = "Sorry, I'm having trouble connecting to the server. Please try again.";
      
      // Provide more specific error messages
      if (error.response) {
        // Server responded with error status
        if (error.response.status === 401) {
          errorMessage = "Authentication required. Please log in again.";
        } else if (error.response.status === 403) {
          errorMessage = "Access denied. This feature is only available to admin users.";
        } else if (error.response.status === 404) {
          errorMessage = "Service not found. Please check if the chatbot is properly configured.";
        } else if (error.response.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = "Network error. Please check your internet connection.";
      }
      
      const errorBotMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorMessage,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorBotMessage]);
    } finally {
      setIsBotThinking(false);
    }
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