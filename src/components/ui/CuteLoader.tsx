import { cn } from "@/lib/utils";

interface CuteLoaderProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
}

export function CuteLoader({ size = "md", message = "Loading...", className }: CuteLoaderProps) {
  const sizeClasses = {
    sm: "w-6 h-6 text-lg",
    md: "w-8 h-8 text-2xl", 
    lg: "w-12 h-12 text-4xl"
  };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {/* Cute bouncing emojis */}
      <div className="flex items-center gap-1">
        <span className={cn("animate-bounce", sizeClasses[size])} style={{animationDelay: '0ms'}}>
          🚀
        </span>
        <span className={cn("animate-bounce", sizeClasses[size])} style={{animationDelay: '150ms'}}>
          💫
        </span>
        <span className={cn("animate-bounce", sizeClasses[size])} style={{animationDelay: '300ms'}}>
          ✨
        </span>
      </div>
      
      {/* Loading message */}
      {message && (
        <p className="text-white/80 text-sm font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}

// Specific cute loaders for different actions
export function PlanningLoader() {
  return (
    <CuteLoader 
      message="Planning your perfect route... 🗺️"
      className="py-4"
    />
  );
}

export function ChallengeLoader() {
  return (
    <CuteLoader 
      message="Setting up your challenge... 💰"
      className="py-4"
    />
  );
}

export function WatchingLoader() {
  return (
    <CuteLoader 
      message="Loading friend challenges... 👀"
      className="py-4"
    />
  );
}