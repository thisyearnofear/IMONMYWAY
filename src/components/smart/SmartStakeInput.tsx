"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/PremiumButton";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/PremiumCard";
import { useComponentAnimation } from "@/hooks/useAnimation";
import { useComponentNotification } from "@/hooks/useNotification";
import { useWallet } from "@/hooks/useWallet";
import { cn } from "@/lib/utils";

interface SmartStakeInputProps {
  onStakeSet: (amount: string) => Promise<void>;
  isLoading?: boolean;
  minStake?: string;
  maxStake?: string;
  userBalance?: string;
  context?: {
    distance?: number;
    timeAvailable?: number;
    destination?: string;
  };
}

export function SmartStakeInput({
  onStakeSet,
  isLoading = false,
  minStake = "0.001",
  maxStake = "10",
  userBalance = "0",
  context
}: SmartStakeInputProps) {
  const [stakeAmount, setStakeAmount] = useState("0.01");
  const [error, setError] = useState("");
  const [showRecommendation, setShowRecommendation] = useState(false);

  const { isConnected } = useWallet();
  const { cardAnimation, getStaggeredDelay } = useComponentAnimation("SmartStakeInput");
  const { notifyContextual, notifyError, notifySuccess } = useComponentNotification("SmartStakeInput");
  
  // Simple mock for deleted hook
  const preferences = {
    successRate: 0.75,
    preferredStakeAmounts: ["0.01", "0.05", "0.1", "0.5"]
  };

  const getRecommendedStakeAmount = (_params: any) => ({
    value: "0.05",
    confidence: 75,
    reason: "Balanced recommendation based on typical usage"
  });

  const recordUserAction = (_action: any) => {}; // No-op

  // Get smart recommendation
  const recommendation = getRecommendedStakeAmount({
    distance: context?.distance,
    timeAvailable: context?.timeAvailable,
    currentBalance: parseFloat(userBalance)
  });

  // Show recommendation for new users or when context changes
  useEffect(() => {
    if (isConnected && recommendation.confidence > 70) {
      setShowRecommendation(true);
      // Auto-apply recommendation if confidence is very high
      if (recommendation.confidence > 85 && preferences.successRate > 0.8) {
        setStakeAmount(recommendation.value);
      }
    }
  }, [isConnected, recommendation, preferences.successRate]);

  const validateStake = (amount: string) => {
    const numAmount = parseFloat(amount);
    const numMin = parseFloat(minStake);
    const numMax = parseFloat(maxStake);
    const numBalance = parseFloat(userBalance);

    if (isNaN(numAmount) || numAmount <= 0) {
      return "Please enter a valid amount";
    }
    if (numAmount < numMin) {
      return `Minimum stake is ${minStake} STT`;
    }
    if (numAmount > numMax) {
      return `Maximum stake is ${maxStake} STT`;
    }
    if (numAmount > numBalance) {
      return "Insufficient balance";
    }
    return "";
  };

  const handleStakeChange = (value: string) => {
    setStakeAmount(value);
    setError(validateStake(value));
  };

  const handleSubmit = async () => {
    const validationError = validateStake(stakeAmount);
    if (validationError) {
      setError(validationError);
      notifyError(validationError);
      return;
    }

    try {
      await onStakeSet(stakeAmount);
      
      // Record user action for learning
      await recordUserAction({
        type: "stake_created",
        data: { amount: stakeAmount, context }
      });

      notifySuccess(`Stake of ${stakeAmount} STT created successfully!`);
      notifyContextual("stake_created", { amount: stakeAmount });
    } catch (error: any) {
      notifyError(error.message || "Failed to create stake");
    }
  };

  const applyRecommendation = () => {
    setStakeAmount(recommendation.value);
    setShowRecommendation(false);
    notifyContextual("recommendation_applied", { 
      amount: recommendation.value,
      confidence: recommendation.confidence 
    });
  };

  // Smart quick amounts based on user preferences and context
  const getSmartQuickAmounts = () => {
    const baseAmounts = preferences.preferredStakeAmounts.length > 0 
      ? preferences.preferredStakeAmounts 
      : ["0.01", "0.05", "0.1", "0.5"];
    
    // Add recommendation if it's not already in the list
    if (!baseAmounts.includes(recommendation.value)) {
      baseAmounts.push(recommendation.value);
    }
    
    return baseAmounts
      .map(amount => parseFloat(amount))
      .filter(amount => amount >= parseFloat(minStake) && amount <= parseFloat(maxStake))
      .sort((a, b) => a - b)
      .slice(0, 4)
      .map(amount => amount.toString());
  };

  const smartQuickAmounts = getSmartQuickAmounts();

  return (
    <Card className={cn("p-6 space-y-6", cardAnimation)}>
      {/* Header with Smart Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-3xl">💰</div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Set Your Stake</h3>
            <p className="text-sm text-gray-600">
              {preferences.successRate > 0 
                ? `${(preferences.successRate * 100).toFixed(0)}% success rate`
                : "Smart recommendations enabled"
              }
            </p>
          </div>
        </div>
        {showRecommendation && (
          <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            AI Suggested
          </div>
        )}
      </div>

      {/* Smart Recommendation Banner */}
      {showRecommendation && (
        <div 
          className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200"
          style={{ animationDelay: `${getStaggeredDelay(0)}ms` }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">🤖</span>
                <span className="font-medium text-blue-900">Smart Recommendation</span>
                <span className="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded-full">
                  {recommendation.confidence}% confident
                </span>
              </div>
              <p className="text-sm text-blue-800 mb-2">
                Suggested stake: <span className="font-mono font-bold">{recommendation.value} STT</span>
              </p>
              <p className="text-xs text-blue-700">{recommendation.reason}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={applyRecommendation}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
              >
                Apply
              </button>
              <button
                onClick={() => setShowRecommendation(false)}
                className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-md hover:bg-gray-300 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Balance Display */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Available Balance:</span>
        <span className="font-mono text-gray-900">{userBalance} STT</span>
      </div>

      {/* Stake Input */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Stake Amount (STT)
        </label>
        <Input
          type="number"
          value={stakeAmount}
          onChange={(e) => handleStakeChange(e.target.value)}
          placeholder="0.01"
          min={minStake}
          max={maxStake}
          step="0.001"
          className={cn(
            "text-lg font-mono transition-all duration-200",
            error ? "border-red-500 ring-red-200" : "focus:ring-blue-200",
            stakeAmount === recommendation.value && "ring-2 ring-blue-300 border-blue-400"
          )}
        />
        {error && (
          <p className="text-red-500 text-sm mt-1 animate-shake">{error}</p>
        )}
      </div>

      {/* Smart Quick Amount Buttons */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">
            Quick Select:
          </label>
          <span className="text-xs text-gray-500">
            Based on your preferences
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {smartQuickAmounts.map((amount, index) => {
            const isRecommended = amount === recommendation.value;
            const isPreferred = preferences.preferredStakeAmounts.includes(amount);
            
            return (
              <button
                key={amount}
                onClick={() => handleStakeChange(amount)}
                className={cn(
                  "px-3 py-2 text-sm rounded-lg border transition-all duration-200",
                  "hover:scale-105 active:scale-95",
                  stakeAmount === amount
                    ? "bg-blue-100 border-blue-500 text-blue-700 ring-2 ring-blue-300"
                    : isRecommended
                    ? "bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100"
                    : isPreferred
                    ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                    : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                )}
                style={{ animationDelay: `${getStaggeredDelay(index)}ms` }}
              >
                <div className="flex flex-col items-center">
                  <span>{amount} STT</span>
                  {isRecommended && (
                    <span className="text-xs text-purple-600">🤖</span>
                  )}
                  {isPreferred && !isRecommended && (
                    <span className="text-xs text-green-600">⭐</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Context Information */}
      {context && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-gray-900">Commitment Context</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {context.distance && (
              <div>
                <span className="text-gray-600">Distance:</span>
                <span className="ml-2 font-mono">{(context.distance / 1000).toFixed(1)}km</span>
              </div>
            )}
            {context.timeAvailable && (
              <div>
                <span className="text-gray-600">Time Available:</span>
                <span className="ml-2 font-mono">{context.timeAvailable}min</span>
              </div>
            )}
            {context.destination && (
              <div className="col-span-2">
                <span className="text-gray-600">Destination:</span>
                <span className="ml-2">{context.destination}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Stake Button */}
      <Button
        onClick={handleSubmit}
        disabled={!!error || !stakeAmount || isLoading}
        className="w-full"
        variant="primary"
      >
        Stake {stakeAmount} STT
      </Button>

      {/* Smart Tips */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>💡 Your stake will be locked until the commitment deadline</p>
        <p>✅ You&apos;ll get your stake back if you arrive on time</p>
        <p>🎲 Others can bet on your success for additional rewards</p>
        {preferences.successRate > 0.8 && (
          <p className="text-green-600">🌟 High success rate - consider increasing your stake!</p>
        )}
      </div>
    </Card>
  );
}