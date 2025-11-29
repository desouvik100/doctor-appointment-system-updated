import React, { useState, useEffect, useRef } from 'react';
import './AIAssistant.css';

const AIAssistant = ({ user }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: `Hello ${user?.name || 'there'}! 👋 I'm your AI Health Assistant. I can help you with:

🩺 General health information and tips
🔍 Understanding medical symptoms (not a diagnosis)
💊 Medication reminders and information
🏃‍♀️ Healthy lifestyle recommendations
📋 Preparation for doctor visits
🚨 Emergency guidance and contacts

How can I assist you today?`,
      timestamp: new Date()
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline] = useState(true);
  const [messageCount, setMessageCount] = useState(1);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const getAIResponse = (message) => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('headache') || lowerMessage.includes('head pain')) {
      return `For headaches, here are some general tips:

• Stay hydrated - drink plenty of water
• Get adequate rest and sleep
• Try gentle neck and shoulder stretches
• Apply a cold or warm compress
• Avoid bright lights and loud sounds
• Consider stress management techniques

⚠️ If headaches are severe, frequent, or accompanied by fever, vision changes, or neck stiffness, please consult a doctor immediately.`;
    }

    if (lowerMessage.includes('fever') || lowerMessage.includes('temperature')) {
      return `For fever management:

• Rest and stay hydrated
• Take temperature regularly
• Use fever-reducing medication as directed
• Wear light, breathable clothing
• Use cool compresses on forehead
• Eat light, easy-to-digest foods

⚠️ Seek immediate medical attention if fever is above 103°F (39.4°C), lasts more than 3 days, or is accompanied by severe symptoms.`;
    }

    if (lowerMessage.includes('cough') || lowerMessage.includes('cold')) {
      return `For cough and cold symptoms:

• Stay hydrated with warm liquids
• Use a humidifier or breathe steam
• Get plenty of rest
• Gargle with warm salt water
• Avoid irritants like smoke
• Consider honey for soothing throat

⚠️ Consult a doctor if cough persists over 2 weeks, produces blood, or is accompanied by high fever or difficulty breathing.`;
    }

    if (lowerMessage.includes('appointment') || lowerMessage.includes('book') || lowerMessage.includes('doctor')) {
      return `To book an appointment:

• Go to the "Find Doctors" tab
• Browse available doctors by specialization
• Select your preferred doctor and time slot
• Provide reason for visit
• Confirm your appointment

You can also view and manage your appointments in the "My Appointments" tab.`;
    }

    if (lowerMessage.includes('medication') || lowerMessage.includes('medicine')) {
      return `Medication reminders and tips:

• Always take medications as prescribed
• Set reminders for medication times
• Don't skip doses without consulting your doctor
• Store medications properly
• Check expiration dates regularly
• Keep a list of all your medications

⚠️ Never stop or change medications without consulting your healthcare provider.`;
    }

    if (lowerMessage.includes('diet') || lowerMessage.includes('nutrition') || lowerMessage.includes('food')) {
      return `Healthy nutrition tips:

• Eat a balanced diet with fruits and vegetables
• Stay hydrated with 8-10 glasses of water daily
• Limit processed foods and added sugars
• Include lean proteins and whole grains
• Practice portion control
• Eat regular meals throughout the day

For specific dietary needs, consult with a nutritionist or your doctor.`;
    }

    if (lowerMessage.includes('exercise') || lowerMessage.includes('fitness') || lowerMessage.includes('workout')) {
      return `Exercise and fitness guidelines:

• Aim for 150 minutes of moderate exercise weekly
• Include both cardio and strength training
• Start slowly and gradually increase intensity
• Stay hydrated during workouts
• Warm up before and cool down after exercise
• Listen to your body and rest when needed

⚠️ Consult your doctor before starting a new exercise program, especially if you have health conditions.`;
    }

    if (lowerMessage.includes('stress') || lowerMessage.includes('anxiety') || lowerMessage.includes('mental')) {
      return `Stress and mental health support:

• Practice deep breathing exercises
• Try meditation or mindfulness
• Maintain regular sleep schedule
• Stay connected with friends and family
• Engage in hobbies you enjoy
• Consider professional counseling if needed

🆘 If you're experiencing thoughts of self-harm, please contact emergency services or a mental health crisis line immediately.`;
    }

    if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') || lowerMessage.includes('911')) {
      return `🚨 EMERGENCY CONTACTS & INFORMATION:

🆘 IMMEDIATE EMERGENCIES:
• Call 911 (US) or your local emergency number
• For medical emergencies: Go to nearest ER
• Poison Control: 1-800-222-1222

🏥 WHEN TO SEEK IMMEDIATE CARE:
• Chest pain or difficulty breathing
• Severe bleeding or trauma
• Loss of consciousness
• Severe allergic reactions
• Signs of stroke (FAST: Face drooping, Arm weakness, Speech difficulty, Time to call)

⚠️ Remember: When in doubt, always err on the side of caution and seek professional medical help immediately.`;
    }

    return `Thank you for your question! While I can provide general health information, I recommend:

• Consulting with a healthcare professional for personalized advice
• Booking an appointment through our "Find Doctors" tab
• Calling emergency services for urgent medical concerns

Is there a specific health topic you'd like general information about? I can help with topics like:
• Common symptoms and general care
• Healthy lifestyle tips
• Medication reminders
• Appointment booking guidance`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !isOnline) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setMessageCount(prev => prev + 1);

    const thinkingTime = Math.random() * 1000 + 1000;
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: getAIResponse(userMessage.content),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      setMessageCount(prev => prev + 1);
      setIsTyping(false);
    }, thinkingTime);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "How to book an appointment?",
    "Tips for headaches",
    "Healthy diet tips",
    "Exercise guidelines",
    "Emergency contacts"
  ];

  return (
    <div className="ai-assistant">
      {/* Header */}
      <div className="ai-assistant__header">
        <div className="ai-assistant__header-content">
          <div className="ai-assistant__header-left">
            <div className="ai-assistant__avatar">
              <i className="fas fa-robot"></i>
            </div>
            <div>
              <h4 className="ai-assistant__title">
                AI Health Assistant
                <span className="ai-assistant__status-dot"></span>
              </h4>
              <p className="ai-assistant__subtitle">
                {isOnline ? 'Online • Ready to help' : 'Offline • Reconnecting...'}
              </p>
            </div>
          </div>
          <div className="ai-assistant__stats">
            <i className="fas fa-comments"></i>
            {messageCount} messages
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="ai-assistant__body">
        {/* Messages */}
        <div className="ai-assistant__messages" ref={chatContainerRef}>
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`ai-assistant__message ai-assistant__message--${message.type}`}
            >
              <div className="ai-assistant__message-bubble">
                <div style={{ whiteSpace: 'pre-line' }}>
                  {message.content}
                </div>
              </div>
              <div className="ai-assistant__message-time">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="ai-assistant__message ai-assistant__message--ai">
              <div className="ai-assistant__typing">
                <div className="ai-assistant__typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                AI is typing...
              </div>
            </div>
          )}
        </div>

        {/* Quick Questions */}
        <div className="ai-assistant__quick-questions">
          <span className="ai-assistant__quick-label">Quick questions:</span>
          <div className="ai-assistant__quick-grid">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                className="ai-assistant__quick-btn"
                onClick={() => setInputMessage(question)}
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="ai-assistant__input-area">
          <div className="ai-assistant__input-wrapper">
            <div className="ai-assistant__input-icon">
              <i className="fas fa-comment-medical"></i>
            </div>
            <textarea
              className="ai-assistant__textarea"
              placeholder="Ask me about health tips, symptoms, or how to use this system..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows="1"
              disabled={!isOnline}
            />
            <button
              className="ai-assistant__send-btn"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping || !isOnline}
            >
              {isTyping ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className="fas fa-paper-plane"></i>
              )}
            </button>
          </div>
          
          <div className="ai-assistant__footer-info">
            <div className="ai-assistant__disclaimer">
              <i className="fas fa-info-circle"></i>
              General information only • Not medical diagnosis
            </div>
            <span className="ai-assistant__char-count">
              {inputMessage.length}/500
            </span>
          </div>
          
          <div className="ai-assistant__emergency">
            <p className="ai-assistant__emergency-text">
              <i className="fas fa-exclamation-triangle"></i>
              <strong>Emergency?</strong> Call 911 or go to your nearest emergency room
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
