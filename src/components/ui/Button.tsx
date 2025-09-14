import { ButtonHTMLAttributes, forwardRef, useState } from "react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./LoadingSpinner";
import { useAnimation } from "@/hooks/useAnimation";
import { useLoadingState } from "@/hooks/useLoadingState";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success" | "pixel";
  size?: "sm" | "md" | "lg";
  
  // Enhanced loading states
  isLoading?: boolean;
  loadingText?: string;
  
  // Success states
  showSuccess?: boolean;
  successText?: string;
  successDuration?: number;
  
  // Animation configuration
  animationIntensity?: "subtle" | "medium" | "intense";
  disableAnimations?: boolean;
  
  // Async operation support
  asyncOperation?: () => Promise<void>;
  optimistic?: boolean;
  
  // Visual enhancements
  icon?: string;
  iconPosition?: "left" | "right";
  badge?: string | number;
  
  // Legacy support (preserve all original functionality)
  loadingMessage?: string;
  selected?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading: externalLoading,
      loadingText,
      showSuccess: externalSuccess,
      successText,
      successDuration = 2000,
      animationIntensity = "medium",
      disableAnimations = false,
      asyncOperation,
      optimistic = false,
      icon,
      iconPosition = "left",
      badge,
      loadingMessage, // Legacy support
      selected,
      children,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const [internalSuccess, setInternalSuccess] = useState(false);
    
    // Only use animation hooks if they're available (graceful degradation)
    let getAnimationClass: any = () => "";
    let triggerCelebration: any = () => {};
    try {
      const animationHooks = useAnimation();
      getAnimationClass = animationHooks.getAnimationClass;
      triggerCelebration = animationHooks.triggerCelebration;
    } catch (e) {
      // Graceful fallback if hooks aren't available
    }

    let loadingState: any = { isLoading: false, isOptimistic: false };
    let loadingActions: any = { start: () => {}, success: () => {}, error: () => {} };
    try {
      const [state, actions] = useLoadingState({ optimistic, minDuration: 300 });
      loadingState = state;
      loadingActions = actions;
    } catch (e) {
      // Graceful fallback
    }

    // Determine actual loading and success states
    const isLoading = externalLoading || loadingState.isLoading;
    const showSuccess = externalSuccess || internalSuccess || loadingState.isOptimistic;

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isLoading) return;

      if (asyncOperation) {
        try {
          loadingActions.start(loadingText || loadingMessage);
          await asyncOperation();
          
          // Show success state
          setInternalSuccess(true);
          loadingActions.success(successText);
          
          // Trigger celebration for important actions
          if (variant === "primary" && animationIntensity !== "subtle") {
            triggerCelebration({
              type: "success",
              intensity: animationIntensity,
              haptic: true
            });
          }

          // Reset success state after duration
          setTimeout(() => {
            setInternalSuccess(false);
          }, successDuration);
          
        } catch (error: any) {
          loadingActions.error(error.message || "Operation failed");
        }
      } else {
        onClick?.(e);
      }
    };

    const baseStyles = cn(
      "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "relative overflow-hidden touch-target",
      !disableAnimations && getAnimationClass("hover", animationIntensity),
      !disableAnimations && getAnimationClass("press", animationIntensity)
    );

    const variants = {
      primary: cn(
        "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md",
        "hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:glow-primary",
        "focus-visible:ring-blue-500",
        showSuccess && "from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
      ),
      secondary: cn(
        "glass text-white border border-white/20 shadow-sm",
        "hover:bg-white/10 hover:shadow-md",
        "focus-visible:ring-gray-500"
      ),
      outline: cn(
        "border-2 border-blue-600 text-blue-600 bg-transparent",
        "hover:bg-blue-50 hover:text-blue-700",
        "focus-visible:ring-blue-500"
      ),
      ghost: cn(
        "text-gray-300 hover:bg-white/10 hover:text-white",
        "focus-visible:ring-gray-500"
      ),
      danger: cn(
        "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md",
        "hover:from-red-700 hover:to-red-800 hover:shadow-lg",
        "focus-visible:ring-red-500"
      ),
      success: cn(
        "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md",
        "hover:from-green-700 hover:to-green-800 hover:shadow-lg hover:glow-success",
        "focus-visible:ring-green-500"
      ),
      pixel: cn(
        "btn-pixel",
        showSuccess && "bg-green-600 border-green-500 text-white"
      ),
    };

    const sizes = {
      sm: "h-9 px-4 text-sm min-w-[2.25rem]",
      md: "h-11 px-6 py-2.5 text-base min-w-[2.75rem]",
      lg: "h-13 px-8 text-lg min-w-[3.25rem]",
    };

    const getContent = () => {
      if (showSuccess && successText) {
        return (
          <div className="flex items-center space-x-2">
            <span className="text-green-400">✓</span>
            <span>{successText}</span>
          </div>
        );
      }

      if (isLoading) {
        return (
          <div className="flex items-center space-x-2">
            <LoadingSpinner
              size="sm"
              color={variant === "primary" || variant === "danger" || variant === "success" || variant === "pixel" ? "white" : "blue"}
            />
            {(loadingText || loadingMessage) && <span>{loadingText || loadingMessage}</span>}
          </div>
        );
      }

      return (
        <div className="flex items-center space-x-2">
          {icon && iconPosition === "left" && <span className="pixel-perfect">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === "right" && <span className="pixel-perfect">{icon}</span>}
          {badge && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full font-mono">
              {badge}
            </span>
          )}
        </div>
      );
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          selected && "ring-2 ring-blue-500 ring-offset-2",
          className
        )}
        disabled={disabled || isLoading}
        onClick={handleClick}
        {...props}
      >
        {/* Enhanced ripple effect */}
        {!disableAnimations && (
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            <div className="absolute inset-0 bg-white/10 transform scale-0 group-active:scale-100 transition-transform duration-200 rounded-xl" />
          </div>
        )}
        
        {getContent()}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };