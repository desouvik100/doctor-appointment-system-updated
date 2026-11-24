// Theme initialization utility
// This ensures theme is applied immediately on page load to prevent flash

(function() {
  // Get saved theme or detect system preference
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('healthsync-theme');
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      return savedTheme;
    }
    
    // Default to auto mode
    return 'auto';
  };

  // Apply theme immediately
  const applyTheme = (theme) => {
    const root = document.documentElement;
    
    if (theme === 'auto') {
      // Remove data-theme to use CSS media query
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
  };

  // Initialize theme
  const initialTheme = getInitialTheme();
  applyTheme(initialTheme);

  // Listen for system theme changes in auto mode
  if (initialTheme === 'auto') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      // Re-apply auto theme when system preference changes
      if (localStorage.getItem('healthsync-theme') === 'auto') {
        applyTheme('auto');
      }
    });
  }

  // Prevent flash of unstyled content
  document.documentElement.style.visibility = 'visible';
})();