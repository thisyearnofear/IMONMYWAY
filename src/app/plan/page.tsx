"use client";

import { useState, useCallback } from "react";
import { PremiumNavigation } from "@/components/layout/PremiumNavigation";
import { ToastContainer } from "@/components/ui/Toast";
import { Button } from "@/components/ui/PremiumButton";
import { Input } from "@/components/ui/Input";
import { SpeedPicker } from "@/components/ui/SpeedPicker";
import { MobilePlanControls } from "@/components/mobile/MobilePlanControls";
import {
  MapSkeleton,
  RouteCardSkeleton,
} from "@/components/ui/LoadingSkeleton";
import { useUIStore } from "@/stores/uiStore";
import { useLocationStore } from "@/stores/locationStore";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { calculateDistance, calculateETA } from "@/lib/distance";
import { formatTime, formatDistance } from "@/lib/utils";
import { getConfidenceScore } from "@/lib/speed";
import { MapContainer } from "@/components/map/MapContainer";
import ParallaxSection from "@/components/three/ParallaxSection";
import WebGLParticleSystem from "@/components/three/ParticleSystem";
import { motion } from "framer-motion";

// We'll use OpenStreetMap's Nominatim service for geocoding
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

export default function PlanPage() {
  const [startAddress, setStartAddress] = useState("");
  const [endAddress, setEndAddress] = useState("");
  const [planData, setPlanData] = useState<{
    distance: number;
    eta: number;
    confidence: number;
    startCoords: [number, number];
    endCoords: [number, number];
  } | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);

  const { addToast } = useUIStore();
  const { selectedPace } = useLocationStore();
  const deviceInfo = useDeviceDetection();

  const planRoute = useCallback(async () => {
    if (!startAddress.trim() || !endAddress.trim()) {
      addToast({
        message: "Please enter both start and end addresses",
        type: "warning",
      });
      return;
    }

    setIsPlanning(true);

    try {
      const startCoords = await geocodeAddress(startAddress);
      const endCoords = await geocodeAddress(endAddress);

      if (!startCoords || !endCoords) {
        addToast({
          message: "Could not find one or more addresses",
          type: "error",
        });
        return;
      }

      const distance = calculateDistance(
        startCoords[0],
        startCoords[1],
        endCoords[0],
        endCoords[1]
      );
      const eta = calculateETA(distance, selectedPace);
      const confidence = getConfidenceScore(selectedPace, distance);

      setPlanData({
        distance,
        eta,
        confidence,
        startCoords,
        endCoords,
      });

      addToast({ message: "Route planned successfully!", type: "success" });
    } catch (error) {
      addToast({ message: "Failed to plan route", type: "error" });
    } finally {
      setIsPlanning(false);
    }
  }, [startAddress, endAddress, selectedPace, addToast]);

  const shareRoute = () => {
    if (!planData) return;

    const shareText = `Check out my planned run: ${formatDistance(
      planData.distance
    )} in ${formatTime(planData.eta)} at ${selectedPace} min/mile pace.`;

    if (typeof window !== "undefined" && navigator.share) {
      navigator.share({
        title: "My Planned Run",
        text: shareText,
        url: window.location.href,
      });
    } else if (typeof window !== "undefined") {
      navigator.clipboard.writeText(shareText);
      addToast({
        message: "Route details copied to clipboard",
        type: "success",
      });
    }
  };

  // Mobile-first rendering with modern design
  if (deviceInfo.isMobile) {
    return (
      <div className="min-h-screen relative">
        {/* Enhanced 3D Background with WebGL Particles */}
        <WebGLParticleSystem count={1500} color="#60a5fa" size={0.02} />

        {/* Subtle gradient overlays for depth */}
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/50 via-purple-950/30 to-pink-950/15" />
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(59,130,246,0.1),transparent_70%)]" />

        {/* Full-screen map on mobile */}
        <div className="fixed inset-0 z-0">
          <MapContainer
            className="h-full"
            center={planData ? planData.startCoords : [40.7128, -74.006]}
            onMapReady={(map) => {
              if (planData && typeof window !== "undefined") {
                import("leaflet").then((L) => {
                  const startMarker = L.marker(planData.startCoords).addTo(map);
                  const endMarker = L.marker(planData.endCoords, {
                    icon: L.icon({
                      iconUrl:
                        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
                      shadowUrl:
                        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [1, -34],
                      shadowSize: [41, 41],
                    }),
                  }).addTo(map);

                  L.polyline([planData.startCoords, planData.endCoords], {
                    color: "blue",
                    weight: 3,
                    opacity: 0.7,
                  }).addTo(map);

                  const group = L.featureGroup([startMarker, endMarker]);
                  map.fitBounds(group.getBounds().pad(0.1));
                });
              }
            }}
          />
        </div>

        {/* Modern mobile controls overlay */}
        <div className="relative z-10">
          <MobilePlanControls
            startAddress={startAddress}
            endAddress={endAddress}
            onStartAddressChange={setStartAddress}
            onEndAddressChange={setEndAddress}
            onPlanRoute={planRoute}
            onShareRoute={shareRoute}
            planData={planData}
            isPlanning={isPlanning}
          />
        </div>

        <ToastContainer />
      </div>
    );
  }

  // Modern desktop layout
  return (
    <div className="min-h-screen relative">
      {/* Enhanced 3D Background with WebGL Particles */}
      <WebGLParticleSystem count={2000} color="#60a5fa" size={0.03} />

      {/* Subtle gradient overlays for depth */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-pink-950/10" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(59,130,246,0.08),transparent_70%)]" />

      <PremiumNavigation />

      <main className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        <ParallaxSection offset={20} className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                🗺️ Plan Your Route
              </span>
            </h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              Drop pins on the interactive map or enter addresses to plan your punctuality challenge
            </p>
          </motion.div>
        </ParallaxSection>

        {/* Modern Map Section */}
        <ParallaxSection offset={-10} className="mb-8">
          <motion.div
            className="glass-enhanced rounded-2xl overflow-hidden shadow-2xl border border-white/20"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white mb-2">
                📍 Interactive Route Planning
              </h2>
              <p className="text-white/70">
                Click on the map to set your start and end points, or use the form below
              </p>
            </div>
            {!planData ? (
              <div className="relative">
                <MapSkeleton className="h-96" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-b-2xl">
                  <div className="text-center">
                    <div className="text-5xl mb-4">🗺️</div>
                    <p className="text-white font-semibold text-lg">Plan your route on the map</p>
                    <p className="text-white/70">Enter addresses below or click directly on the map</p>
                  </div>
                </div>
              </div>
            ) : (
              <MapContainer
                className="h-96"
                center={planData ? planData.startCoords : [40.7128, -74.006]}
                onMapReady={(map) => {
                  if (planData && typeof window !== "undefined") {
                    import("leaflet").then((L) => {
                      // Add markers for start and end
                      const startMarker = L.marker(planData.startCoords).addTo(
                        map
                      );
                      const endMarker = L.marker(planData.endCoords, {
                        icon: L.icon({
                          iconUrl:
                            "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
                          shadowUrl:
                            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
                          iconSize: [25, 41],
                          iconAnchor: [12, 41],
                          popupAnchor: [1, -34],
                          shadowSize: [41, 41],
                        }),
                      }).addTo(map);

                      // Add line between points
                      L.polyline([planData.startCoords, planData.endCoords], {
                        color: "blue",
                        weight: 3,
                        opacity: 0.7,
                      }).addTo(map);

                      // Fit map to show both points
                      const group = L.featureGroup([startMarker, endMarker]);
                      map.fitBounds(group.getBounds().pad(0.1));
                    });
                  }
                }}
              />
            )}
          </motion.div>
        </ParallaxSection>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Modern Planning Form */}
          <ParallaxSection offset={15}>
            <motion.div
              className="glass-enhanced p-8 rounded-2xl shadow-2xl border border-white/20 h-full"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                📝 Route Details
              </h2>

              <div className="space-y-6">
                <div className="space-y-4">
                  <Input
                    label="Start Location"
                    value={startAddress}
                    onChange={(e) => setStartAddress(e.target.value)}
                    placeholder="e.g., Central Park, NYC"
                  />

                  <Input
                    label="Destination"
                    value={endAddress}
                    onChange={(e) => setEndAddress(e.target.value)}
                    placeholder="e.g., Times Square, NYC"
                  />
                </div>

                <SpeedPicker />

                <Button
                  onClick={planRoute}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
                  isLoading={isPlanning}
                  disabled={isPlanning}
                >
                  {isPlanning ? "Planning Route..." : "📍 Plan Route"}
                </Button>
              </div>

              {/* Modern Route Summary */}
              {planData && (
                <motion.div
                  className="mt-8 p-6 glass-modern rounded-xl border border-white/20"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-green-400">✅ Route Planned!</h3>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        planData.confidence >= 80
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : planData.confidence >= 65
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {planData.confidence >= 80
                        ? "High"
                        : planData.confidence >= 65
                        ? "Med"
                        : "Low"} {planData.confidence}% confident
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="text-center p-4 glass-enhanced rounded-lg">
                      <div className="text-2xl font-bold text-blue-400 mb-1">
                        {formatDistance(planData.distance)}
                      </div>
                      <div className="text-sm text-white/60">Distance</div>
                    </div>
                    <div className="text-center p-4 glass-enhanced rounded-lg">
                      <div className="text-2xl font-bold text-purple-400 mb-1">
                        {formatTime(planData.eta)}
                      </div>
                      <div className="text-sm text-white/60">Estimated Time</div>
                    </div>
                  </div>
                  <div className="text-center mb-4">
                    <div className="text-white/80">
                      <strong>Pace:</strong> {selectedPace} min/mile
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareRoute}
                    className="w-full border-white/30 text-white hover:bg-white/10"
                  >
                    📤 Share Route
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </ParallaxSection>

          {/* Modern Tips and Help */}
          <ParallaxSection offset={-15}>
            <motion.div
              className="glass-enhanced p-8 rounded-2xl shadow-2xl border border-white/20 h-full"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                💡 Planning Tips
              </h2>
              <div className="space-y-5">
                <motion.div
                  className="flex items-start gap-4 p-4 glass-modern rounded-lg border border-white/10"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="text-2xl text-blue-400 mt-1">🎯</span>
                  <div>
                    <strong className="text-white font-semibold">Be Specific:</strong>
                    <p className="text-white/70 text-sm mt-1">Use landmarks or full addresses for accurate planning</p>
                  </div>
                </motion.div>
                <motion.div
                  className="flex items-start gap-4 p-4 glass-modern rounded-lg border border-white/10"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="text-2xl text-green-400 mt-1">⚡</span>
                  <div>
                    <strong className="text-white font-semibold">Realistic Pace:</strong>
                    <p className="text-white/70 text-sm mt-1">Consider terrain and weather conditions</p>
                  </div>
                </motion.div>
                <motion.div
                  className="flex items-start gap-4 p-4 glass-modern rounded-lg border border-white/10"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="text-2xl text-purple-400 mt-1">🛡️</span>
                  <div>
                    <strong className="text-white font-semibold">Safety First:</strong>
                    <p className="text-white/70 text-sm mt-1">Share your route with friends for safety</p>
                  </div>
                </motion.div>
                <motion.div
                  className="flex items-start gap-4 p-4 glass-modern rounded-lg border border-white/10"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="text-2xl text-pink-400 mt-1">🎁</span>
                  <div>
                    <strong className="text-white font-semibold">Earn Rewards:</strong>
                    <p className="text-white/70 text-sm mt-1">Complete challenges to earn 2.5x your stake</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </ParallaxSection>
        </div>

        {/* Modern Additional Tips */}
        <ParallaxSection offset={-25} className="mt-12">
          <motion.div
            className="glass-enhanced p-8 rounded-2xl shadow-2xl border border-white/20 text-center"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-white mb-8">
              🚀 Advanced Planning Features
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <motion.div
                className="p-6 glass-modern rounded-xl border border-white/10"
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <h3 className="font-bold text-blue-400 mb-3 text-lg">
                  🎯 GPS Tracking
                </h3>
                <p className="text-white/80 leading-relaxed">
                  Real-time location verification ensures punctuality with blockchain timestamping
                </p>
              </motion.div>
              <motion.div
                className="p-6 glass-modern rounded-xl border border-white/10"
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
              >
                <h3 className="font-bold text-purple-400 mb-3 text-lg">
                  💰 Smart Rewards
                </h3>
                <p className="text-white/80 leading-relaxed">
                  Earn 2.5x multiplier bonuses when you complete challenges successfully
                </p>
              </motion.div>
              <motion.div
                className="p-6 glass-modern rounded-xl border border-white/10"
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
              >
                <h3 className="font-bold text-pink-400 mb-3 text-lg">
                  🌐 Decentralized
                </h3>
                <p className="text-white/80 leading-relaxed">
                  Built on Somnia Network for trustless, transparent punctuality challenges
                </p>
              </motion.div>
            </div>
          </motion.div>
        </ParallaxSection>
      </main>

      <ToastContainer />
    </div>
  );
}
