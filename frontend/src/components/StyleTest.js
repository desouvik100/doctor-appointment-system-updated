import React from 'react';

const StyleTest = () => {
  return (
    <div style={{ padding: '40px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Test Card */}
        <div className="card card-glass" style={{ marginBottom: '30px', padding: '40px' }}>
          <h1 className="text-gradient" style={{ fontSize: '48px', fontWeight: '800', marginBottom: '20px' }}>
            🎨 Style Test Page
          </h1>
          <p style={{ fontSize: '18px', color: '#4a5568' }}>
            If you can see this card with a glass effect and gradient text, the styling is working!
          </p>
        </div>

        {/* Test Buttons */}
        <div className="card" style={{ marginBottom: '30px', padding: '40px' }}>
          <h2 style={{ marginBottom: '20px' }}>Button Tests</h2>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary">Primary Button</button>
            <button className="btn btn-secondary">Secondary Button</button>
            <button className="btn btn-outline">Outline Button</button>
            <button className="btn btn-ghost">Ghost Button</button>
            <button className="btn btn-primary btn-pill">Pill Button</button>
            <button className="btn btn-primary btn-lg">Large Button</button>
          </div>
        </div>

        {/* Test Form */}
        <div className="card" style={{ marginBottom: '30px', padding: '40px' }}>
          <h2 style={{ marginBottom: '20px' }}>Form Tests</h2>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-control" 
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Pill Input</label>
            <input 
              type="text" 
              className="form-control form-control-pill" 
              placeholder="Pill-shaped input"
            />
          </div>
        </div>

        {/* Test Badges */}
        <div className="card" style={{ marginBottom: '30px', padding: '40px' }}>
          <h2 style={{ marginBottom: '20px' }}>Badge Tests</h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <span className="badge badge-primary">Primary</span>
            <span className="badge badge-success">Success</span>
            <span className="badge badge-warning">Warning</span>
            <span className="badge badge-error">Error</span>
            <span className="badge badge-info">Info</span>
            <span className="badge badge-gradient">Gradient</span>
          </div>
        </div>

        {/* Test Avatars */}
        <div className="card" style={{ marginBottom: '30px', padding: '40px' }}>
          <h2 style={{ marginBottom: '20px' }}>Avatar Tests</h2>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div className="avatar avatar-xs">XS</div>
            <div className="avatar avatar-sm">SM</div>
            <div className="avatar avatar-md">MD</div>
            <div className="avatar avatar-lg">LG</div>
            <div className="avatar avatar-xl">XL</div>
          </div>
        </div>

        {/* Test Alert */}
        <div className="alert alert-success">
          <div className="alert-icon">✓</div>
          <div className="alert-content">
            <div className="alert-title">Success!</div>
            <div>Your styling is working perfectly!</div>
          </div>
        </div>

        {/* Test Loading */}
        <div className="card" style={{ marginBottom: '30px', padding: '40px', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '20px' }}>Loading Spinner Test</h2>
          <div className="spinner"></div>
        </div>

        {/* Instructions */}
        <div className="card card-gradient" style={{ padding: '40px', color: 'white' }}>
          <h2 style={{ marginBottom: '20px' }}>✅ If you can see all these styled elements:</h2>
          <ul style={{ fontSize: '18px', lineHeight: '1.8' }}>
            <li>Glass effect cards</li>
            <li>Gradient text and backgrounds</li>
            <li>Styled buttons with hover effects</li>
            <li>Professional form inputs</li>
            <li>Colorful badges</li>
            <li>Gradient avatars</li>
            <li>Success alert</li>
            <li>Spinning loader</li>
          </ul>
          <p style={{ fontSize: '20px', fontWeight: '600', marginTop: '20px' }}>
            🎉 Then your styling is working perfectly!
          </p>
        </div>

      </div>
    </div>
  );
};

export default StyleTest;
