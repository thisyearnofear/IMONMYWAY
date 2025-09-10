"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useWallet } from "@/hooks/useWallet";
import { useUIStore } from "@/stores/uiStore";

interface WalletOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function WalletOnboarding({
  onComplete,
  onSkip,
}: WalletOnboardingProps) {
  const [step, setStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const { connect, isConnected, isConnecting, switchToSomnia, chainId } =
    useWallet();
  const { addToast } = useUIStore();

  const maxRetries = 3;

  const steps = [
    {
      title: "Welcome to IMONMYWAY! 🎯",
      description:
        "First punctuality accountability protocol on Somnia. Stake tokens on your commitments and let others bet on your success.",
      icon: "🏃‍♂️",
      action: null,
    },
    {
      title: "Connect Your Wallet 🔗",
      description:
        "Connect MetaMask to create staked commitments and participate in betting.",
      icon: "🦊",
      action: "connect",
    },
    {
      title: "Switch to Somnia Network ⚡",
      description:
        "Somnia offers lightning-fast transactions perfect for real-time betting.",
      icon: "🌐",
      action: "network",
    },
    {
      title: "You're All Set! 🎉",
      description:
        "Start creating staked commitments or bet on others' punctuality.",
      icon: "✅",
      action: null,
    },
  ];

  useEffect(() => {
    if (isConnected && chainId === 50312) {
      // Auto-advance to final step when fully connected to Somnia mainnet
      setStep(3);
    } else if (isConnected) {
      // Move to network step if connected but wrong network
      setStep(2);
    }
  }, [isConnected, chainId]);

  const nextStep = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setStep((prev) => Math.min(prev + 1, steps.length - 1));
      setIsAnimating(false);
    }, 300);
  };

  const handleConnect = async () => {
    setLastError(null);
    try {
      await connect();
      setRetryCount(0);
      addToast({
        type: "success",
        message: "Wallet connected successfully! 🎉",
      });
      nextStep();
    } catch (error: any) {
      console.error("Connection failed:", error);
      const errorMessage = getErrorMessage(error);
      setLastError(errorMessage);

      if (retryCount < maxRetries) {
        addToast({
          type: "warning",
          message: `${errorMessage} Retrying... (${
            retryCount + 1
          }/${maxRetries})`,
        });
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          handleConnect();
        }, 2000);
      } else {
        addToast({
          type: "error",
          message: errorMessage,
        });
      }
    }
  };

  const getErrorMessage = (error: any): string => {
    if (error.code === 4001) {
      return "Connection rejected. Please approve the connection in MetaMask.";
    }
    if (error.code === -32002) {
      return "Connection already pending. Check MetaMask for pending requests.";
    }
    if (error.message?.includes("User rejected")) {
      return "Connection cancelled. Please try connecting again.";
    }
    return error.message || "Failed to connect wallet. Please try again.";
  };

  const handleNetworkSwitch = async () => {
    setLastError(null);
    try {
      await switchToSomnia();
      setRetryCount(0);
      addToast({
        type: "success",
        message: "Switched to Somnia Network! ⚡",
      });
      nextStep();
    } catch (error: any) {
      console.error("Network switch failed:", error);
      const errorMessage = getNetworkErrorMessage(error);
      setLastError(errorMessage);

      if (retryCount < maxRetries) {
        addToast({
          type: "warning",
          message: `${errorMessage} Retrying... (${
            retryCount + 1
          }/${maxRetries})`,
        });
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          handleNetworkSwitch();
        }, 2000);
      } else {
        addToast({
          type: "error",
          message: errorMessage,
        });
      }
    }
  };

  const getNetworkErrorMessage = (error: any): string => {
    if (error.code === 4001) {
      return "Network switch rejected. Please approve in MetaMask.";
    }
    if (error.code === 4902) {
      return "Somnia Network not found. Adding network automatically...";
    }
    if (error.message?.includes("User rejected")) {
      return "Network switch cancelled. Please try again.";
    }
    return error.message || "Failed to switch network. Please try again.";
  };

  const currentStep = steps[step];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Progress Bar */}
        <div className="h-1 bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Icon */}
          <div
            className={`text-center mb-6 transition-all duration-300 ${
              isAnimating ? "scale-75 opacity-50" : "scale-100 opacity-100"
            }`}
          >
            <div className="text-6xl mb-4 animate-bounce-gentle">
              {currentStep.icon}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {currentStep.title}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {currentStep.description}
            </p>

            {/* Error Display */}
            {lastError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
                <div className="flex items-center space-x-2">
                  <span className="text-red-500">⚠️</span>
                  <p className="text-red-700 text-sm">{lastError}</p>
                </div>
                {retryCount > 0 && retryCount < maxRetries && (
                  <p className="text-red-600 text-xs mt-1">
                    Retry {retryCount} of {maxRetries}...
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {currentStep.action === "connect" && (
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
              >
                {isConnecting ? (
                  <LoadingSpinner
                    size="sm"
                    color="white"
                    message="Connecting..."
                  />
                ) : (
                  "Connect MetaMask"
                )}
              </Button>
            )}

            {currentStep.action === "network" && (
              <Button
                onClick={handleNetworkSwitch}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all duration-200"
              >
                Switch to Somnia Network
              </Button>
            )}

            {step === 0 && (
              <Button
                onClick={nextStep}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
              >
                Get Started
              </Button>
            )}

            {step === steps.length - 1 && (
              <Button
                onClick={onComplete}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-200"
              >
                Start Using Protocol
              </Button>
            )}

            {/* Skip Button */}
            {step < steps.length - 1 && (
              <button
                onClick={onSkip}
                className="w-full text-gray-500 hover:text-gray-700 text-sm py-2 transition-colors duration-200"
              >
                Skip for now
              </button>
            )}
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center space-x-2 mt-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index <= step ? "bg-blue-600" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
