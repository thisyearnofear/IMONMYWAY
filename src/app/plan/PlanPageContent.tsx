"use client";

import { useState, useCallback, useEffect } from "react";
import { ToastContainer } from "@/components/ui/Toast";
import { Button } from "@/components/ui/PremiumButton";
import { Input } from "@/components/ui/Input";
import { SpeedPicker } from "@/components/ui/SpeedPicker";
import { MobilePlanControls } from "@/components/mobile/MobilePlanControls";
import { StatusIndicator, GPSStatusIndicator } from "@/components/ui/StatusIndicator";
import {
  MapSkeleton,
  RouteCardSkeleton,
} from "@/components/ui/LoadingSkeleton";
import { useUIStore } from "@/stores/uiStore";
import { useLocationStore } from "@/stores/locationStore";
import { useMobileExperience } from "@/hooks/useMobileExperience";
import { calculateDistance, calculateETA } from "@/lib/distance";
import { formatTime, formatDistance } from "@/lib/utils";
import { getConfidenceScore, SPEED_PRESETS, findPresetByPace } from "@/lib/speed";
// Removed: runningService - AI now uses on-chain data
import { MapContainer } from "@/components/map/MapContainer";
import ParallaxSection from "@/components/three/ParallaxSection";
import WebGLParticleSystem from "@/components/three/ParticleSystem";
import { motion } from "framer-motion";
import { createStartMarker, createDestinationMarker, createPolyline, fitBoundsToMarkers } from "@/lib/map-utils";
import { realtimeService } from "@/lib/realtime-service";

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

export default function PlanPageContent() {
  const [startAddress, setStartAddress] = useState("");
  const [endAddress, setEndAddress] = useState("");
  const [planData, setPlanData] = useState<{
    distance: number;
    eta: number;
    confidence: number;
    startCoords: [number, number];
    endCoords: [number, number];
    speedEstimate?: any;
  } | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customPace, setCustomPace] = useState("12");

  const { addToast } = useUIStore();
  const { selectedPace, setSelectedPace } = useLocationStore();
  const { isMobile, triggerHaptic, supportsGeolocation } = useMobileExperience();

  // Speed picker functions
  const currentPreset = findPresetByPace(selectedPace);

  const handlePresetSelect = (pace: number) => {
    setSelectedPace(pace);
    setShowCustomInput(false);
  };

  const handleCustomSubmit = () => {
    const pace = parseFloat(customPace);
    if (pace > 0 && pace <= 30) {
      setSelectedPace(pace);
      setShowCustomInput(false);
    }
  };

  // GPS location tracking
  useEffect(() => {
    if (supportsGeolocation) {
      getCurrentLocation();
    }
  }, [supportsGeolocation]);

  const getCurrentLocation = useCallback(async () => {
    if (!supportsGeolocation) {
      addToast({
        message: "Geolocation not supported by this browser",
        type: "error",
      });
      return;
    }

    try {
      const position = await realtimeService.getCurrentPosition();
      setCurrentLocation({
        lat: position.latitude,
        lng: position.longitude,
        accuracy: position.accuracy,
      });
      setGpsEnabled(true);
      triggerHaptic('success');

      addToast({
        message: `Location found with ${position.accuracy}m accuracy`,
        type: "success",
      });
    } catch (error) {
      console.error('GPS error:', error);
      setGpsEnabled(false);
      addToast({
        message: error instanceof Error ? error.message : "Failed to get location",
        type: "error",
      });
    }
  }, [supportsGeolocation, addToast, triggerHaptic]);

  const planRoute = useCallback(async () => {
    if (!startAddress.trim() || !endAddress.trim()) {
      addToast({
        message: "Please enter both start and end addresses",
        type: "warning",
      });
      triggerHaptic('warning');
      return;
    }

    setIsPlanning(true);
    triggerHaptic('light');

    try {
      const startCoords = await geocodeAddress(startAddress);
      const endCoords = await geocodeAddress(endAddress);

      if (!startCoords || !endCoords) {
        addToast({
          message: "Could not find one or more addresses",
          type: "error",
        });
        triggerHaptic('error');
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

      // Simplified: Use basic speed calculation instead of complex service
      let speedEstimate = null;
      if (currentLocation) {
        const walkingTime = (distance / 5) * 60; // 5 km/h walking speed
        const runningTime = (distance / 10) * 60; // 10 km/h running speed
        speedEstimate = {
          walkingTime: Math.round(walkingTime),
          runningTime: Math.round(runningTime),
          timeSaved: Math.round(walkingTime - runningTime)
        };
      }

      setPlanData({
        distance,
        eta,
        confidence,
        startCoords,
        endCoords,
        speedEstimate,
      });

      triggerHaptic('success');
      addToast({ message: "Route planned successfully!", type: "success" });
    } catch (error) {
      triggerHaptic('error');
      addToast({ message: "Failed to plan route", type: "error" });
    } finally {
      setIsPlanning(false);
    }
  }, [startAddress, endAddress, selectedPace, addToast, triggerHaptic]);

  const shareRoute = useCallback(() => {
    if (typeof window === "undefined" || !planData) return;

    const shareText = `Check out my planned run: ${formatDistance(
      planData.distance
    )} in ${formatTime(planData.eta)} at ${selectedPace} min/mile pace.`;

    if (navigator.share) {
      navigator.share({
        title: "My Planned Run",
        text: shareText,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      addToast({
        message: "Route details copied to clipboard",
        type: "success",
      });
    }
  }, [planData, selectedPace, addToast]);

  // DRY: Single map ready handler for both mobile and desktop
  const handleMapReady = useCallback(
    async (map: any) => {
      // Add current location marker if available
      if (currentLocation) {
        try {
          const L = await import("leaflet");
          const currentLocationMarker = L.default.marker([currentLocation.lat, currentLocation.lng], {
            icon: L.default.divIcon({
              className: 'current-location-marker',
              html: '<div class="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>',
              iconSize: [12, 12],
              iconAnchor: [6, 6]
            })
          }).bindPopup(`Current Location (±${currentLocation.accuracy}m)`);

          currentLocationMarker.addTo(map);
        } catch (error) {
          console.error("Error adding current location marker:", error);
        }
      }

      // Add route markers if available
      if (planData) {
        try {
          const L = await import("leaflet");
          const startMarker = await createStartMarker(planData.startCoords);
          const endMarker = await createDestinationMarker(planData.endCoords);
          const polyline = await createPolyline([planData.startCoords, planData.endCoords], true);

          startMarker.addTo(map);
          endMarker.addTo(map);
          polyline.addTo(map);

          const group = L.default.featureGroup([startMarker, endMarker, polyline]);
          fitBoundsToMarkers(map, group);
        } catch (error) {
          console.error("Error adding markers to map:", error);
        }
      }
    },
    [currentLocation, planData]
  );

  // Mobile-first rendering with enhanced GPS integration
  if (isMobile) {
    return (
      <div className="min-h-screen relative">
        {/* Enhanced 3D Background with WebGL Particles */}
        <WebGLParticleSystem count={1500} color="#60a5fa" size={0.02} />

        {/* Subtle gradient overlays for depth */}
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/50 via-purple-950/30 to-pink-950/15" />
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(59,130,246,0.1),transparent_70%)]" />

        {/* GPS Status Bar */}
        <div className="fixed top-0 left-0 right-0 z-20 bg-black/20 backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center justify-between p-4">
            <GPSStatusIndicator
              isEnabled={gpsEnabled}
              accuracy={currentLocation?.accuracy}
              className="text-white"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={getCurrentLocation}
              emoji="📍"
              className="text-white"
            >
              Refresh GPS
            </Button>
          </div>
        </div>

        {/* Full-screen map on mobile */}
        <div className="fixed inset-0 z-0">
          <MapContainer
            className="h-full"
            center={
              planData ? planData.startCoords :
                currentLocation ? [currentLocation.lat, currentLocation.lng] :
                  [40.7128, -74.006]
            }
            onMapReady={handleMapReady}
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


      <main className="relative z-10 container mx-auto px-4 pt-16 pb-6 max-w-4xl">
        <ParallaxSection offset={20} className="text-center mb-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-3xl font-bold mb-2">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                🗺️ Plan Your Route
              </span>
            </h1>
            <p className="text-white/70 text-base max-w-2xl mx-auto">
              Enter addresses or click on the map to plan your punctuality challenge
            </p>
          </motion.div>
        </ParallaxSection>

        {/* Compact Layout - Side by Side */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {/* Map Section */}
          <motion.div
            className="rounded-xl overflow-hidden shadow-xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-white mb-1">
                📍 Interactive Map
              </h2>
              <p className="text-white/60 text-sm">
                Click to set points or use form
              </p>
            </div>
            <div className="relative">
              <MapContainer
                className="h-64"
                center={
                  planData ? planData.startCoords :
                    currentLocation ? [currentLocation.lat, currentLocation.lng] :
                      [40.7128, -74.006]
                }
                onMapReady={handleMapReady}
              />
              {!planData && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                  <div className="text-center">
                    <div className="text-3xl mb-2">🗺️</div>
                    <p className="text-white text-sm">Enter addresses to see route</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Controls Section */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* Address Inputs */}
            <div className="space-y-3">
              <Input
                label="Start Location"
                value={startAddress}
                onChange={(e) => setStartAddress(e.target.value)}
                placeholder="From..."
                variant="dark"
                className="text-sm"
              />
              <Input
                label="Destination"
                value={endAddress}
                onChange={(e) => setEndAddress(e.target.value)}
                placeholder="To..."
                variant="dark"
                className="text-sm"
              />
            </div>

            {/* Compact Speed Picker */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-white font-medium mb-2 text-sm">How fast will you move?</h3>
              <p className="text-white/60 text-xs mb-3">This helps calculate arrival times</p>

              {/* Current Selection Display */}
              <div className="bg-white/10 rounded-lg p-3 mb-3 text-center">
                <div className="text-lg mb-1">{currentPreset?.icon || '⚡'}</div>
                <div className="text-white font-medium text-sm">{currentPreset?.label || 'Custom'}</div>
                <div className="text-white/70 text-xs">{selectedPace} min/mile</div>
              </div>

              {/* Speed Options Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {SPEED_PRESETS.slice(0, 6).map((preset) => (
                  <Button
                    key={preset.id}
                    variant={currentPreset?.id === preset.id ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => handlePresetSelect(preset.pace)}
                    className="text-xs h-auto py-2 px-2"
                  >
                    <div className="text-center">
                      <div className="text-sm">{preset.icon}</div>
                      <div className="text-xs font-medium">{preset.label}</div>
                      <div className="text-xs opacity-70">{preset.pace} min/mile</div>
                    </div>
                  </Button>
                ))}
              </div>

              {/* Custom Speed Toggle */}
              {!showCustomInput ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCustomInput(true)}
                  className="w-full text-xs border border-dashed border-white/30"
                >
                  ⚙️ Custom Speed
                </Button>
              ) : (
                <div className="space-y-2">
                  <Input
                    type="number"
                    value={customPace}
                    onChange={(e) => setCustomPace(e.target.value)}
                    placeholder="Minutes per mile"
                    step="0.1"
                    min="1"
                    max="30"
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCustomSubmit} className="flex-1 text-xs">
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowCustomInput(false)}
                      className="flex-1 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Calculate Button */}
            <Button
              onClick={planRoute}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-xl shadow-xl hover:from-blue-700 hover:to-purple-700"
              isLoading={isPlanning}
              disabled={isPlanning || !startAddress.trim() || !endAddress.trim()}
            >
              {isPlanning ? "Planning..." : "📍 Calculate Route"}
            </Button>
          </motion.div>
        </div>

        {/* Compact Results Display */}
        {planData && (
          <motion.div
            className="mb-4 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center">
              <h3 className="text-lg font-bold text-white mb-3">Route Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <div className="text-xl font-bold text-blue-400 mb-1">
                    {formatDistance(planData.distance)}
                  </div>
                  <div className="text-white/70 text-xs">Distance</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-purple-400 mb-1">
                    {formatTime(planData.eta)}
                  </div>
                  <div className="text-white/70 text-xs">Est. Time</div>
                </div>
                <div>
                  <div className={`text-xl font-bold mb-1 ${planData.confidence >= 80 ? 'text-green-400' :
                    planData.confidence >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                    {planData.confidence}%
                  </div>
                  <div className="text-white/70 text-xs">Confidence</div>
                </div>
              </div>

              {/* Running vs Walking Comparison */}
              {planData.speedEstimate && (
                <div className="mb-4 p-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl border border-green-400/30">
                  <h4 className="text-white font-bold mb-2">🏃‍♂️ Beat Google Maps</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-white/70">Google Maps (walking)</div>
                      <div className="text-white font-bold">{planData.speedEstimate.walkingTime} min</div>
                    </div>
                    <div>
                      <div className="text-white/70">Your running estimate</div>
                      <div className="text-green-400 font-bold">{planData.speedEstimate.runningTime} min</div>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <div className="text-green-300 font-bold">
                      Save {planData.speedEstimate.timeSaved} minutes by running!
                    </div>
                    <div className="text-white/60 text-xs">
                      Conditions: {planData.speedEstimate.conditions}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex space-x-3">
                <Button
                  onClick={shareRoute}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-white/30 text-white py-2"
                >
                  📤 Share
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 text-white py-2 hover:bg-green-700"
                  onClick={() => window.location.href = '/share'}
                >
                  🚀 Start Challenge
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-white/30 text-white py-2"
                  onClick={() => window.location.href = '/challenges'}
                >
                  🎯 Challenge Templates
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        <ToastContainer />
      </main>
    </div>
  );
}