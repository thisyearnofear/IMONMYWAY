"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circle" | "rectangle" | "button" | "card";
  lines?: number;
  animate?: boolean;
}

export function Skeleton({
  className,
  variant = "rectangle",
  lines = 1,
  animate = true,
}: SkeletonProps) {
  const baseClasses = cn(
    "bg-gradient-to-r from-white/5 via-white/10 to-white/5",
    "bg-[length:200%_100%]",
    animate && "animate-shimmer",
    className
  );

  const variantClasses = {
    text: "h-4 rounded",
    circle: "rounded-full aspect-square",
    rectangle: "rounded-lg",
    button: "h-12 rounded-xl",
    card: "h-32 rounded-2xl",
  };

  if (variant === "text" && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              variantClasses.text,
              index === lines - 1 ? "w-3/4" : "w-full" // Last line shorter
            )}
            style={{
              animationDelay: animate ? `${index * 100}ms` : undefined,
            }}
          />
        ))}
      </div>
    );
  }

  return <div className={cn(baseClasses, variantClasses[variant])} />;
}

// Specific skeleton components for common use cases
export function ButtonSkeleton({ className }: { className?: string }) {
  return <Skeleton variant="button" className={cn("w-32", className)} />;
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-gradient-to-br from-gold/5 to-violet/5 border border-gold/10 p-6 space-y-4", className)}>
      <Skeleton variant="text" lines={1} className="w-1/2 h-6" />
      <Skeleton variant="text" lines={3} />
      <div className="flex gap-2 mt-4">
        <ButtonSkeleton />
        <ButtonSkeleton className="w-24" />
      </div>
    </div>
  );
}

export function UserSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Skeleton variant="circle" className="w-10 h-10" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="w-1/2" />
        <Skeleton variant="text" className="w-1/3 h-3" />
      </div>
    </div>
  );
}

export function RouteCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-gradient-to-br from-gold/5 to-violet/5 border border-gold/10 p-6 space-y-4", className)}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <Skeleton variant="text" className="w-1/2 h-6 mb-2" />
          <Skeleton variant="text" lines={2} />
        </div>
        <Skeleton variant="circle" className="w-8 h-8" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <Skeleton variant="text" className="w-16 h-8 mx-auto mb-1" />
          <Skeleton variant="text" className="w-12 h-3 mx-auto" />
        </div>
        <div className="text-center">
          <Skeleton variant="text" className="w-16 h-8 mx-auto mb-1" />
          <Skeleton variant="text" className="w-12 h-3 mx-auto" />
        </div>
      </div>

      <ButtonSkeleton className="w-full" />
    </div>
  );
}

export function NavigationSkeleton() {
  return (
    <div className="bg-gradient-to-br from-gold/10 to-violet/10 border border-gold/20 p-4 rounded-xl">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" className="w-10 h-10" />
          <div>
            <Skeleton variant="text" className="w-24 h-5 mb-1" />
            <Skeleton variant="text" className="w-20 h-3" />
          </div>
        </div>

        <div className="hidden md:flex gap-4">
          <Skeleton variant="button" className="w-20 h-8" />
          <Skeleton variant="button" className="w-20 h-8" />
          <Skeleton variant="button" className="w-20 h-8" />
        </div>

        <Skeleton variant="button" className="w-28" />
      </div>
    </div>
  );
}

export function MapSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg relative overflow-hidden",
        className
      )}
    >
      {/* Map grid pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="grid grid-cols-8 grid-rows-6 h-full">
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} className="border border-white/10" />
          ))}
        </div>
      </div>

      {/* Map markers */}
      <div className="absolute top-1/4 left-1/4">
        <Skeleton
          variant="circle"
          className="w-6 h-6 bg-blue-500/50"
          animate={false}
        />
      </div>
      <div className="absolute bottom-1/3 right-1/3">
        <Skeleton
          variant="circle"
          className="w-6 h-6 bg-red-500/50"
          animate={false}
        />
      </div>

      {/* Loading indicator */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-gradient-to-br from-gold/5 to-violet/5 border border-gold/10 px-4 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-white/80 text-sm">Loading map...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
