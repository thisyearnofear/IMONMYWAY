"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { PremiumNavigation } from "@/components/layout/PremiumNavigation";
import { ToastContainer } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/PremiumButton";
import { useWallet } from "@/hooks/useWallet";
import { useLocationStore } from "@/stores/locationStore";
import { useUIStore } from "@/stores/uiStore";

// Dynamic imports for components that might cause SSR issues
const WebGLParticleSystem = dynamic(() => import("@/components/three/ParticleSystem"), {
  ssr: false
});

const SmartStakeInput = dynamic(() => import("@/components/smart/SmartStakeInput").then(mod => ({ default: mod.SmartStakeInput })), {
  ssr: false
});

const MapContainer = dynamic(() => import("@/components/map/MapContainer").then(mod => ({ default: mod.MapContainer })), {
  ssr: false
});

export default function Share() {
  const [stakeAmount, setStakeAmount] = useState("");
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const router = useRouter();
  const { isConnected, balance, address, chainId } = useWallet();
  const { currentLocation } = useLocationStore();
  const { addToast } = useUIStore();

  // Helper function to calculate distance between two points
  const calculateDistance = (start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (end.lat - start.lat) * Math.PI / 180;
    const dLng = (end.lng - start.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  // Real commitment creation using contracts and database
  const createCommitment = async (start: any, end: any, deadline: number, pace: number, amount: string) => {
    const { dbService } = await import('@/lib/db-service');
    const { useContractService } = await import('@/hooks/useContractService');
    
    if (!address) throw new Error('Wallet not connected');
    
    try {
      // Create commitment in database first
      const commitmentId = `commitment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const commitmentData = {
        userId: address,
        commitmentId: commitmentId,
        stakeAmount: amount,
        deadline: new Date(deadline),
        startLatitude: start.lat,
        startLongitude: start.lng,
        targetLatitude: end.lat,
        targetLongitude: end.lng,
        estimatedDistance: calculateDistance(start, end),
        estimatedPace: pace
      };
      
      await dbService.createCommitment(commitmentData);
      
      // If blockchain is available, create on-chain commitment
      if (window.ethereum && chainId) {
        const { BrowserProvider, parseEther } = await import('ethers');
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // Convert coordinates to contract format (scaled integers)
        const startLoc: [bigint, bigint, bigint, bigint] = [
          BigInt(Math.round(start.lat * 1e6)), 
          BigInt(Math.round(start.lng * 1e6)), 
          BigInt(Math.round(Date.now() / 1000)), 
          BigInt(100) // accuracy
        ];
        const endLoc: [bigint, bigint, bigint, bigint] = [
          BigInt(Math.round(end.lat * 1e6)), 
          BigInt(Math.round(end.lng * 1e6)), 
          BigInt(deadline), 
          BigInt(100) // accuracy
        ];
        
        // Use the contract service to create the commitment
        const { ContractService } = await import('@/services/contractService');
        const contractService = new ContractService(signer);
        
        await contractService.createCommitment(
          startLoc, 
          endLoc, 
          BigInt(deadline), 
          BigInt(pace), 
          amount
        );
        
        // Update commitment status to pending
        await dbService.updateCommitmentStatus(commitmentId, 'pending');
      }
      
      return commitmentId;
    } catch (error) {
      console.error('Error creating commitment:', error);
      throw error;
    }
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
      <div className="min-h-screen relative">
        <WebGLParticleSystem count={1500} color="#60a5fa" size={0.02} />
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-pink-950/10" />
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(59,130,246,0.08),transparent_70%)]" />
        <motion.div
          className="flex items-center justify-center min-h-screen relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center max-w-md mx-auto p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl">
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
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Create Bet
        </h1>
        <p className="text-gray-700 text-sm">Tap map for destination, set stake</p>
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
            <div className="text-center text-gray-900">
              <div className="text-6xl mb-2">📍</div>
              <p className="text-lg font-medium">Tap to set destination</p>
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
            userBalance={balance || "0.0"}
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
              <p className="text-gray-900 font-bold text-lg mb-2">
                Destination set: {destination[0].toFixed(4)}, {destination[1].toFixed(4)}
              </p>
              <p className="text-gray-700 text-sm mb-3">
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
            className="p-4 bg-blue-900/20 rounded-xl text-center border border-blue-400/30"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h4 className="font-medium text-blue-100 mb-2">How it works</h4>
            <ul className="text-sm text-blue-50 space-y-1">
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
