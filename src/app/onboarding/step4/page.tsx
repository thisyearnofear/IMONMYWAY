"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/PremiumButton";
import { motion } from "framer-motion";

export default function Step4CulturalProfile() {
  const { address } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (!address) {
      router.push('/');
      return;
    }
  }, [address, router]);

  const handleContinue = () => {
    router.push('/create');
  };

  if (!address) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white">Please connect your wallet first.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-purple-950 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">AI-Powered Commitments</span>
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto">
            Our AI learns from your actual on-chain performance history to provide intelligent commitment suggestions.
            No profiles needed - just start creating commitments and let the blockchain data train your personal AI.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 rounded-xl p-8 border border-white/20 text-center"
        >
          <div className="text-6xl mb-6">🧠</div>
          <h2 className="text-2xl font-bold text-white mb-4">How It Works</h2>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="text-lg font-semibold text-white mb-2">Analyze History</h3>
              <p className="text-white/70 text-sm">AI analyzes your past commitment performance from blockchain data</p>
            </div>

            <div className="text-center">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="text-lg font-semibold text-white mb-2">Smart Suggestions</h3>
              <p className="text-white/70 text-sm">Get personalized pace and deadline recommendations</p>
            </div>

            <div className="text-center">
              <div className="text-3xl mb-2">🚀</div>
              <h3 className="text-lg font-semibold text-white mb-2">Improve Over Time</h3>
              <p className="text-white/70 text-sm">Each commitment makes your AI smarter and more accurate</p>
            </div>
          </div>

          <div className="bg-blue-500/20 rounded-lg p-4 mb-6">
            <p className="text-blue-100 text-sm">
              <strong>New users:</strong> Start with conservative AI estimates.
              <br />
              <strong>Experienced users:</strong> Benefit from personalized insights based on your proven track record.
            </p>
          </div>

          <Button
            onClick={handleContinue}
            size="lg"
            className="px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl"
          >
            Start Creating AI-Powered Commitments
          </Button>
        </motion.div>
      </div>
    </div>
  );
}