import { forwardRef, useState } from "react";
import { Button } from "./PremiumButton";
import { cn } from "@/lib/utils";

interface DelightfulButtonProps extends React.ComponentProps<typeof Button> {
  emoji?: string;
  hoverEmoji?: string;
  successEmoji?: string;
  onDelightfulClick?: () => void;
}

export const DelightfulButton = forwardRef<HTMLButtonElement, DelightfulButtonProps>(
  ({ 
    children, 
    className, 
    emoji,
    hoverEmoji,
    successEmoji = "🎉",
    onDelightfulClick,
    onClick,
    ...props 
  }, ref) => {
    const [isClicked, setIsClicked] = useState(false);
    const [currentEmoji, setCurrentEmoji] = useState(emoji);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Trigger success animation
      setIsClicked(true);
      setCurrentEmoji(successEmoji);
      
      // Call the delightful callback
      onDelightfulClick?.();
      
      // Call original onClick
      onClick?.(e);
      
      // Reset after animation
      setTimeout(() => {
        setIsClicked(false);
        setCurrentEmoji(emoji);
      }, 600);
    };

    return (
      <Button
        ref={ref}
        className={cn(
          "group relative overflow-hidden",
          "transition-all duration-300 ease-out",
          "hover:shadow-lg hover:shadow-current/20",
          // Cute bounce on click
          isClicked && "animate-bounce",
          className
        )}
        onClick={handleClick}
        onMouseEnter={() => hoverEmoji && setCurrentEmoji(hoverEmoji)}
        onMouseLeave={() => !isClicked && setCurrentEmoji(emoji)}
        {...props}
      >
        {/* Floating hearts on click */}
        {isClicked && (
          <>
            <div className="absolute -top-2 left-1/4 text-red-400 animate-ping opacity-75">💖</div>
            <div className="absolute -top-3 right-1/4 text-yellow-400 animate-ping opacity-75 animation-delay-100">⭐</div>
            <div className="absolute -top-2 left-3/4 text-green-400 animate-ping opacity-75 animation-delay-200">✨</div>
          </>
        )}
        
        {/* Button content with emoji */}
        <span className="flex items-center gap-2">
          {currentEmoji && (
            <span className={cn(
              "transition-transform duration-200",
              isClicked && "scale-125 rotate-12"
            )}>
              {currentEmoji}
            </span>
          )}
          {children}
        </span>

        {/* Ripple effect */}
        <div className="absolute inset-0 overflow-hidden rounded-inherit">
          <div className={cn(
            "absolute inset-0 bg-white/20 rounded-full scale-0 transition-transform duration-500",
            isClicked && "scale-150 opacity-0"
          )} />
        </div>
      </Button>
    );
  }
);

DelightfulButton.displayName = 'DelightfulButton';