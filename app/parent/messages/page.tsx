// File: app/parent/messages/page.tsx
// Parent Messaging/Chat Interface

'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './ParentMessages.module.scss';

interface Conversation {
  id: number;
  participant: {
    id: number;
    name: string;
    email: string;
  };
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface Message {
  id: number;
  content: string;
  senderId: number;
  senderName?: string;
  createdAt: string;
  read: boolean;
}

export default function ParentMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('parent_token');
      
      const response = await fetch('/api/communication/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        
        // Auto-select first conversation if none selected
        if (data.length > 0 && !selectedConversation) {
          setSelectedConversation(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: number) => {
    try {
      const token = localStorage.getItem('parent_token');
      
      const response = await fetch(`/api/communication/messages/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    try {
      setSending(true);
      const token = localStorage.getItem('parent_token');
      
      const response = await fetch('/api/communication/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: selectedConversation.participant.id,
          content: newMessage.trim(),
          conversationId: selectedConversation.id
        }),
      });

      if (response.ok) {
        const newMsg = await response.json();
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        
        // Refresh conversations to update last message
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className={styles.messagesContainer}>
      {/* Conversations Sidebar */}
      <div className={styles.conversationsSidebar}>
        <div className={styles.sidebarHeader}>
          <h2>Messages</h2>
          <button 
            className={styles.refreshButton}
            onClick={fetchConversations}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 6C14 3.79086 12.2091 2 10 2C8.5733 2 7.33799 2.83982 6.66432 4.05004M2 10C2 12.2091 3.79086 14 6 14C7.4267 14 8.66201 13.1602 9.33568 11.9499M4.33999 10H2V13.5M11.66 6H14V2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        
        <div className={styles.conversationsList}>
          {conversations.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <p>No conversations yet</p>
              <small>Contact your child's teacher or admin to start chatting</small>
            </div>
          ) : (
            conversations.map(conversation => (
              <div
                key={conversation.id}
                className={`${styles.conversationItem} ${
                  selectedConversation?.id === conversation.id ? styles.active : ''
                }`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <div className={styles.participantAvatar}>
                  <span>{conversation.participant.name.charAt(0)}</span>
                </div>
                <div className={styles.conversationInfo}>
                  <div className={styles.participantName}>
                    {conversation.participant.name}
                  </div>
                  <div className={styles.lastMessage}>
                    {conversation.lastMessage || 'No messages yet'}
                  </div>
                </div>
                <div className={styles.conversationMeta}>
                  <div className={styles.timestamp}>
                    {formatTime(conversation.lastMessageTime)}
                  </div>
                  {conversation.unreadCount > 0 && (
                    <div className={styles.unreadBadge}>
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={styles.chatArea}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className={styles.chatHeader}>
              <div className={styles.participantInfo}>
                <div className={styles.participantAvatarLarge}>
                  <span>{selectedConversation.participant.name.charAt(0)}</span>
                </div>
                <div>
                  <h3>{selectedConversation.participant.name}</h3>
                  <p>{selectedConversation.participant.email}</p>
                </div>
              </div>
            </div>

            {/* Messages Container */}
            <div className={styles.messagesContainerInner}>
              {messages.length === 0 ? (
                <div className={styles.noMessages}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <h3>Start a conversation</h3>
                  <p>Send a message to {selectedConversation.participant.name}</p>
                </div>
              ) : (
                <div className={styles.messagesList}>
                  {messages.map((message) => {
                    const isOwnMessage = message.senderId === 
                      JSON.parse(localStorage.getItem('parent_user') || '{}').id;
                    
                    return (
                      <div
                        key={message.id}
                        className={`${styles.message} ${
                          isOwnMessage ? styles.ownMessage : styles.otherMessage
                        }`}
                      >
                        {!isOwnMessage && (
                          <div className={styles.senderAvatar}>
                            <span>{message.senderName?.charAt(0) || 'T'}</span>
                          </div>
                        )}
                        <div className={styles.messageContent}>
                          <div className={styles.messageText}>
                            {message.content}
                          </div>
                          <div className={styles.messageTime}>
                            {formatTime(message.createdAt)}
                            {isOwnMessage && (
                              <span className={styles.readStatus}>
                                {message.read ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className={styles.messageInputArea}>
              <div className={styles.inputContainer}>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  rows={1}
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className={styles.sendButton}
                >
                  {sending ? (
                    <div className={styles.sendingSpinner}></div>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M18 2L9 11M18 2L12 18L9 11M18 2L2 9L9 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.selectConversation}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <h2>Select a conversation</h2>
            <p>Choose a conversation from the sidebar to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}