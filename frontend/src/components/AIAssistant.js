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
    const [isOnline, setIsOnline] = useState(true);
    const [messageCount, setMessageCount] = useState(1);
    const chatContainerRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    // Predefined responses for common health queries
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
            handleEmergencyInfo();
            return '';
        }

        // Default response
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

        // Simulate AI thinking time with variable delay
        const thinkingTime = Math.random() * 1000 + 1000; // 1-2 seconds
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
        "Tips for managing headaches",
        "Healthy diet recommendations",
        "Exercise guidelines",
        "Medication reminders",
        "Emergency contacts"
    ];

    const handleEmergencyInfo = () => {
        const emergencyMessage = {
            id: Date.now(),
            type: 'ai',
            content: `🚨 EMERGENCY CONTACTS & INFORMATION:

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

📞 NON-EMERGENCY MEDICAL HELP:
• Nurse hotline: Many insurance providers offer 24/7 nurse lines
• Urgent care centers for non-life-threatening issues
• Telemedicine consultations

⚠️ Remember: When in doubt, always err on the side of caution and seek professional medical help immediately.`,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, emergencyMessage]);
    };

    return (
        <div className="card shadow-sm ai-assistant-card">
            <div className="card-header ai-header-gradient position-relative">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h4 className="mb-0 text-white">
                            <i className="fas fa-robot me-2"></i>
                            AI Health Assistant
                            <span className={`status-indicator ms-2 ${isOnline ? 'online' : 'offline'}`}></span>
                        </h4>
                        <small className="text-white-50">
                            {isOnline ? 'Online • Ready to help' : 'Offline • Reconnecting...'}
                        </small>
                    </div>
                    <div className="ai-stats text-white-50">
                        <small>
                            <i className="fas fa-comments me-1"></i>
                            {messageCount} messages
                        </small>
                    </div>
                </div>
            </div>

            <div className="card-body p-0">
                {/* Chat Messages */}
                <div
                    ref={chatContainerRef}
                    className="chat-container"
                    style={{ height: '400px', overflowY: 'auto', padding: '1rem' }}
                >
                    {messages.map((message) => (
                        <div key={message.id} className={`mb-3 d-flex message-bubble ${message.type === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                            <div className={`max-width-75 ${message.type === 'user' ? 'text-end' : 'text-start'}`} style={{ maxWidth: '75%' }}>
                                <div className={`p-3 rounded-3 ${message.type === 'user'
                                    ? 'bg-primary text-white'
                                    : 'bg-light border'}`}>
                                    <div style={{ whiteSpace: 'pre-line', fontSize: '0.9rem' }}>
                                        {message.content}
                                    </div>
                                </div>
                                <small className="text-muted d-block mt-1">
                                    {message.timestamp.toLocaleTimeString()}
                                </small>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="mb-3 d-flex justify-content-start">
                            <div className="bg-light border p-3 rounded-3 ai-thinking">
                                <div className="typing-indicator">
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
                <div className="border-top p-3 bg-light">
                    <small className="text-muted d-block mb-2">Quick questions:</small>
                    <div className="d-flex flex-wrap gap-2">
                        {quickQuestions.map((question, index) => (
                            <button
                                key={index}
                                className="btn btn-sm btn-outline-secondary quick-question-btn"
                                onClick={() => {
                                    if (question === "Emergency contacts") {
                                        handleEmergencyInfo();
                                    } else {
                                        setInputMessage(question);
                                    }
                                }}
                            >
                                {question}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Input Area */}
                <div className="border-top p-3 ai-input-area">
                    <div className="input-group">
                        <div className="input-group-text bg-light border-end-0">
                            <i className="fas fa-user text-muted"></i>
                        </div>
                        <textarea
                            className="form-control ai-input border-start-0"
                            placeholder="Ask me about health tips, symptoms, or how to use this system..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows="2"
                            style={{ resize: 'none' }}
                            disabled={!isOnline}
                        />
                        <button
                            className="btn btn-primary send-btn position-relative"
                            onClick={handleSendMessage}
                            disabled={!inputMessage.trim() || isTyping || !isOnline}
                        >
                            {isTyping ? (
                                <div className="spinner-border spinner-border-sm" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            ) : (
                                <i className="fas fa-paper-plane"></i>
                            )}
                        </button>
                    </div>
                    
                    {/* Character Counter */}
                    <div className="d-flex justify-content-between align-items-center mt-2">
                        <div className="disclaimer-text">
                            <small className="text-muted">
                                <i className="fas fa-info-circle me-1"></i>
                                General information only • Not medical diagnosis
                            </small>
                        </div>
                        <small className="text-muted">
                            {inputMessage.length}/500
                        </small>
                    </div>
                    
                    {/* Emergency Banner */}
                    <div className="emergency-banner mt-2 p-2 bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded">
                        <small className="text-danger">
                            <i className="fas fa-exclamation-triangle me-1"></i>
                            <strong>Emergency?</strong> Call 911 or go to your nearest emergency room
                        </small>
                    </div>
                </div>
            </div>


        </div>
    );
};

export default AIAssistant;
