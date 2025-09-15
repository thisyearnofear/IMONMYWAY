import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./LoadingSpinner";

interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "glass" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  glow?: boolean;
  pulse?: boolean;
  gradient?: boolean;
  glass?: boolean;
}

// Single source of truth for all buttons - replaces Button, EnhancedButton, MobileOptimizedButton
export const Button = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ 
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
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = cn(
      "relative inline-flex items-center justify-center",
      "font-bold tracking-wide transition-all duration-300",
      "focus:outline-none focus:ring-2 focus:ring-offset-2",
      "transform-gpu will-change-transform",
      "overflow-hidden group"
    );

    const sizeClasses = {
      sm: "px-4 py-2 text-sm rounded-lg gap-2",
      md: "px-6 py-3 text-base rounded-xl gap-3", 
      lg: "px-8 py-4 text-lg rounded-xl gap-3",
      xl: "px-10 py-5 text-xl rounded-2xl gap-4"
    };

    const variantClasses = {
      primary: cn(
        "bg-gradient-to-r from-blue-600 to-purple-600",
        "hover:from-blue-700 hover:to-purple-700",
        "text-white shadow-lg hover:shadow-xl",
        "focus:ring-blue-500"
      ),
      secondary: cn(
        "bg-gradient-to-r from-gray-600 to-gray-700",
        "hover:from-gray-700 hover:to-gray-800", 
        "text-white shadow-lg hover:shadow-xl",
        "focus:ring-gray-500"
      ),
      glass: cn(
        "glass-button",
        "text-white hover:text-white",
        "focus:ring-white/20"
      ),
      outline: cn(
        "border-2 border-white/20 bg-transparent",
        "hover:bg-white/10 hover:border-white/30",
        "text-white focus:ring-white/20"
      ),
      ghost: cn(
        "bg-transparent hover:bg-white/10",
        "text-white/80 hover:text-white",
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
      )
    };

    const glowClasses = glow ? {
      primary: "shadow-blue-500/25 hover:shadow-blue-500/40",
      secondary: "shadow-gray-500/25 hover:shadow-gray-500/40",
      glass: "shadow-white/10 hover:shadow-white/20",
      outline: "shadow-white/10 hover:shadow-white/20", 
      ghost: "shadow-white/5 hover:shadow-white/10",
      danger: "shadow-red-500/25 hover:shadow-red-500/40",
      success: "shadow-green-500/25 hover:shadow-green-500/40"
    }[variant] : "";

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          sizeClasses[size],
          variantClasses[variant],
          glow && glowClasses,
          pulse && "animate-pulse",
          gradient && "bg-gradient-to-r",
          glass && "glass-button",
          !isDisabled && "hover:scale-105 hover:-translate-y-1 hover:rotate-1",
          !isDisabled && "active:scale-95 active:translate-y-0 active:rotate-0",
          isDisabled && "opacity-50 cursor-not-allowed",
          className
        )}
        disabled={isDisabled}
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
              {children && <span>{children}</span>}
              {icon && iconPosition === "right" && (
                <span className="flex-shrink-0">{icon}</span>
              )}
            </>
          )}
        </div>

        {/* Glow Effect */}
        {glow && (
          <div className="absolute inset-0 rounded-inherit bg-gradient-to-r from-current to-current opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl" />
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Export both names for compatibility during transition
export const PremiumButton = Button;

// Floating Action Button Variant
interface FloatingButtonProps extends Omit<PremiumButtonProps, 'variant' | 'size'> {
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
    "top-left": "fixed top-6 left-6"
  };

  const sizeClasses = {
    md: "w-12 h-12 rounded-full",
    lg: "w-16 h-16 rounded-2xl"
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
  spacing = "sm" 
}: ButtonGroupProps) {
  const spacingClasses = {
    none: "gap-0",
    sm: "gap-2",
    md: "gap-4"
  };

  return (
    <div className={cn(
      "flex",
      orientation === "horizontal" ? "flex-row" : "flex-col",
      spacingClasses[spacing],
      className
    )}>
      {children}
    </div>
  );
}