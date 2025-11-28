import React, { useState, useEffect, useRef } from 'react';
import axios from '../api/config';

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
      const statusResponse = await axios.get('/api/chatbot/status', {
        timeout: 3000 // 3 second timeout
      });
      const status = statusResponse.data;
      setAiStatus({
        ...status,
        configured: true,
        fallbackMode: status.fallbackMode || false
      });
    } catch (error) {
      // Silently fail - chatbot will work in fallback mode
      console.warn('Chatbot API unavailable, using fallback mode');
      setAiStatus({ provider: 'offline', configured: true, fallbackMode: true });
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
      const response = await axios.get(`/api/chatbot/suggestions?context=${context}`, {
        timeout: 3000 // 3 second timeout
      });
      if (response.data.success) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      // Silently fail and use fallback suggestions
      console.warn('Using fallback suggestions (chatbot API unavailable)');
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
      }, {
        timeout: 30000 // 30 second timeout for AI responses
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
      console.warn('Chat API error:', error.message);
      
      let errorContent = 'I apologize, but the AI service is currently unavailable. The chatbot requires the backend server to be running on port 5005. Please ensure the backend is started.';
      
      // Check if it's a connection error
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        errorContent = '⚠️ Backend server is not running. Please start the backend server (npm start in backend folder) to use the AI chatbot.';
      } else if (error.response?.data?.response) {
        errorContent = error.response.data.response;
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
        isError: true
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

  const handleClose = () => {
    console.log('Close button clicked - closing chatbot');
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleToggle = () => {
    console.log('Toggle button clicked - current state:', isOpen);
    setIsOpen(!isOpen);
    if (isOpen) {
      setIsMinimized(false);
    }
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
      {/* Backdrop Overlay - Click to close */}
      {isOpen && (
        <div 
          
          onMouseDown={(e) => {
            console.log('BACKDROP CLICKED!');
            handleClose();
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 998,
            cursor: 'pointer',
            pointerEvents: 'all'
          }}
        />
      )}

      {/* Chatbot Toggle Button */}
      <div  onClick={handleToggle}>
        <div >
          {isOpen ? (
            <i ></i>
          ) : (
            <i ></i>
          )}
        </div>
        {!isOpen && (
          <div >
            <div >
              <strong>AI Assistant</strong>
              <div >
                <span ></span>
                {aiStatus.provider} {aiStatus.fallbackMode ? 'Intelligent Mode' : 'Ready'}
              </div>
            </div>
          </div>
        )}
        {aiStatus.fallbackMode && (
          <div  style={{background: '#10b981'}}>
            <i ></i>
          </div>
        )}
      </div>

      {/* Chatbot Window */}
      <div 
        
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div >
          <div >
            <div >
              <i ></i>
            </div>
            <div >
              <h4>HealthSync AI</h4>
              <span >
                <span ></span>
                {aiStatus.fallbackMode ? 'Intelligent Assistant' : `${aiStatus.provider} Ready`}
              </span>
            </div>
          </div>
          <div >
            <button  onClick={exportChat} title="Export Chat">
              <i ></i>
            </button>
            <button  onClick={clearChat} title="Clear Chat">
              <i ></i>
            </button>
            <button  onClick={toggleMinimize} title={isMinimized ? "Expand" : "Minimize"}>
              <i ></i>
            </button>
            <button 
               
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('CLOSE BUTTON CLICKED!');
                handleClose();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              title="Close"
              type="button"
              style={{
                cursor: 'pointer',
                zIndex: 9999,
                position: 'relative',
                pointerEvents: 'all'
              }}
            >
              <i  style={{ pointerEvents: 'none' }}></i>
            </button>
          </div>
        </div>

        {/* Messages */}
        {!isMinimized && (
          <div >
            {aiStatus.fallbackMode && (
              <div  style={{background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%)', borderColor: '#10b981'}}>
                <div  style={{color: '#10b981'}}>
                  <i ></i>
                </div>
                <div >
                  <h5 style={{color: '#065f46'}}>Intelligent Assistant Mode</h5>
                  <p style={{color: '#047857'}}>I'm ready to help with any questions or topics you'd like to explore!</p>
                  <small style={{color: '#059669'}}>Using advanced conversational intelligence</small>
                </div>
              </div>
            )}
            
            {messages.map((message) => (
              <div key={message.id} >
                <div >
                  {message.role === 'assistant' ? (
                    <i ></i>
                  ) : (
                    <i ></i>
                  )}
                </div>
                <div >
                  <div >
                    {message.content}
                  </div>
                  <div >
                    <span >{formatTime(message.timestamp)}</span>
                    {message.provider && (
                      <span >{message.provider}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div >
                <div >
                  <i ></i>
                </div>
                <div >
                  <div >
                    <div >
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
          <div >
            <div >
              <div >
                <i ></i>
                Try asking about {currentContext}:
              </div>
              <button 
                 
                onClick={() => fetchSuggestions(currentContext)}
                title="Refresh suggestions"
              >
                <i ></i>
              </button>
            </div>
            <div >
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  
                  onClick={() => sendMessage(suggestion)}
                  disabled={isLoading}
                >
                  <i ></i>
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        {!isMinimized && (
          <div >
            <div >
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything - I'm here to help!"
                rows="1"
                disabled={isLoading}
              />
              <button
                
                onClick={() => sendMessage()}
                disabled={!inputMessage.trim() || isLoading}
              >
                {isLoading ? (
                  <i ></i>
                ) : (
                  <i ></i>
                )}
              </button>
            </div>
            <div >
              <div >
                <small>
                  <i ></i>
                  HealthSync AI • {aiStatus.fallbackMode ? 'Intelligent Assistant' : `Powered by ${aiStatus.provider}`}
                </small>
              </div>
              <div >
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

