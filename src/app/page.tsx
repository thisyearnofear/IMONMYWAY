"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { WalletOnboarding } from "@/components/onboarding/WalletOnboarding";
import { AchievementDisplay } from "@/components/reputation/AchievementDisplay";
import { NetworkStatus } from "@/components/core/NetworkStatus";
import { useWallet } from "@/hooks/useWallet";
import { useUIStore } from "@/stores/uiStore";
import { useAnimation } from "@/hooks/useAnimation";
import { useNotification } from "@/hooks/useNotification";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { isConnected } = useWallet();
  const { addToast } = useUIStore();
  const { getAnimationClass, triggerCelebration } = useAnimation();
  const { success } = useNotification();

  useEffect(() => {
    if (!isConnected) {
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    triggerCelebration({
      type: "success",
      intensity: "intense",
      haptic: true
    });
    success("Welcome to Punctuality Protocol! 🎉 Ready to put your punctuality to the test?");
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
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
              <div className="terminal-line">USER_STAKES: 100 TOKENS → &quot;I&apos;ll be there by 3:00 PM&quot;</div>
              <div className="terminal-line">FRIEND_BETS: 50 TOKENS → &quot;No way, traffic is crazy&quot;</div>
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
                  variant="pixel"
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
          <Card className="data-panel p-8 animate-fade-in hover:glow-primary transition-all duration-300">
            <div className="w-16 h-16 glass-elevated rounded-lg flex items-center justify-center mb-6 pixel-perfect">
              <span className="text-3xl">🗺️</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-4 font-mono uppercase tracking-wide">
              ROUTE_OPTIMIZER
            </h3>
            <div className="space-y-2 text-sm">
              <div className="data-row">
                <span className="data-label">AI_TRAFFIC_ANALYSIS</span>
                <span className="data-value status-online">ACTIVE</span>
              </div>
              <div className="data-row">
                <span className="data-label">ETA_PREDICTION</span>
                <span className="data-value status-online">REAL_TIME</span>
              </div>
              <div className="data-row">
                <span className="data-label">GPS_ACCURACY</span>
                <span className="data-value">±2M</span>
              </div>
            </div>
          </Card>

          <Card className="data-panel p-8 animate-fade-in hover:glow-success transition-all duration-300">
            <div className="w-16 h-16 glass-elevated rounded-lg flex items-center justify-center mb-6 pixel-perfect">
              <span className="text-3xl">💰</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-4 font-mono uppercase tracking-wide">
              SOCIAL_BETTING
            </h3>
            <div className="space-y-2 text-sm">
              <div className="data-row">
                <span className="data-label">STAKE_TOKENS</span>
                <span className="data-value status-online">ENABLED</span>
              </div>
              <div className="data-row">
                <span className="data-label">FRIEND_BETS</span>
                <span className="data-value status-online">LIVE</span>
              </div>
              <div className="data-row">
                <span className="data-label">PAYOUT_RATIO</span>
                <span className="data-value">1:2.5</span>
              </div>
            </div>
          </Card>

          <Card className="data-panel p-8 animate-fade-in hover:glow-primary transition-all duration-300">
            <div className="w-16 h-16 glass-elevated rounded-lg flex items-center justify-center mb-6 pixel-perfect">
              <span className="text-3xl">📍</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-4 font-mono uppercase tracking-wide">
              BLOCKCHAIN_VERIFY
            </h3>
            <div className="space-y-2 text-sm">
              <div className="data-row">
                <span className="data-label">PROOF_OF_ARRIVAL</span>
                <span className="data-value status-online">IMMUTABLE</span>
              </div>
              <div className="data-row">
                <span className="data-label">SMART_CONTRACTS</span>
                <span className="data-value status-online">DEPLOYED</span>
              </div>
              <div className="data-row">
                <span className="data-label">NETWORK</span>
                <span className="data-value">SOMNIA</span>
              </div>
            </div>
          </Card>
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
        <Card className="data-panel p-12 text-center animate-fade-in">
          <h3 className="text-3xl font-bold text-white mb-6 font-mono uppercase tracking-wide">
            PROTOCOL_STATISTICS
          </h3>
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
        </Card>
      </main>

      {/* Wallet Onboarding Modal */}
      {showOnboarding && (
        <WalletOnboarding
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
    </div>
  );
}
