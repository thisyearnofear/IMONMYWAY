import { cn } from "@/lib/utils";

interface CuteStatusBadgeProps {
  status: "online" | "busy" | "away" | "offline";
  label?: string;
  emoji?: string;
  className?: string;
  animated?: boolean;
}

export function CuteStatusBadge({ 
  status, 
  label, 
  emoji,
  className,
  animated = true 
}: CuteStatusBadgeProps) {
  const statusConfig = {
    online: {
      color: "bg-green-400",
      textColor: "text-green-400",
      emoji: emoji || "🟢",
      label: label || "Online & Ready!",
      animation: "animate-pulse"
    },
    busy: {
      color: "bg-orange-400", 
      textColor: "text-orange-400",
      emoji: emoji || "🔥",
      label: label || "Super Busy",
      animation: "animate-bounce"
    },
    away: {
      color: "bg-yellow-400",
      textColor: "text-yellow-400", 
      emoji: emoji || "⏰",
      label: label || "Be Right Back",
      animation: "animate-wiggle"
    },
    offline: {
      color: "bg-gray-400",
      textColor: "text-gray-400",
      emoji: emoji || "😴",
      label: label || "Sleeping",
      animation: ""
    }
  };

  const config = statusConfig[status];

  return (
    <div className={cn(
      "glass-enhanced px-3 py-2 rounded-full flex items-center gap-2",
      "hover:scale-105 transition-all duration-300 cursor-pointer group",
      className
    )}>
      <div className={cn(
        "w-2 h-2 rounded-full shadow-lg",
        config.color,
        animated && config.animation,
        "group-hover:animate-heartbeat"
      )} />
      
      <span className="text-white/90 font-medium text-xs sm:text-sm tracking-wide">
        <span className={cn(
          "inline-block mr-1",
          animated && "group-hover:animate-wiggle"
        )}>
          {config.emoji}
        </span>
        {config.label}
      </span>
    </div>
  );
}

// Preset cute status badges
export function LiveStatusBadge({ time }: { time: string }) {
  return (
    <CuteStatusBadge 
      status="online"
      emoji="🔥"
      label={`Live & Ready • ${time}`}
    />
  );
}

export function BusyStatusBadge() {
  return (
    <CuteStatusBadge 
      status="busy"
      emoji="💸"
      label="Making Money!"
    />
  );
}

export function AwayStatusBadge() {
  return (
    <CuteStatusBadge 
      status="away"
      emoji="🚗"
      label="On My Way..."
    />
  );
}