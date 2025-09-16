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
import ParallaxSection from "@/components/three/ParallaxSection";
import WebGLParticleSystem from "@/components/three/ParticleSystem";
import { motion } from "framer-motion";

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
    <div className="min-h-screen relative">
      {/* Enhanced 3D Background with WebGL Particles */}
      <WebGLParticleSystem count={3000} color="#60a5fa" size={0.03} />

      {/* Subtle gradient overlays for depth */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-pink-950/10" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(59,130,246,0.08),transparent_70%)]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(168,85,247,0.05),transparent_70%)]" />

      {/* Floating elements with enhanced 3D effect */}
      <div className="fixed inset-0 opacity-15 pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 text-2xl"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          💰
        </motion.div>
        <motion.div
          className="absolute bottom-1/3 right-1/4 text-xl"
          animate={{
            y: [0, 15, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        >
          ✨
        </motion.div>
        <motion.div
          className="absolute top-2/3 left-1/6 text-xl"
          animate={{
            rotate: [0, 10, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        >
          🎯
        </motion.div>
      </div>

      <NetworkStatus />

      <main className="relative z-10 min-h-screen flex flex-col">
        {/* Enhanced Hero Section with Parallax */}
        <ParallaxSection offset={30} className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Live Status Badge */}
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="glass-enhanced px-4 py-3 rounded-full flex items-center gap-3 shadow-2xl backdrop-blur-xl border border-white/10">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg" />
              <span className="text-white/90 font-semibold text-sm tracking-wide">
                🔥 Live & Ready
              </span>
            </div>
          </motion.div>

          {/* Enhanced Hero Title with 3D animations */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="mb-8 overflow-hidden">
              <motion.h1
                className="heading-primary tracking-tight leading-none"
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
              >
                <span className="inline-block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">
                  IMONMYWAY
                </span>
              </motion.h1>
            </div>
            <motion.div
              className="overflow-hidden"
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <p className="text-body max-w-3xl mx-auto leading-relaxed mb-10 text-lg">
                GPS-verified punctuality challenges on the blockchain.
                <br />
                <span className="text-xl text-white/80 font-medium">
                  Plan routes, stake crypto, prove your punctuality, earn rewards.
                </span>
              </p>
            </motion.div>

            {/* Primary Call-to-Action with enhanced effects */}
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Link href="/plan">
                <DelightfulButton
                  variant="primary"
                  size="xl"
                  emoji="🗺️"
                  hoverEmoji="🎯"
                  successEmoji="✨"
                  glow
                  className="btn-primary min-w-[240px] h-18 text-xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-300"
                  aria-label="Plan your route on an interactive map"
                  context="first_time"
                  onDelightfulClick={() => {
                    console.log("Planning route on map! 🗺️");
                    setShowCelebration(true);
                  }}
                >
                  Plan Your Route
                </DelightfulButton>
              </Link>
            </motion.div>

            {/* Secondary Actions with staggered animation */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              <Link href="/share" className="flex-1">
                <DelightfulButton
                  variant="glass"
                  size="lg"
                  emoji="💰"
                  className="btn-secondary w-full h-14 text-base font-semibold backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300"
                  aria-label="Create a staked punctuality challenge"
                  context="achievement"
                >
                  Create Challenge
                </DelightfulButton>
              </Link>
              <Link href="/watch" className="flex-1">
                <DelightfulButton
                  variant="glass"
                  size="lg"
                  emoji="📍"
                  className="btn-secondary w-full h-14 text-base font-semibold backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300"
                  aria-label="Watch live GPS tracking"
                  context="social"
                >
                  Track Live
                </DelightfulButton>
              </Link>
            </motion.div>
          </motion.div>
        </ParallaxSection>

        {/* Enhanced Features Section with Parallax */}
        <ParallaxSection offset={-20} className="content-section px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-6xl mx-auto">
            {/* Key Benefits with 3D glassmorphism cards */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, staggerChildren: 0.2 }}
              viewport={{ once: true }}
            >
              <motion.div
                className="group"
                whileHover={{ y: -10, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="glass-enhanced p-8 rounded-2xl text-center backdrop-blur-xl border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 h-full">
                  <motion.div
                    className="text-4xl mb-4"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    🗺️
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-3">Interactive Maps</h3>
                  <p className="text-white/70 leading-relaxed">Plan routes visually on real-time maps with advanced pathfinding</p>
                </div>
              </motion.div>

              <motion.div
                className="group"
                whileHover={{ y: -10, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
              >
                <div className="glass-enhanced p-8 rounded-2xl text-center backdrop-blur-xl border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 h-full">
                  <motion.div
                    className="text-4xl mb-4"
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    📍
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-3">GPS Tracking</h3>
                  <p className="text-white/70 leading-relaxed">Real-time location verification with blockchain timestamping</p>
                </div>
              </motion.div>

              <motion.div
                className="group"
                whileHover={{ y: -10, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
              >
                <div className="glass-enhanced p-8 rounded-2xl text-center backdrop-blur-xl border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 h-full">
                  <motion.div
                    className="text-4xl mb-4"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    💰
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-3">2.5x Rewards</h3>
                  <p className="text-white/70 leading-relaxed">Win big on punctuality with multiplier bonuses and staking rewards</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Additional feature highlights */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="glass-enhanced inline-block px-8 py-4 rounded-full backdrop-blur-xl border border-white/20 shadow-xl">
                <span className="text-white/90 font-medium">
                  🚀 Powered by Somnia Network • Real-time • Decentralized • Rewarding
                </span>
              </div>
            </motion.div>
          </div>
        </ParallaxSection>
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
