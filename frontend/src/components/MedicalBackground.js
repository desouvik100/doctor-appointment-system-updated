import React from 'react';

const MedicalBackground = ({ children, variant = 'default' }) => {
  const getBackgroundStyle = () => {
    switch (variant) {
      case 'hero':
        return {
          background: `
            linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(255, 255, 255, 0.95) 30%, rgba(72, 187, 120, 0.06) 70%, rgba(255, 255, 255, 0.95) 100%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Cdefs%3E%3Cpattern id='medical-grid' x='0' y='0' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M18,10 L22,10 M20,8 L20,12' stroke='%23667eea' stroke-width='1' opacity='0.1'/%3E%3Ccircle cx='20' cy='20' r='1' fill='%23667eea' opacity='0.05'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23medical-grid)'/%3E%3C/svg%3E")
          `,
          backgroundSize: 'cover, 80px 80px',
          backgroundAttachment: 'fixed, scroll',
          position: 'relative',
          minHeight: '100vh'
        };
      
      case 'dashboard':
        return {
          background: `
            linear-gradient(145deg, rgba(248, 250, 252, 0.98) 0%, rgba(226, 232, 240, 0.95) 100%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cdefs%3E%3Cpattern id='stethoscope-pattern' x='0' y='0' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='30' cy='30' r='8' fill='none' stroke='%23667eea' stroke-width='1.5' opacity='0.08'/%3E%3Cpath d='M30,38 Q30,55 45,55 Q60,55 60,40' fill='none' stroke='%23667eea' stroke-width='1.5' opacity='0.08'/%3E%3Ccircle cx='70' cy='70' r='6' fill='none' stroke='%2348bb78' stroke-width='1' opacity='0.06'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='200' height='200' fill='url(%23stethoscope-pattern)'/%3E%3C/svg%3E")
          `,
          backgroundSize: 'cover, 200px 200px',
          position: 'relative',
          minHeight: '100vh'
        };
      
      case 'auth':
        return {
          background: `
            linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(255, 255, 255, 0.98) 50%, rgba(72, 187, 120, 0.03) 100%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3Cdefs%3E%3Cpattern id='heartbeat' x='0' y='0' width='150' height='50' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0,25 L20,25 L30,15 L40,35 L50,10 L60,40 L70,25 L150,25' fill='none' stroke='%23667eea' stroke-width='1' opacity='0.1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='300' height='300' fill='url(%23heartbeat)'/%3E%3C/svg%3E")
          `,
          backgroundSize: 'cover, 300px 100px',
          position: 'relative',
          minHeight: '100vh'
        };
      
      default:
        return {
          background: `
            linear-gradient(135deg, #f8fafc 0%, #e2e8f0 20%, #f1f5f9 40%, #ffffff 60%, #f8fafc 80%, #e2e8f0 100%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3Cpattern id='medical-dots' x='0' y='0' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='10' cy='10' r='1' fill='%23667eea' opacity='0.1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23medical-dots)'/%3E%3C/svg%3E")
          `,
          backgroundSize: 'cover, 40px 40px',
          position: 'relative',
          minHeight: '100vh'
        };
    }
  };

  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      radial-gradient(circle at 20% 30%, rgba(102, 126, 234, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(72, 187, 120, 0.06) 0%, transparent 50%),
      radial-gradient(circle at 40% 80%, rgba(237, 137, 54, 0.04) 0%, transparent 50%)
    `,
    pointerEvents: 'none',
    opacity: 0.7
  };

  const floatingElementsStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Ccircle cx='100' cy='100' r='3' fill='%23667eea' opacity='0.1'%3E%3Canimate attributeName='opacity' values='0.1;0.3;0.1' dur='4s' repeatCount='indefinite'/%3E%3C/circle%3E%3Ccircle cx='300' cy='150' r='2' fill='%2348bb78' opacity='0.1'%3E%3Canimate attributeName='opacity' values='0.1;0.25;0.1' dur='6s' repeatCount='indefinite'/%3E%3C/circle%3E%3Ccircle cx='200' cy='300' r='1.5' fill='%23ed8936' opacity='0.1'%3E%3Canimate attributeName='opacity' values='0.1;0.2;0.1' dur='5s' repeatCount='indefinite'/%3E%3C/circle%3E%3Cpath d='M50,50 L60,50 M55,45 L55,55' stroke='%23667eea' stroke-width='1' opacity='0.08'%3E%3CanimateTransform attributeName='transform' type='rotate' values='0 55 50;360 55 50' dur='20s' repeatCount='indefinite'/%3E%3C/path%3E%3C/svg%3E")`,
    backgroundSize: '400px 400px',
    pointerEvents: 'none',
    opacity: 0.6
  };

  return (
    <div style={getBackgroundStyle()}>
      {variant === 'hero' && <div style={overlayStyle}></div>}
      {variant === 'hero' && <div style={floatingElementsStyle}></div>}
      {children}
    </div>
  );
};

export default MedicalBackground;