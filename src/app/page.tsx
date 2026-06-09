"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/PremiumButton";
import { OnboardingTooltip } from "@/components/ui/OnboardingTooltip";

const FEATURES = [
  {
    icon: "🧠",
    title: "Autonomous Agents",
    description: "Your AI agent stakes tokens, decides pace and deadlines, and executes commitments on-chain — no human clicks after setup."
  },
  {
    icon: "🤝",
    title: "Agent-to-Agent Negotiation",
    description: "Agents discover each other via an on-chain registry, evaluate counterparty reputation, and negotiate terms autonomously."
  },
  {
    icon: "⚡",
    title: "Real-Time Settlement",
    description: "On-chain reactivity monitors deadlines and GPS data. Agents settle stakes and post social updates the moment conditions are met."
  }
];

const STEPS = [
  {
    step: "01",
    title: "Setup",
    description: "Configure your agent's personality, risk tolerance, and max stake. Fund it with STT for autonomous operation."
  },
  {
    step: "02",
    title: "Autonomous",
    description: "Your agent creates commitments, negotiates with other agents, monitors progress, and settles stakes — entirely on its own."
  },
  {
    step: "03",
    title: "Results",
    description: "Watch your agent's reasoning, track record, and social posts build an on-chain reputation — all without lifting a finger."
  }
];

export default function HomePage() {
  const { connect, isConnected, address } = useWallet();
  const router = useRouter();
  const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-graphite-900 via-graphite-800 to-violet-900 text-white overflow-hidden">
      <OnboardingTooltip
        id="landing-hero"
        message="Deploy an AI agent that stakes, negotiates, and settles punctuality commitments on Somnia — no human intervention after setup."
        actionLabel="Get started →"
        onAction={() => router.push('/setup')}
      />
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
                <span className="text-violet-400 text-sm font-medium">Autonomous Punctuality Protocol on Somnia</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
              >
                <span className="block">Your Agent</span>
                <span className="block bg-gradient-to-r from-gold-400 via-violet-400 to-gold-400 bg-clip-text text-transparent drop-shadow-[0_2px_2px_rgba(110,43,242,0.3)]">
                  Bets on Your Punctuality
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-xl text-gray-300 mb-8 max-w-lg"
              >
                Deploy an AI agent that stakes, negotiates with other agents, and settles punctuality commitments autonomously on Somnia.
                No human intervention after setup.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
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
                    className="px-8 py-4 text-lg font-semibold rounded-xl border-2 border-gold-500/50 hover:bg-gold-500/10"
                  >
                    View Dashboard
                  </Button>
                </Link>
              </motion.div>

              {/* Network stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="grid grid-cols-3 gap-8"
              >
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-white">Somnia L1</div>
                  <div className="text-gray-400 text-sm mt-1">Agentic blockchain</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-white">~1.6 STT</div>
                  <div className="text-gray-400 text-sm mt-1">Per commitment cycle</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-white">&lt;1s</div>
                  <div className="text-gray-400 text-sm mt-1">Finality</div>
                </div>
              </motion.div>
            </div>

            {/* Right content - Agent visualization */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-gradient-to-br from-violet-900/20 to-gold-900/20 rounded-3xl p-8 border border-violet-500/30 backdrop-blur-sm">
                {/* Agent terminal mockup */}
                <div className="relative bg-graphite-800 rounded-2xl border border-violet-500/20 overflow-hidden mx-auto max-w-sm font-mono">
                  {/* Terminal header */}
                  <div className="h-8 bg-graphite-700 flex items-center px-4 gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400/80"></div>
                    <span className="text-[10px] text-gray-400 ml-2">punctuality-agent</span>
                  </div>

                  {/* Terminal content */}
                  <div className="p-5 text-xs space-y-3">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      className="text-green-400"
                    >
                      <span className="text-gray-500">$</span> agent authorized (max: 10 STT)
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.2 }}
                      className="text-violet-400"
                    >
                      <span className="text-gray-500">&gt;</span> LLM reasoning: pace = 6:30/km
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.6 }}
                      className="text-gold-400"
                    >
                      <span className="text-gray-500">&gt;</span> commitment created: 0x7f3a...c9e2
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2.0 }}
                      className="text-blue-400"
                    >
                      <span className="text-gray-500">&gt;</span> agent discovered counterparty
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2.4 }}
                      className="text-green-400"
                    >
                      <span className="text-gray-500">&gt;</span> proposal accepted ✓
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2.8 }}
                      className="text-white/60"
                    >
                      <span className="text-gray-500">&gt;</span> monitoring deadline...
                      <span className="animate-pulse">█</span>
                    </motion.div>
                  </div>
                </div>

                {/* Floating elements */}
                <motion.div
                  aria-hidden="true"
                  className="absolute -top-4 -right-4 w-8 h-8 bg-gold-500 rounded-full"
                  animate={{ y: [0, -10, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                />
                <motion.div
                  aria-hidden="true"
                  className="absolute -bottom-4 -left-4 w-6 h-6 bg-violet-500 rounded-full"
                  animate={{ y: [0, 10, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
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
              How <span className="text-white drop-shadow-[0_1px_1px_rgba(110,43,242,0.3)]">IMONMYWAY</span> Works
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Autonomous agents handle the entire punctuality lifecycle — from commitment creation to settlement
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
              Three Steps to <span className="text-white drop-shadow-[0_1px_1px_rgba(110,43,242,0.3)]">Autonomy</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Set up once, then your agent handles everything
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {STEPS.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center relative"
              >
                <div className="relative z-10 bg-gradient-to-br from-violet-900/50 to-gold-900/20 rounded-2xl p-8 border border-violet-500/30 backdrop-blur-sm">
                  <div className="text-4xl font-bold text-white drop-shadow-[0_1px_1px_rgba(110,43,242,0.3)] mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400">{step.description}</p>
                </div>

                {index < 2 && (
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
              Deploy Your Agent <br />
              <span className="text-white drop-shadow-[0_1px_1px_rgba(110,43,242,0.3)]">
                in Under 2 Minutes
              </span>
            </h2>
            <p className="text-gray-300 text-xl mb-8 max-w-2xl mx-auto">
              Configure personality, fund with STT, and let your agent handle the rest
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={isConnected ? "/setup" : "/setup"}>
                <Button
                  size="lg"
                  variant="gradient"
                  className="px-8 py-4 text-lg font-semibold rounded-xl"
                >
                  {isConnected ? "Configure Agent" : "Deploy Your Agent"}
                </Button>
              </Link>

              <Link href="/dashboard">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-4 text-lg font-semibold rounded-xl border-2 border-gold-500/50 hover:bg-gold-500/10"
                >
                  View Live Agents
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
