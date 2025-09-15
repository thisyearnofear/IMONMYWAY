import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
  y: number;
}

interface FloatingReactionsProps {
  trigger?: boolean;
  emojis?: string[];
  className?: string;
}

export function FloatingReactions({ 
  trigger = false, 
  emojis = ["🎉", "💰", "⭐", "✨", "🚀"],
  className 
}: FloatingReactionsProps) {
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  useEffect(() => {
    if (!trigger) return;

    // Create multiple floating reactions
    const newReactions: FloatingReaction[] = [];
    for (let i = 0; i < 5; i++) {
      newReactions.push({
        id: Math.random().toString(36),
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        x: Math.random() * 100,
        y: Math.random() * 100,
      });
    }

    setReactions(newReactions);

    // Clear reactions after animation
    const timer = setTimeout(() => {
      setReactions([]);
    }, 2000);

    return () => clearTimeout(timer);
  }, [trigger, emojis]);

  return (
    <div className={cn("absolute inset-0 pointer-events-none overflow-hidden", className)}>
      {reactions.map((reaction) => (
        <div
          key={reaction.id}
          className="absolute text-2xl animate-float-up opacity-0"
          style={{
            left: `${reaction.x}%`,
            top: `${reaction.y}%`,
            animationDelay: `${Math.random() * 500}ms`,
          }}
        >
          {reaction.emoji}
        </div>
      ))}
    </div>
  );
}

// Add the animation to your CSS
export const floatingReactionStyles = `
@keyframes float-up {
  0% {
    opacity: 1;
    transform: translateY(0) scale(0.8);
  }
  50% {
    opacity: 1;
    transform: translateY(-50px) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translateY(-100px) scale(0.8);
  }
}

.animate-float-up {
  animation: float-up 2s ease-out forwards;
}
`;