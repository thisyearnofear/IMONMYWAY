"use client";

import { useState } from "react";
import { Button } from "./Button";

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  successMessage?: string;
  loadingMessage?: string;
  animation?: "pulse" | "bounce" | "shake" | "success";
}

export function AnimatedButton({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  size = "md",
  className = "",
  successMessage,
  loadingMessage,
  animation = "pulse",
}: AnimatedButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    setIsAnimating(true);

    try {
      await onClick?.();

      if (successMessage) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setIsLoading(false);
        }, 2000);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
    } finally {
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const getAnimationClass = () => {
    if (!isAnimating) return "";

    switch (animation) {
      case "bounce":
        return "animate-bounce";
      case "shake":
        return "animate-shake";
      case "success":
        return "animate-pulse scale-105";
      default:
        return "animate-pulse";
    }
  };

  const getContent = () => {
    if (showSuccess && successMessage) {
      return (
        <div className="flex items-center justify-center space-x-2">
          <span className="text-green-500">✓</span>
          <span>{successMessage}</span>
        </div>
      );
    }

    if (isLoading && loadingMessage) {
      return (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>{loadingMessage}</span>
        </div>
      );
    }

    return children;
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isLoading}
      variant={showSuccess ? "primary" : variant}
      size={size}
      className={`
        transition-all duration-300 transform hover:scale-105 active:scale-95
        ${getAnimationClass()}
        ${showSuccess ? "bg-green-600 hover:bg-green-700" : ""}
        ${className}
      `}
    >
      {getContent()}
    </Button>
  );
}
