/**
 * Ready To Use State Component
 * Reusable component for ready-to-use state
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface ReadyToUseStateProps {
  formattedAddress: string;
}

export const ReadyToUseState = memo(function ReadyToUseState({
  formattedAddress,
}: ReadyToUseStateProps) {
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Link href="/plan">
        <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 rounded-xl font-bold text-xl shadow-2xl transform hover:scale-105 transition-all duration-300">
          🗺️ Start Planning Route
        </button>
      </Link>
      
      <Link href="/create">
      <button className="w-full bg-white/20 backdrop-blur-sm text-white py-6 rounded-xl font-bold text-xl border-2 border-white/30 hover:border-white/50 transition-all duration-300">
      🧠 Create AI Challenge
      </button>
      </Link>
      
      {/* Compact Status - Success State */}
      <div className="mt-4 text-sm text-green-400 font-medium">
        ✅ Somnia • {formattedAddress} • Ready
      </div>
    </motion.div>
  );
});