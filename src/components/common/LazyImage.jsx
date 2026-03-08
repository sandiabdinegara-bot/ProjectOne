import React, { useState, useEffect, useRef } from 'react';

/**
 * LazyImage Component
 * 
 * Features:
 * - Intersection Observer for dynamic loading
 * - Skeleton placeholder to prevent Layout Shift
 * - Pre-loads image before it enters viewport (rootMargin)
 * - Native loading="lazy" support
 * - Print friendly (forces load on print)
 */
const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  style = {}, 
  placeholderColor = '#f1f5f9',
  rootMargin = '200px',
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    // 1. Force load for printing
    const handleBeforePrint = () => setIsInView(true);
    window.addEventListener('beforeprint', handleBeforePrint);

    // 2. Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener('beforeprint', handleBeforePrint);
    };
  }, [rootMargin]);

  return (
    <div 
      ref={imgRef}
      className={`lazy-image-container ${className}`}
      style={{ 
        position: 'relative', 
        overflow: 'hidden',
        backgroundColor: placeholderColor,
        ...style 
      }}
    >
      {/* Skeleton Animation */}
      {!isLoaded && (
        <div className="skeleton-overlay" />
      )}

      {/* Actual Image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: style.objectFit || 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            display: 'block'
          }}
          {...props}
        />
      )}

      <style>{`
        .lazy-image-container {
          display: block;
        }
        
        .skeleton-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg, 
            rgba(255,255,255, 0) 0%, 
            rgba(255,255,255, 0.4) 50%, 
            rgba(255,255,255, 0) 100%
          );
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.5s infinite;
          z-index: 1;
        }

        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @media print {
          .lazy-image-container img {
            opacity: 1 !important;
            display: block !important;
          }
          .skeleton-overlay {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LazyImage;
