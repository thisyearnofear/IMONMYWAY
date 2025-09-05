"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { WalletOnboarding } from "@/components/onboarding/WalletOnboarding";
import { AchievementDisplay } from "@/components/reputation/AchievementDisplay";
import { useWallet } from "@/hooks/useWallet";
import { useUIStore } from "@/stores/uiStore";
import { useAchievements } from "@/hooks/useAchievements";

export default function HomePage() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { isConnected } = useWallet();
  const { addToast } = useUIStore();

  // Show onboarding after 2 seconds for new users
  useEffect(() => {
    if (!isConnected) {
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    addToast({
      type: "success",
      message: "Welcome to Punctuality Protocol! 🎉",
    });
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <main className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in">
            <span>⏰</span>
            <span>Put your money where your mouth is</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 animate-scale-in">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Punctuality Protocol
            </span>
          </h1>

          <p
            className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            Stake tokens on your punctuality commitments and let others bet on
            your success. Real-time GPS verification ensures accountability in
            the most fun way possible.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            <Link href="/plan">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
              >
                Start Planning Route
              </Button>
            </Link>
            <Link href="/share">
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transform hover:scale-105 transition-all duration-200"
              >
                Create Your First Bet
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div
            className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in"
            style={{ animationDelay: "0.6s" }}
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🗺️</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Plan Your Route
            </h3>
            <p className="text-gray-600">
              Use our intelligent route planner to calculate distances and ETAs
              with real-time traffic data.
            </p>
          </div>

          <div
            className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in"
            style={{ animationDelay: "0.8s" }}
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Stake & Bet
            </h3>
            <p className="text-gray-600">
              Put tokens on the line for your punctuality. Friends can bet on
              your success for added motivation.
            </p>
          </div>

          <div
            className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in"
            style={{ animationDelay: "1s" }}
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📍</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              GPS Verification
            </h3>
            <p className="text-gray-600">
              Blockchain-verified proof of arrival ensures fair payouts and
              builds trust in the community.
            </p>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="animate-fade-in" style={{ animationDelay: "1.2s" }}>
          <AchievementDisplay />
        </div>

        {/* Social Proof / Stats */}
        <div
          className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 text-center animate-fade-in"
          style={{ animationDelay: "1.2s" }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Join the Movement
          </h3>
          <p className="text-gray-600 mb-6">
            Be part of the future of accountability. Turn punctuality into
            profit with blockchain technology.
          </p>
          <div className="flex justify-center space-x-8 text-sm text-gray-500">
            <div>
              <div className="font-bold text-2xl text-blue-600">100%</div>
              <div>Blockchain Verified</div>
            </div>
            <div>
              <div className="font-bold text-2xl text-purple-600">
                Real-time
              </div>
              <div>GPS Tracking</div>
            </div>
            <div>
              <div className="font-bold text-2xl text-green-600">Social</div>
              <div>Betting Features</div>
            </div>
          </div>
        </div>
      </main>

      {/* Wallet Onboarding Modal */}
      {showOnboarding && (
        <WalletOnboarding
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
    </div>
  );
}
