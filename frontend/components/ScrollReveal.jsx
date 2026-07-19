import React, { useEffect, useRef, useState } from 'react';

/**
 * ScrollReveal component triggers a slide-up and fade-in animation when the
 * wrapped element enters the viewport.
 */
export const ScrollReveal = ({
  children,
  className = '',
  animationClass = 'animate-in fade-in slide-in-from-bottom-2 duration-700',
  style = {}
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Stop observing once visible
          if (ref.current) {
            observer.unobserve(ref.current);
          }
        }
      },
      {
        threshold: 0.05, // Trigger early when 5% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Offset slightly to feel more dynamic
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} transition-opacity duration-300 ${isVisible ? animationClass : 'opacity-0'}`}
      style={style}
    >
      {children}
    </div>
  );
};
