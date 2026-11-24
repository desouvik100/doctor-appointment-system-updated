import { useState } from 'react';
import AIChatbot from './AIChatbot';
import './AIChatbot.css';

const AIChatbotWidget = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button 
          className="chatbot-fab"
          onClick={() => setIsOpen(true)}
          title="Chat with AI Assistant"
        >
          <i className="fas fa-robot"></i>
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <AIChatbot 
          userId={userId} 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </>
  );
};

export default AIChatbotWidget;
