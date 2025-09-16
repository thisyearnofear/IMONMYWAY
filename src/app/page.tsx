"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button, ButtonGroup } from "@/components/ui/PremiumButton";
import { DelightfulButton } from "@/components/ui/DelightfulButton";
import {
  Card,
  CardContent,
  DataPanel,
  DataRow,
} from "@/components/ui/PremiumCard";
import { ConsumerTestimonial } from "@/components/ui/ConsumerTestimonial";
import { WalletOnboarding } from "@/components/onboarding/WalletOnboarding";
import { AchievementDisplay } from "@/components/reputation/AchievementDisplay";
import { NetworkStatus } from "@/components/core/NetworkStatus";
import { SuccessCelebration } from "@/components/ui/ParticleSystem";
import { useWallet } from "@/hooks/useWallet";
import { useUIStore } from "@/stores/uiStore";
import { useAnimation } from "@/hooks/useAnimation";
import { useNotification } from "@/hooks/useNotification";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCelebration, setShowCelebration] = useState(false);
  const { isConnected } = useWallet();
  const { addToast } = useUIStore();
  const { getAnimationClass, triggerCelebration } = useAnimation();
  const { success } = useNotification();

  // Update time every second for live clock effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    setShowCelebration(true); // Trigger particle celebration
    triggerCelebration({
      type: "success",
      intensity: "intense",
      haptic: true,
    });
    success(
      "Welcome to Punctuality Protocol! 🎉 Ready to put your punctuality to the test?"
    );
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Fun Consumer Background with better depth */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950 via-purple-950/30 to-pink-950/20" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(59,130,246,0.15),transparent_70%)]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(168,85,247,0.1),transparent_70%)]" />

      {/* Subtle floating elements - reduced for better focus */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 text-xl animate-float"
          style={{ animationDelay: "0s" }}
        >
          💰
        </div>
        <div
          className="absolute bottom-1/3 right-1/4 text-lg animate-float"
          style={{ animationDelay: "3s" }}
        >
          ✨
        </div>
        <div
          className="absolute top-2/3 left-1/6 text-lg animate-float"
          style={{ animationDelay: "5s" }}
        >
          🎯
        </div>
      </div>

      <NetworkStatus />

      <main className="relative z-10 min-h-screen flex flex-col">
        {/* Simplified Hero Section */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Live Status Badge */}
          <div className="flex justify-center mb-8">
            <div className="glass-enhanced px-3 py-2 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white/90 font-medium text-sm">
                🔥 Live & Ready
              </span>
            </div>
          </div>

          {/* Enhanced Hero Title with GSAP animations */}
          <div className="text-center mb-12">
            <div className="mb-6 overflow-hidden">
              <h1 className="heading-primary tracking-tight leading-none animate-hero-text">
                <span className="inline-block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  IMONMYWAY
                </span>
              </h1>
            </div>
            <div className="overflow-hidden">
              <p className="text-body max-w-2xl mx-auto leading-relaxed mb-8 animate-subtitle">
                Turn punctuality into profit.
                <br />
                <span className="text-lg text-white/70">
                  Stake money, arrive on time, get paid 2.5x back.
                </span>
              </p>
            </div>

            {/* Primary Call-to-Action */}
            <div className="mb-8">
              <Link href="/plan">
                <DelightfulButton
                  variant="primary"
                  size="xl"
                  emoji="🚀"
                  hoverEmoji="💫"
                  successEmoji="✨"
                  glow
                  className="btn-primary min-w-[220px] h-16 text-lg font-bold shadow-2xl"
                  aria-label="Start planning your punctuality challenge"
                  onDelightfulClick={() => {
                    console.log("Let's go! 🚀");
                    setShowCelebration(true);
                  }}
                >
                  Start Your Journey
                </DelightfulButton>
              </Link>
            </div>

            {/* Secondary Actions with better spacing */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
              <Link href="/share" className="flex-1">
                <DelightfulButton
                  variant="glass"
                  size="md"
                  emoji="💰"
                  className="btn-secondary w-full h-12 text-sm"
                  aria-label="Place a bet on someone's punctuality"
                >
                  Place Bet
                </DelightfulButton>
              </Link>
              <Link href="/watch" className="flex-1">
                <DelightfulButton
                  variant="glass"
                  size="md"
                  emoji="👀"
                  className="btn-secondary w-full h-12 text-sm"
                  aria-label="Watch ongoing challenges"
                >
                  Watch Live
                </DelightfulButton>
              </Link>
            </div>
          </div>
        </div>

        {/* Enhanced Features Section */}
        <div className="content-section px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-4xl mx-auto">
            {/* Key Benefits with better visual hierarchy */}
            <div className="grid grid-cols-3 gap-6 mb-12">
              <div className="card-enhanced text-center animate-fade-in">
                <div className="status-indicator status-success mb-3 mx-auto w-fit">
                  <span>🎯</span>
                  <span>99% Accurate</span>
                </div>
                <p className="text-xs text-white/60">GPS-verified arrivals</p>
              </div>
              <div
                className="card-enhanced text-center animate-fade-in"
                style={{ animationDelay: "100ms" }}
              >
                <div className="status-indicator bg-blue-500/10 text-blue-400 border-blue-500/30 mb-3 mx-auto w-fit">
                  <span>💸</span>
                  <span>2.5x Returns</span>
                </div>
                <p className="text-xs text-white/60">Verified payouts</p>
              </div>
              <div
                className="card-enhanced text-center animate-fade-in"
                style={{ animationDelay: "200ms" }}
              >
                <div className="status-indicator bg-purple-500/10 text-purple-400 border-purple-500/30 mb-3 mx-auto w-fit">
                  <span>⚡</span>
                  <span>Instant</span>
                </div>
                <p className="text-xs text-white/60">Smart contracts</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Wallet Onboarding Modal */}
      {showOnboarding && (
        <WalletOnboarding
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {/* GSAP-inspired Celebration Particles */}
      <SuccessCelebration
        trigger={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />
    </div>
  );
}
