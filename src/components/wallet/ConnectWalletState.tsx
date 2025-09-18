/**
 * Connect Wallet State Component
 * Reusable component for wallet connection state
 */

import { memo } from 'react';
import { motion } from 'framer-motion';

interface ConnectWalletStateProps {
  onConnect: () => void;
  isConnecting: boolean;
  onLearnMore?: () => void;
}

export const ConnectWalletState = memo(function ConnectWalletState({
  onConnect,
  isConnecting,
  onLearnMore,
}: ConnectWalletStateProps) {
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <button 
        onClick={onConnect}
        disabled={isConnecting}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 rounded-xl font-bold text-xl shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isConnecting ? '🔄 Connecting...' : '🔗 Connect Wallet to Start'}
      </button>
      
      {onLearnMore && (
        <button 
          onClick={onLearnMore}
          className="w-full bg-white/20 backdrop-blur-sm text-white py-6 rounded-xl font-bold text-xl border-2 border-white/30 hover:border-white/50 transition-all duration-300"
        >
          📖 Learn How It Works
        </button>
      )}
    </motion.div>
  );
});