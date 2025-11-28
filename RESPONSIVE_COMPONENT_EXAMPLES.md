# Responsive Component Examples

## Common Responsive Patterns for Your Application

### 1. Responsive Card Grid

**Desktop (3 columns) → Tablet (2 columns) → Mobile (1 column)**

```jsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: 'clamp(1rem, 3vw, 2rem)'
}}>
  {/* Cards go here */}
</div>
```

**CSS Alternative:**
```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

@media (max-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
```

### 2. Responsive Header

**Desktop (flex row) → Mobile (flex column)**

```jsx
<div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 'clamp(1rem, 2vw, 2rem)',
  padding: 'clamp(1rem, 3vw, 2rem)'
}}>
  <h1 style={{
    fontSize: 'clamp(1.5rem, 5vw, 3rem)',
    margin: 0
  }}>Title</h1>
  <button style={{
    minHeight: '48px',
    padding: '0.75rem 1.5rem',
    whiteSpace: 'nowrap'
  }}>Action</button>
</div>
```

### 3. Responsive Table

**Desktop (horizontal) → Mobile (scrollable)**

```jsx
<div style={{
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
  borderRadius: '8px'
}}>
  <table style={{
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 'clamp(0.875rem, 2vw, 1rem)'
  }}>
    {/* Table content */}
  </table>
</div>
```

### 4. Responsive Form

**Desktop (2 columns) → Mobile (1 column)**

```jsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: 'clamp(1rem, 2vw, 1.5rem)'
}}>
  <input style={{
    width: '100%',
    minHeight: '48px',
    padding: '0.75rem 1rem',
    fontSize: '16px'
  }} />
  {/* More inputs */}
</div>
```

### 5. Responsive Navigation

**Desktop (horizontal) → Mobile (hamburger)**

```jsx
<nav style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 'clamp(0.75rem, 2vw, 1.5rem)',
  flexWrap: 'wrap',
  gap: '1rem'
}}>
  <div style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', fontWeight: 'bold' }}>
    Logo
  </div>
  <ul style={{
    display: 'flex',
    gap: 'clamp(1rem, 2vw, 2rem)',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    flexWrap: 'wrap'
  }}>
    <li><a href="#home">Home</a></li>
    <li><a href="#about">About</a></li>
    <li><a href="#contact">Contact</a></li>
  </ul>
</nav>
```

### 6. Responsive Hero Section

**Desktop (large) → Mobile (compact)**

```jsx
<section style={{
  minHeight: 'clamp(400px, 100vh, 600px)',
  padding: 'clamp(2rem, 5vw, 4rem)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center'
}}>
  <div>
    <h1 style={{
      fontSize: 'clamp(2rem, 8vw, 4rem)',
      lineHeight: 1.2,
      marginBottom: '1rem'
    }}>
      Welcome
    </h1>
    <p style={{
      fontSize: 'clamp(1rem, 2vw, 1.25rem)',
      lineHeight: 1.6,
      marginBottom: '2rem'
    }}>
      Subtitle text
    </p>
    <button style={{
      padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 3vw, 2rem)',
      fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
      minHeight: '48px'
    }}>
      Get Started
    </button>
  </div>
</section>
```

### 7. Responsive Stats Display

**Desktop (4 columns) → Tablet (2 columns) → Mobile (1 column)**

```jsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: 'clamp(1rem, 2vw, 2rem)',
  padding: 'clamp(1rem, 3vw, 2rem)'
}}>
  {[
    { label: 'Users', value: '10K+' },
    { label: 'Doctors', value: '500+' },
    { label: 'Appointments', value: '50K+' },
    { label: 'Uptime', value: '99.9%' }
  ].map((stat, i) => (
    <div key={i} style={{
      textAlign: 'center',
      padding: 'clamp(1rem, 2vw, 1.5rem)',
      background: '#f0f4f8',
      borderRadius: '8px'
    }}>
      <p style={{
        fontSize: 'clamp(0.75rem, 1.5vw, 0.85rem)',
        color: '#718096',
        margin: 0,
        textTransform: 'uppercase'
      }}>
        {stat.label}
      </p>
      <p style={{
        fontSize: 'clamp(1.5rem, 4vw, 2rem)',
        fontWeight: 700,
        color: '#667eea',
        margin: '0.5rem 0 0 0'
      }}>
        {stat.value}
      </p>
    </div>
  ))}
</div>
```

### 8. Responsive Modal

**Desktop (centered) → Mobile (full-width with margins)**

```jsx
<div style={{
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
  zIndex: 1000
}}>
  <div style={{
    background: 'white',
    borderRadius: '12px',
    padding: 'clamp(1.5rem, 3vw, 2rem)',
    maxWidth: 'clamp(300px, 90vw, 500px)',
    maxHeight: '90vh',
    overflowY: 'auto',
    width: '100%'
  }}>
    {/* Modal content */}
  </div>
</div>
```

### 9. Responsive Button Group

**Desktop (horizontal) → Mobile (vertical)**

```jsx
<div style={{
  display: 'flex',
  gap: 'clamp(0.5rem, 1vw, 1rem)',
  flexWrap: 'wrap'
}}>
  <button style={{
    flex: '1 1 auto',
    minWidth: '120px',
    minHeight: '48px',
    padding: '0.75rem 1.5rem'
  }}>
    Button 1
  </button>
  <button style={{
    flex: '1 1 auto',
    minWidth: '120px',
    minHeight: '48px',
    padding: '0.75rem 1.5rem'
  }}>
    Button 2
  </button>
</div>
```

### 10. Responsive List

**Desktop (2 columns) → Mobile (1 column)**

```jsx
<ul style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 'clamp(1rem, 2vw, 1.5rem)',
  listStyle: 'none',
  margin: 0,
  padding: 0
}}>
  {items.map((item, i) => (
    <li key={i} style={{
      padding: 'clamp(1rem, 2vw, 1.5rem)',
      background: '#f0f4f8',
      borderRadius: '8px',
      fontSize: 'clamp(0.95rem, 2vw, 1rem)'
    }}>
      {item}
    </li>
  ))}
</ul>
```

### 11. Responsive Sidebar Layout

**Desktop (sidebar + content) → Mobile (stacked)**

```jsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: 'clamp(1rem, 2vw, 2rem)',
  padding: 'clamp(1rem, 3vw, 2rem)'
}}>
  <aside style={{
    padding: 'clamp(1rem, 2vw, 1.5rem)',
    background: '#f0f4f8',
    borderRadius: '8px'
  }}>
    {/* Sidebar content */}
  </aside>
  <main style={{
    padding: 'clamp(1rem, 2vw, 1.5rem)',
    background: 'white',
    borderRadius: '8px'
  }}>
    {/* Main content */}
  </main>
</div>
```

### 12. Responsive Image Gallery

**Desktop (4 columns) → Tablet (2 columns) → Mobile (1 column)**

```jsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 'clamp(1rem, 2vw, 1.5rem)',
  padding: 'clamp(1rem, 3vw, 2rem)'
}}>
  {images.map((img, i) => (
    <img
      key={i}
      src={img}
      alt={`Gallery ${i}`}
      style={{
        width: '100%',
        height: 'auto',
        aspectRatio: '1',
        objectFit: 'cover',
        borderRadius: '8px'
      }}
    />
  ))}
</div>
```

## Responsive Typography Patterns

### Heading Scaling
```jsx
<h1 style={{
  fontSize: 'clamp(1.5rem, 5vw, 3rem)',
  lineHeight: 1.2,
  marginBottom: '1rem'
}}>
  Responsive Heading
</h1>
```

### Body Text Scaling
```jsx
<p style={{
  fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)',
  lineHeight: 1.6,
  marginBottom: '1rem'
}}>
  Responsive body text
</p>
```

### Responsive Spacing
```jsx
<div style={{
  padding: 'clamp(1rem, 3vw, 2rem)',
  margin: 'clamp(1rem, 2vw, 2rem) 0',
  gap: 'clamp(0.5rem, 1vw, 1rem)'
}}>
  Content
</div>
```

## Utility Classes

### Hide/Show by Device
```css
/* Hide on mobile */
.d-none-mobile { display: none; }

/* Hide on desktop */
.d-none-desktop { display: none; }

/* Full width on mobile */
.w-100-mobile { width: 100%; }

/* Center text on mobile */
.text-center-mobile { text-align: center; }
```

## Best Practices

1. **Use clamp() for typography**
   ```css
   font-size: clamp(min, preferred, max);
   ```

2. **Use auto-fit for grids**
   ```css
   grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
   ```

3. **Use flexWrap for flexibility**
   ```css
   flexWrap: 'wrap';
   ```

4. **Use minHeight for touch targets**
   ```css
   minHeight: '48px';
   ```

5. **Use proper overflow handling**
   ```css
   overflow: hidden;
   textOverflow: 'ellipsis';
   whiteSpace: 'nowrap';
   ```

## Testing These Patterns

1. **Desktop (1025px+)**
   - Full layouts
   - Multiple columns
   - Hover effects

2. **Tablet (769px - 1024px)**
   - 2-column layouts
   - Adjusted spacing
   - Touch-friendly

3. **Mobile (≤768px)**
   - Single column
   - Full-width elements
   - Compact spacing

4. **Small Mobile (≤576px)**
   - Extra compact
   - Minimal padding
   - Readable text

## Performance Tips

1. Use CSS Grid and Flexbox
2. Minimize media queries
3. Use clamp() for smooth scaling
4. Lazy load images
5. Optimize images for mobile
6. Minimize CSS
7. Use CSS variables
8. Avoid inline styles when possible

## Accessibility Tips

1. Ensure 48px minimum tap targets
2. Use proper heading hierarchy
3. Maintain good contrast
4. Use semantic HTML
5. Include focus indicators
6. Test with keyboard navigation
7. Test with screen readers
8. Provide alt text for images

---

**Use these patterns as templates for your components!**
