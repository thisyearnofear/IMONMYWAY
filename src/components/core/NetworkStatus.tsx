"use client";

import { useUIStore } from '@/stores/uiStore';
import { useWallet } from '@/hooks/useWallet';

export function NetworkStatus() {
  const { contractAddress, networkMetrics } = useUIStore();
  const { networkMetrics: walletMetrics } = useWallet();

  const isOnSomnia = walletMetrics.isOnSomnia;
  const lastTxSpeed = networkMetrics.lastTxSpeed || walletMetrics.lastTxSpeed;

  return (
    <div className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border text-xs">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2 h-2 rounded-full ${isOnSomnia ? 'bg-green-500' : 'bg-yellow-500'}`} />
        <span className="font-medium">
          {isOnSomnia ? 'Somnia Network' : 'Switch to Somnia'}
        </span>
      </div>
      
      {lastTxSpeed && (
        <div className="text-green-600 font-medium">
          Last TX: {lastTxSpeed.toFixed(1)}s ⚡
        </div>
      )}
      
      <div className="text-gray-500 truncate">
        Contract: {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
      </div>
    </div>
  );
}
