"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/PremiumButton";
import { Card } from "@/components/ui/PremiumCard";
import { WalletOnboarding } from "@/components/onboarding/WalletOnboarding";
import { useWallet } from "@/hooks/useWallet";
import { useUIStore } from "@/stores/uiStore";
import { useAnimation } from "@/hooks/useAnimation";
import { useNotification } from "@/hooks/useNotification";
import { cn } from "@/lib/utils";

// Dynamic imports for components that might cause SSR issues
const NetworkStatus = dynamic(() => import("@/components/core/NetworkStatus").then(mod => ({ default: mod.NetworkStatus })), {
  ssr: false
});

// Animated Hourglass Component
const HourglassAnimation = () => {
  return (
    <div className="relative w-32 h-40 mx-auto">
      {/* Hourglass container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Top chamber */}
        <div className="w-16 h-16 border-l-2 border-r-2 border-t-2 border-gold/70 rounded-t-full" />
        
        {/* Neck */}
        <div className="w-4 h-4 border-l border-r border-gold/50" />
        
        {/* Bottom chamber */}
        <div className="w-16 h-16 border-l-2 border-r-2 border-b-2 border-gold/70 rounded-b-full" />
        
        {/* Sand animation */}
        <div className="absolute top-8 w-1 h-32 bg-gradient-to-b from-gold/100 via-gold/80 to-transparent animate-sand-flow" />
        
        {/* Sand particles */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-gold/60 rounded-full animate-sand-fall"
              style={{
                left: `${Math.random() * 20 - 10}px`,
                top: `${Math.random() * 20}px`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Gear Animation Component
const GearAnimation = ({ delay = 0 }) => {
  return (
    <div 
      className="w-8 h-8 border-2 border-violet/30 rounded-full animate-spin"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="absolute inset-0 border-2 border-violet/20 rounded-full animate-ping" />
    </div>
  );
};

export default function HomePage() {
  const { connect, isConnected } = useWallet();
  const { getAnimationClass, triggerCelebration } = useAnimation();
  const { success } = useNotification();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Handle scroll for parallax effects
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-graphite-500 via-violet-950 to-gold-900">
      <NetworkStatus />

      {/* Animated background particles - Timepiece theme */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gold-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 10 + 5}s`
            }}
          />
        ))}
        {[...Array(20)].map((_, i) => (
          <div
            key={`violet-${i}`}
            className="absolute w-1.5 h-1.5 bg-violet-400/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${Math.random() * 12 + 8}s`
            }}
          />
        ))}
      </div>

      <main className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section - The Timepiece */}
        <div className="text-center mb-20 relative">
          {/* Parallax clock gears - Enhanced with timepiece aesthetic */}
          <div
            className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-gold/10 to-violet/10 rounded-full opacity-20 animate-float"
            style={{ transform: `translateY(${scrollY * 0.1}px)` }}
          />
          <div
            className="absolute -top-10 -right-20 w-24 h-24 bg-gradient-to-br from-gold/10 to-violet/10 rounded-full opacity-25 animate-float"
            style={{ transform: `translateY(${scrollY * -0.05}px)`, animationDelay: '1s' }}
          />
          <div
            className="absolute top-40 -left-10 w-32 h-32 bg-gradient-to-br from-gold/10 to-violet/10 rounded-full opacity-20 animate-float"
            style={{ transform: `translateY(${scrollY * 0.08}px)`, animationDelay: '2s' }}
          />

          {/* Title */}
          <div className="relative z-20">
            <h1 className="heading-primary mb-6">
              <span className="bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 bg-clip-text text-transparent">
                IMONMYWAY
              </span>
            </h1>

            {/* Animated hourglass */}
            <div className="mb-8">
              <HourglassAnimation />
            </div>

            <p className="text-xl md:text-2xl text-gold-400/90 max-w-3xl mx-auto mb-8 text-body">
              Put your money where your <span className="text-white font-bold">minutes</span> are.
            </p>

            <p className="text-lg text-gold-400/90 max-w-2xl mx-auto mb-12 text-body">
              Stake tokens on your punctuality. Earn your reputation in <span className="text-white font-bold">real time</span>.
            </p>

            {/* Action buttons with timepiece styling */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Link href="/plan">
                <Button
                  variant="gradient"
                  size="lg"
                  className="btn-timepiece"
                >
                  Start a Commitment
                </Button>
              </Link>

              <Link href="/watch">
                <Button
                  variant="glass"
                  size="lg"
                  className="border-2 border-gold-400/50 text-gold-400 hover:border-gold-400 hover:bg-gold-400/10"
                >
                  Track a Friend
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Time Gears Section - The Mechanics */}
        <div className="relative mb-20">
          <div className="flex justify-center space-x-16 mb-16">
            {[1, 2, 3, 4, 5].map((step, index) => (
              <div 
                key={step}
                className="flex flex-col items-center relative"
                style={{ transform: `rotate(${scrollY * 0.01 * (index + 1)}deg)` }}
              >
                <GearAnimation delay={index * 0.2} />
                <div className="mt-4 text-center">
                  <div className="text-sm text-gold/60 font-mono uppercase tracking-wider">
                    {index === 0 && 'Plan'}
                    {index === 1 && 'Stake'}
                    {index === 2 && 'Track'}
                    {index === 3 && 'Arrive'}
                    {index === 4 && 'Reward'}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Connection lines between gears */}
          <div className="absolute inset-0 flex justify-center">
            <div className="w-4/5 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent my-auto" />
          </div>
        </div>

        {/* Features Grid - The Mechanisms */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {[
            { icon: '🪙', title: 'Staked Commitments', desc: 'Gear tooth engraved with a coin symbol', variant: 'premium' as const },
            { icon: '🎲', title: 'Social Betting', desc: 'Twin hourglasses facing each other', variant: 'enhanced' as const },
            { icon: '📍', title: 'GPS Verification', desc: 'Compass needle overlay on a clock face', variant: 'floating' as const },
            { icon: '⭐', title: 'Reputation System', desc: 'Radiant gold dial showing rising score', variant: 'premium' as const },
            { icon: '🤖', title: 'Smart Recommendations', desc: 'AI brain motif nested inside gears', variant: 'enhanced' as const },
            { icon: '⚡', title: 'Optimistic Updates', desc: 'Flickering second hand showing instant feedback', variant: 'floating' as const }
          ].map((feature, index) => (
            <Card
              key={feature.title}
              variant={feature.variant}
              className="p-8 hover:scale-105 transition-all duration-300 group"
            >
              <div className="relative z-10 text-center">
                <div className="text-5xl mb-6 animate-float">
                  {feature.icon}
                </div>

                <h3 className="text-xl font-bold text-white mb-3 heading-secondary">
                  {feature.title}
                </h3>

                <p className="text-white/70 text-sm text-body">
                  {feature.desc}
                </p>
              </div>

              {/* Mechanical accent */}
              <div className="absolute -bottom-2 -right-2 w-8 h-8 border-2 border-gold-400/30 rounded-full animate-gear-interlock opacity-60" />
            </Card>
          ))}
        </div>

        {/* Interactive Map Section - Time in Motion */}
        <div className="relative mb-20">
          <Card variant="floating" className="p-8">
            <div className="text-center">
              <h2 className="heading-secondary text-white mb-8">
                Your journey is your clock
              </h2>

              <div className="aspect-video bg-gradient-to-br from-gold/10 to-violet/10 rounded-xl relative overflow-hidden p-8 border border-gold/20">
                {/* Simulated map with clock face */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-4 border-gold-400/40 rounded-full relative animate-clock-rotate">
                    {/* Clock numerals */}
                    {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num, i) => {
                      const angle = (i * 30) * (Math.PI / 180);
                      const radius = 100;
                      const x = 50 + radius * Math.sin(angle);
                      const y = 50 - radius * Math.cos(angle);

                      return (
                        <div
                          key={num}
                          className="absolute text-gold-400/70 font-bold text-sm font-mono"
                          style={{
                            left: `${x}%`,
                            top: `${y}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                        >
                          {num}
                        </div>
                      );
                    })}

                    {/* Clock hands */}
                    <div className="absolute top-1/2 left-1/2 w-1 h-20 bg-gradient-to-b from-gold-400 to-gold-500 origin-bottom transform -translate-x-1/2 animate-tick" />
                    <div className="absolute top-1/2 left-1/2 w-1 h-16 bg-gradient-to-b from-violet-400 to-violet-500 origin-bottom transform -translate-x-1/2" />
                    <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-gold-400 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Floating particles */}
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-violet-400/30 rounded-full animate-time-drift"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      top: `${20 + Math.random() * 60}%`,
                      animationDelay: `${i * 0.5}s`
                    }}
                  />
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Token Economics / Reputation Section */}
        <div className="grid lg:grid-cols-2 gap-12 mb-20">
          {/* Pendulum Animation */}
          <div className="flex justify-center items-center">
            <div className="relative w-32 h-64">
              <div className="absolute top-0 left-1/2 w-1 h-16 bg-violet/30" />
              <div 
                className="absolute left-1/2 w-16 h-1 bg-gold origin-top animate-pendulum"
                style={{
                  transformOrigin: 'top center',
                  animation: 'pendulum 3s ease-in-out infinite'
                }}
              />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-gold rounded-full" />
            </div>
          </div>
          
          {/* Content */}
          <div className="flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-white mb-4 font-display">
              Punctuality pays dividends
            </h2>
            <p className="text-white/70 mb-6 font-body">
              The earlier you arrive, the stronger your reputation. 
              Build trust through consistent punctuality and earn higher stakes.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gold rounded-full animate-pulse" />
                <span className="text-white/80 font-mono text-sm">+2.5x multiplier for early arrivals</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-violet rounded-full animate-pulse" />
                <span className="text-white/80 font-mono text-sm">Reputation score increases with reliability</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gold rounded-full animate-pulse" />
                <span className="text-white/80 font-mono text-sm">Higher stakes for trusted users</span>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof Section */}
        <div className="mb-20">
          <h2 className="heading-secondary text-center text-white mb-12">
            The Clock Never Lies
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { quote: "Arrived 5 min early — 2.5x return", user: "EarlyBird21", time: "2025-10-27 14:23:45", verified: true, variant: 'premium' as const },
              { quote: "Perfect punctuality streak: 30 days", user: "PunctualPro", time: "2025-10-26 09:15:22", verified: true, variant: 'enhanced' as const },
              { quote: "Won 150 tokens betting on my arrival", user: "ConfidentCommuter", time: "2025-10-25 18:02:11", verified: false, variant: 'floating' as const },
              { quote: "Trust score increased by 25 points", user: "ReliableRider", time: "2025-10-24 12:45:33", verified: true, variant: 'premium' as const },
              { quote: "First bet win — now I'm hooked", user: "NewComer", time: "2025-10-23 16:22:44", verified: false, variant: 'enhanced' as const },
              { quote: "Consistent punctuality pays off", user: "TimeMaster", time: "2025-10-22 07:59:59", verified: true, variant: 'floating' as const }
            ].map((testimonial, index) => (
              <Card key={index} variant={testimonial.variant} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${testimonial.verified ? 'bg-gold-400 animate-pulse' : 'bg-violet-400/50'}`} />
                    <span className="text-white font-mono text-sm font-semibold">{testimonial.user}</span>
                  </div>
                  <span className="text-xs text-white/50 font-mono">{testimonial.time}</span>
                </div>

                <p className="text-white/90 italic mb-4 text-body">"{testimonial.quote}"</p>

                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gold-400 rounded-full animate-pulse" />
                  <span className="text-xs text-gold-400 font-mono font-bold">VERIFIED ARRIVAL</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-gold-400/20 bg-gradient-to-br from-gold/10 to-violet/10 rounded-xl">
        <div className="container mx-auto px-4 py-16 relative overflow-hidden">
          {/* Footer clock watermark - Enhanced */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-10">
            <div className="w-80 h-80 border-2 border-gold-400/30 rounded-full relative animate-clock-rotate">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-8 bg-gradient-to-b from-gold-400/50 to-transparent"
                  style={{
                    top: '10px',
                    left: '50%',
                    transform: `translateX(-50%) rotate(${i * 30}deg) translateY(-120px)`
                  }}
                />
              ))}
              {/* Center dot */}
              <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-gold-400/60 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="relative z-10">
            <div className="text-center mb-12">
              <h3 className="heading-secondary text-white mb-4">
                Time Well Spent
              </h3>
              <p className="text-white/60 text-body max-w-md mx-auto">
                Every commitment is a promise to yourself and others.
              </p>
            </div>

            <div className="flex justify-center space-x-8 mb-12">
              {['About', 'Features', 'Team', 'FAQ', 'Contact'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-white/70 hover:text-gold-400 transition-colors font-mono text-sm hover:scale-105 transform duration-200"
                >
                  {item}
                </a>
              ))}
            </div>

            <div className="text-center">
              <p className="text-white/50 text-sm font-mono">
                © 2025 IMONMYWAY. All rights reserved. Built on Somnia Network.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Wallet Onboarding Modal */}
      {showOnboarding && <WalletOnboarding 
        onComplete={() => setShowOnboarding(false)} 
        onSkip={() => setShowOnboarding(false)} 
      />}
    </div>
  );
}
