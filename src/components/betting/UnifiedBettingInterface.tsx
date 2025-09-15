"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/PremiumButton";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/PremiumCard";
import { ReputationBadge } from "@/components/reputation/ReputationBadge";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAnimation } from "@/hooks/useAnimation";
import { useNotification } from "@/hooks/useNotification";
import { useOptimisticUpdate } from "@/hooks/useLoadingState";
import { useBetting } from "@/hooks/useBetting";
import { useWallet } from "@/hooks/useWallet";
import { ActiveBet } from "@/stores/bettingStore";
import { formatTime, formatDistance } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface UnifiedBettingInterfaceProps {
  mode: "stake" | "bet" | "watch" | "manage";
  commitment?: ActiveBet;
  onCommitmentCreated?: (commitmentId: string) => void;
  onBetPlaced?: (success: boolean) => void;
  className?: string;
}

export function UnifiedBettingInterface({
  mode,
  commitment,
  onCommitmentCreated,
  onBetPlaced,
  className
}: UnifiedBettingInterfaceProps) {
  const [stakeAmount, setStakeAmount] = useState("0.01");
  const [betAmount, setBetAmount] = useState("0.01");
  const [bettingFor, setBettingFor] = useState(true);
  const [destination, setDestination] = useState<[number, number] | null>(null);

  const { isConnected, address } = useWallet();
  const { createCommitment, placeBet, fulfillCommitment } = useBetting();
  const { getAnimationClass, triggerCelebration } = useAnimation();
  const { notifyContext, success, error } = useNotification();
  const { optimisticData, executeOptimistic } = useOptimisticUpdate<ActiveBet>();

  // Quick amount presets
  const quickAmounts = {
    stake: ["0.01", "0.05", "0.1", "0.5"],
    bet: ["0.01", "0.02", "0.05", "0.1"]
  };

  // Calculate potential winnings
  const calculatePotentialWinnings = (amount: string, odds: number = 2.0) => {
    return (parseFloat(amount) * odds).toFixed(3);
  };

  // Handle stake creation
  const handleCreateStake = async () => {
    if (!isConnected || !destination) {
      error("Please connect wallet and set destination");
      return;
    }

    const commitmentId = await executeOptimistic(
      {
        ...commitment!,
        stakeAmount: BigInt(parseFloat(stakeAmount) * 1e18),
        status: "pending"
      },
      async () => {
        const result = await createCommitment(
          { lat: 40.7128, lng: -74.006 }, // Current location (mock)
          { lat: destination[0], lng: destination[1] },
          Date.now() + 30 * 60 * 1000, // 30 minutes
          8, // Default pace
          stakeAmount
        );
        
        if (!result) throw new Error("Failed to create commitment");
        
        return {
          ...commitment!,
          commitmentId: result,
          stakeAmount: BigInt(parseFloat(stakeAmount) * 1e18),
          status: "active"
        } as ActiveBet;
      },
      {
        onSuccess: (result) => {
          notifyContext({
            context: "commitment",
            event: "created",
            data: { amount: stakeAmount }
          });
          onCommitmentCreated?.(result.commitmentId);
          triggerCelebration({
            type: "success",
            intensity: "medium",
            haptic: true
          });
        },
        onError: (err) => {
          error(`Failed to create commitment: ${err}`);
        }
      }
    );
  };

  // Handle bet placement
  const handlePlaceBet = async () => {
    if (!isConnected || !commitment) {
      error("Please connect wallet");
      return;
    }

    const success = await executeOptimistic(
      {
        ...commitment,
        betAmount: BigInt(parseFloat(betAmount) * 1e18),
        bettingFor,
        status: "pending"
      },
      async () => {
        const result = await placeBet(commitment.commitmentId, betAmount, bettingFor);
        if (!result) throw new Error("Failed to place bet");
        
        return {
          ...commitment,
          betAmount: BigInt(parseFloat(betAmount) * 1e18),
          bettingFor,
          status: "confirmed"
        };
      },
      {
        onSuccess: () => {
          notifyContext({
            context: "betting",
            event: "bet_placed",
            data: { amount: betAmount, bettingFor }
          });
          onBetPlaced?.(true);
        },
        onError: (err) => {
          error(`Failed to place bet: ${err}`);
          onBetPlaced?.(false);
        }
      }
    );
  };

  // Render stake creation interface
  const renderStakeInterface = () => (
    <Card className={cn("p-6 space-y-6", getAnimationClass("enter", "medium"))}>
      <div className="flex items-center space-x-3">
        <div className="text-3xl">💰</div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Create Your Commitment</h3>
          <p className="text-sm text-gray-600">Stake tokens on your punctuality</p>
        </div>
      </div>

      {/* Stake Amount Input */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Stake Amount (STT)
        </label>
        <Input
          type="number"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
          placeholder="0.01"
          min="0.001"
          step="0.001"
          className="text-lg font-mono"
        />
        
        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {quickAmounts.stake.map((amount, index) => (
            <button
              key={amount}
              onClick={() => setStakeAmount(amount)}
              className={cn(
                "px-3 py-2 text-sm rounded-lg border transition-all duration-200",
                "hover:scale-105 active:scale-95",
                stakeAmount === amount
                  ? "bg-blue-100 border-blue-500 text-blue-700"
                  : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {amount} STT
            </button>
          ))}
        </div>
      </div>

      {/* Commitment Summary */}
      <div className="bg-blue-50 rounded-lg p-4 space-y-2">
        <h4 className="font-medium text-blue-900">Commitment Details</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <div className="flex justify-between">
            <span>Stake Amount:</span>
            <span className="font-mono">{stakeAmount} STT</span>
          </div>
          <div className="flex justify-between">
            <span>Time Limit:</span>
            <span>30 minutes</span>
          </div>
          <div className="flex justify-between">
            <span>Potential Reward:</span>
            <span className="font-mono text-green-700">
              +{calculatePotentialWinnings(stakeAmount, 1.5)} STT
            </span>
          </div>
        </div>
      </div>

      <Button
        variant="primary"
        className="w-full"
        onClick={handleCreateStake}
        disabled={!destination || parseFloat(stakeAmount) <= 0}
      >
        Stake {stakeAmount} STT
      </Button>
    </Card>
  );

  // Render betting interface
  const renderBettingInterface = () => (
    <Card className={cn("p-6 space-y-6", getAnimationClass("enter", "medium"))}>
      {/* Commitment Info */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🎲</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Place Your Bet</h3>
            <p className="text-sm text-gray-600">
              Bet on {commitment?.targetAddress.slice(0, 6)}...{commitment?.targetAddress.slice(-4)}&apos;s success
            </p>
          </div>
        </div>
        <ReputationBadge score={7500} size="sm" />
      </div>

      {/* Commitment Details */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Stake Amount:</span>
          <span className="font-mono text-lg">
            {commitment ? (Number(commitment.stakeAmount) / 1e18).toFixed(3) : "0"} STT
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Time Remaining:</span>
          {commitment && (
            <CountdownTimer
              targetTime={commitment.deadline}
              onComplete={() => notifyContext({ context: "commitment", event: "expired", data: {} })}
            />
          )}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Distance:</span>
          <span>{formatDistance(commitment?.estimatedDistance || 0)}</span>
        </div>
      </div>

      {/* Betting Direction */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Your Prediction
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setBettingFor(true)}
            className={cn(
              "p-4 rounded-lg border-2 transition-all duration-200",
              "hover:scale-105 active:scale-95",
              bettingFor
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            )}
          >
            <div className="text-2xl mb-2">✅</div>
            <div className="font-medium">Will Arrive On Time</div>
            <div className="text-sm opacity-75">2.1x payout</div>
          </button>
          <button
            onClick={() => setBettingFor(false)}
            className={cn(
              "p-4 rounded-lg border-2 transition-all duration-200",
              "hover:scale-105 active:scale-95",
              !bettingFor
                ? "border-red-500 bg-red-50 text-red-700"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            )}
          >
            <div className="text-2xl mb-2">❌</div>
            <div className="font-medium">Will Be Late</div>
            <div className="text-sm opacity-75">1.8x payout</div>
          </button>
        </div>
      </div>

      {/* Bet Amount */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Bet Amount (STT)
        </label>
        <Input
          type="number"
          value={betAmount}
          onChange={(e) => setBetAmount(e.target.value)}
          placeholder="0.01"
          min="0.001"
          step="0.001"
          className="text-lg font-mono"
        />
        
        <div className="grid grid-cols-4 gap-2">
          {quickAmounts.bet.map((amount, index) => (
            <button
              key={amount}
              onClick={() => setBetAmount(amount)}
              className={cn(
                "px-3 py-2 text-sm rounded-lg border transition-all duration-200",
                "hover:scale-105 active:scale-95",
                betAmount === amount
                  ? "bg-blue-100 border-blue-500 text-blue-700"
                  : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
              )}
            >
              {amount} STT
            </button>
          ))}
        </div>
      </div>

      {/* Potential Winnings */}
      <div className="bg-green-50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-green-700">Potential Winnings:</span>
          <span className="font-mono text-lg text-green-800">
            +{calculatePotentialWinnings(betAmount, bettingFor ? 2.1 : 1.8)} STT
          </span>
        </div>
      </div>

      <Button
        variant={bettingFor ? "primary" : "secondary"}
        className="w-full"
        onClick={handlePlaceBet}
        disabled={parseFloat(betAmount) <= 0}
      >
        Bet {betAmount} STT {bettingFor ? "FOR" : "AGAINST"} Success
      </Button>
    </Card>
  );

  // Render watch interface
  const renderWatchInterface = () => (
    <Card className={cn("p-6 space-y-4", getAnimationClass("enter", "medium"))}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">👀</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Live Tracking</h3>
            <p className="text-sm text-gray-600">Following the commitment progress</p>
          </div>
        </div>
        <ReputationBadge score={7500} size="sm" />
      </div>

      {commitment && (
        <>
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to destination</span>
              <span>65% complete</span>
            </div>
            <ProgressBar value={65} className="h-3" />
          </div>

          {/* Live Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-600">
                {formatTime(commitment.deadline - Date.now())}
              </div>
              <div className="text-xs text-blue-700">Time Remaining</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-green-600">
                {formatDistance(commitment.estimatedDistance * 0.35)}
              </div>
              <div className="text-xs text-green-700">Distance Left</div>
            </div>
          </div>

          {/* Current Bets */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Current Bets</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-sm text-green-700">Betting FOR</div>
                <div className="font-mono text-lg text-green-800">1.25 STT</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <div className="text-sm text-red-700">Betting AGAINST</div>
                <div className="font-mono text-lg text-red-800">0.80 STT</div>
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );

  // Main render logic
  const renderInterface = () => {
    switch (mode) {
      case "stake":
        return renderStakeInterface();
      case "bet":
        return renderBettingInterface();
      case "watch":
        return renderWatchInterface();
      default:
        return <div>Invalid mode</div>;
    }
  };

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      {renderInterface()}
    </div>
  );
}