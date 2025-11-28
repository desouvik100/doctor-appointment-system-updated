# HealthSync Pro - Design System Quick Start

## 🚀 Get Started in 5 Minutes

### 1. Import the Master Stylesheet

Already done in `App.js`:
```javascript
import './styles/professional-master.css';
```

### 2. Use Pre-built Components

#### Buttons
```jsx
// Primary gradient button
<button className="btn btn-primary">
  <i className="fas fa-check"></i>
  Save Changes
</button>

// Outline button
<button className="btn btn-outline btn-pill">
  Cancel
</button>

// Large button
<button className="btn btn-primary btn-lg btn-block">
  Get Started
</button>
```

#### Cards
```jsx
// Glass card with hover effect
<div className="card card-glass card-hover-lift">
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</div>

// Gradient card
<div className="card card-gradient">
  <h3>Premium Feature</h3>
</div>
```

#### Forms
```jsx
<div className="form-group">
  <label className="form-label">Email Address</label>
  <input 
    type="email" 
    className="form-control form-control-pill" 
    placeholder="you@example.com"
  />
</div>
```

#### Badges
```jsx
<span className="badge badge-success">Active</span>
<span className="badge badge-warning">Pending</span>
<span className="badge badge-gradient">Premium</span>
```

### 3. Common Layouts

#### Centered Container
```jsx
<div className="d-flex justify-center align-center" style={{minHeight: '100vh'}}>
  <div className="card" style={{maxWidth: '500px', width: '100%'}}>
    {/* Your content */}
  </div>
</div>
```

#### Grid Layout
```jsx
<div className="d-grid" style={{gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-6)'}}>
  <div className="card">Card 1</div>
  <div className="card">Card 2</div>
  <div className="card">Card 3</div>
</div>
```

#### Flex Row
```jsx
<div className="d-flex justify-between align-center gap-4">
  <h2>Page Title</h2>
  <button className="btn btn-primary">Action</button>
</div>
```

### 4. Color System

```jsx
// Text colors
<p className="text-primary">Primary text</p>
<p className="text-secondary">Secondary text</p>
<p className="text-muted">Muted text</p>
<p className="text-gradient">Gradient text</p>

// Backgrounds
<div className="bg-gradient">Gradient background</div>
```

### 5. Spacing

```jsx
// Margins
<div className="mt-4 mb-6">Content with margins</div>

// Padding
<div className="p-6">Content with padding</div>

// Gaps (for flex/grid)
<div className="d-flex gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### 6. Responsive Utilities

```jsx
// Hide on mobile
<div className="sm-hidden">Desktop only</div>

// Show on mobile
<div className="sm-block md-hidden">Mobile only</div>
```

## 🎨 Most Used Classes

### Layout
- `d-flex` - Flexbox container
- `d-grid` - Grid container
- `justify-center` - Center horizontally
- `align-center` - Center vertically
- `gap-4` - Add gap between items

### Buttons
- `btn btn-primary` - Primary button
- `btn btn-outline` - Outline button
- `btn btn-pill` - Pill-shaped button
- `btn btn-lg` - Large button
- `btn btn-block` - Full-width button

### Cards
- `card` - Basic card
- `card-glass` - Glass effect
- `card-hover-lift` - Lift on hover
- `card-gradient` - Gradient background

### Forms
- `form-control` - Input field
- `form-control-pill` - Pill-shaped input
- `form-label` - Form label

### Text
- `text-center` - Center text
- `text-gradient` - Gradient text
- `text-muted` - Muted text

### Spacing
- `mt-4`, `mb-4` - Margin top/bottom
- `p-4`, `p-6` - Padding
- `gap-4` - Gap between flex/grid items

## 💡 Pro Tips

### 1. Combine Classes
```jsx
<button className="btn btn-primary btn-lg btn-pill hover-lift">
  Premium Button
</button>
```

### 2. Use CSS Variables
```jsx
<div style={{
  padding: 'var(--space-6)',
  borderRadius: 'var(--radius-xl)',
  boxShadow: 'var(--shadow-lg)'
}}>
  Custom styled div
</div>
```

### 3. Animations
```jsx
<div className="card animate-slide-up">
  Animated card
</div>
```

### 4. Loading States
```jsx
{loading ? (
  <div className="d-flex justify-center p-6">
    <div className="spinner"></div>
  </div>
) : (
  <div>Content</div>
)}
```

### 5. Alerts
```jsx
<div className="alert alert-success">
  <div className="alert-icon">✓</div>
  <div className="alert-content">
    <div className="alert-title">Success!</div>
    <div>Your changes have been saved.</div>
  </div>
</div>
```

## 🎯 Common Patterns

### Modal
```jsx
<div className="modal-backdrop">
  <div className="modal">
    <div className="modal-header">
      <h3 className="modal-title">Modal Title</h3>
      <button className="modal-close">×</button>
    </div>
    <div className="modal-body">
      Modal content
    </div>
    <div className="modal-footer">
      <button className="btn btn-ghost">Cancel</button>
      <button className="btn btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

### Stat Card
```jsx
<div className="card card-hover-lift">
  <div className="d-flex align-center gap-4">
    <div className="avatar avatar-lg bg-gradient">
      <i className="fas fa-users"></i>
    </div>
    <div>
      <div style={{fontSize: 'var(--text-4xl)', fontWeight: 'var(--font-bold)'}}>
        1,234
      </div>
      <div className="text-muted">Total Users</div>
    </div>
  </div>
</div>
```

### Search Bar
```jsx
<div className="form-group">
  <div style={{position: 'relative'}}>
    <i className="fas fa-search" style={{
      position: 'absolute',
      left: 'var(--space-4)',
      top: '50%',
      transform: 'translateY(-50%)',
      color: 'var(--text-muted)'
    }}></i>
    <input 
      type="text"
      className="form-control form-control-pill"
      placeholder="Search..."
      style={{paddingLeft: 'var(--space-12)'}}
    />
  </div>
</div>
```

## 📱 Responsive Example

```jsx
<div className="d-grid" style={{
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: 'var(--space-6)'
}}>
  <div className="card">Card 1</div>
  <div className="card">Card 2</div>
  <div className="card">Card 3</div>
</div>
```

## 🎨 Color Variables

```css
var(--primary-start)    /* #667eea */
var(--success)          /* #10b981 */
var(--warning)          /* #f59e0b */
var(--error)            /* #ef4444 */
var(--text-primary)     /* #1a202c */
var(--text-secondary)   /* #4a5568 */
var(--text-muted)       /* #a0aec0 */
```

## 🚀 Ready to Use!

Your design system is now active. Start building beautiful, consistent UIs with these pre-built components and utilities!

For more details, see `PROFESSIONAL_DESIGN_SYSTEM.md`
