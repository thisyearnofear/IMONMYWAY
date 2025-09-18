/**
 * Switch Network State Component
 * Reusable component for network switching state
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface SwitchNetworkStateProps {
  onSwitchNetwork: () => void;
  formattedAddress: string;
  networkName: string;
}

export const SwitchNetworkState = memo(function SwitchNetworkState({
  onSwitchNetwork,
  formattedAddress,
  networkName,
}: SwitchNetworkStateProps) {
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="mb-4 p-4 bg-orange-500/20 border border-orange-500/30 rounded-xl">
        <p className="text-orange-200 font-medium mb-2">⚠️ Switch to Somnia Network</p>
        <p className="text-sm text-orange-200/80">You&apos;re connected to the wrong network</p>
      </div>
      
      <button 
        onClick={onSwitchNetwork}
        className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-6 rounded-xl font-bold text-xl shadow-2xl transform hover:scale-105 transition-all duration-300"
      >
        🔄 Switch Network & Start
      </button>
      
      <Link href="/plan">
        <button className="w-full bg-white/20 backdrop-blur-sm text-white py-6 rounded-xl font-bold text-xl border-2 border-white/30 hover:border-white/50 transition-all duration-300">
          🗺️ Plan Route (Demo Mode)
        </button>
      </Link>
      
      {/* Compact Status */}
      <div className="mt-4 text-sm text-white/60">
        📡 Connected: {formattedAddress} • {networkName}
      </div>
    </motion.div>
  );
});