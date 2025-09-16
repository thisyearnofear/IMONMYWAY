"use client";

import { useUIStore } from "@/stores/uiStore";
import { useWallet } from "@/hooks/useWallet";
import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";

// GSAP-enhanced NetworkStatus inspired by interactive demos

interface SystemStatus {
  protocol: "ACTIVE" | "INACTIVE" | "ERROR";
  gps: "ENABLED" | "DISABLED" | "POOR_SIGNAL";
  contracts: "DEPLOYED" | "NOT_DEPLOYED" | "ERROR";
  blockNumber: number | null;
}

export function NetworkStatus() {
  const { contractAddress, networkMetrics, isOnline } = useUIStore();
  const { networkMetrics: walletMetrics, address, isConnected } = useWallet();
  const containerRef = useRef<HTMLDivElement>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    protocol: "ACTIVE",
    gps: "ENABLED",
    contracts: "DEPLOYED",
    blockNumber: 42161,
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const [particles, setParticles] = useState<
    Array<{ id: string; x: number; y: number }>
  >([]);

  const isOnSomnia = walletMetrics.isOnSomnia;
  const lastTxSpeed = networkMetrics.lastTxSpeed || walletMetrics.lastTxSpeed;

  // GSAP-enhanced animations and interactions
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const statusCards = container.querySelectorAll('[data-status-card]');
    
    // Entrance animation
    gsap.fromTo(container, 
      { opacity: 0, scale: 0.8, y: -20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.7)" }
    );

    // Stagger animation for status cards
    gsap.fromTo(statusCards,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power2.out", delay: 0.2 }
    );

    // Interactive hover effects
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Subtle follow effect for glow
      gsap.to(container, {
        '--mouse-x': `${x}px`,
        '--mouse-y': `${y}px`,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    const handleClick = () => {
      // Celebration particles on click
      const newParticles = [];
      for (let i = 0; i < 6; i++) {
        newParticles.push({
          id: Math.random().toString(),
          x: Math.random() * 100,
          y: Math.random() * 100
        });
      }
      setParticles(newParticles);
      
      // Clear particles after animation
      setTimeout(() => setParticles([]), 2000);
      
      // Pulse effect
      gsap.to(container, {
        scale: 1.05,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      });
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('click', handleClick);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('click', handleClick);
    };
  }, []);

  // Status change animations
  useEffect(() => {
    const statusElements = containerRef.current?.querySelectorAll('[data-status-value]');
    statusElements?.forEach((element, index) => {
      gsap.fromTo(element,
        { scale: 0.8, opacity: 0.5 },
        { scale: 1, opacity: 1, duration: 0.3, delay: index * 0.05, ease: "back.out(1.4)" }
      );
    });
  }, [systemStatus, isConnected, isOnSomnia]);

  // Simulate real-time block updates with animation
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStatus((prev) => ({
        ...prev,
        blockNumber: prev.blockNumber ? prev.blockNumber + 1 : 42161,
      }));
    }, 12000); // Update every 12 seconds (approximate Somnia block time)

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
      case "ENABLED":
      case "DEPLOYED":
        return "text-green-400";
      case "INACTIVE":
      case "DISABLED":
      case "NOT_DEPLOYED":
        return "text-yellow-400";
      case "ERROR":
      case "POOR_SIGNAL":
        return "text-red-400";
      default:
        return "text-white/60";
    }
  };

  const getNetworkStatusText = () => {
    if (!isConnected) return "WALLET_DISCONNECTED";
    if (!isOnSomnia) return "WRONG_NET";
    return "CONNECTED";
  };

  const getNetworkStatusColor = () => {
    if (!isConnected) return "text-red-600";
    if (!isOnSomnia) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "fixed top-4 right-4 z-50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/20 text-xs font-mono max-w-sm transition-all duration-500 cursor-pointer",
        "bg-gradient-to-br from-black/20 via-black/10 to-black/5",
        "hover:scale-105 hover:shadow-3xl",
        isMinimized && "scale-90 opacity-75"
      )}
      style={{
        background: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                     linear-gradient(145deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)`
      }}
    >
      {/* Floating Particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute pointer-events-none text-lg animate-ping"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animation: 'float 2s ease-out forwards'
          }}
        >
          ✨
        </div>
      ))}

      {/* Header with enhanced design */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={cn(
                "w-4 h-4 rounded-full transition-all duration-300",
                isOnSomnia ? "bg-green-400 animate-pulse" : "bg-yellow-400 animate-bounce"
              )}
            />
            {isOnSomnia && (
              <div className="absolute inset-0 w-4 h-4 rounded-full bg-green-400 animate-ping opacity-50" />
            )}
          </div>
          <div>
            <div className="font-semibold text-white text-sm">
              {isOnSomnia ? '🌐 Somnia Network' : '⚠️ Switch to Somnia'}
            </div>
            <div className="text-white/60 text-xs">
              {isOnSomnia ? 'Connected' : 'Wrong Network'}
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-white/60 hover:text-white/80 transition-colors p-1 rounded"
        >
          {isMinimized ? '▲' : '▼'}
        </button>
      </div>

      {!isMinimized && (
        <>
          {/* Wallet Address with improved styling */}
          {address && (
            <div className="mb-4 p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10" data-status-card>
              <div className="text-white/60 text-xs mb-1">Wallet Address</div>
              <div className="font-medium text-white/90 break-all text-xs">
                {address.slice(0, 8)}...{address.slice(-6)}
              </div>
            </div>
          )}

          {/* Enhanced System Status Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all duration-300" data-status-card>
              <div className="text-white/60 text-xs mb-1">Protocol</div>
              <div className={cn("font-bold text-sm", getStatusColor(systemStatus.protocol))} data-status-value>
                ⚡ {systemStatus.protocol}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all duration-300" data-status-card>
              <div className="text-white/60 text-xs mb-1">GPS</div>
              <div className={cn("font-bold text-sm", getStatusColor(systemStatus.gps))} data-status-value>
                📍 {systemStatus.gps}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all duration-300" data-status-card>
              <div className="text-white/60 text-xs mb-1">Contracts</div>
              <div className={cn("font-bold text-sm", getStatusColor(systemStatus.contracts))} data-status-value>
                📜 {systemStatus.contracts}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all duration-300" data-status-card>
              <div className="text-white/60 text-xs mb-1">Block</div>
              <div className="font-bold text-blue-400 text-sm" data-status-value data-block-number>
                🧱 {systemStatus.blockNumber}
              </div>
            </div>
          </div>

          {/* Enhanced Performance Metrics */}
          <div className="space-y-3 mb-4">
            {lastTxSpeed && (
              <div className="flex items-center justify-between p-3 bg-green-500/10 backdrop-blur-sm rounded-xl border border-green-500/20" data-status-card>
                <span className="text-green-400 font-medium">TX Speed</span>
                <span className="font-bold text-green-300">
                  {lastTxSpeed.toFixed(1)}s ⚡
                </span>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-blue-500/10 backdrop-blur-sm rounded-xl border border-blue-500/20" data-status-card>
              <span className="text-blue-400 font-medium">Contract</span>
              <span className="font-bold text-blue-300 truncate ml-2">
                {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
              </span>
            </div>
          </div>

          {/* Interactive Status Icons */}
          <div className="flex justify-center gap-4 pt-4 border-t border-white/10">
            <div className="text-2xl hover:scale-125 transition-transform cursor-pointer" title="Rewards Active">
              💰
            </div>
            <div className="text-2xl hover:scale-125 transition-transform cursor-pointer" title="Enhanced Features">
              ✨
            </div>
            <div className="text-2xl hover:scale-125 transition-transform cursor-pointer" title="Target Tracking">
              🎯
            </div>
          </div>

          {/* Interaction Hint */}
          <div className="text-center mt-3 text-white/40 text-xs">
            Click for effects • Hover to interact
          </div>
        </>
      )}

      {/* CSS for float animation */}
      <style jsx>{`
        @keyframes float {
          0% {
            opacity: 1;
            transform: translateY(0) scale(0.5);
          }
          50% {
            opacity: 0.8;
            transform: translateY(-50px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-100px) scale(0.5);
          }
        }
      `}</style>
    </div>
  );
}
            </div>
          </div>

          {/* Enhanced Performance Metrics */}
          <div className="space-y-3 mb-4">
            {lastTxSpeed && (
              <div className="flex items-center justify-between p-3 bg-green-500/10 backdrop-blur-sm rounded-xl border border-green-500/20" data-status-card>
                <span className="text-green-400 font-medium">TX Speed</span>
                <span className="font-bold text-green-300">
                  {lastTxSpeed.toFixed(1)}s ⚡
                </span>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-blue-500/10 backdrop-blur-sm rounded-xl border border-blue-500/20" data-status-card>
              <span className="text-blue-400 font-medium">Contract</span>
              <span className="font-bold text-blue-300 truncate ml-2">
                {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
              </span>
            </div>
          </div>

          {/* Interactive Status Icons */}
          <div className="flex justify-center gap-4 pt-4 border-t border-white/10">
            <div className="text-2xl hover:scale-125 transition-transform cursor-pointer" title="Rewards Active">
              💰
            </div>
            <div className="text-2xl hover:scale-125 transition-transform cursor-pointer" title="Enhanced Features">
              ✨
            </div>
            <div className="text-2xl hover:scale-125 transition-transform cursor-pointer" title="Target Tracking">
              🎯
            </div>
          </div>

          {/* Interaction Hint */}
          <div className="text-center mt-3 text-white/40 text-xs">
            Click for effects • Hover to interact
          </div>
        </>
      )}

      {/* CSS for float animation */}
      <style jsx>{`
        @keyframes float {
          0% {
            opacity: 1;
            transform: translateY(0) scale(0.5);
          }
          50% {
            opacity: 0.8;
            transform: translateY(-50px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-100px) scale(0.5);
          }
        }
      `}</style>
    </div>
  );
}
