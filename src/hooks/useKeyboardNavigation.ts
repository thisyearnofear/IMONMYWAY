import { useState, useEffect, useCallback } from 'react';

interface KeyboardNavigationOptions {
  enabled?: boolean;
  onEscape?: () => void;
  onSpace?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
}

// Hook for handling keyboard navigation in visualization components
export function useKeyboardNavigation(options: KeyboardNavigationOptions = {}) {
  const {
    enabled = true,
    onEscape,
    onSpace,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight
  } = options;
  
  const [isFocused, setIsFocused] = useState(false);
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        if (onEscape) onEscape();
        break;
      case ' ':
        event.preventDefault();
        if (onSpace) onSpace();
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (onArrowUp) onArrowUp();
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (onArrowDown) onArrowDown();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (onArrowLeft) onArrowLeft();
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (onArrowRight) onArrowRight();
        break;
    }
  }, [enabled, onEscape, onSpace, onArrowUp, onArrowDown, onArrowLeft, onArrowRight]);
  
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);
  
  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);
  
  useEffect(() => {
    if (!enabled) return;
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
  
  return {
    isFocused,
    handleFocus,
    handleBlur
  };
}