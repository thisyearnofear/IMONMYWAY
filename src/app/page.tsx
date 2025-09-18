"use client";

import { motion } from "framer-motion";
import { useState, useCallback } from "react";
import WebGLParticleSystem from "@/components/three/ParticleSystem";
import { NetworkStatus } from "@/components/core/NetworkStatus";
import { useHeroState } from "@/hooks/useHeroState";
import { WalletStateRenderer } from "@/components/wallet";

export default function HomePage() {
  const [showLearnMore, setShowLearnMore] = useState(false);
  const { heroState, formattedAddress, walletInfo, connect, switchToSomnia, isConnecting } = useHeroState();
  
  const handleLearnMore = useCallback(() => {
    setShowLearnMore(!showLearnMore);
  }, [showLearnMore]);

  return (
    <div className="min-h-screen relative">
      {/* Enhanced 3D Background with WebGL Particles */}
      <WebGLParticleSystem count={1500} color="#60a5fa" size={0.02} />

      {/* Subtle gradient overlays for depth */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/50 via-purple-950/30 to-pink-950/15" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(59,130,246,0.1),transparent_70%)]" />

      <NetworkStatus />

      <main className="relative z-10 min-h-screen flex flex-col">
        {/* Hero Section - Enhanced with Raised Platform */}
        <section className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <motion.div 
            className="max-w-md mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Raised Platform Container */}
            <div className="glass-enhanced p-8 md:p-6 text-center shadow-3xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02]">
              {/* Main Headline */}
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Run on Time. Win Big.
                </h1>
                <p className="text-lg text-white/80">
                  Bet on your punctuality. Earn crypto.
                </p>
              </motion.div>

              {/* Contextual Content Based on Wallet State */}
              <WalletStateRenderer
                heroState={heroState}
                formattedAddress={formattedAddress}
                networkName={walletInfo.networkName}
                onConnect={connect}
                onSwitchNetwork={switchToSomnia}
                onLearnMore={handleLearnMore}
                isConnecting={isConnecting}
              />

              {/* Learn More Expandable Content */}
              {showLearnMore && (
                <motion.div
                  className="mt-6 p-6 bg-white/5 rounded-xl border border-white/10"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-lg font-semibold mb-4 text-white">How IMONMYWAY Works</h3>
                  <div className="space-y-3 text-sm text-white/80">
                    <div className="flex items-start gap-3">
                      <span className="text-blue-400">🗺️</span>
                      <div>
                        <strong>Plan Your Route:</strong> Set destination and departure time with optimal route calculation.
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-purple-400">💰</span>
                      <div>
                        <strong>Place Your Bet:</strong> Stake crypto tokens on your punctuality commitment.
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-green-400">📍</span>
                      <div>
                        <strong>GPS Verification:</strong> Real-time tracking with smart contract automation.
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Benefits - Always show for READY_TO_USE and CONNECT_WALLET states */}
              {(heroState === 'READY_TO_USE' || heroState === 'CONNECT_WALLET') && (
                <motion.div
                  className="grid grid-cols-3 gap-4 mt-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
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
              )}
            </div>
          </motion.div>
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
