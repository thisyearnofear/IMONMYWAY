"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button, ButtonGroup } from "@/components/ui/PremiumButton";
import { DelightfulButton } from "@/components/ui/DelightfulButton";
import { Card, CardContent, DataPanel, DataRow } from "@/components/ui/PremiumCard";
import { ConsumerTestimonial } from "@/components/ui/ConsumerTestimonial";
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
  const [currentTime, setCurrentTime] = useState(new Date());
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
      {/* Fun Consumer Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950 via-purple-950/40 to-pink-950/30" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.2),transparent_60%)]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.15),transparent_60%)]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(236,72,153,0.1),transparent_70%)]" />
      
      {/* Fun Floating Elements */}
      <div className="fixed inset-0 opacity-40 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 text-2xl animate-float" style={{animationDelay: '0s'}}>💰</div>
        <div className="absolute top-1/3 right-1/3 text-xl animate-float" style={{animationDelay: '2s'}}>⏰</div>
        <div className="absolute bottom-1/4 left-1/3 text-lg animate-float" style={{animationDelay: '4s'}}>🎯</div>
        <div className="absolute top-2/3 right-1/4 text-xl animate-float" style={{animationDelay: '1s'}}>🚀</div>
        <div className="absolute top-1/2 left-1/6 text-sm animate-float" style={{animationDelay: '3s'}}>💸</div>
        <div className="absolute bottom-1/3 right-1/6 text-lg animate-float" style={{animationDelay: '5s'}}>🔥</div>
      </div>
      
      <NetworkStatus />
      
      <main className="relative z-10 min-h-screen flex flex-col">
        {/* Compact Hero Section */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Live Status Badge */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="glass-enhanced px-4 py-2 rounded-full flex items-center gap-2 animate-fade-in hover:scale-105 transition-all duration-300 cursor-pointer group">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50 group-hover:animate-heartbeat" />
              <span className="text-white/90 font-medium text-xs sm:text-sm tracking-wide">
                <span className="group-hover:animate-wiggle inline-block">🔥</span> Live & Ready • {currentTime.toLocaleTimeString('en-US', { hour12: false })}
              </span>
            </div>
          </div>

          {/* Impact Title */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black mb-4 tracking-tight leading-none">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x">
                IMONMYWAY
              </span>
            </h1>
            <div className="h-0.5 w-16 sm:w-24 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-4" />
            <p className="text-lg sm:text-xl lg:text-2xl text-white/90 font-medium max-w-3xl mx-auto leading-relaxed">
              Turn being on time into <span className="text-yellow-400 font-bold">cold hard cash</span> 💰<br/>
              <span className="text-blue-400">Challenge your friends</span> • <span className="text-green-400">Prove them wrong</span> • <span className="text-purple-400">Get paid</span>
            </p>
          </div>

          {/* Compact Value Demo */}
          <div className="max-w-4xl mx-auto mb-8 sm:mb-12">
            <Card variant="floating" className="p-4 sm:p-6 mb-6 group hover:shadow-xl transition-all duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center group">
                  <div className="w-12 h-12 glass-enhanced rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                    <span className="text-2xl group-hover:animate-wiggle">💰</span>
                  </div>
                  <div className="text-sm font-bold text-white/90">Stake $100</div>
                  <div className="text-xs text-white/70">"I'll be there by 3PM"</div>
                </div>
                <div className="flex flex-col items-center group">
                  <div className="w-12 h-12 glass-enhanced rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
                    <span className="text-2xl group-hover:animate-bounce">📍</span>
                  </div>
                  <div className="text-sm font-bold text-white/90">GPS Checks</div>
                  <div className="text-xs text-white/70">Arrived 2:58 PM ✅</div>
                </div>
                <div className="flex flex-col items-center group">
                  <div className="w-12 h-12 glass-enhanced rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <span className="text-2xl group-hover:animate-heartbeat">🎉</span>
                  </div>
                  <div className="text-sm font-bold text-green-400">Win $250! 🎉</div>
                  <div className="text-xs text-white/70">2.5x your money back</div>
                </div>
              </div>
            </Card>

            {/* Delightful Action Buttons */}
            <div className="space-y-3 sm:space-y-0 sm:flex sm:gap-3 sm:justify-center">
              <Link href="/plan" className="block sm:inline-block">
                <DelightfulButton
                  variant="primary"
                  size="lg"
                  emoji="🗺️"
                  hoverEmoji="🚀"
                  successEmoji="✨"
                  glow
                  className="w-full sm:w-auto min-w-[160px] h-14 text-base font-bold"
                  onDelightfulClick={() => console.log("Planning route! 🗺️")}
                >
                  Plan My Route
                </DelightfulButton>
              </Link>
              <Link href="/share" className="block sm:inline-block">
                <DelightfulButton
                  variant="success"
                  size="lg"
                  emoji="💰"
                  hoverEmoji="💸"
                  successEmoji="🤑"
                  glow
                  className="w-full sm:w-auto min-w-[160px] h-14 text-base font-bold"
                  onDelightfulClick={() => console.log("Starting challenge! 💰")}
                >
                  Start Challenge
                </DelightfulButton>
              </Link>
              <Link href="/watch" className="block sm:inline-block">
                <DelightfulButton
                  variant="glass"
                  size="lg"
                  emoji="👀"
                  hoverEmoji="🍿"
                  successEmoji="🎬"
                  className="w-full sm:w-auto min-w-[160px] h-14 text-base font-bold"
                  onDelightfulClick={() => console.log("Watching friends! 👀")}
                >
                  Watch Friends
                </DelightfulButton>
              </Link>
            </div>
          </div>
        </div>

        {/* Compact Features Section */}
        <div className="px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
          <div className="max-w-6xl mx-auto">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
              <div className="glass-enhanced p-3 sm:p-4 rounded-xl text-center hover:scale-105 hover:rotate-1 transition-all duration-300 group cursor-pointer">
                <div className="text-lg sm:text-2xl font-bold text-green-400 mb-1 group-hover:animate-wiggle">🎯 99%</div>
                <div className="text-xs sm:text-sm text-white/70">Super Accurate</div>
              </div>
              <div className="glass-enhanced p-3 sm:p-4 rounded-xl text-center hover:scale-105 hover:-rotate-1 transition-all duration-300 group cursor-pointer">
                <div className="text-lg sm:text-2xl font-bold text-blue-400 mb-1 group-hover:animate-bounce">💸 2.5x</div>
                <div className="text-xs sm:text-sm text-white/70">Your Money Back</div>
              </div>
              <div className="glass-enhanced p-3 sm:p-4 rounded-xl text-center hover:scale-105 hover:rotate-1 transition-all duration-300 group cursor-pointer">
                <div className="text-lg sm:text-2xl font-bold text-purple-400 mb-1 group-hover:animate-pulse">⚡ Instant</div>
                <div className="text-xs sm:text-sm text-white/70">Payouts</div>
              </div>
              <div className="glass-enhanced p-3 sm:p-4 rounded-xl text-center hover:scale-105 hover:-rotate-1 transition-all duration-300 group cursor-pointer">
                <div className="text-lg sm:text-2xl font-bold text-yellow-400 mb-1 group-hover:animate-heartbeat">🔥 Always</div>
                <div className="text-xs sm:text-sm text-white/70">Available</div>
              </div>
            </div>

            {/* How It Works - Compact */}
            <Card variant="floating" className="p-4 sm:p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  How to <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Make Money</span> 💰
                </h2>
                <p className="text-sm sm:text-base text-white/70">It's literally this easy to get paid for being on time</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 glass-enhanced rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl sm:text-2xl">1️⃣</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white mb-2">Make Your Bet</h3>
                  <p className="text-xs sm:text-sm text-white/70">Say where you're going & when you'll be there</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 glass-enhanced rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl sm:text-2xl">2️⃣</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white mb-2">Friends Doubt You</h3>
                  <p className="text-xs sm:text-sm text-white/70">They bet you'll be late (spoiler: you won't be)</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 glass-enhanced rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl sm:text-2xl">3️⃣</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white mb-2">Prove Them Wrong</h3>
                  <p className="text-xs sm:text-sm text-white/70">Show up on time, get paid automatically</p>
                </div>
              </div>
            </Card>
          </div>
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
