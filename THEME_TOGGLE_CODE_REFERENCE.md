# Theme Toggle - Code Reference 💻

## Quick Code Snippets

### 1. Theme State Management

```javascript
// Initialize theme from localStorage
const [darkMode, setDarkMode] = useState(() => {
  const saved = localStorage.getItem('darkMode');
  return saved === 'true';
});

// Apply theme on mount and when it changes
useEffect(() => {
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
}, [darkMode]);
```

### 2. Toggle Function

```javascript
const toggleDarkMode = useCallback(() => {
  setDarkMode(prev => {
    const newMode = !prev;
    localStorage.setItem('darkMode', newMode);
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
    toast.success(`Switched to ${newMode ? 'Dark' : 'Light'} mode`);
    return newMode;
  });
}, []);
```

### 3. Floating Toggle Button

```jsx
<button
  className="theme-toggle-btn"
  onClick={toggleDarkMode}
  title={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode (Ctrl+D)`}
  aria-label={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode`}
  style={{
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: darkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    border: darkMode ? '3px solid rgba(102, 126, 234, 0.5)' : '3px solid rgba(255, 255, 255, 0.5)',
    color: darkMode ? '#fbbf24' : '#667eea',
    fontSize: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 9999,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transition: 'all 0.3s ease',
    border: 'none'
  }}
>
  <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
</button>
```

### 4. Navbar Toggle Button

```jsx
<button
  className="btn navbar-theme-toggle"
  onClick={toggleDarkMode}
  title={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode (Ctrl+D)`}
  aria-label={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode`}
  style={{
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.2)',
    border: '2px solid rgba(255, 255, 255, 0.4)',
    color: '#ffffff',
    fontSize: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease'
  }}
>
  <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
</button>
```

### 5. Keyboard Shortcut

```javascript
useEffect(() => {
  const handleKeyPress = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      toggleDarkMode();
    }
  };

  document.addEventListener('keydown', handleKeyPress);
  return () => document.removeEventListener('keydown', handleKeyPress);
}, [toggleDarkMode]);
```

### 6. CSS Theme Variables

```css
/* Light Theme Variables */
[data-theme="light"] {
  --bg-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.9);
  --card-bg: #ffffff;
  --card-text: #1e293b;
  --button-primary-bg: #ffffff;
  --button-primary-text: #667eea;
}

/* Dark Theme Variables */
[data-theme="dark"] {
  --bg-gradient: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  --text-primary: #f1f5f9;
  --text-secondary: rgba(241, 245, 249, 0.9);
  --card-bg: rgba(30, 41, 59, 0.95);
  --card-text: #f1f5f9;
  --button-primary-bg: #667eea;
  --button-primary-text: #ffffff;
}
```

### 7. Using Theme Variables in CSS

```css
body {
  background: var(--bg-gradient);
  color: var(--text-primary);
}

.card {
  background: var(--card-bg);
  color: var(--card-text);
}

.btn-primary {
  background: var(--button-primary-bg);
  color: var(--button-primary-text);
}
```

### 8. Conditional Styling in JSX

```jsx
<div className={`min-vh-100 ${darkMode ? 'dark-theme' : 'medical-bg'}`}>
  {/* Content */}
</div>
```

### 9. Toast Notification

```javascript
import toast from 'react-hot-toast';

// Success notification
toast.success('Switched to Dark mode');

// Error notification
toast.error('Something went wrong');

// Custom notification
toast('Theme changed', {
  icon: '🌓',
  duration: 3000
});
```

### 10. Check Current Theme

```javascript
// From React state
const isDarkMode = darkMode;

// From DOM
const currentTheme = document.documentElement.getAttribute('data-theme');
const isDark = currentTheme === 'dark';

// From localStorage
const savedTheme = localStorage.getItem('darkMode');
const isDarkSaved = savedTheme === 'true';
```

## Complete Component Example

```jsx
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

function ThemeToggleExample() {
  // Initialize theme from localStorage
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  // Apply theme on mount and changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Toggle function
  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('darkMode', newMode);
      document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
      toast.success(`Switched to ${newMode ? 'Dark' : 'Light'} mode`);
      return newMode;
    });
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        toggleDarkMode();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [toggleDarkMode]);

  return (
    <div>
      {/* Floating Toggle Button */}
      <button
        onClick={toggleDarkMode}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: darkMode ? '#1e293b' : '#ffffff',
          color: darkMode ? '#fbbf24' : '#667eea',
          border: 'none',
          fontSize: '1.5rem',
          cursor: 'pointer',
          zIndex: 9999,
          transition: 'all 0.3s ease'
        }}
      >
        <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
      </button>

      {/* Your content */}
      <div className="content">
        <h1>Theme Toggle Example</h1>
        <p>Current theme: {darkMode ? 'Dark' : 'Light'}</p>
      </div>
    </div>
  );
}

export default ThemeToggleExample;
```

## Utility Functions

### 1. Get Current Theme

```javascript
export const getCurrentTheme = () => {
  return document.documentElement.getAttribute('data-theme') || 'light';
};
```

### 2. Set Theme

```javascript
export const setTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('darkMode', theme === 'dark');
};
```

### 3. Toggle Theme

```javascript
export const toggleTheme = () => {
  const current = getCurrentTheme();
  const newTheme = current === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  return newTheme;
};
```

### 4. Get Saved Theme

```javascript
export const getSavedTheme = () => {
  const saved = localStorage.getItem('darkMode');
  return saved === 'true' ? 'dark' : 'light';
};
```

### 5. Detect System Theme

```javascript
export const getSystemTheme = () => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};
```

## CSS Animations

### 1. Hover Effect

```css
.theme-toggle-btn {
  transition: all 0.3s ease;
}

.theme-toggle-btn:hover {
  transform: scale(1.1) rotate(15deg);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}
```

### 2. Smooth Color Transition

```css
* {
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

### 3. Icon Rotation

```css
.theme-icon {
  transition: transform 0.3s ease;
}

.theme-toggle-btn:hover .theme-icon {
  transform: rotate(180deg);
}
```

## Testing Code

### 1. Test Theme Toggle

```javascript
// Test in browser console
const testThemeToggle = () => {
  console.log('Initial theme:', getCurrentTheme());
  
  // Toggle theme
  toggleTheme();
  console.log('After toggle:', getCurrentTheme());
  
  // Check localStorage
  console.log('Saved in localStorage:', localStorage.getItem('darkMode'));
  
  // Check DOM attribute
  console.log('DOM attribute:', document.documentElement.getAttribute('data-theme'));
};

testThemeToggle();
```

### 2. Test Persistence

```javascript
// Test in browser console
const testPersistence = () => {
  // Set dark mode
  setTheme('dark');
  console.log('Set to dark, refreshing...');
  
  // Refresh page
  setTimeout(() => {
    location.reload();
  }, 1000);
  
  // After refresh, check theme
  window.addEventListener('load', () => {
    console.log('After refresh:', getCurrentTheme());
  });
};

testPersistence();
```

### 3. Test Keyboard Shortcut

```javascript
// Test in browser console
const testKeyboardShortcut = () => {
  console.log('Press Ctrl+D to toggle theme');
  
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      console.log('Keyboard shortcut triggered!');
      console.log('Theme before:', getCurrentTheme());
      // Toggle will happen automatically
      setTimeout(() => {
        console.log('Theme after:', getCurrentTheme());
      }, 100);
    }
  });
};

testKeyboardShortcut();
```

## Debugging

### 1. Check Theme State

```javascript
// In browser console
console.log('React State:', darkMode);
console.log('DOM Attribute:', document.documentElement.getAttribute('data-theme'));
console.log('localStorage:', localStorage.getItem('darkMode'));
console.log('CSS Variables:', getComputedStyle(document.documentElement).getPropertyValue('--bg-gradient'));
```

### 2. Force Theme

```javascript
// Force light mode
document.documentElement.setAttribute('data-theme', 'light');
localStorage.setItem('darkMode', 'false');

// Force dark mode
document.documentElement.setAttribute('data-theme', 'dark');
localStorage.setItem('darkMode', 'true');
```

### 3. Clear Theme

```javascript
// Reset to default
localStorage.removeItem('darkMode');
document.documentElement.removeAttribute('data-theme');
location.reload();
```

## Common Issues & Solutions

### Issue 1: Theme not persisting
```javascript
// Solution: Check localStorage
if (!localStorage.getItem('darkMode')) {
  console.error('localStorage not working');
  // Use cookies as fallback
  document.cookie = `darkMode=${darkMode}; max-age=31536000`;
}
```

### Issue 2: Flash of wrong theme
```javascript
// Solution: Apply theme before React renders
// Add to index.html <head>
<script>
  const savedTheme = localStorage.getItem('darkMode');
  if (savedTheme === 'true') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
</script>
```

### Issue 3: CSS variables not updating
```javascript
// Solution: Force CSS recalculation
document.documentElement.style.display = 'none';
document.documentElement.offsetHeight; // Trigger reflow
document.documentElement.style.display = '';
```

---

**Quick Reference:**
- State: `darkMode` (boolean)
- Toggle: `toggleDarkMode()`
- DOM Attribute: `data-theme="light|dark"`
- localStorage Key: `darkMode`
- Keyboard: `Ctrl+D` or `Cmd+D`
- Icons: Moon (🌙) for light, Sun (☀️) for dark
