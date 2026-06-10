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
    title: "On-Chain Event Loop",
    description:
      "No cron. No server. Somnia Reactivity subscriptions wake your agent contract when registry events fire — the chain drives the entire lifecycle.",
  },
  {
    label: "Station 02",
    title: "Agent-to-Agent Discovery",
    description:
      "Agents find each other through an on-chain registry, evaluate reputations, and negotiate stakes — all autonomously, all on-chain.",
  },
  {
    label: "Station 03",
    title: "LLM Agents Respond",
    description:
      "The contract calls Somnia's LLM agent for decisions — pace, risk, stake. The response comes back on-chain, consensus-verified by validators.",
  },
  {
    label: "Station 04",
    title: "Self-Settlement",
    description:
      "On-chain reactivity fires at deadline. If it misses, settleCommitment() lets anyone settle — permissionless, gas ≈ $0.001. Three layers of defense, zero infrastructure.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Deploy",
    description:
      "Configure your agent's personality, risk tolerance, and max stake. Fund it with STT and deploy — no infrastructure needed.",
  },
  {
    number: "02",
    title: "Autonomous",
    description:
      "On-chain reactivity wakes your agent. It discovers counterparties, negotiates terms, and creates commitments — no server involved.",
  },
  {
    number: "03",
    title: "Results",
    description:
      "History builds on-chain. Reputation grows. The same pattern replaces every off-chain keeper — automated market makers, Liquidations, oracles.",
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
  const [agentStatus, setAgentStatus] = useState<{ balance: string; commitments: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      const { fetchAgentStatus } = await import('@/lib/rpc');
      const status = await fetchAgentStatus();
      if (!cancelled) setAgentStatus(status);
    };
    fetch();
    const id = setInterval(fetch, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Scroll-driven accent color: violet → gold → violet
  useEffect(() => {
    const updateAccent = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const t = Math.min(1, scrollY / docHeight);

      // Violet #6E2BF2 → Gold #EAC46C → Violet #6E2BF2
      let r: number, g: number, b: number;
      if (t < 0.5) {
        const p = t * 2;
        r = Math.round(110 + (234 - 110) * p);
        g = Math.round(43 + (196 - 43) * p);
        b = Math.round(242 + (108 - 242) * p);
      } else {
        const p = (t - 0.5) * 2;
        r = Math.round(234 + (110 - 234) * p);
        g = Math.round(196 + (43 - 196) * p);
        b = Math.round(108 + (242 - 108) * p);
      }

      document.documentElement.style.setProperty(
        '--section-accent',
        `rgb(${r}, ${g}, ${b})`
      );
      document.documentElement.style.setProperty(
        '--section-accent-rgb',
        `${r}, ${g}, ${b}`
      );
    };

    window.addEventListener('scroll', updateAccent, { passive: true });
    updateAccent();
    return () => window.removeEventListener('scroll', updateAccent);
  }, []);

  return (
    <div className="min-h-screen bg-graphite-900 text-white overflow-hidden">
      <OnboardingTooltip
        id="landing-hero"
        message="Deploy an autonomous agent on Somnia — it wakes itself up, negotiates on-chain, and settles without any server infrastructure."
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
              <span className="font-mono text-xs text-gold-500 uppercase tracking-[0.2em]">
                Autonomous Agent Framework
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-bold mb-6 leading-[1.1] tracking-tight"
            >
              <span className="block">Smart Contracts That</span>
              <span className="block text-gold-500">
                Wake Themselves Up
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-lg text-gray-300 mb-4 max-w-lg leading-relaxed"
            >
              No server. No keeper. No cron. Somnia Reactivity lets your
              contract wake itself — the first autonomous agent framework where
              the chain is the runtime.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base text-gray-400 mb-8 max-w-lg leading-relaxed"
            >
              Stakes, negotiations, and settlements happen on-chain, triggered
              by on-chain events not off-chain servers.
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
                  className="px-8 py-4 text-lg font-semibold rounded-xl border-2 border-gold-500/60 hover:bg-gold-500/15"
                >
                  Watch Live Agent
                </Button>
              </Link>
            </motion.div>

            {/* Agent live status bar */}
            {agentStatus && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="flex items-center gap-3 mb-6 font-mono text-[11px]"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400/80">Agent funded</span>
                <span className="text-white/30">·</span>
                <span className="text-white/50">{agentStatus.balance}</span>
                {agentStatus.commitments > 0 && (
                  <>
                    <span className="text-white/30">·</span>
                    <span className="text-gold-500/70">{agentStatus.commitments} active</span>
                  </>
                )}
              </motion.div>
            )}

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-8 font-mono text-sm"
            >
              <div>
                <div className="text-white font-bold text-lg">Somnia L1</div>
                <div className="text-white/60 text-xs uppercase tracking-wider">
                  Agentic chain
                </div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <div className="text-white font-bold text-lg">~1.6 STT</div>
                <div className="text-white/60 text-xs uppercase tracking-wider">
                  Per cycle
                </div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <div className="text-white font-bold text-lg">&lt;1s</div>
                <div className="text-white/60 text-xs uppercase tracking-wider">
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
              <div className="w-[300px] h-[300px] rounded-full blur-3xl" style={{ backgroundColor: 'rgba(var(--section-accent-rgb), 0.25)' }} />
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
              className="absolute bottom-4 left-4 right-4 font-mono text-[10px] text-white/60 space-y-1"
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
      <section className="relative h-screen zone-accent">
        <div className="absolute top-8 left-0 right-0 z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="font-mono text-xs text-gold-500/80 uppercase tracking-[0.2em] block mb-2">
              How IMONMYWAY Works
            </span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              The Agent Route
            </h2>
          </motion.div>
        </div>

        <RouteMap stations={FEATURES} className="h-full" />
      </section>

      {/* Divider */}
      <div className="px-4 py-2">
        <div className="max-w-7xl mx-auto divider">
          <div className="line" />
          <div className="dot" />
          <div className="line" />
        </div>
      </div>

      {/* Steps — The Agent Dial */}
      <section className="py-32 px-4 zone-accent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="font-mono text-xs text-gold-500/80 uppercase tracking-[0.2em] block mb-2">
              Three Steps to Autonomy
            </span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Setup once. Then your agent handles everything.
            </h2>
          </motion.div>

          <AgentDial steps={STEPS} />
        </div>
      </section>

      {/* Divider */}
      <div className="px-4 py-2">
        <div className="max-w-7xl mx-auto divider">
          <div className="line" />
          <div className="dot" />
          <div className="line" />
        </div>
      </div>

      {/* CTA — Deploy */}
      <section className="py-32 px-4 zone-accent">
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
            <p className="text-gray-300 text-lg mb-3">
              Configure personality, fund with STT, and let your agent handle
              the rest.
            </p>
            <div className="font-mono text-xs text-gold-500/70 mb-10">
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
                  className="px-10 py-4 text-lg font-semibold rounded-xl border-2 border-gold-500/60 hover:bg-gold-500/15"
                >
                  Watch Live Agent
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Animated route line */}
          <div className="mt-16 flex items-center justify-center gap-2">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold-500/50" />
            <div className="w-1.5 h-1.5 rounded-full bg-gold-500/60" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold-500/50" />
          </div>
        </div>
      </section>
    </div>
  );
}
