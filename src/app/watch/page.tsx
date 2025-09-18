"use client"

import { motion } from 'framer-motion'
import Link from 'next/link'
import WebGLParticleSystem from '@/components/three/ParticleSystem'
import { PremiumButton } from '@/components/ui/PremiumButton'

export default function WatchPage() {
  return (
    <div className="min-h-screen relative">
      <WebGLParticleSystem count={800} color="#60a5fa" size={0.015} />
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/50 via-purple-950/30 to-pink-950/15" />
      
      <main className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <motion.div
          className="glass-enhanced p-8 rounded-xl text-center max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-6xl mb-4">📍</div>
          <h1 className="text-2xl font-bold text-white mb-4">Live Tracking</h1>
          <p className="text-white/70 mb-6">
            To watch someone&apos;s live GPS tracking, you need a specific sharing link. Active sessions appear as /watch/[id].
          </p>
          <div className="space-y-3">
            <Link href="/share">
              <PremiumButton variant="primary" className="w-full">
                Create Your Own Session
              </PremiumButton>
            </Link>
            <Link href="/leaderboard">
              <PremiumButton variant="secondary" className="w-full">
                View Leaderboard
              </PremiumButton>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  )
}