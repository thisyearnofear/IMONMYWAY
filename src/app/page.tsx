"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/PremiumButton";
import { Card, DataPanel, DataRow } from "@/components/ui/PremiumCard";
import { WalletOnboarding } from "@/components/onboarding/WalletOnboarding";
import { useWallet } from "@/hooks/useWallet";
import { useUIStore } from "@/stores/uiStore";
import { useAnimation } from "@/hooks/useAnimation";
import { useNotification } from "@/hooks/useNotification";
import { cn } from "@/lib/utils";

// Dynamic imports for components that might cause SSR issues
const AchievementDisplay = dynamic(() => import("@/components/reputation/AchievementDisplay").then(mod => ({ default: mod.AchievementDisplay })), {
  ssr: false
});

const NetworkStatus = dynamic(() => import("@/components/core/NetworkStatus").then(mod => ({ default: mod.NetworkStatus })), {
  ssr: false
});

export default function HomePage() {
  const { connect, isConnected } = useWallet();
  const { getAnimationClass, triggerCelebration } = useAnimation();
  const { success } = useNotification();
  
  // Local state for onboarding modal
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Show onboarding after 2 seconds for new users
  useEffect(() => {
    if (!isConnected) {
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  const handleCelebration = () => {
    triggerCelebration({ type: 'success', intensity: 'medium' });
    success("Welcome to the future of punctuality!");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Grid overlay background */}
      <div className="fixed inset-0 grid-overlay opacity-30" />
      
      <NetworkStatus />
      
      <main className="relative z-10 container mx-auto px-4 py-16 max-w-6xl safe-area-top">
        {/* Hero Section */}
        <div className="text-center mb-16">
          {/* Status Badge */}
          <div className="inline-flex items-center space-x-2 glass-elevated px-6 py-3 rounded-full text-sm font-mono font-medium mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white/90 uppercase tracking-wider">PROTOCOL_ACTIVE</span>
          </div>

          {/* Main Title */}
          <h1 className="text-6xl md:text-8xl font-black text-white mb-8 animate-scale-in pixel-perfect">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
              IMONMYWAY
            </span>
          </h1>

          {/* Subtitle */}
          <div className="space-y-4 mb-12">
            <p className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto leading-relaxed animate-fade-in font-medium">
              <span className="font-mono text-blue-400">&gt;</span> Bet money on your punctuality
              <br />
              <span className="font-mono text-green-400">&gt;</span> Friends bet against you • GPS auto-verifies • Winner takes all
            </p>
            
            {/* Live Example */}
            <div className="terminal max-w-2xl mx-auto text-left">
              <div className="terminal-line">USER_STAKES: 100 TOKENS → "I&apos;ll be there by 3:00 PM"</div>
              <div className="terminal-line">FRIEND_BETS: 50 TOKENS → "No way, traffic is crazy"</div>
              <div className="terminal-line">GPS_VERIFIED: ARRIVED_AT_2:58_PM → USER_WINS_150_TOKENS</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-6 animate-fade-in">
            {/* Primary Value Prop */}
            <div className="glass-elevated p-6 rounded-xl max-w-2xl mx-auto mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-2">
                  💰 STAKE → 📍 ARRIVE → 🎉 WIN 2.5X
                </div>
                <div className="text-white/70 font-mono text-sm">
                  Friends bet against you • GPS proves you made it • Smart contracts pay out
                </div>
              </div>
            </div>

            {/* Action Flow */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/plan">
                <Button
                  variant="glass"
                  size="lg"
                  icon="1️⃣"
                  className="text-lg px-8 py-4 glow-primary w-full sm:w-auto"
                >
                  PLAN ROUTE
                </Button>
              </Link>
              <div className="hidden sm:block text-white/50 font-mono">→</div>
              <Link href="/share">
                <Button
                  variant="success"
                  size="lg"
                  icon="2️⃣"
                  className="text-lg px-8 py-4 w-full sm:w-auto"
                >
                  STAKE & INVITE
                </Button>
              </Link>
              <div className="hidden sm:block text-white/50 font-mono">→</div>
              <Button
                variant="secondary"
                size="lg"
                icon="3️⃣"
                disabled
                className="text-lg px-8 py-4 w-full sm:w-auto opacity-50"
              >
                AUTO VERIFY
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="flex justify-center space-x-8 text-sm font-mono">
              <div className="text-center">
                <div className="text-green-400 font-bold">2.5X</div>
                <div className="text-white/60">PAYOUT</div>
              </div>
              <div className="text-center">
                <div className="text-blue-400 font-bold">±2M</div>
                <div className="text-white/60">GPS ACCURACY</div>
              </div>
              <div className="text-center">
                <div className="text-purple-400 font-bold">AUTO</div>
                <div className="text-white/60">VERIFICATION</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <DataPanel 
            className="p-8 animate-fade-in hover:glow-primary transition-all duration-300 min-h-[280px]"
            title="ROUTE_OPTIMIZER"
          >
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 glass-elevated rounded-lg flex items-center justify-center pixel-perfect">
                <span className="text-3xl">🗺️</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <DataRow label="AI_TRAFFIC_ANALYSIS" value="ACTIVE" status="success" />
              <DataRow label="ETA_PREDICTION" value="REAL_TIME" status="success" />
              <DataRow label="GPS_ACCURACY" value="±2M" status="neutral" />
            </div>
          </DataPanel>

          <DataPanel 
            className="p-8 animate-fade-in hover:glow-success transition-all duration-300 min-h-[280px]"
            title="SOCIAL_BETTING"
          >
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 glass-elevated rounded-lg flex items-center justify-center pixel-perfect">
                <span className="text-3xl">💰</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <DataRow label="STAKE_TOKENS" value="ENABLED" status="success" />
              <DataRow label="FRIEND_BETS" value="LIVE" status="success" />
              <DataRow label="PAYOUT_RATIO" value="1:2.5" status="neutral" />
            </div>
          </DataPanel>

          <DataPanel 
            className="p-8 animate-fade-in hover:glow-primary transition-all duration-300 min-h-[280px]"
            title="BLOCKCHAIN_VERIFY"
          >
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 glass-elevated rounded-lg flex items-center justify-center pixel-perfect">
                <span className="text-3xl">📍</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <DataRow label="PROOF_OF_ARRIVAL" value="IMMUTABLE" status="success" />
              <DataRow label="SMART_CONTRACTS" value="DEPLOYED" status="success" />
              <DataRow label="NETWORK" value="SOMNIA" status="neutral" />
            </div>
          </DataPanel>
        </div>

        {/* Terminal Status */}
        <div className="terminal mb-16 animate-fade-in">
          <div className="terminal-line">SYSTEM_STATUS: ALL_MODULES_OPERATIONAL</div>
          <div className="terminal-line">GPS_TRACKING: PRECISION_MODE_ENABLED</div>
          <div className="terminal-line">BLOCKCHAIN_SYNC: BLOCK_HEIGHT_CURRENT</div>
          <div className="terminal-line">READY_FOR_COMMITMENT_PROTOCOL_INITIALIZATION</div>
        </div>

        {/* Achievements Section */}
        <div className="mb-16 animate-fade-in">
          <AchievementDisplay />
        </div>

        {/* Stats Panel */}
        <DataPanel 
          className="p-12 text-center animate-fade-in"
          title="PROTOCOL_STATISTICS"
        >
          <div className="grid grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="text-4xl font-black font-mono text-blue-400 mb-2">
                100%
              </div>
              <div className="text-white/70 font-mono text-sm uppercase">BLOCKCHAIN_VERIFIED</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black font-mono text-green-400 mb-2">
                REAL_TIME
              </div>
              <div className="text-white/70 font-mono text-sm uppercase">GPS_TRACKING</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black font-mono text-purple-400 mb-2">
                SOCIAL
              </div>
              <div className="text-white/70 font-mono text-sm uppercase">BETTING_PROTOCOL</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="progress-bar h-3 rounded-full mb-4">
            <div className="progress-fill w-3/4 rounded-full" />
          </div>
          <div className="text-white/60 font-mono text-sm">
            SYSTEM_READINESS: 75% • AWAITING_USER_INPUT
          </div>
        </DataPanel>
      </main>

      {/* Wallet Onboarding Modal */}
      {showOnboarding && <WalletOnboarding 
        onComplete={() => setShowOnboarding(false)} 
        onSkip={() => setShowOnboarding(false)} 
      />}
    </div>
  );
}
