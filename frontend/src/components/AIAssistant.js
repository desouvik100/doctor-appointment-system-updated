import React, { useState, useEffect, useRef } from 'react';

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
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-4 lg:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <i className="fas fa-robot text-white text-xl"></i>
            </div>
            <div>
              <h4 className="text-white font-bold flex items-center gap-2">
                AI Health Assistant
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </h4>
              <p className="text-indigo-100 text-sm">
                {isOnline ? 'Online • Ready to help' : 'Offline • Reconnecting...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg text-white text-sm">
            <i className="fas fa-comments"></i>
            {messageCount} messages
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 bg-slate-50" ref={chatContainerRef}>
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] lg:max-w-[70%] ${message.type === 'user' ? 'order-1' : ''}`}>
              <div className={`rounded-2xl px-4 py-3 ${
                message.type === 'user' 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-md' 
                  : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md shadow-sm'
              }`}>
                <div style={{ whiteSpace: 'pre-line' }} className="text-sm leading-relaxed">
                  {message.content}
                </div>
              </div>
              <div className={`text-xs text-slate-400 mt-1 ${message.type === 'user' ? 'text-right' : ''}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                AI is typing...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Questions */}
      <div className="px-4 py-3 bg-white border-t border-slate-100">
        <span className="text-xs font-medium text-slate-500 mb-2 block">Quick questions:</span>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 text-slate-600 text-xs font-medium rounded-lg transition-colors"
              onClick={() => setInputMessage(question)}
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <div className="absolute left-4 top-3 text-indigo-400">
              <i className="fas fa-comment-medical"></i>
            </div>
            <textarea
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Ask me about health tips, symptoms, or how to use this system..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows="1"
              disabled={!isOnline}
            />
          </div>
          <button
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              inputMessage.trim() && !isTyping && isOnline
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
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
        
        <div className="flex items-center justify-between mt-3 text-xs">
          <div className="flex items-center gap-1 text-slate-400">
            <i className="fas fa-info-circle"></i>
            General information only • Not medical diagnosis
          </div>
          <span className="text-slate-400">
            {inputMessage.length}/500
          </span>
        </div>
        
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-600 text-xs font-medium flex items-center gap-2">
            <i className="fas fa-exclamation-triangle"></i>
            <span><strong>Emergency?</strong> Call 911 or go to your nearest emergency room</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
