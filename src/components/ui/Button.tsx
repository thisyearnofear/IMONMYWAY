import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./LoadingSpinner";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  loadingMessage?: string;
  icon?: string;
  selected?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      icon,
      selected,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-xl font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 btn-press touch-target";

    const variants = {
      primary:
        "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg focus-visible:ring-blue-500",
      secondary:
        "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 shadow-sm hover:shadow-md focus-visible:ring-gray-500",
      outline:
        "border-2 border-blue-600 text-blue-600 bg-transparent hover:bg-blue-50 focus-visible:ring-blue-500",
      ghost:
        "text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500",
      danger:
        "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg focus-visible:ring-red-500",
    };

    const sizes = {
      sm: "h-9 px-4 text-sm min-w-[2.25rem]",
      md: "h-11 px-6 py-2.5 text-base min-w-[2.75rem]",
      lg: "h-13 px-8 text-lg min-w-[3.25rem]",
    };

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          selected && "ring-2 ring-blue-500 ring-offset-2",
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <LoadingSpinner
            size="sm"
            color={
              variant === "primary" || variant === "danger" ? "white" : "blue"
            }
            className="mr-2"
          />
        )}
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
