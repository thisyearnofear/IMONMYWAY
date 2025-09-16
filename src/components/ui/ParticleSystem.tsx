"use client";

import { useEffect, useRef } from "react";
// Import gsap with type assertion for build compatibility
const gsap = require('gsap').gsap;

interface ParticleSystemProps {
  trigger?: boolean;
  x?: number;
  y?: number;
  particleCount?: number;
  colors?: string[];
  emojis?: string[];
  onComplete?: () => void;
}

export function ParticleSystem({
  trigger = false,
  x = 50, // percentage
  y = 50, // percentage
  particleCount = 12,
  colors = ["#22c55e", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"],
  emojis = ["✨", "💫", "⭐", "🌟", "💥", "🎉"],
  onComplete,
}: ParticleSystemProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trigger || !containerRef.current) return;

    const container = containerRef.current;
    const particles: HTMLDivElement[] = [];

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.className = "fixed pointer-events-none z-[9999] text-2xl";
      particle.style.left = `${x}%`;
      particle.style.top = `${y}%`;

      // Randomize particle content
      if (Math.random() > 0.5) {
        particle.textContent =
          emojis[Math.floor(Math.random() * emojis.length)];
      } else {
        particle.style.width = "8px";
        particle.style.height = "8px";
        particle.style.borderRadius = "50%";
        particle.style.backgroundColor =
          colors[Math.floor(Math.random() * colors.length)];
      }

      container.appendChild(particle);
      particles.push(particle);
    }

    // Animate particles with physics-like behavior
    particles.forEach((particle, index) => {
      const angle = (360 / particleCount) * index;
      const velocity = 100 + Math.random() * 150; // Initial velocity
      const gravity = 800; // Gravity effect
      const friction = 0.95; // Air resistance

      // Calculate initial velocity components
      const vx = Math.cos((angle * Math.PI) / 180) * velocity;
      const vy = Math.sin((angle * Math.PI) / 180) * velocity;

      // Physics animation using GSAP
      const tl = gsap.timeline();

      // Initial burst
      tl.to(particle, {
        x: vx * 0.1,
        y: vy * 0.1,
        scale: Math.random() * 0.5 + 0.8,
        rotation: Math.random() * 360,
        duration: 0.1,
        ease: "power2.out",
      })
        // Main physics motion
        .to(particle, {
          x: vx * 0.3,
          y: vy * 0.3 + gravity * 0.5, // Add gravity
          scale: Math.random() * 0.3 + 0.5,
          rotation: Math.random() * 720,
          opacity: 0.8,
          duration: 0.8,
          ease: "power2.out",
        })
        // Fade out
        .to(particle, {
          opacity: 0,
          scale: 0.2,
          duration: 0.5,
          ease: "power2.in",
          onComplete: () => {
            if (container.contains(particle)) {
              container.removeChild(particle);
            }
          },
        });
    });

    // Cleanup and callback
    const cleanup = setTimeout(() => {
      particles.forEach((particle) => {
        if (container.contains(particle)) {
          container.removeChild(particle);
        }
      });
      onComplete?.();
    }, 2000);

    return () => clearTimeout(cleanup);
  }, [trigger, x, y, particleCount, colors, emojis, onComplete]);

  return <div ref={containerRef} />;
}

// Pre-built celebration effects
export function SuccessCelebration({
  trigger,
  onComplete,
}: {
  trigger: boolean;
  onComplete?: () => void;
}) {
  return (
    <ParticleSystem
      trigger={trigger}
      particleCount={16}
      emojis={["🎉", "✨", "🌟", "🎊", "💫"]}
      colors={["#22c55e", "#10b981", "#34d399"]}
      onComplete={onComplete}
    />
  );
}

export function WalletConnectedCelebration({
  trigger,
  onComplete,
}: {
  trigger: boolean;
  onComplete?: () => void;
}) {
  return (
    <ParticleSystem
      trigger={trigger}
      particleCount={10}
      emojis={["💰", "🔗", "✅", "🚀"]}
      colors={["#3b82f6", "#1d4ed8", "#2563eb"]}
      onComplete={onComplete}
    />
  );
}

export function RouteCompletedCelebration({
  trigger,
  onComplete,
  x,
  y,
}: {
  trigger: boolean;
  onComplete?: () => void;
  x?: number;
  y?: number;
}) {
  return (
    <ParticleSystem
      trigger={trigger}
      x={x}
      y={y}
      particleCount={20}
      emojis={["🎯", "⭐", "🏆", "💎", "🎊", "🔥"]}
      colors={["#f59e0b", "#d97706", "#amber-400"]}
      onComplete={onComplete}
    />
  );
}
