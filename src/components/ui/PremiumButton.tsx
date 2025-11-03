import { ButtonHTMLAttributes, forwardRef, ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

// Consolidated LoadingSpinner (AGGRESSIVE CONSOLIDATION)
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'green' | 'purple' | 'white' | 'current'
  className?: string
}

export function LoadingSpinner({
  size = 'md',
  color = 'current',
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const colorClasses = {
    blue: 'border-blue-600 border-t-transparent',
    green: 'border-green-600 border-t-transparent',
    purple: 'border-purple-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    current: 'border-current border-t-transparent'
  }

  return (
    <div className={`relative ${className}`}>
      <div
        className={`
          ${sizeClasses[size]} 
          ${colorClasses[color]}
          border-2 rounded-full animate-spin
        `}
      />
    </div>
  )
}

interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
  | "primary"
  | "secondary"
  | "glass"
  | "outline"
  | "ghost"
  | "danger"
  | "success"
  | "gradient";
  size?: "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  glow?: boolean;
  pulse?: boolean;
  gradient?: boolean;
  glass?: boolean;
  // NEW: Delightful interactions (ENHANCEMENT FIRST)
  emoji?: string;
  hoverEmoji?: string;
  successEmoji?: string;
  onDelightfulClick?: () => void;
  context?: 'first_time' | 'returning' | 'achievement' | 'streak' | 'social';
  "aria-label"?: string;
  "aria-describedby"?: string;
}

// CONSOLIDATED: Single source of truth for ALL buttons (AGGRESSIVE CONSOLIDATION)
// Replaces: Button, EnhancedButton, MobileOptimizedButton, DelightfulButton
export const Button = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      icon,
      iconPosition = "left",
      glow = false,
      pulse = false,
      gradient = false,
      glass = false,
      // NEW: Delightful features
      emoji,
      hoverEmoji,
      successEmoji = "🎉",
      onDelightfulClick,
      context,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    // Delightful interaction state
    const [isClicked, setIsClicked] = useState(false);
    const [currentEmoji, setCurrentEmoji] = useState(emoji);
    const baseClasses = cn(
      "relative inline-flex items-center justify-center",
      "font-bold tracking-wide transition-all duration-300",
      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
      "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
      "transform-gpu will-change-transform",
      "overflow-hidden group",
      // Better focus visibility
      "focus:z-10 relative"
    );

    const sizeClasses = {
      sm: "px-4 py-2 text-sm rounded-lg gap-2",
      md: "px-6 py-3 text-base rounded-xl gap-3",
      lg: "px-8 py-4 text-lg rounded-xl gap-3",
      xl: "px-10 py-5 text-xl rounded-2xl gap-4",
    };

    const variantClasses = {
      primary: cn(
        "btn-primary",
        "focus:ring-blue-500"
      ),
      secondary: cn(
        "btn-secondary",
        "focus:ring-gray-500"
      ),
      glass: cn(
        "btn-glass",
        "focus:ring-white/20"
      ),
      outline: cn(
        "border-2 border-white/20 bg-transparent",
        "hover:bg-white/10 hover:border-white/30",
        "text-white focus:ring-white/20"
      ),
      ghost: cn(
        "btn-glass",
        "focus:ring-white/20"
      ),
      danger: cn(
        "bg-gradient-to-r from-red-600 to-red-700",
        "hover:from-red-700 hover:to-red-800",
        "text-white shadow-lg hover:shadow-xl",
        "focus:ring-red-500"
      ),
      success: cn(
        "bg-gradient-to-r from-green-600 to-emerald-600",
        "hover:from-green-700 hover:to-emerald-700",
        "text-white shadow-lg hover:shadow-xl",
        "focus:ring-green-500"
      ),
      gradient: cn(
        "bg-gradient-to-r from-violet-600 to-gold/80",
        "hover:from-violet-500 hover:to-gold/90",
        "text-white shadow-lg hover:shadow-xl",
        "focus:ring-violet-500"
      ),
    };

    const glowClasses = glow
      ? {
        primary: "shadow-blue-500/25 hover:shadow-blue-500/40",
        secondary: "shadow-gray-500/25 hover:shadow-gray-500/40",
        glass: "shadow-white/10 hover:shadow-white/20",
        outline: "shadow-white/10 hover:shadow-white/20",
        ghost: "shadow-white/5 hover:shadow-white/10",
        danger: "shadow-red-500/25 hover:shadow-red-500/40",
        success: "shadow-green-500/25 hover:shadow-green-500/40",
        gradient: "shadow-violet-500/25 hover:shadow-violet-500/40",
      }[variant]
      : "";

    // Contextual delightful responses
    const getContextualResponses = (ctx?: string) => {
      const responses = {
        first_time: ["🎉", "🌟", "✨", "🚀"],
        returning: ["👋", "💫", "🎊", "🏠"],
        achievement: ["🏆", "🎯", "💎", "⭐"],
        streak: ["🔥", "⚡", "💥", "🌟"],
        social: ["👥", "💫", "🎈", "🤝"]
      };
      return responses[ctx as keyof typeof responses] || ["🎉", "✨", "💫"];
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Delightful interactions
      if (emoji || onDelightfulClick) {
        setIsClicked(true);

        // Use contextual responses
        if (context) {
          const contextualEmojis = getContextualResponses(context);
          const randomEmoji = contextualEmojis[Math.floor(Math.random() * contextualEmojis.length)];
          setCurrentEmoji(randomEmoji);
        }

        // Call delightful callback
        onDelightfulClick?.();

        // Reset after animation
        setTimeout(() => {
          setIsClicked(false);
          setCurrentEmoji(emoji);
        }, 600);
      }

      // Call original onClick
      onClick?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      // Handle keyboard activation
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!isDisabled && handleClick) {
          handleClick(e as any);
        }
      }
      // Call original onKeyDown if provided
      props.onKeyDown?.(e);
    };

    const isDisabled = disabled || isLoading;

    return (
      <div className="magnet-wrapper">
        <button
          ref={ref}
          className={cn(
            "magnet-btn",
            baseClasses,
            sizeClasses[size],
            variantClasses[variant],
            glow && glowClasses,
            pulse && "animate-pulse",
            gradient && "bg-gradient-to-r",
            glass && "bg-gradient-to-br from-gold/15 to-violet/15 border border-gold/30 rounded-xl",
            !isDisabled && "hover:scale-105 hover:-translate-y-1",
            !isDisabled && "active:scale-95 active:translate-y-0",
            isDisabled && "opacity-50 cursor-not-allowed",
            // Delightful animations
            isClicked && "animate-bounce",
            className
          )}
          disabled={isDisabled}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onMouseEnter={() => hoverEmoji && setCurrentEmoji(hoverEmoji)}
          onMouseLeave={() => !isClicked && setCurrentEmoji(emoji)}
          aria-disabled={isDisabled}
          aria-busy={isLoading}
          tabIndex={isDisabled ? -1 : 0}
          {...props}
        >
          {/* Enhanced Shimmer & Sparkle Effect */}
          <div className="absolute inset-0 -top-px overflow-hidden rounded-inherit">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
            {/* Sparkle particles on hover */}
            <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-300 delay-100" />
            <div className="absolute top-1/3 right-1/3 w-0.5 h-0.5 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-300 delay-200" />
            <div className="absolute bottom-1/3 left-1/2 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-300 delay-150" />
          </div>

          {/* Delightful floating elements */}
          {isClicked && (
            <>
              <div className="absolute -top-2 left-1/4 text-red-400 animate-ping opacity-75">
                💖
              </div>
              <div className="absolute -top-3 right-1/4 text-yellow-400 animate-ping opacity-75 animation-delay-100">
                ⭐
              </div>
              <div className="absolute -top-2 left-3/4 text-green-400 animate-ping opacity-75 animation-delay-200">
                ✨
              </div>
            </>
          )}

          {/* Content */}
          <div className="relative flex items-center justify-center gap-inherit">
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="text-current" />
                {loadingText && <span>{loadingText}</span>}
              </>
            ) : (
              <>
                {icon && iconPosition === "left" && (
                  <span className="flex-shrink-0">{icon}</span>
                )}
                {currentEmoji && (
                  <span
                    className={cn(
                      "transition-transform duration-200",
                      isClicked && "scale-125 rotate-12"
                    )}
                  >
                    {currentEmoji}
                  </span>
                )}
                {children && <span>{children}</span>}
                {icon && iconPosition === "right" && (
                  <span className="flex-shrink-0">{icon}</span>
                )}
              </>
            )}
          </div>

          {/* Ripple effect for delightful interactions */}
          <div className="absolute inset-0 overflow-hidden rounded-inherit">
            <div
              className={cn(
                "absolute inset-0 bg-white/20 rounded-full scale-0 transition-transform duration-500",
                isClicked && "scale-150 opacity-0"
              )}
            />
          </div>

          {/* Glow Effect */}
          {glow && (
            <div className="absolute inset-0 rounded-inherit bg-gradient-to-r from-current to-current opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl" />
          )}
        </button>
      </div>
    );
  }
);

Button.displayName = "Button";

// Export both names for compatibility during transition
export const PremiumButton = Button;

// Floating Action Button Variant
interface FloatingButtonProps
  extends Omit<PremiumButtonProps, "variant" | "size"> {
  size?: "md" | "lg";
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

export function FloatingButton({
  position = "bottom-right",
  size = "lg",
  className,
  ...props
}: FloatingButtonProps) {
  const positionClasses = {
    "bottom-right": "fixed bottom-6 right-6",
    "bottom-left": "fixed bottom-6 left-6",
    "top-right": "fixed top-6 right-6",
    "top-left": "fixed top-6 left-6",
  };

  const sizeClasses = {
    md: "w-12 h-12 rounded-full",
    lg: "w-16 h-16 rounded-2xl",
  };

  return (
    <PremiumButton
      variant="glass"
      className={cn(
        positionClasses[position],
        sizeClasses[size],
        "z-50 shadow-2xl",
        className
      )}
      glow
      {...props}
    />
  );
}

// Button Group Component
interface ButtonGroupProps {
  children: ReactNode;
  className?: string;
  orientation?: "horizontal" | "vertical";
  spacing?: "none" | "sm" | "md";
}

export function ButtonGroup({
  children,
  className,
  orientation = "horizontal",
  spacing = "sm",
}: ButtonGroupProps) {
  const spacingClasses = {
    none: "gap-0",
    sm: "gap-2",
    md: "gap-4",
  };

  return (
    <div
      className={cn(
        "flex",
        orientation === "horizontal" ? "flex-row" : "flex-col",
        spacingClasses[spacing],
        className
      )}
    >
      {children}
    </div>
  );
}
