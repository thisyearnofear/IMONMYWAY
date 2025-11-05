"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/PremiumButton";
import { Card } from "@/components/ui/PremiumCard";
import { useWallet } from "@/hooks/useWallet";
import { motion } from "framer-motion";
import { ViralChallenges } from "@/components/challenges/ViralChallenges";
import { CHALLENGE_TEMPLATES } from "@/lib/challenge-templates";

// Feature data - Cultural Time Intelligence focused
const FEATURES = [
  {
    icon: "🌍",
    title: "Cultural Time Profiles",
    description: "Define what 'on time' means in your culture. Jamaica's flexible 30min vs Japan's precise timing - both respected."
  },
  {
    icon: "🏃‍♂️",
    title: "Running Speed Intelligence",
    description: "Fill Google Maps' gap between walking (3mph) and driving. Get accurate running time estimates for any route."
  },
  {
    icon: "🚂",
    title: "Local Transport Challenges",
    description: "Buenos Aires train-hops, airport terminal sprints, and city-specific punctuality challenges worldwide."
  },
  {
    icon: "👥",
    title: "Peer Review System",
    description: "Build reputation through peer reviews that understand cultural context. Rate punctuality by local standards."
  },
  {
    icon: "📊",
    title: "Hofstede-Based Analytics",
    description: "Objective cultural framework based on research. No stereotypes - just data-driven time perception insights."
  },
  {
    icon: "🎯",
    title: "Adaptive Challenges",
    description: "Challenges that adapt to your cultural background, fitness level, and local transport infrastructure."
  },
  {
    icon: "⚡",
    title: "Real-Time Verification",
    description: "GPS tracking with cultural context awareness. Arrive 'on time' by your culture's definition to win."
  }
];

// Stats data - single source of truth
const STATS = [
  { label: "Active Users", value: 12847, suffix: "+" },
  { label: "Challenges", value: 89234, suffix: "+" },
  { label: "Tokens Staked", value: 245, suffix: "K+" }
];

// Steps data - single source of truth
const STEPS = [
  {
    step: "01",
    title: "Create",
    description: "Set up a punctuality challenge with your destination, arrival time, and stake amount."
  },
  {
    step: "02",
    title: "Challenge",
    description: "Invite friends to bet on your arrival or let others take the bet against you."
  },
  {
    step: "03",
    title: "Track",
    description: "Share your live location as you travel to your destination."
  },
  {
    step: "04",
    title: "Earn",
    description: "Arrive on time or early to win tokens and boost your reputation score."
  }
];

// Animated counter component
const AnimatedCounter = ({ end, duration = 2000 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16); // 60fps
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [end, duration]);

  return <>{count.toLocaleString()}</>;
};

export default function HomePage() {
  const { connect, isConnected, address } = useWallet();

  // Truncate wallet address for display
  const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-graphite-900 via-graphite-800 to-violet-900 text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-block px-4 py-1 bg-violet-900/30 rounded-full border border-violet-500/30 mb-4"
              >
                <span className="text-violet-400 text-sm font-medium">Live on Somnia Network</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
              >
                <span className="block">Cultural Time</span>
                <span className="block bg-gradient-to-r from-gold-400 via-violet-400 to-gold-400 bg-clip-text text-transparent drop-shadow-[0_2px_2px_rgba(110,43,242,0.3)]">
                  Intelligence Protocol
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-xl text-gray-300 mb-8 max-w-lg"
              >
                Stake tokens on punctuality commitments that respect cultural time differences.
                Run faster than Google Maps. Build global reputation through consistent arrivals.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4 mb-12"
              >
                <Link href="/create">
                  <Button
                    size="lg"
                    variant="gradient"
                    className="px-8 py-4 text-lg font-semibold rounded-xl"
                  >
                    🧠 Create AI Challenge
                  </Button>
                </Link>

                <Link href="/challenges">
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-8 py-4 text-lg font-semibold rounded-xl border-2 border-gold-500/50 hover:bg-gold-500/10"
                  >
                    🎯 Browse Challenges
                  </Button>
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="grid grid-cols-3 gap-8"
              >
                {STATS.map((stat, index) => (
                  <div key={index}>
                    <div className="text-3xl md:text-4xl font-bold text-white drop-shadow-[0_1px_1px_rgba(110,43,242,0.3)]">
                      <AnimatedCounter end={stat.value} />{stat.suffix}
                    </div>
                    <div className="text-gray-400 text-sm mt-2">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right content - Interactive demo */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-gradient-to-br from-violet-900/20 to-gold-900/20 rounded-3xl p-8 border border-violet-500/30 backdrop-blur-sm">
                {/* Phone mockup */}
                <div className="relative bg-graphite-800 rounded-3xl border border-violet-500/20 overflow-hidden mx-auto max-w-sm">
                  {/* Status bar */}
                  <div className="h-6 bg-graphite-700 flex items-center justify-between px-4 text-xs">
                    <span>9:41</span>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    </div>
                  </div>

                  {/* App content */}
                  <div className="p-6">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-violet-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                        <span className="text-2xl">⏰</span>
                      </div>
                      <h3 className="font-bold text-lg">Meeting with Alex</h3>
                      <p className="text-gray-400 text-sm">10:00 AM • Starbucks Downtown</p>
                    </div>

                    {/* Progress */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>75%</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-gold-500 to-violet-500"
                          initial={{ width: 0 }}
                          animate={{ width: "75%" }}
                          transition={{ duration: 2, delay: 1 }}
                        />
                      </div>
                    </div>

                    {/* Timer */}
                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold text-white drop-shadow-[0_1px_1px_rgba(110,43,242,0.3)]">
                        12:45
                      </div>
                      <div className="text-gray-400 text-sm">Time Remaining</div>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="ghost" className="py-3">
                        ⏰ Arrived Early
                      </Button>
                      <Button variant="ghost" className="py-3">
                        📍 Track Me
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Floating elements */}
                <motion.div
                  className="absolute -top-4 -right-4 w-8 h-8 bg-gold-500 rounded-full"
                  animate={{
                    y: [0, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: 0.5
                  }}
                />
                <motion.div
                  className="absolute -bottom-4 -left-4 w-6 h-6 bg-violet-500 rounded-full"
                  animate={{
                    y: [0, 10, 0],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: 1
                  }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why <span className="text-white drop-shadow-[0_1px_1px_rgba(110,43,242,0.3)]">IMONMYWAY</span>?
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Transform punctuality from a personal virtue into a social and financial opportunity
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-graphite-600/50 to-graphite-700/30 backdrop-blur-lg rounded-2xl p-6 border border-violet-500/20 hover:border-gold-500/30 transition-all duration-300 group"
              >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-graphite-800/50 to-violet-900/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It <span className="text-white drop-shadow-[0_1px_1px_rgba(110,43,242,0.3)]">Works</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Simple steps to transform your punctuality into rewards
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {STEPS.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center relative"
              >
                <div className="relative z-10 bg-gradient-to-br from-violet-900/50 to-gold-900/20 rounded-2xl p-6 border border-violet-500/30 backdrop-blur-sm">
                  <div className="text-4xl font-bold text-white drop-shadow-[0_1px_1px_rgba(110,43,242,0.3)] mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400">{step.description}</p>
                </div>

                {/* Connector line (not for last item) */}
                {index < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-violet-500/50 to-gold-500/50"></div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-violet-900/30 to-gold-900/20 rounded-3xl p-12 border border-violet-500/30 backdrop-blur-sm"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Turn Your Time <br />
              <span className="text-white drop-shadow-[0_1px_1px_rgba(110,43,242,0.3)]">
                Into Tokens?
              </span>
            </h2>
            <p className="text-gray-300 text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of users who are already earning rewards for being punctual
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="gradient"
                className="px-8 py-4 text-lg font-semibold rounded-xl"
                onClick={connect}
              >
                {isConnected ? `Connected: ${truncatedAddress}` : "Connect Wallet & Start"}
              </Button>

              <Link href="/watch">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-4 text-lg font-semibold rounded-xl border-2 border-gold-500/50 hover:bg-gold-500/10"
                >
                  Watch Live Challenges
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Viral Challenges Section */}
      <ViralChallenges
        challenges={CHALLENGE_TEMPLATES}
        onSelectChallenge={(challenge) => {
          // In a real app, this would navigate to the challenge creation page
          window.location.href = `/challenges`;
        }}
      />
    </div>
  );
}