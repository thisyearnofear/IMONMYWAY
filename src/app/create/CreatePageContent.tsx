"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/PremiumButton";
import { Input } from "@/components/ui/Input";
import { useWallet } from "@/hooks/useWallet";
import { useUIStore } from "@/stores/uiStore";
import { useLocationStore } from "@/stores/locationStore";
import { useNavigationContext } from "@/hooks/useNavigationContext";
import { CHALLENGE_TEMPLATES, createChallengeFromTemplate } from "@/lib/challenge-templates";
import { AICommitmentEngine, type AICommitmentSuggestion } from "@/lib/ai-commitment-engine";
import { MapContainer } from "@/components/map/MapContainer";
import { calculateDistance } from "@/lib/distance";

// Enhanced geocoding with autocomplete suggestions
const geocodeAddress = async (
  address: string
): Promise<[number, number] | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}&limit=1`
    );

    if (!response.ok) {
      throw new Error("Geocoding service unavailable");
    }

    const data = await response.json();

    if (data.length > 0) {
      const result = data[0];
      return [parseFloat(result.lat), parseFloat(result.lon)];
    }

    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};

export default function CreatePageContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const { addToast } = useUIStore();
  const { currentLocation } = useLocationStore();
  const { getPreservedState } = useNavigationContext();

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(
    params.get("template")
  );
  const [startAddress, setStartAddress] = useState("");
  const [endAddress, setEndAddress] = useState("");
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [stakeAmount, setStakeAmount] = useState("3");
  const [isCreating, setIsCreating] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AICommitmentSuggestion | null>(null);
  const [commitmentContext, setCommitmentContext] = useState<'work' | 'social' | 'urgent'>('social');

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }

    // Load preserved route data from plan page
    const preservedRoute = getPreservedState('plannedRoute');
    if (preservedRoute && !destination) {
      // If we have preserved route data and no destination set, use it
      if (preservedRoute.endCoords) {
        // Use coordinates directly if available
        setDestination(preservedRoute.endCoords);
        setEndAddress(preservedRoute.endAddress || '');
      } else if (preservedRoute.endAddress && preservedRoute.endAddress !== 'Current Location') {
        // Fallback to geocoding addresses
        const loadPreservedRoute = async () => {
          try {
            const coords = await geocodeAddress(preservedRoute.endAddress);
            if (coords) {
              setDestination(coords);
              setEndAddress(preservedRoute.endAddress);
            }
          } catch (error) {
            console.error('Error loading preserved route:', error);
          }
        };
        loadPreservedRoute();
      }
      if (preservedRoute.startAddress && preservedRoute.startAddress !== 'Current Location') {
        setStartAddress(preservedRoute.startAddress);
      }
    }

    // Generate AI suggestion when user and destination are available
    const generateAISuggestion = async () => {
      if (address && destination && currentLocation) {
        try {
          console.log('Generating AI suggestion for distance:', calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            destination[0],
            destination[1]
          ));

          const distance = calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            destination[0],
            destination[1]
          );

          const suggestion = await AICommitmentEngine.generateSuggestion(
            address,
            distance * 1000, // convert km to meters
            commitmentContext
          );

          console.log('AI suggestion generated:', suggestion);
          setAiSuggestion(suggestion);
        } catch (error) {
          console.error('Error generating AI suggestion:', error);
          // Set fallback suggestion on error
          setAiSuggestion({
            estimatedPace: 0.083,
            suggestedDeadline: 30,
            confidenceLevel: 0.3,
            reasoning: "Error generating AI suggestion, using fallback",
            socialBoost: 0,
            viralPotential: 0
          });
        }
      }
    };

    generateAISuggestion();
  }, [address, isConnected, router, destination, currentLocation, commitmentContext]);

  // AI suggestion is now generated in the main useEffect above

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = CHALLENGE_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setStakeAmount(template.stakeAmount.suggested.toString());
    }
  };

  const handleMapClick = (latlng: [number, number]) => {
    setDestination(latlng);
  };

  const handleCreateCommitment = async () => {
    if (!address || !destination || !currentLocation) {
      addToast({
        message: "Please ensure wallet is connected, location is enabled, and destination is set",
        type: "error"
      });
      return;
    }

    setIsCreating(true);

    try {
      let commitmentData: any; // Using any to satisfy multiple shapes before sending to DB

      if (selectedTemplate) {
        // Create from template, now passing location data
        const template = CHALLENGE_TEMPLATES.find(t => t.id === selectedTemplate);
        if (template) {
          commitmentData = createChallengeFromTemplate(selectedTemplate, address, {
            start: currentLocation,
            target: { latitude: destination[0], longitude: destination[1] },
          });
        }
      } else {
        // AI-Assisted Custom Commitment (using on-chain data)
        if (!aiSuggestion) {
          console.log('No AI suggestion available, using fallback values');
          // Fallback values if AI is not available
          aiSuggestion = {
            estimatedPace: 0.083, // ~12 min/mile = 5 mph walking pace
            suggestedDeadline: 30,
            confidenceLevel: 0.5,
            reasoning: "Fallback estimate - AI analysis unavailable",
            socialBoost: 0,
            viralPotential: 0
          };
        }

        const deadline = new Date(Date.now() + aiSuggestion.suggestedDeadline * 60 * 1000);
        const distance = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          destination[0],
          destination[1]
        );

        // Constructing the object to perfectly match dbService type
        commitmentData = {
          userId: address,
          commitmentId: `commitment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          stakeAmount: stakeAmount.toString(),
          deadline,
          startLatitude: currentLocation.latitude,
          startLongitude: currentLocation.longitude,
          targetLatitude: destination[0],
          targetLongitude: destination[1],
          estimatedDistance: Number(distance),
          estimatedPace: Number(aiSuggestion.estimatedPace),
        };
      }

      if (commitmentData) {
        // Create on-chain commitment (the real source of truth)
        try {
          // Create commitment in database first
          const commitmentId = commitmentData.commitmentId;

          // Try to create in database, but don't fail if it's not available
          try {
            const { dbService } = await import('@/lib/db-service');
            await dbService.createCommitment(commitmentData);
          } catch (dbError) {
            console.warn('Database not available, creating commitment in memory:', dbError);
          }

          // If blockchain is available, create on-chain commitment
          console.log('Checking for window.ethereum:', typeof window !== 'undefined' && window.ethereum);
          if (typeof window !== 'undefined' && window.ethereum) {
            console.log('Attempting blockchain interaction...');
            try {
              const { BrowserProvider } = await import('ethers');
              const provider = new BrowserProvider(window.ethereum);
              const signer = await provider.getSigner();
              const network = await provider.getNetwork();
              console.log('Connected to network:', network.chainId);

              // Convert coordinates to contract format (scaled integers)
              const startLoc: [bigint, bigint, bigint, bigint] = [
                BigInt(Math.round(currentLocation.latitude * 1e6)),
                BigInt(Math.round(currentLocation.longitude * 1e6)),
                BigInt(Math.round(Date.now() / 1000)),
                BigInt(100) // accuracy
              ];
              const endLoc: [bigint, bigint, bigint, bigint] = [
                BigInt(Math.round(destination[0] * 1e6)),
                BigInt(Math.round(destination[1] * 1e6)),
                BigInt(Math.round(commitmentData.deadline.getTime() / 1000)),
                BigInt(100) // accuracy
              ];

              console.log('Creating commitment with params:', {
                startLoc,
                endLoc,
                deadline: BigInt(Math.round(commitmentData.deadline.getTime() / 1000)),
                pace: BigInt(commitmentData.estimatedPace),
                stakeAmount: commitmentData.stakeAmount
              });

              // Use the contract service to create the commitment
              const { ContractService } = await import('@/services/contractService');
              const contractService = new ContractService(signer);

              const result = await contractService.createCommitment(
                startLoc,
                endLoc,
                BigInt(Math.round(commitmentData.deadline.getTime() / 1000)),
                BigInt(commitmentData.estimatedPace),
                commitmentData.stakeAmount
              );

              console.log('On-chain commitment created successfully:', result);

              // Update commitment status to pending if database is available
              try {
                const { dbService } = await import('@/lib/db-service');
                await dbService.updateCommitmentStatus(commitmentId, 'pending');
              } catch (dbError) {
                console.warn('Could not update commitment status in database:', dbError);
              }
            } catch (contractError) {
              console.error('Blockchain interaction failed:', contractError);
              console.warn('Continuing with off-chain commitment due to blockchain error');
            }
          } else {
            console.log('window.ethereum not available, skipping on-chain interaction');
          }

          addToast({
            message: "AI-Assisted Commitment created successfully!",
            type: "success"
          });

          // Navigate to challenges page instead of individual watch
          router.push('/challenges');
        } catch (error) {
          console.error('Error creating commitment:', error);
          addToast({
            message: "Failed to create commitment. Please try again.",
            type: "error"
          });
        }
      }
    } catch (error) {
      console.error("Error creating commitment:", error);
      addToast({
        message: "Failed to create commitment",
        type: "error"
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white">Redirecting to connect wallet...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-purple-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Create Your <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Punctuality Challenge</span>
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto">
            Choose a template or create a custom challenge. Set your destination and stake amount.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Challenge Templates */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/10 rounded-xl p-6 border border-white/20"
          >
            <h2 className="text-2xl font-bold text-white mb-4">🎯 Challenge Templates</h2>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              <Button
                variant={!selectedTemplate ? 'primary' : 'outline'}
                className="w-full text-left justify-start"
                onClick={() => setSelectedTemplate(null)}
              >
                <div>
                  <div className="font-medium">Custom Challenge</div>
                  <div className="text-xs opacity-70">Create your own rules</div>
                </div>
              </Button>

              {CHALLENGE_TEMPLATES.filter(t => t.isActive).map((template) => (
                <Button
                  key={template.id}
                  variant={selectedTemplate === template.id ? 'primary' : 'outline'}
                  className="w-full text-left justify-start p-4"
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <div>
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs opacity-70 mt-1">{template.description}</div>
                    <div className="text-xs mt-2 flex gap-2">
                      <span className="bg-white/20 px-2 py-1 rounded">{template.difficulty}</span>
                      <span className="bg-white/20 px-2 py-1 rounded">${template.stakeAmount.suggested}</span>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </motion.div>

          {/* Map & Destination */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 rounded-xl p-6 border border-white/20"
          >
            <h2 className="text-2xl font-bold text-white mb-4">📍 Set Destination</h2>

            <div className="space-y-4">
              <Input
                placeholder="Enter destination address..."
                value={endAddress}
                onChange={(e) => setEndAddress(e.target.value)}
                className="text-white"
              />

              <div className="h-64 rounded-lg overflow-hidden">
                <MapContainer
                  className="h-full"
                  center={
                    destination ||
                    (currentLocation ? [currentLocation.latitude, currentLocation.longitude] : [40.7128, -74.006])
                  }
                  onClick={handleMapClick}
                />
              </div>

              {destination && (
                <div className="p-3 bg-green-500/20 rounded-lg border border-green-400/30">
                  <p className="text-green-100 text-sm">
                    <strong>Destination:</strong> {destination[0].toFixed(4)}, {destination[1].toFixed(4)}
                  </p>
                  {aiSuggestion && (
                    <div className="mt-2 text-xs">
                      <div className="text-green-200">
                        AI Estimated Time: {aiSuggestion.suggestedDeadline} minutes
                      </div>
                      <div className="text-green-300 font-bold">
                        Pace: {(aiSuggestion.estimatedPace * 60).toFixed(1)} sec/100m
                      </div>
                      <div className="text-green-400">
                        Confidence: {Math.round(aiSuggestion.confidenceLevel * 100)}%
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Settings & Create */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/10 rounded-xl p-6 border border-white/20"
          >
            <h2 className="text-2xl font-bold text-white mb-4">⚙️ Challenge Settings</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Commitment Context</label>
                <select
                  value={commitmentContext}
                  onChange={(e) => setCommitmentContext(e.target.value as 'work' | 'social' | 'urgent')}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                >
                  <option value="social">Social Gathering</option>
                  <option value="work">Work Meeting</option>
                  <option value="urgent">Urgent Appointment</option>
                </select>
                <p className="text-xs text-white/60 mt-1">Helps our AI set a culturally-aware deadline.</p>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Stake Amount</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="text-white"
                />
                <p className="text-xs text-white/60 mt-1">Amount to stake on this challenge</p>
              </div>

              {aiSuggestion && (
                <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-400/30">
                  <p className="text-blue-100 text-sm">
                    <strong>🧠 AI Suggestion:</strong> {aiSuggestion.suggestedDeadline} minutes
                  </p>
                  <p className="text-blue-200 text-xs mt-1">
                    Confidence: {Math.round(aiSuggestion.confidenceLevel * 100)}% | Viral Potential: {Math.round(aiSuggestion.viralPotential * 100)}%
                  </p>
                  <p className="text-blue-300 text-xs mt-1">{aiSuggestion.reasoning}</p>
                  {aiSuggestion.viralPotential > 0.7 && (
                    <div className="mt-2 flex items-center gap-1">
                      <span className="text-xs">🚀</span>
                      <span className="text-blue-200 text-xs">High viral potential - perfect for social sharing!</span>
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <h3 className="text-white font-medium">Challenge Preview</h3>
                {selectedTemplate ? (
                  <div className="p-3 bg-purple-500/20 rounded-lg border border-purple-400/30">
                    <p className="text-purple-100 text-sm">
                      {CHALLENGE_TEMPLATES.find(t => t.id === selectedTemplate)?.description}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-500/20 rounded-lg border border-gray-400/30">
                    <p className="text-gray-100 text-sm">
                      Custom punctuality challenge - arrive at your destination on time according to your cultural expectations.
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={handleCreateCommitment}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 text-lg rounded-xl"
                disabled={isCreating || !destination}
              >
                {isCreating ? "Creating..." : "🚀 Create Challenge"}
              </Button>

              <div className="text-center">
                <p className="text-white/60 text-xs">
                  Challenge will be shareable with friends for betting
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
