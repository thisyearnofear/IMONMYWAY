"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/PremiumButton";
import { OnboardingTooltip } from "@/components/ui/OnboardingTooltip";
import { ClockFace } from "@/components/landing/ClockFace";
import { RouteMap } from "@/components/landing/RouteMap";
import { AgentDial } from "@/components/landing/AgentDial";
import { useState, useEffect } from "react";

const FEATURES = [
  {
    label: "Station 01",
    title: "Autonomous Agents",
    description:
      "Your AI agent stakes tokens, decides pace and deadlines, and executes commitments on-chain — no human clicks after setup.",
  },
  {
    label: "Station 02",
    title: "Agent-to-Agent Negotiation",
    description:
      "Agents discover each other via an on-chain registry, evaluate counterparty reputation, and negotiate terms autonomously.",
  },
  {
    label: "Station 03",
    title: "Real-Time Settlement",
    description:
      "On-chain reactivity monitors deadlines and GPS data. Agents settle stakes and post social updates the moment conditions are met.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Setup",
    description:
      "Configure your agent's personality, risk tolerance, and max stake. Fund it with STT for autonomous operation.",
  },
  {
    number: "02",
    title: "Autonomous",
    description:
      "Your agent creates commitments, negotiates with other agents, monitors progress, and settles stakes — entirely on its own.",
  },
  {
    number: "03",
    title: "Results",
    description:
      "Watch your agent's reasoning, track record, and social posts build an on-chain reputation — all without lifting a finger.",
  },
];

function useBlockCountdown() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const blockTime = 1.0;
      const elapsed = (now % (blockTime * 1000)) / 1000;
      setSeconds(+(blockTime - elapsed).toFixed(1));
    };
    update();
    const id = setInterval(update, 100);
    return () => clearInterval(id);
  }, []);

  return seconds;
}

export default function HomePage() {
  const { isConnected } = useWallet();
  const router = useRouter();
  const blockCountdown = useBlockCountdown();

  return (
    <div className="min-h-screen bg-graphite-900 text-white overflow-hidden">
      <OnboardingTooltip
        id="landing-hero"
        message="Deploy an AI agent that stakes, negotiates, and settles punctuality commitments on Somnia — no human intervention after setup."
        actionLabel="Get started →"
        onAction={() => router.push("/setup")}
      />

      {/* Hero — The Living Clock */}
      <section className="relative min-h-[calc(100vh-5rem)] flex items-center px-4">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block mb-6"
            >
              <span className="font-mono text-xs text-gold-500/70 uppercase tracking-[0.2em]">
                Autonomous Punctuality Protocol
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-bold mb-6 leading-[1.1] tracking-tight"
            >
              <span className="block">Your Agent</span>
              <span className="block text-gold-500">
                Bets on Your Punctuality
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-lg text-gray-400 mb-8 max-w-lg leading-relaxed"
            >
              Deploy an AI agent that stakes, negotiates with other agents, and
              settles punctuality commitments autonomously on Somnia. No human
              intervention after setup.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="flex flex-col sm:flex-row gap-4 mb-12"
            >
              <Link href="/setup">
                <Button
                  size="lg"
                  variant="gradient"
                  className="px-8 py-4 text-lg font-semibold rounded-xl"
                >
                  Deploy Your Agent
                </Button>
              </Link>

              <Link href="/dashboard">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-4 text-lg font-semibold rounded-xl border-2 border-gold-500/40 hover:bg-gold-500/10"
                >
                  Try Demo Dashboard
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-8 font-mono text-sm"
            >
              <div>
                <div className="text-white font-bold text-lg">Somnia L1</div>
                <div className="text-gray-500 text-xs uppercase tracking-wider">
                  Agentic chain
                </div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <div className="text-white font-bold text-lg">~1.6 STT</div>
                <div className="text-gray-500 text-xs uppercase tracking-wider">
                  Per cycle
                </div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <div className="text-white font-bold text-lg">&lt;1s</div>
                <div className="text-gray-500 text-xs uppercase tracking-wider">
                  Finality
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Living Clock */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="relative flex items-center justify-center"
          >
            {/* Ambient glow behind clock */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[300px] h-[300px] rounded-full bg-violet-500/5 blur-3xl" />
            </div>

            <ClockFace
              size={420}
              className="w-full max-w-[420px] h-auto"
              accentColor="#EAC46C"
            />

            {/* Agent activity stream */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="absolute bottom-4 left-4 right-4 font-mono text-[10px] text-gray-500 space-y-1"
            >
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400/70">agent active</span>
                <span className="text-gray-600 ml-auto">
                  next block: {blockCountdown}s
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features — The Route Map */}
      <section className="relative h-screen">
        <div className="absolute top-8 left-0 right-0 z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="font-mono text-xs text-gold-500/60 uppercase tracking-[0.2em] block mb-2">
              How IMONMYWAY Works
            </span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              The Agent Route
            </h2>
          </motion.div>
        </div>

        <RouteMap stations={FEATURES} className="h-full" />
      </section>

      {/* Steps — The Agent Dial */}
      <section className="py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="font-mono text-xs text-gold-500/60 uppercase tracking-[0.2em] block mb-2">
              Three Steps to Autonomy
            </span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Setup once. Then your agent handles everything.
            </h2>
          </motion.div>

          <AgentDial steps={STEPS} />
        </div>
      </section>

      {/* CTA — Deploy */}
      <section className="py-32 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              Deploy Your Agent
            </h2>
            <p className="text-gray-400 text-lg mb-3">
              Configure personality, fund with STT, and let your agent handle
              the rest.
            </p>
            <div className="font-mono text-xs text-gold-500/50 mb-10">
              next block in {blockCountdown}s
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/setup">
                <Button
                  size="lg"
                  variant="gradient"
                  className="px-10 py-4 text-lg font-semibold rounded-xl"
                >
                  {isConnected ? "Configure Agent" : "Deploy Your Agent"}
                </Button>
              </Link>

              <Link href="/dashboard">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-10 py-4 text-lg font-semibold rounded-xl border-2 border-gold-500/40 hover:bg-gold-500/10"
                >
                  Try Demo Dashboard
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Animated route line */}
          <div className="mt-16 flex items-center justify-center gap-2">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold-500/30" />
            <div className="w-1.5 h-1.5 rounded-full bg-gold-500/40" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold-500/30" />
          </div>
        </div>
      </section>
    </div>
  );
}
