import React, { useState, useRef, useEffect } from 'react';

export const LazyImage: React.FC<{ src: string; alt: string; className?: string; loadIndex?: number }> = ({ src, alt, className, loadIndex = 0 }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timeoutId: number;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Stagger requests to prevent rate-limiting issues
          const delay = (loadIndex * 200) + (Math.random() * 100);
          timeoutId = window.setTimeout(() => {
            setIsInView(true);
          }, delay);
          observer.disconnect(); // Disconnect after it's in view
        }
      },
      { rootMargin: '200px' }
    );

    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      clearTimeout(timeoutId);
    };
  }, [loadIndex]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-900/50 rounded-lg overflow-hidden">
      {!isLoaded && (
        <div className="absolute inset-0 shimmer-bg"></div>
      )}
      <img
        src={isInView ? src : undefined}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        className={`${className} transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};