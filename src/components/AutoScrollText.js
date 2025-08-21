import { useRef, useEffect, useState } from 'react';
import './AutoScrollText.css';

const AutoScrollText = ({ children, className = '', pauseOnHover = true, maxWidth }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const actualContainerWidth = containerRef.current.getBoundingClientRect().width;
        const textWidth = textRef.current.scrollWidth;
        
        setContainerWidth(actualContainerWidth);
        setShouldScroll(textWidth > actualContainerWidth + 5); // 5px buffer
        
        // Set CSS custom property for animation
        if (textWidth > actualContainerWidth + 5) {
          const scrollDistance = textWidth - actualContainerWidth;
          containerRef.current.style.setProperty('--scroll-distance', `-${scrollDistance}px`);
        }
      }
    };

    // Multiple checks to handle different rendering scenarios
    const immediateCheck = () => checkOverflow();
    const delayedCheck = () => setTimeout(checkOverflow, 50);
    const laterCheck = () => setTimeout(checkOverflow, 200);

    immediateCheck();
    delayedCheck();
    laterCheck();
    
    // Recheck on window resize
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(checkOverflow, 50);
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [children]);

  const handleMouseEnter = () => {
    if (pauseOnHover) {
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) {
      setIsPaused(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`auto-scroll-container ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        ref={textRef}
        className={`auto-scroll-text ${shouldScroll ? 'scrolling' : ''} ${isPaused ? 'paused' : ''}`}
      >
        {children}
      </div>
    </div>
  );
};

export default AutoScrollText;