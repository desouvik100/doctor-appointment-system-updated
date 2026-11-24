import { useState, useEffect, useRef } from 'react';
import axios from '../api/config';
import './AIChatbot.css';

const AIChatbot = ({ userId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load welcome message and quick replies on mount
  useEffect(() => {
    loadWelcomeMessage();
    loadQuickReplies();
  }, []);

  const loadWelcomeMessage = async () => {
    try {
      const response = await axios.get('/api/ai/chat/welcome');
      if (response.data.success) {
        setMessages([{
          id: Date.now(),
          type: 'bot',
          text: response.data.message,
          suggestions: response.data.suggestions,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      setMessages([{
        id: Date.now(),
        type: 'bot',
        text: "👋 Hello! I'm your HealthSync AI assistant. How can I help you today?",
        suggestions: ["Book appointment", "Find doctor", "Check queue", "Help"],
        timestamp: new Date()
      }]);
    }
  };

  const loadQuickReplies = async () => {
    try {
      const response = await axios.get('/api/ai/chat/quick-replies');
      if (response.data.success) {
        setQuickReplies(response.data.quickReplies);
      }
    } catch (error) {
      console.error('Error loading quick replies:', error);
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: text.trim(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await axios.post('/api/ai/chat', {
        message: text,
        userId
      });

      // Simulate typing delay for natural feel
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: response.data.response,
        suggestions: response.data.suggestions,
        isUrgent: response.data.isUrgent,
        data: response.data.data,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: "I'm having trouble connecting. Please try again.",
        suggestions: ["Try again"],
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  const handleQuickReplyClick = (quickReply) => {
    sendMessage(quickReply.text.replace(/[^\w\s]/g, '').trim());
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="chatbot-container">
      {/* Header */}
      <div className="chatbot-header">
        <div className="chatbot-header-info">
          <div className="chatbot-avatar">
            <i className="fas fa-robot"></i>
          </div>
          <div>
            <h3>HealthSync AI</h3>
            <span className="online-status">
              <span className="status-dot"></span>
              Online
            </span>
          </div>
        </div>
        <button className="chatbot-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Quick Replies Bar */}
      <div className="quick-replies-bar">
        {quickReplies.map(qr => (
          <button
            key={qr.id}
            className="quick-reply-chip"
            onClick={() => handleQuickReplyClick(qr)}
          >
            {qr.text}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="chatbot-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.type} ${msg.isUrgent ? 'urgent' : ''}`}>
            {msg.type === 'bot' && (
              <div className="message-avatar">
                <i className="fas fa-robot"></i>
              </div>
            )}
            <div className="message-content">
              <div className="message-bubble">
                <p style={{ whiteSpace: 'pre-line' }}>{msg.text}</p>
              </div>
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="message-suggestions">
                  {msg.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      className="suggestion-btn"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              <span className="message-time">{formatTime(msg.timestamp)}</span>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message bot">
            <div className="message-avatar">
              <i className="fas fa-robot"></i>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form className="chatbot-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message..."
          disabled={isTyping}
        />
        <button type="submit" disabled={!inputText.trim() || isTyping}>
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};

export default AIChatbot;
