"use client";

import { useState } from "react";
import { PremiumNavigation } from "@/components/layout/PremiumNavigation";
import { ToastContainer } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import WebGLParticleSystem from "@/components/three/ParticleSystem";
import { Button } from "@/components/ui/PremiumButton";
import { SmartStakeInput } from "@/components/smart/SmartStakeInput";
import { MapContainer } from "@/components/map/MapContainer";
import { useWallet } from "@/hooks/useWallet";
import { useLocationStore } from "@/stores/locationStore";
import { useUIStore } from "@/stores/uiStore";

export default function Share() {
  const [stakeAmount, setStakeAmount] = useState("");
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const router = useRouter();
  const { isConnected } = useWallet();
  const { currentLocation } = useLocationStore();
  const { addToast } = useUIStore();

  // Simple mock for createCommitment - replace with actual implementation
  const createCommitment = async (_start: any, _end: any, _deadline: number, _pace: number, _amount: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `commitment_${Date.now()}`; // Mock commitment ID
  };

  const handleStakeSet = async (amount: string) => {
    if (!isConnected) {
      addToast({
        type: "error",
        message: "Please connect your wallet first",
      });
      return;
    }

    if (!currentLocation) {
      addToast({
        type: "error",
        message: "Location access required",
      });
      return;
    }

    if (!destination) {
      addToast({
        type: "error",
        message: "Please set a destination on the map",
      });
      return;
    }

    setIsCreating(true);

    try {
      const commitmentId = await createCommitment(
        { lat: currentLocation.latitude, lng: currentLocation.longitude },
        { lat: destination[0], lng: destination[1] },
        Date.now() + 30 * 60 * 1000, // 30 minutes from now
        8, // Default pace
        amount
      );

      if (commitmentId) {
        addToast({
          type: "success",
          message:
            "Commitment created! Share the link with friends to let them bet.",
        });
        router.push(`/watch/${commitmentId}`);
      }
    } catch (error) {
      console.error("Error creating commitment:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleMapClick = (latlng: [number, number]) => {
    setDestination(latlng);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen relative bg-gradient-to-br from-slate-50 to-blue-50">
        <WebGLParticleSystem count={1000} color="#60a5fa" size={0.02} />
        <motion.div
          className="flex items-center justify-center min-h-screen"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center max-w-md mx-auto p-6 glass-enhanced rounded-2xl shadow-2xl border border-white/20">
            <motion.div className="text-6xl mb-4" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              🔗
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Connect Your Wallet
            </h1>
            <p className="text-white/80 mb-6">
              Connect your wallet to create staked commitments and start betting
              on punctuality.
            </p>
            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">Connect Wallet</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <WebGLParticleSystem count={1500} color="#60a5fa" size={0.02} />
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-pink-950/10" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(59,130,246,0.08),transparent_70%)]" />

      <PremiumNavigation />

      {/* Minimal Header */}
      <div className="relative z-10 p-4 text-center">
        <h1 className="text-2xl font-bold text-white mb-1">
          Create Bet
        </h1>
        <p className="text-white/70 text-sm">Tap map for destination, set stake</p>
      </div>

      {/* Full-screen map */}
      <div className="fixed inset-0 z-0">
        <MapContainer
          className="h-full"
          center={
            currentLocation
              ? [currentLocation.latitude, currentLocation.longitude]
              : [40.7128, -74.006]
          }
          onClick={handleMapClick}
        />
        {!destination && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="text-center text-white">
              <div className="text-6xl mb-2">📍</div>
              <p className="text-lg">Tap to set destination</p>
            </div>
          </div>
        )}
      </div>

      {/* Compact bottom controls bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 z-10">
        <div className="space-y-4 max-w-4xl mx-auto">
          <SmartStakeInput
            onStakeSet={handleStakeSet}
            isLoading={isCreating}
            userBalance="1.5" // Mock balance
            context={{
              distance: destination && currentLocation
                ? Math.round(
                    Math.sqrt(
                      Math.pow((destination[0] - currentLocation.latitude) * 111000, 2) +
                      Math.pow((destination[1] - currentLocation.longitude) * 111000, 2)
                    )
                  )
                : undefined,
              timeAvailable: 30,
              destination: destination ? `${destination[0].toFixed(4)}, ${destination[1].toFixed(4)}` : undefined
            }}
          />
          {destination && (
            <motion.div
              className="p-4 bg-white/10 rounded-xl text-center backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-white font-bold text-lg mb-2">
                Destination set: {destination[0].toFixed(4)}, {destination[1].toFixed(4)}
              </p>
              <p className="text-white/70 text-sm mb-3">
                30 min limit • {destination && currentLocation ? (Math.sqrt(
                  Math.pow((destination[0] - currentLocation.latitude) * 111000, 2) +
                  Math.pow((destination[1] - currentLocation.longitude) * 111000, 2)
                )).toFixed(1) : ''} km away
              </p>
            </motion.div>
          )}
          <Button
            onClick={() => handleStakeSet(stakeAmount)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-5 text-xl rounded-xl shadow-2xl hover:from-blue-700 hover:to-purple-700"
            disabled={isCreating || !destination}
          >
            {isCreating ? "Creating..." : "💰 Create Bet Challenge"}
          </Button>
          <motion.div
            className="p-4 bg-blue-500/10 rounded-xl text-center border border-blue-400/30"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h4 className="font-medium text-blue-300 mb-2">How it works</h4>
            <ul className="text-xs text-blue-200 space-y-1">
              <li>• Tap map to set destination</li>
              <li>• Set stake amount</li>
              <li>• Share link for friends to bet</li>
              <li>• Arrive on time to win!</li>
            </ul>
          </motion.div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
