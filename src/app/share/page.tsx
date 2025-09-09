"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StakeInput } from "@/components/betting/StakeInput";
import { MapContainer } from "@/components/map/MapContainer";
import { useWallet } from "@/hooks/useWallet";
import { useLocationStore } from "@/stores/locationStore";
import { useBetting } from "@/hooks/useBetting";
import { useUIStore } from "@/stores/uiStore";

export default function Share() {
  const [stakeAmount, setStakeAmount] = useState("");
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const router = useRouter();
  const { isConnected } = useWallet();
  const { currentLocation } = useLocationStore();
  const { createCommitment } = useBetting();
  const { addToast } = useUIStore();

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">🔗</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-gray-600 mb-6">
            Connect your wallet to create staked commitments and start betting
            on punctuality.
          </p>
          <Button className="w-full">Connect Wallet</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Your Bet
          </h1>
          <p className="text-gray-600">
            Set your destination, choose your stake, and let friends bet on your
            punctuality
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Map Section */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Set Your Destination
              </h2>
              <p className="text-sm text-gray-600">
                Click on the map to set where you are heading
              </p>
            </div>
            <MapContainer
              className="h-96"
              center={
                currentLocation
                  ? [currentLocation.latitude, currentLocation.longitude]
                  : [40.7128, -74.006]
              }
              onClick={handleMapClick}
            />
          </div>

          {/* Betting Section */}
          <div className="space-y-6">
            <StakeInput
              onStakeSet={handleStakeSet}
              isLoading={isCreating}
              userBalance="1.5" // Mock balance
            />

            {destination && (
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Commitment Summary
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stake Amount:</span>
                    <span className="font-medium">
                      {stakeAmount || "0"} STT
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time Limit:</span>
                    <span className="font-medium">30 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Location:</span>
                    <span className="font-medium font-mono text-xs">
                      {currentLocation
                        ? `${currentLocation.latitude.toFixed(
                            4
                          )}, ${currentLocation.longitude.toFixed(4)}`
                        : "Not available"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Destination:</span>
                    <span className="font-medium font-mono text-xs">
                      {destination
                        ? `${destination[0].toFixed(
                            4
                          )}, ${destination[1].toFixed(4)}`
                        : "Not set"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Set your destination on the map</li>
                <li>• Choose how much to stake on your punctuality</li>
                <li>• Share the link with friends to let them bet</li>
                <li>• Arrive on time to claim your stake back</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
