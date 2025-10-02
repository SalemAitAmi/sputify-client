import { useRef, useEffect, useState } from 'react';
import { useAnimationSync } from '../contexts/AnimationSyncContext';
import './AutoScrollText.css';

const AutoScrollText = ({ children, className = '', pauseOnHover = true }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [measurements, setMeasurements] = useState({
    scrollDistance: 0,
    duration: 10
  });
  
  const { animationPhase, cycleKey } = useAnimationSync();

  // Measure text overflow
  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        // Force layout recalculation
        void containerRef.current.offsetWidth;
        
        const containerWidth = containerRef.current.offsetWidth;
        const textWidth = textRef.current.scrollWidth;
        
        const needsScroll = textWidth > containerWidth + 5;
        setShouldScroll(needsScroll);
        
        if (needsScroll) {
          const distance = textWidth - containerWidth;
          
          // Constant speed: 30 pixels per second, max 15 seconds
          const pixelsPerSecond = 30;
          const calculatedDuration = distance / pixelsPerSecond;
          const duration = Math.min(calculatedDuration, 15); // Cap at 15s
          
          setMeasurements({
            scrollDistance: distance,
            duration: duration
          });
        }
      }
    };

    // Multiple checks at different timings
    const timers = [
      setTimeout(checkOverflow, 0),
      setTimeout(checkOverflow, 50),
      setTimeout(checkOverflow, 150),
      setTimeout(checkOverflow, 300),
    ];
    
    // Watch for size changes
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(checkOverflow, 50);
    });
    
    // Watch for DOM changes
    const mutationObserver = new MutationObserver(() => {
      setTimeout(checkOverflow, 50);
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    if (textRef.current) {
      mutationObserver.observe(textRef.current, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }

    return () => {
      timers.forEach(timer => clearTimeout(timer));
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [children, cycleKey]); // Re-check when cycle resets

  // Apply CSS variables when measurements change
  useEffect(() => {
    if (containerRef.current && shouldScroll) {
      containerRef.current.style.setProperty('--scroll-distance', `-${measurements.scrollDistance}px`);
      containerRef.current.style.setProperty('--scroll-duration', `${measurements.duration}s`);
    }
  }, [measurements, shouldScroll]);

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

  // Determine if animation should be active
  const isScrolling = shouldScroll && animationPhase === 'scrolling' && !isPaused;

  return (
    <div 
      ref={containerRef}
      className={`auto-scroll-container ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        ref={textRef}
        className={`auto-scroll-text ${isScrolling ? 'scrolling' : ''}`}
        key={cycleKey} // Force reset when cycle restarts
      >
        {children}
      </div>
    </div>
  );
};

export default AutoScrollText;