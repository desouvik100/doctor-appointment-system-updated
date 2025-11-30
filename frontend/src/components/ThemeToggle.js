import { useTheme } from '../contexts/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button 
      className="theme-toggle" 
      onClick={toggleTheme}
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div className={`theme-toggle__track ${isDarkMode ? 'theme-toggle__track--dark' : ''}`}>
        <div className="theme-toggle__thumb">
          {isDarkMode ? (
            <i className="fas fa-moon"></i>
          ) : (
            <i className="fas fa-sun"></i>
          )}
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;
