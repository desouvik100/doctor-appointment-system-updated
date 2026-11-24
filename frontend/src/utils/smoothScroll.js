// Professional Smooth Scrolling Utilities

/**
 * Smooth scroll to element with professional easing
 * @param {string|Element} target - CSS selector or DOM element
 * @param {Object} options - Scroll options
 */
export const smoothScrollTo = (target, options = {}) => {
  const defaultOptions = {
    behavior: 'smooth',
    block: 'start',
    inline: 'nearest',
    offset: 80 // Account for fixed headers
  };

  const scrollOptions = { ...defaultOptions, ...options };
  
  let element;
  if (typeof target === 'string') {
    element = document.querySelector(target);
  } else {
    element = target;
  }

  if (element) {
    // Calculate offset position
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - scrollOptions.offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: scrollOptions.behavior
    });
  }
};

/**
 * Smooth scroll to top of page
 * @param {Object} options - Scroll options
 */
export const smoothScrollToTop = (options = {}) => {
  const defaultOptions = {
    behavior: 'smooth',
    top: 0,
    left: 0
  };

  const scrollOptions = { ...defaultOptions, ...options };
  
  window.scrollTo(scrollOptions);
};

/**
 * Smooth scroll within container
 * @param {Element} container - Container element
 * @param {string|Element} target - Target element
 * @param {Object} options - Scroll options
 */
export const smoothScrollInContainer = (container, target, options = {}) => {
  const defaultOptions = {
    behavior: 'smooth',
    block: 'nearest',
    inline: 'nearest'
  };

  const scrollOptions = { ...defaultOptions, ...options };
  
  let element;
  if (typeof target === 'string') {
    element = container.querySelector(target);
  } else {
    element = target;
  }

  if (element) {
    element.scrollIntoView(scrollOptions);
  }
};

/**
 * Add smooth scrolling to navigation links
 * @param {string} navSelector - Navigation container selector
 */
export const enableSmoothNavigation = (navSelector = 'nav') => {
  const nav = document.querySelector(navSelector);
  if (!nav) return;

  const links = nav.querySelectorAll('a[href^="#"]');
  
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const target = document.querySelector(targetId);
      
      if (target) {
        smoothScrollTo(target, { offset: 100 });
        
        // Update URL without jumping
        if (history.pushState) {
          history.pushState(null, null, targetId);
        }
      }
    });
  });
};

/**
 * Professional scroll reveal animation
 * @param {string} selector - Elements to animate
 * @param {Object} options - Animation options
 */
export const addScrollReveal = (selector, options = {}) => {
  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observerOptions = { ...defaultOptions, ...options };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('scroll-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const elements = document.querySelectorAll(selector);
  elements.forEach(el => {
    el.classList.add('scroll-hidden');
    observer.observe(el);
  });
};

/**
 * Smooth scroll with callback
 * @param {string|Element} target - Target element
 * @param {Function} callback - Callback function
 * @param {Object} options - Scroll options
 */
export const smoothScrollWithCallback = (target, callback, options = {}) => {
  smoothScrollTo(target, options);
  
  // Wait for scroll to complete
  setTimeout(() => {
    if (typeof callback === 'function') {
      callback();
    }
  }, 600); // Adjust timing based on scroll duration
};

/**
 * Check if element is in viewport
 * @param {Element} element - Element to check
 * @param {number} threshold - Visibility threshold (0-1)
 * @returns {boolean} - Whether element is visible
 */
export const isElementInViewport = (element, threshold = 0.5) => {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  const verticalVisible = rect.top <= windowHeight * (1 - threshold) && 
                         rect.bottom >= windowHeight * threshold;
  const horizontalVisible = rect.left <= windowWidth * (1 - threshold) && 
                           rect.right >= windowWidth * threshold;
  
  return verticalVisible && horizontalVisible;
};

/**
 * Professional parallax scrolling effect
 * @param {string} selector - Elements to apply parallax
 * @param {number} speed - Parallax speed (0-1)
 */
export const addParallaxEffect = (selector, speed = 0.5) => {
  const elements = document.querySelectorAll(selector);
  
  const updateParallax = () => {
    const scrolled = window.pageYOffset;
    
    elements.forEach(element => {
      const rate = scrolled * -speed;
      element.style.transform = `translateY(${rate}px)`;
    });
  };

  // Throttle scroll events for performance
  let ticking = false;
  const handleScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateParallax();
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Initial call
  updateParallax();
};

/**
 * Initialize all smooth scrolling features
 */
export const initSmoothScrolling = () => {
  // Enable smooth navigation
  enableSmoothNavigation();
  
  // Add scroll reveal to common elements
  addScrollReveal('.card, .section, .hero, .feature');
  
  // Add back to top functionality
  const backToTopButton = document.querySelector('.back-to-top');
  if (backToTopButton) {
    backToTopButton.addEventListener('click', () => {
      smoothScrollToTop();
    });
  }
  
  // Show/hide back to top button
  window.addEventListener('scroll', () => {
    if (backToTopButton) {
      if (window.pageYOffset > 300) {
        backToTopButton.classList.add('visible');
      } else {
        backToTopButton.classList.remove('visible');
      }
    }
  });
};

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSmoothScrolling);
  } else {
    initSmoothScrolling();
  }
}