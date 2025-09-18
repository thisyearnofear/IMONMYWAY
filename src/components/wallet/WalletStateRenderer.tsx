/**
 * Wallet State Renderer - Performance Optimized
 * Lazy loads wallet state components for better performance
 */

import { memo, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import type { HeroState } from '@/lib/wallet-utils';

// Lazy load wallet state components
const ConnectWalletState = lazy(() => import('./ConnectWalletState').then(m => ({ default: m.ConnectWalletState })));
const SwitchNetworkState = lazy(() => import('./SwitchNetworkState').then(m => ({ default: m.SwitchNetworkState })));
const ReadyToUseState = lazy(() => import('./ReadyToUseState').then(m => ({ default: m.ReadyToUseState })));

interface WalletStateRendererProps {
  heroState: HeroState;
  formattedAddress: string;
  networkName: string;
  onConnect: () => void;
  onSwitchNetwork: () => void;
  onLearnMore?: () => void;
  isConnecting: boolean;
}

const LoadingFallback = memo(function LoadingFallback() {
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full h-16 bg-white/10 rounded-xl animate-pulse" />
      <div className="w-full h-16 bg-white/5 rounded-xl animate-pulse" />
    </motion.div>
  );
});

export const WalletStateRenderer = memo(function WalletStateRenderer({
  heroState,
  formattedAddress,
  networkName,
  onConnect,
  onSwitchNetwork,
  onLearnMore,
  isConnecting,
}: WalletStateRendererProps) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      {heroState === 'CONNECT_WALLET' && (
        <ConnectWalletState 
          onConnect={onConnect}
          isConnecting={isConnecting}
          onLearnMore={onLearnMore}
        />
      )}

      {heroState === 'SWITCH_NETWORK' && (
        <SwitchNetworkState 
          onSwitchNetwork={onSwitchNetwork}
          formattedAddress={formattedAddress}
          networkName={networkName}
        />
      )}

      {heroState === 'READY_TO_USE' && (
        <ReadyToUseState 
          formattedAddress={formattedAddress}
        />
      )}
    </Suspense>
  );
});