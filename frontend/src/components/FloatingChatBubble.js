import React, { useState } from 'react';
import './FloatingChatBubble.css';

const FloatingChatBubble = ({ onOpenChat }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hi! 👋 How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickActions = [
    { icon: 'calendar-check', text: 'Book Appointment', action: 'book' },
    { icon: 'user-md', text: 'Find Doctor', action: 'doctors' },
    { icon: 'stethoscope', text: 'Check Symptoms', action: 'symptoms' },
    { icon: 'question-circle', text: 'Get Help', action: 'help' }
  ];

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      
      const data = await response.json();
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: data.response || 'I can help you with appointments, finding doctors, or answering health questions!'
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: 'I can help you book appointments, find doctors, or answer health questions. What would you like to do?'
      }]);
    }
    setLoading(false);
  };

  const handleQuickAction = (action) => {
    const responses = {
      book: 'Great! I can help you book an appointment. Please sign in or create an account to continue.',
      doctors: 'Looking for a doctor? I can help you find the right specialist. What type of doctor do you need?',
      symptoms: 'I can help analyze your symptoms. Please describe what you\'re experiencing.',
      help: 'I\'m here to help! You can ask me about:\n• Booking appointments\n• Finding doctors\n• Checking symptoms\n• General health questions'
    };

    setMessages(prev => [
      ...prev,
      { type: 'user', text: quickActions.find(a => a.action === action).text },
      { type: 'bot', text: responses[action] }
    ]);
  };

  return (
    <>
      {/* Floating Button */}
      <div className={`floating-chat-button ${isOpen ? 'open' : ''}`} onClick={handleToggle}>
        {isOpen ? (
          <i className="fas fa-times"></i>
        ) : (
          <>
            <i className="fas fa-comments"></i>
            <span className="chat-badge">AI</span>
          </>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="floating-chat-window">
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">
                <i className="fas fa-robot"></i>
              </div>
              <div>
                <h4>HealthSync AI</h4>
                <span className="status-indicator">
                  <span className="status-dot"></span>
                  Always available
                </span>
              </div>
            </div>
            <button className="chat-close" onClick={handleToggle}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.type}`}>
                {msg.type === 'bot' && (
                  <div className="message-avatar">
                    <i className="fas fa-robot"></i>
                  </div>
                )}
                <div className="message-bubble">
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-message bot">
                <div className="message-avatar">
                  <i className="fas fa-robot"></i>
                </div>
                <div className="message-bubble typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </div>

          <div className="quick-actions">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                className="quick-action-btn"
                onClick={() => handleQuickAction(action.action)}
              >
                <i className={`fas fa-${action.icon}`}></i>
                <span>{action.text}</span>
              </button>
            ))}
          </div>

          <div className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="chat-send-btn" onClick={handleSend} disabled={!input.trim()}>
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>

          <div className="chat-footer">
            <small>
              <i className="fas fa-shield-alt me-1"></i>
              Secure & HIPAA Compliant
            </small>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChatBubble;
