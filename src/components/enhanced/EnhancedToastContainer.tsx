"use client";

import { useEffect } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useAnimation } from "@/hooks/useAnimation";
import { cn } from "@/lib/utils";

export function EnhancedToastContainer() {
  const { toasts, removeToast } = useUIStore();
  const { getAnimationClass } = useAnimation();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm">
      {toasts.map((toast, index) => (
        <EnhancedToast
          key={toast.id}
          toast={toast}
          index={index}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

interface EnhancedToastProps {
  toast: {
    id: string;
    message: string;
    type: "success" | "error" | "warning" | "info";
  };
  index: number;
  onClose: () => void;
}

function EnhancedToast({ toast, index, onClose }: EnhancedToastProps) {
  const { getAnimationClass, getStaggeredDelay } = useAnimation();

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const variants = {
    success: "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg",
    error: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg",
    warning: "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg",
    info: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg",
  };

  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 backdrop-blur-sm",
        "transform transition-all duration-300 ease-out",
        "hover:scale-105 active:scale-95",
        variants[toast.type],
        getAnimationClass("enter", "medium")
      )}
      style={{
        animationDelay: `${getStaggeredDelay(index, 100)}ms`,
      }}
    >
      <div className="text-lg flex-shrink-0 animate-pulse">{icons[toast.type]}</div>
      <span className="flex-1 text-sm font-medium leading-relaxed">
        {toast.message}
      </span>
      <button
        onClick={onClose}
        className="text-white/80 hover:text-white transition-colors flex-shrink-0 hover:scale-110 active:scale-90 transform transition-transform"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}