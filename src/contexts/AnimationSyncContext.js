import { createContext, useContext, useState, useEffect } from 'react';

const AnimationSyncContext = createContext(null);

export const AnimationSyncProvider = ({ children }) => {
  const [animationPhase, setAnimationPhase] = useState('initial-pause');
  const [cycleKey, setCycleKey] = useState(0);

  useEffect(() => {
    // Animation cycle timing:
    // 0-5s: initial-pause (sync all elements)
    // 5-20s: scrolling (15s window)
    // 20-25s: end-pause
    // 25s: reset and restart
    
    const INITIAL_PAUSE = 5000;    // 5s
    const SCROLL_WINDOW = 15000;   // 15s
    const END_PAUSE = 5000;        // 5s
    const TOTAL_CYCLE = INITIAL_PAUSE + SCROLL_WINDOW + END_PAUSE; // 25s

    // Start with initial pause
    setAnimationPhase('initial-pause');
    
    // Begin scrolling after initial pause
    const scrollTimer = setTimeout(() => {
      setAnimationPhase('scrolling');
    }, INITIAL_PAUSE);
    
    // End pause after scroll window
    const endPauseTimer = setTimeout(() => {
      setAnimationPhase('end-pause');
    }, INITIAL_PAUSE + SCROLL_WINDOW);
    
    // Reset cycle
    const resetTimer = setTimeout(() => {
      setCycleKey(prev => prev + 1);
      setAnimationPhase('initial-pause');
    }, TOTAL_CYCLE);
    
    // Set up recurring cycle
    const interval = setInterval(() => {
      setCycleKey(prev => prev + 1);
      setAnimationPhase('initial-pause');
      
      setTimeout(() => setAnimationPhase('scrolling'), INITIAL_PAUSE);
      setTimeout(() => setAnimationPhase('end-pause'), INITIAL_PAUSE + SCROLL_WINDOW);
    }, TOTAL_CYCLE);
    
    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(endPauseTimer);
      clearTimeout(resetTimer);
      clearInterval(interval);
    };
  }, []);

  return (
    <AnimationSyncContext.Provider value={{ animationPhase, cycleKey }}>
      {children}
    </AnimationSyncContext.Provider>
  );
};

export const useAnimationSync = () => {
  const context = useContext(AnimationSyncContext);
  if (!context) {
    throw new Error('useAnimationSync must be used within AnimationSyncProvider');
  }
  return context;
};