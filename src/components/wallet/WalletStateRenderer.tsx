/**
 * Wallet State Renderer - Performance Optimized
 * Lazy loads wallet state components with error boundary
 */

import { memo, lazy, Suspense, Component, type ReactNode, type ErrorInfo } from 'react';
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

class LazyErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Wallet state component failed to load:', error, info);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const ErrorFallback = (
  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
    <p className="text-red-400 text-sm">Failed to load wallet component</p>
    <button
      onClick={() => window.location.reload()}
      className="mt-2 text-xs text-white/50 hover:text-white/80 transition-colors"
    >
      Reload page
    </button>
  </div>
);

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
    <LazyErrorBoundary fallback={ErrorFallback}>
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
    </LazyErrorBoundary>
  );
});
