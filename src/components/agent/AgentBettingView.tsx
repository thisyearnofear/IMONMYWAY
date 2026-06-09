"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@/hooks/useWallet';
import { ContractService } from '@/services/contractService';
import { Card, CardContent } from '@/components/ui/PremiumCard';
import { Button, LoadingSpinner } from '@/components/ui/PremiumButton';
import { ethers } from 'ethers';

interface AgentBettingViewProps {
  commitmentId: string;
  stakeAmount: number;
  deadline: Date;
  currentProgress: number;
  status: string;
  destinationReached: boolean;
  timeRemaining: number;
  totalBetsFor: string;
  totalBetsAgainst: string;
  agentReasoning?: string;
}

export function AgentBettingView({
  commitmentId,
  stakeAmount,
  deadline,
  currentProgress,
  status,
  destinationReached,
  timeRemaining,
  totalBetsFor,
  totalBetsAgainst,
  agentReasoning,
}: AgentBettingViewProps) {
  const { address, isConnected } = useWallet();
  const [betAmount, setBetAmount] = useState('');
  const [isBetting, setIsBetting] = useState(false);
  const [userBet, setUserBet] = useState<{ amount: string; prediction: 'success' | 'failure' } | null>(null);

  const totalPool = parseFloat(totalBetsFor) + parseFloat(totalBetsAgainst);
  const oddsFor = totalPool > 0 ? (totalPool / Math.max(parseFloat(totalBetsFor), 0.001)) : 2.0;
  const oddsAgainst = totalPool > 0 ? (totalPool / Math.max(parseFloat(totalBetsAgainst), 0.001)) : 2.0;
  const progressPct = Math.round(currentProgress * 100);

  const placeBet = async (prediction: 'success' | 'failure') => {
    if (!betAmount || !address) return;
    setIsBetting(true);
    try {
      const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await browserProvider.getSigner();
      const service = new ContractService(signer);
      await service.placeBet(commitmentId, prediction === 'success', betAmount);
      setUserBet({ amount: betAmount, prediction });
      setBetAmount('');
    } catch (err) {
      console.error('Bet failed:', err);
    } finally {
      setIsBetting(false);
    }
  };

  const isFinished = status === 'completed' || status === 'failed';

  return (
    <Card variant="enhanced">
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Betting</h3>
          {agentReasoning && (
            <span className="text-[10px] font-mono text-gold/70 bg-gold/10 px-2 py-0.5 rounded">
              Agent: {agentReasoning}
            </span>
          )}
        </div>

        {/* Pool Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
            <p className="text-[10px] text-green-400/70 uppercase tracking-wider font-mono mb-1">Betting For</p>
            <p className="text-lg font-bold text-green-400">{parseFloat(totalBetsFor).toFixed(2)}</p>
            <p className="text-[10px] text-green-400/50 font-mono">{oddsFor.toFixed(2)}x</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
            <p className="text-[10px] text-red-400/70 uppercase tracking-wider font-mono mb-1">Betting Against</p>
            <p className="text-lg font-bold text-red-400">{parseFloat(totalBetsAgainst).toFixed(2)}</p>
            <p className="text-[10px] text-red-400/50 font-mono">{oddsAgainst.toFixed(2)}x</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[10px] font-mono text-white/50 mb-1">
            <span>Progress: {progressPct}%</span>
            <span>{timeRemaining > 0 ? `${Math.floor(timeRemaining / 60)}m remaining` : 'Time up'}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-gold to-green-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* User Bet Status */}
        {userBet && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mb-4 p-3 rounded-lg border ${
              userBet.prediction === 'success'
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            <p className="text-sm font-bold text-white">
              Your bet: {userBet.amount} STT on {userBet.prediction}
            </p>
          </motion.div>
        )}

        {/* Bet Input + Actions */}
        {!userBet && !isFinished && isConnected && (
          <div className="space-y-3">
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="Bet amount (STT)"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-gold/50 focus:outline-none"
              min="0.01"
              step="0.1"
            />
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => placeBet('success')}
                disabled={!betAmount || isBetting}
                className="bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30"
              >
                {isBetting ? <LoadingSpinner size="sm" /> : 'Bet For'}
              </Button>
              <Button
                onClick={() => placeBet('failure')}
                disabled={!betAmount || isBetting}
                className="bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30"
              >
                {isBetting ? <LoadingSpinner size="sm" /> : 'Bet Against'}
              </Button>
            </div>
          </div>
        )}

        {isFinished && (
          <div className="text-center py-3">
            <p className="text-sm text-white/60 font-mono">
              Commitment {status === 'completed' ? 'fulfilled' : 'failed'} — betting closed
            </p>
          </div>
        )}

        {!isConnected && (
          <p className="text-center text-xs text-white/40 font-mono">Connect wallet to place bets</p>
        )}
      </CardContent>
    </Card>
  );
}
