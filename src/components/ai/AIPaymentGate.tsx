/**
 * AI Payment Gate Component
 * Handles STT payments for Venice AI access
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/PremiumButton';
import { useWallet } from '@/hooks/useWallet';
import { useUIStore } from '@/stores/uiStore';

interface AIPaymentGateProps {
  children: React.ReactNode;
  feature: 'pace' | 'reputation' | 'insights';
  onPaymentSuccess?: () => void;
}

export function AIPaymentGate({ children, feature, onPaymentSuccess }: AIPaymentGateProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const { address, isConnected } = useWallet();
  const { addToast } = useUIStore();

  // Check AI access status
  const checkAccess = async () => {
    if (!address) return;

    try {
      const response = await fetch(`/api/ai/payment/status?userAddress=${address}`);
      const data = await response.json();

      setHasAccess(data.hasAccess || false);
      setTimeRemaining(data.timeRemaining || 0);
    } catch (error) {
      console.error('Error checking AI access:', error);
      setHasAccess(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      checkAccess();
    } else {
      setHasAccess(false);
      setIsChecking(false);
    }
  }, [isConnected, address]);

  // Handle STT payment for AI access
  const handlePayment = async () => {
    if (!address) {
      addToast({
        message: 'Please connect your wallet first',
        type: 'error'
      });
      return;
    }

    setIsPaying(true);

    try {
      // In a real implementation, this would:
      // 1. Request STT payment approval from user
      // 2. Send transaction to recipient wallet (0x55A5705453Ee82c742274154136Fce8149597058)
      // 3. Wait for confirmation
      // 4. Call our API to grant access

      // For now, simulate the payment process
      addToast({
        message: 'Processing 0.5 STT payment for AI access...',
        type: 'info',
        duration: 3000
      });

      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Call our API to grant access (would include real transaction hash)
      const response = await fetch('/api/ai/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: address,
          paymentAmount: '0.5',
          transactionHash: `simulated_tx_${Date.now()}` // In real implementation, actual tx hash
        })
      });

      if (response.ok) {
        const data = await response.json();
        addToast({
          message: '🎉 AI access granted! You now have 24 hours of premium AI features.',
          type: 'success',
          duration: 5000
        });

        setHasAccess(true);
        setTimeRemaining(24); // 24 hours
        onPaymentSuccess?.();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Payment failed');
      }

    } catch (error) {
      console.error('Payment error:', error);
      addToast({
        message: error instanceof Error ? error.message : 'Payment failed. Please try again.',
        type: 'error'
      });
    } finally {
      setIsPaying(false);
    }
  };

  // Show loading state
  if (isChecking) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-white">Checking AI access...</span>
      </div>
    );
  }

  // Show payment gate if no access
  if (!hasAccess) {
    return (
      <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl p-6 border border-purple-500/20">
        <div className="text-center">
          <div className="text-3xl mb-4">🧠</div>
          <h3 className="text-xl font-bold text-white mb-2">
            Unlock Premium AI Features
          </h3>
          <p className="text-white/80 mb-4">
            Get access to advanced AI-powered {feature} recommendations,
            personalized insights, and intelligent analysis.
          </p>

          <div className="bg-white/10 rounded-lg p-4 mb-6">
            <div className="text-sm text-white/60 mb-2">What's included:</div>
            <ul className="text-sm text-white/80 space-y-1">
              <li>• AI-powered pace recommendations</li>
              <li>• Advanced reputation predictions</li>
              <li>• Contextual insights with web search</li>
              <li>• 24-hour unlimited access</li>
            </ul>
          </div>

          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-yellow-400 mb-1">0.5 STT</div>
            <div className="text-sm text-white/60">One-time payment for 24 hours</div>
          </div>

          <Button
            onClick={handlePayment}
            disabled={isPaying || !isConnected}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
          >
            {isPaying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing Payment...
              </>
            ) : (
              <>🚀 Unlock AI Features (0.5 STT)</>
            )}
          </Button>

          <p className="text-xs text-white/50 mt-3">
            Payments go to: 0x55A5705453Ee82c742274154136Fce8149597058
          </p>
        </div>
      </div>
    );
  }

  // Show access status and children
  return (
    <div className="relative">
      {/* Access indicator */}
      <div className="absolute top-2 right-2 z-10">
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg px-3 py-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400 font-medium">
              AI Active ({timeRemaining}h left)
            </span>
          </div>
        </div>
      </div>

      {/* Render children when access is granted */}
      {children}
    </div>
  );
}
