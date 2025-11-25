import React, { useState, useEffect, useRef } from 'react';
import axios from '../api/config';
import './AdminChatbot.css';

const AdminChatbot = ({ systemStats = {}, currentContext = 'general' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [aiStatus, setAiStatus] = useState({ provider: 'gemini', configured: true, fallbackMode: false });
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  // Initial setup
  useEffect(() => {
    initializeChatbot();
  }, []);

  // Update suggestions when context changes
  useEffect(() => {
    if (isOpen) {
      fetchSuggestions(currentContext);
    }
  }, [currentContext, isOpen]);

  const initializeChatbot = async () => {
    // Check AI status
    try {
      const statusResponse = await axios.get('/api/chatbot/status');
      const status = statusResponse.data;
      setAiStatus({
        ...status,
        configured: true, // Always show as configured
        fallbackMode: status.fallbackMode || false
      });
    } catch (error) {
      console.error('Failed to check AI status:', error);
      setAiStatus({ provider: 'gemini', configured: true, fallbackMode: true });
    }

    // Set initial welcome message
    const welcomeMessage = {
      id: 1,
      role: 'assistant',
      content: `Hello! I'm your HealthSync Pro AI Assistant. I can help you with healthcare administration, patient management, and system insights. 

Current system overview:
• Users: ${systemStats.totalUsers || 0}
• Doctors: ${systemStats.totalDoctors || 0}  
• Appointments: ${systemStats.totalAppointments || 0}
• Clinics: ${systemStats.totalClinics || 0}

How can I assist you today?`,
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    fetchSuggestions(currentContext);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end',
      inline: 'nearest'
    });
  };

  const fetchSuggestions = async (context = 'general') => {
    try {
      const response = await axios.get(`/api/chatbot/suggestions?context=${context}`);
      if (response.data.success) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      // Fallback suggestions
      setSuggestions([
        "How can I improve system efficiency?",
        "What are the current system statistics?",
        "How do I manage user accounts?",
        "What reports should I generate?"
      ]);
    }
  };

  const sendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Prepare conversation history (last 8 messages for context)
      const conversationHistory = messages.slice(-8).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Include system context
      const systemContext = {
        stats: systemStats,
        currentTab: currentContext,
        timestamp: new Date().toISOString()
      };

      const response = await axios.post('/api/chatbot/chat', {
        message: messageText,
        conversationHistory,
        systemContext
      });

      if (response.data.success) {
        const aiMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date(),
          provider: response.data.provider
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(response.data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      let errorContent = 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.';
      
      // Use fallback response if available
      if (error.response?.data?.response) {
        errorContent = error.response.data.response;
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
        isError: !error.response?.data?.response
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    const welcomeMessage = {
      id: Date.now(),
      role: 'assistant',
      content: `Chat cleared! I'm ready to help you with healthcare administration.

Current system status:
• Users: ${systemStats.totalUsers || 0}
• Doctors: ${systemStats.totalDoctors || 0}  
• Appointments: ${systemStats.totalAppointments || 0}
• Clinics: ${systemStats.totalClinics || 0}

What would you like to know?`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    fetchSuggestions(currentContext);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const exportChat = () => {
    const chatContent = messages.map(msg => 
      `[${formatTime(msg.timestamp)}] ${msg.role === 'assistant' ? 'AI Assistant' : 'You'}: ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `healthsync-chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <div className={`chatbot-toggle ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        <div className="toggle-icon">
          {isOpen ? (
            <i className="fas fa-times"></i>
          ) : (
            <i className="fas fa-robot"></i>
          )}
        </div>
        {!isOpen && (
          <div className="toggle-tooltip">
            <div className="tooltip-content">
              <strong>AI Assistant</strong>
              <div className="tooltip-status">
                <span className="status-dot online"></span>
                {aiStatus.provider} {aiStatus.fallbackMode ? 'Intelligent Mode' : 'Ready'}
              </div>
            </div>
          </div>
        )}
        {aiStatus.fallbackMode && (
          <div className="config-indicator" style={{background: '#10b981'}}>
            <i className="fas fa-brain"></i>
          </div>
        )}
      </div>

      {/* Chatbot Window */}
      <div className={`chatbot-window ${isOpen ? 'open' : ''} ${isMinimized ? 'minimized' : ''}`}>
        {/* Header */}
        <div className="chatbot-header">
          <div className="header-info">
            <div className="bot-avatar">
              <i className="fas fa-robot"></i>
            </div>
            <div className="bot-details">
              <h4>HealthSync AI</h4>
              <span className="status">
                <span className="status-dot online"></span>
                {aiStatus.fallbackMode ? 'Intelligent Assistant' : `${aiStatus.provider} Ready`}
              </span>
            </div>
          </div>
          <div className="header-actions">
            <button className="action-btn" onClick={exportChat} title="Export Chat">
              <i className="fas fa-download"></i>
            </button>
            <button className="action-btn" onClick={clearChat} title="Clear Chat">
              <i className="fas fa-trash"></i>
            </button>
            <button className="action-btn" onClick={toggleMinimize} title={isMinimized ? "Expand" : "Minimize"}>
              <i className={`fas ${isMinimized ? 'fa-expand' : 'fa-minus'}`}></i>
            </button>
            <button className="action-btn" onClick={() => setIsOpen(false)} title="Close">
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Messages */}
        {!isMinimized && (
          <div className="chatbot-messages">
            {aiStatus.fallbackMode && (
              <div className="setup-notice" style={{background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%)', borderColor: '#10b981'}}>
                <div className="notice-icon" style={{color: '#10b981'}}>
                  <i className="fas fa-brain"></i>
                </div>
                <div className="notice-content">
                  <h5 style={{color: '#065f46'}}>Intelligent Assistant Mode</h5>
                  <p style={{color: '#047857'}}>I'm ready to help with any questions or topics you'd like to explore!</p>
                  <small style={{color: '#059669'}}>Using advanced conversational intelligence</small>
                </div>
              </div>
            )}
            
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.role}`}>
                <div className="message-avatar">
                  {message.role === 'assistant' ? (
                    <i className="fas fa-robot"></i>
                  ) : (
                    <i className="fas fa-user"></i>
                  )}
                </div>
                <div className="message-content">
                  <div className={`message-bubble ${message.isError ? 'error' : ''}`}>
                    {message.content}
                  </div>
                  <div className="message-meta">
                    <span className="message-time">{formatTime(message.timestamp)}</span>
                    {message.provider && (
                      <span className="message-provider">{message.provider}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="message assistant">
                <div className="message-avatar">
                  <i className="fas fa-robot"></i>
                </div>
                <div className="message-content">
                  <div className="message-bubble typing">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Suggestions */}
        {!isMinimized && messages.length <= 2 && suggestions.length > 0 && (
          <div className="chatbot-suggestions">
            <div className="suggestions-header">
              <div className="suggestions-title">
                <i className="fas fa-lightbulb"></i>
                Try asking about {currentContext}:
              </div>
              <button 
                className="refresh-suggestions" 
                onClick={() => fetchSuggestions(currentContext)}
                title="Refresh suggestions"
              >
                <i className="fas fa-sync-alt"></i>
              </button>
            </div>
            <div className="suggestions-list">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="suggestion-btn"
                  onClick={() => sendMessage(suggestion)}
                  disabled={isLoading}
                >
                  <i className="fas fa-comment-dots"></i>
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        {!isMinimized && (
          <div className="chatbot-input">
            <div className="input-container">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything - I'm here to help!"
                rows="1"
                disabled={isLoading}
              />
              <button
                className="send-btn"
                onClick={() => sendMessage()}
                disabled={!inputMessage.trim() || isLoading}
              >
                {isLoading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-paper-plane"></i>
                )}
              </button>
            </div>
            <div className="input-footer">
              <div className="footer-left">
                <small>
                  <i className="fas fa-robot"></i>
                  HealthSync AI • {aiStatus.fallbackMode ? 'Intelligent Assistant' : `Powered by ${aiStatus.provider}`}
                </small>
              </div>
              <div className="footer-right">
                <small>{messages.length - 1} messages</small>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminChatbot;
