"use client";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "rectangular" | "circular";
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({
  className = "",
  variant = "rectangular",
  width,
  height,
  lines = 1,
}: SkeletonProps) {
  const baseClasses = "skeleton";

  const getVariantClasses = () => {
    switch (variant) {
      case "text":
        return "skeleton-text";
      case "circular":
        return "skeleton-circle";
      default:
        return "";
    }
  };

  const getSizeStyles = () => {
    const styles: React.CSSProperties = {};

    if (width) {
      styles.width = typeof width === "number" ? `${width}px` : width;
    }

    if (height) {
      styles.height = typeof height === "number" ? `${height}px` : height;
    }

    return styles;
  };

  if (variant === "text" && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${getVariantClasses()}`}
            style={{
              ...getSizeStyles(),
              width: index === lines - 1 ? "60%" : "100%", // Last line shorter
              height: height || "1em",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${getVariantClasses()} ${className}`}
      style={getSizeStyles()}
    />
  );
}

// Specialized skeleton components for common use cases
export function BetCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 animate-scale-in">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Skeleton variant="circular" width={12} height={12} />
          <Skeleton width={80} height={16} />
        </div>
        <Skeleton width={60} height={20} />
      </div>

      {/* Details skeleton */}
      <div className="space-y-3 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <Skeleton width={60} height={14} />
            <Skeleton width={80} height={14} />
          </div>
        ))}
      </div>

      {/* Action button skeleton */}
      <Skeleton width="100%" height={40} />
    </div>
  );
}

export function CommitmentSkeleton() {
  return (
    <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200 animate-scale-in">
      <div className="flex items-center space-x-2 mb-4">
        <Skeleton variant="circular" width={24} height={24} />
        <Skeleton width={120} height={20} />
      </div>

      <div className="space-y-3">
        <Skeleton width="100%" height={40} />
        <Skeleton width="100%" height={40} />
        <Skeleton width="100%" height={48} />
      </div>
    </div>
  );
}
