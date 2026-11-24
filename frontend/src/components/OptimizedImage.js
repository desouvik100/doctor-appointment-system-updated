import React, { useState } from 'react';

/**
 * OptimizedImage Component
 * 
 * Automatically handles:
 * - WebP format with fallback
 * - Lazy loading
 * - Async decoding
 * - Loading placeholder
 * - Error handling
 * 
 * Usage:
 * <OptimizedImage
 *   src="image.jpg"
 *   alt="Description"
 *   width={800}
 *   height={600}
 *   lazy={true}
 * />
 */

const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  lazy = true,
  placeholder = null,
  onLoad = () => {},
  onError = () => {},
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Generate WebP source path
  const getWebPSrc = (originalSrc) => {
    if (!originalSrc) return null;
    const ext = originalSrc.split('.').pop();
    return originalSrc.replace(`.${ext}`, '.webp');
  };

  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad(e);
  };

  const handleError = (e) => {
    setHasError(true);
    onError(e);
  };

  // If error, show placeholder or nothing
  if (hasError) {
    return placeholder || (
      <div 
        className={`image-placeholder ${className}`}
        style={{ 
          width, 
          height, 
          background: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999'
        }}
      >
        <i className="fas fa-image"></i>
      </div>
    );
  }

  return (
    <picture className={className}>
      {/* WebP version for modern browsers */}
      <source 
        srcSet={getWebPSrc(src)} 
        type="image/webp" 
      />
      
      {/* Original format as fallback */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`optimized-image ${isLoaded ? 'loaded' : 'loading'}`}
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
        {...props}
      />
      
      {/* Loading placeholder */}
      {!isLoaded && placeholder}
    </picture>
  );
};

export default OptimizedImage;

/**
 * Example Usage:
 * 
 * // Basic usage
 * <OptimizedImage
 *   src="/images/hero.jpg"
 *   alt="Hero image"
 *   width={1200}
 *   height={600}
 * />
 * 
 * // With custom placeholder
 * <OptimizedImage
 *   src="/images/product.jpg"
 *   alt="Product"
 *   width={400}
 *   height={400}
 *   placeholder={<div className="skeleton-loader" />}
 * />
 * 
 * // Eager loading (above the fold)
 * <OptimizedImage
 *   src="/images/logo.jpg"
 *   alt="Logo"
 *   width={200}
 *   height={100}
 *   lazy={false}
 * />
 */
