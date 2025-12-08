import { useState } from 'react';

const FloatingActionButton = ({ actions = [], position = 'bottom-right' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const defaultActions = [
    { id: 'book', icon: 'fa-calendar-plus', label: 'Book Appointment', color: 'indigo' },
    { id: 'emergency', icon: 'fa-ambulance', label: 'Emergency', color: 'red' },
    { id: 'chat', icon: 'fa-comments', label: 'Chat with Doctor', color: 'emerald' },
    { id: 'ai', icon: 'fa-robot', label: 'AI Assistant', color: 'purple' }
  ];

  const displayActions = actions.length > 0 ? actions : defaultActions;

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2'
  }[position];

  const colorClasses = {
    indigo: 'bg-indigo-500 hover:bg-indigo-600',
    red: 'bg-red-500 hover:bg-red-600',
    emerald: 'bg-emerald-500 hover:bg-emerald-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
    amber: 'bg-amber-500 hover:bg-amber-600'
  };

  return (
    <div className={`fixed ${positionClasses} z-40 flex flex-col-reverse items-center gap-3`}>
      {/* Action Buttons */}
      <div className={`flex flex-col-reverse items-center gap-3 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        {displayActions.map((action, index) => (
          <button
            key={action.id}
            onClick={() => {
              if (action.onClick) action.onClick();
              setIsOpen(false);
            }}
            className={`group flex items-center gap-3 transition-all duration-300`}
            style={{ transitionDelay: `${index * 50}ms` }}
          >
            <span className="px-3 py-1.5 bg-slate-800 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
              {action.label}
            </span>
            <div className={`w-12 h-12 rounded-full ${colorClasses[action.color] || colorClasses.indigo} text-white shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform`}>
              <i className={`fas ${action.icon}`}></i>
            </div>
          </button>
        ))}
      </div>

      {/* Main FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl flex items-center justify-center transform transition-all duration-300 hover:scale-110 hover:shadow-2xl ${isOpen ? 'rotate-45' : ''}`}
      >
        <i className={`fas fa-plus text-xl transition-transform duration-300`}></i>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 -z-10" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default FloatingActionButton;
