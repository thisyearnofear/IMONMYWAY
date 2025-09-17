"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import WebGLParticleSystem from "@/components/three/ParticleSystem";
import { NetworkStatus } from "@/components/core/NetworkStatus";
import { useWallet } from "@/hooks/useWallet";

export default function HomePage() {
  const { isConnected } = useWallet();

  return (
    <div className="min-h-screen relative">
      {/* Enhanced 3D Background with WebGL Particles */}
      <WebGLParticleSystem count={1500} color="#60a5fa" size={0.02} />

      {/* Subtle gradient overlays for depth */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/50 via-purple-950/30 to-pink-950/15" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(59,130,246,0.1),transparent_70%)]" />

      <NetworkStatus />

      <main className="relative z-10 min-h-screen flex flex-col">
        {/* Hero Section - Clear Value Proposition */}
        <section className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-md mx-auto text-center">
            {/* Main Headline - Simplified */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Run on Time. Win Big.
              </h1>
              <p className="text-lg text-white/80">
                Bet on your punctuality. Earn crypto.
              </p>
            </motion.div>

            {/* CTA Buttons - Prominent, full-width for mobile */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Link href="/plan">
                <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 rounded-xl font-bold text-xl shadow-2xl transform hover:scale-105 transition-all duration-300">
                  🗺️ Start Planning Route
                </button>
              </Link>
              <Link href="/share">
                <button className="w-full bg-white/20 backdrop-blur-sm text-white py-6 rounded-xl font-bold text-xl border-2 border-white/30 hover:border-white/50 transition-all duration-300">
                  💰 Create Bet Challenge
                </button>
              </Link>
            </motion.div>

            {/* Benefits - Icons only, compact */}
            <motion.div
              className="grid grid-cols-3 gap-4 mt-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <motion.div className="text-center" whileHover={{ scale: 1.1 }}>
                <div className="text-4xl mb-1">🏃‍♂️</div>
                <p className="text-xs text-white/70">Perfect Pace</p>
              </motion.div>
              <motion.div className="text-center" whileHover={{ scale: 1.1 }}>
                <div className="text-4xl mb-1">💰</div>
                <p className="text-xs text-white/70">Bet & Win</p>
              </motion.div>
              <motion.div className="text-center" whileHover={{ scale: 1.1 }}>
                <div className="text-4xl mb-1">📍</div>
                <p className="text-xs text-white/70">GPS Verified</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Simplified Footer - Optional quick links */}
        <section className="py-8 px-4 text-center">
          <div className="flex justify-center space-x-6">
            <Link href="/leaderboard" className="text-white/70 hover:text-white transition-colors">
              Leaderboard
            </Link>
            <Link href="/profile" className="text-white/70 hover:text-white transition-colors">
              Profile
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
