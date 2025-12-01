import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Fetch suggestions with abort support
  const fetchSuggestions = useCallback(async (context = 'general') => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await axios.get(`/api/chatbot/suggestions?context=${context}`, { 
        timeout: 3000,
        signal: abortControllerRef.current.signal
      });
      if (response.data.success) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
        setSuggestions([
          "Explain quantum computing simply",
          "What are the latest AI trends?",
          "Help me write a professional email",
          "What's the best way to learn coding?"
        ]);
      }
    }
  }, []);

  // Initialize chatbot once
  useEffect(() => {
    if (initialized) return;
    
    const initializeChatbot = async () => {
      try {
        const statusResponse = await axios.get('/api/chatbot/status', { timeout: 3000 });
        const status = statusResponse.data;
        setAiStatus({
          ...status,
          configured: true,
          fallbackMode: status.fallbackMode || false
        });
      } catch (error) {
        console.warn('Chatbot API unavailable, using fallback mode');
        setAiStatus({ provider: 'offline', configured: true, fallbackMode: true });
      }

      const welcomeMessage = {
        id: 1,
        role: 'assistant',
        content: `Hello! 👋 I'm HealthSync AI, powered by Google Gemini.

I'm a real AI assistant that can help you with ANY question - not just healthcare! Ask me about:

🌍 General Knowledge - Science, history, geography, culture
💻 Technology - Programming, AI, software, gadgets
📚 Learning - Explanations, tutorials, concepts
💡 Creative Ideas - Writing, brainstorming, projects
🏥 Healthcare - Medical info, wellness tips, system help
🔧 Problem Solving - Analysis, advice, solutions

Current System Stats:
• Users: ${systemStats.totalUsers || 0} | Doctors: ${systemStats.totalDoctors || 0}
• Appointments: ${systemStats.totalAppointments || 0} | Clinics: ${systemStats.totalClinics || 0}

What would you like to know?`,
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
      setInitialized(true);
    };

    initializeChatbot();
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [initialized, systemStats]);

  // Fetch suggestions only when chatbot opens and context changes
  useEffect(() => {
    if (isOpen && initialized) {
      fetchSuggestions(currentContext);
    }
  }, [currentContext, isOpen, initialized, fetchSuggestions]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
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
      const conversationHistory = messages.slice(-8).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const systemContext = {
        stats: systemStats,
        currentTab: currentContext,
        timestamp: new Date().toISOString()
      };

      console.log('Sending message to Gemini API:', messageText);
      
      const response = await axios.post('/api/chatbot/chat', {
        message: messageText,
        conversationHistory,
        systemContext
      }, { timeout: 30000 });

      console.log('API Response:', response.data);

      if (response.data.success && response.data.response) {
        const aiMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date(),
          provider: response.data.provider || 'gemini'
        };
        setMessages(prev => [...prev, aiMessage]);
      } else if (response.data.response) {
        // Fallback response from backend
        const aiMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date(),
          provider: 'fallback'
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(response.data.error || 'No response received');
      }
    } catch (error) {
      console.error('Chatbot API Error:', error);
      
      // Show actual error to help debug
      let errorMessage = '⚠️ Unable to connect to AI service.\n\n';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage += 'The request timed out. Please try again.';
      } else if (error.response?.status === 500) {
        errorMessage += 'Server error. Please check if the backend is running and Gemini API key is valid.';
      } else if (error.message.includes('Network Error')) {
        errorMessage += 'Cannot connect to backend server. Please ensure the backend is running on port 5005.';
      } else {
        errorMessage += `Error: ${error.message}\n\nPlease restart the backend server and try again.`;
      }
      
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date(),
        provider: 'error'
      };
      setMessages(prev => [...prev, aiMessage]);
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
      content: `Chat cleared! 🔄 I'm ready to help with anything you'd like to know.

I'm powered by Google Gemini AI - ask me about any topic:
• General knowledge & learning
• Technology & programming  
• Creative ideas & writing
• Healthcare & wellness
• Problem solving & advice

What's on your mind?`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    fetchSuggestions(currentContext);
  };

  const toggleMinimize = () => setIsMinimized(!isMinimized);
  const handleClose = () => { setIsOpen(false); setIsMinimized(false); };
  const handleToggle = () => { setIsOpen(!isOpen); if (isOpen) setIsMinimized(false); };

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
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="admin-chatbot__backdrop"
          onClick={handleClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 998
          }}
        />
      )}

      {/* Toggle Button */}
      <div className="admin-chatbot__toggle" onClick={handleToggle}>
        <div className="admin-chatbot__toggle-icon">
          {isOpen ? <i className="fas fa-times"></i> : <i className="fas fa-robot"></i>}
        </div>
        {!isOpen && (
          <div className="admin-chatbot__toggle-text">
            <strong>AI Assistant</strong>
            <div className="admin-chatbot__toggle-status">
              <span className="admin-chatbot__status-dot"></span>
              {aiStatus.provider} {aiStatus.fallbackMode ? 'Intelligent Mode' : 'Ready'}
            </div>
          </div>
        )}
        {aiStatus.fallbackMode && (
          <div className="admin-chatbot__badge">
            <i className="fas fa-check"></i>
          </div>
        )}
      </div>

      {/* Chat Window */}
      <div 
        className={`admin-chatbot__window ${!isOpen ? 'admin-chatbot__window--hidden' : ''} ${isMinimized ? 'admin-chatbot__window--minimized' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="admin-chatbot__header">
          <div className="admin-chatbot__header-left">
            <div className="admin-chatbot__avatar">
              <i className="fas fa-robot"></i>
            </div>
            <div className="admin-chatbot__header-info">
              <h4>HealthSync AI</h4>
              <span className="admin-chatbot__header-status">
                <span className="admin-chatbot__status-dot"></span>
                {aiStatus.fallbackMode ? 'Intelligent Assistant' : `${aiStatus.provider} Ready`}
              </span>
            </div>
          </div>
          <div className="admin-chatbot__header-actions">
            <button className="admin-chatbot__header-btn" onClick={exportChat} title="Export Chat">
              <i className="fas fa-download"></i>
            </button>
            <button className="admin-chatbot__header-btn" onClick={clearChat} title="Clear Chat">
              <i className="fas fa-trash-alt"></i>
            </button>
            <button className="admin-chatbot__header-btn" onClick={toggleMinimize} title={isMinimized ? "Expand" : "Minimize"}>
              <i className={`fas fa-${isMinimized ? 'expand' : 'minus'}`}></i>
            </button>
            <button className="admin-chatbot__header-btn" onClick={handleClose} title="Close">
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Messages */}
        {!isMinimized && (
          <div className="admin-chatbot__messages">
            {aiStatus.fallbackMode && (
              <div className="admin-chatbot__fallback-banner">
                <div className="admin-chatbot__fallback-icon">
                  <i className="fas fa-brain"></i>
                </div>
                <div className="admin-chatbot__fallback-content">
                  <h5>Intelligent Assistant Mode</h5>
                  <p>I'm ready to help with any questions!</p>
                  <small>Using advanced conversational intelligence</small>
                </div>
              </div>
            )}
            
            {messages.map((message) => (
              <div key={message.id} className={`admin-chatbot__message admin-chatbot__message--${message.role}`}>
                <div className="admin-chatbot__message-avatar">
                  {message.role === 'assistant' ? (
                    <i className="fas fa-robot"></i>
                  ) : (
                    <i className="fas fa-user"></i>
                  )}
                </div>
                <div className="admin-chatbot__message-content">
                  <div className="admin-chatbot__message-bubble">
                    {message.content}
                  </div>
                  <div className="admin-chatbot__message-meta">
                    <span className="admin-chatbot__message-time">{formatTime(message.timestamp)}</span>
                    {message.provider && (
                      <span className="admin-chatbot__message-provider">{message.provider}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="admin-chatbot__message admin-chatbot__message--assistant">
                <div className="admin-chatbot__message-avatar">
                  <i className="fas fa-robot"></i>
                </div>
                <div className="admin-chatbot__typing">
                  <div className="admin-chatbot__typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Suggestions */}
        {!isMinimized && messages.length <= 2 && suggestions.length > 0 && (
          <div className="admin-chatbot__suggestions">
            <div className="admin-chatbot__suggestions-header">
              <div className="admin-chatbot__suggestions-title">
                <i className="fas fa-lightbulb"></i>
                Try asking about {currentContext}:
              </div>
              <button 
                className="admin-chatbot__suggestions-refresh"
                onClick={() => fetchSuggestions(currentContext)}
                title="Refresh suggestions"
              >
                <i className="fas fa-sync-alt"></i>
              </button>
            </div>
            <div className="admin-chatbot__suggestions-grid">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="admin-chatbot__suggestion-btn"
                  onClick={() => sendMessage(suggestion)}
                  disabled={isLoading}
                >
                  <i className="fas fa-arrow-right"></i>
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        {!isMinimized && (
          <div className="admin-chatbot__input-area">
            <div className="admin-chatbot__input-wrapper">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything - I'm here to help!"
                rows="1"
                disabled={isLoading}
              />
              <button
                className="admin-chatbot__send-btn"
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
            <div className="admin-chatbot__footer">
              <div className="admin-chatbot__footer-left">
                <small>
                  <i className="fas fa-shield-alt"></i>
                  HealthSync AI • {aiStatus.fallbackMode ? 'Intelligent Assistant' : `Powered by ${aiStatus.provider}`}
                </small>
              </div>
              <div className="admin-chatbot__footer-right">
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
