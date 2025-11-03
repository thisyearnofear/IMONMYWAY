"use client";

import { useState, useCallback, useEffect } from "react";
import { PremiumNavigation } from "@/components/layout/PremiumNavigation";
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
import { getConfidenceScore } from "@/lib/speed";
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
  } | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [gpsEnabled, setGpsEnabled] = useState(false);

  const { addToast } = useUIStore();
  const { selectedPace } = useLocationStore();
  const { isMobile, triggerHaptic, supportsGeolocation } = useMobileExperience();

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

      setPlanData({
        distance,
        eta,
        confidence,
        startCoords,
        endCoords,
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
            onMapReady={async (map) => {
              // Add current location marker if available
              if (currentLocation && typeof window !== "undefined") {
                try {
                  const L = await import("leaflet");
                  const currentLocationMarker = L.default.marker([currentLocation.lat, currentLocation.lng], {
                    icon: L.default.divIcon({
                      className: 'current-location-marker',
                      html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>',
                      iconSize: [16, 16],
                      iconAnchor: [8, 8]
                    })
                  }).bindPopup(`Current Location (±${currentLocation.accuracy}m)`);

                  currentLocationMarker.addTo(map);
                } catch (error) {
                  console.error("Error adding current location marker:", error);
                }
              }

              // Add route markers if available
              if (planData && typeof window !== "undefined") {
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
            className="rounded-2xl overflow-hidden shadow-2xl border border-gold/20 bg-gradient-to-br from-gold/10 to-violet/10"
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
                onMapReady={async (map) => {
                  if (planData && typeof window !== "undefined") {
                    try {
                      const L = await import("leaflet");
                      // Add markers for start and end
                      const startMarker = await createStartMarker(planData.startCoords);
                      const endMarker = await createDestinationMarker(planData.endCoords);

                      // Add line between points
                      const polyline = await createPolyline([planData.startCoords, planData.endCoords], true);

                      startMarker.addTo(map);
                      endMarker.addTo(map);
                      polyline.addTo(map);

                      // Fit map to show both points
                      const group = L.default.featureGroup([startMarker, endMarker, polyline]);
                      fitBoundsToMarkers(map, group);
                    } catch (error) {
                      console.error("Error adding markers to map:", error);
                    }
                  }
                }}
              />
            )}
          </motion.div>
        </ParallaxSection>

        {/* Desktop Controls - Full Featured */}
        <div className="max-w-4xl mx-auto mb-8 space-y-6">
          {/* Address Inputs */}
          <div className="grid md:grid-cols-3 gap-4">
            <Input
              label="Start Location"
              value={startAddress}
              onChange={(e) => setStartAddress(e.target.value)}
              placeholder="From..."
              className="md:col-span-1"
              variant="dark"
            />
            <Input
              label="Destination"
              value={endAddress}
              onChange={(e) => setEndAddress(e.target.value)}
              placeholder="To..."
              className="md:col-span-1"
              variant="dark"
            />
            <SpeedPicker className="md:col-span-1" />
          </div>

          <Button
            onClick={planRoute}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 text-xl rounded-xl shadow-2xl hover:from-blue-700 hover:to-purple-700"
            isLoading={isPlanning}
            disabled={isPlanning || !startAddress.trim() || !endAddress.trim()}
          >
            {isPlanning ? "Planning Route..." : "📍 Calculate Route"}
          </Button>
        </div>

        {/* Results Display */}
        {planData && (
          <motion.div
            className="max-w-4xl mx-auto mb-8 p-6 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Route Summary</h3>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-400 mb-1">
                    {formatDistance(planData.distance)}
                  </div>
                  <div className="text-white/70 text-sm">Distance</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-400 mb-1">
                    {formatTime(planData.eta)}
                  </div>
                  <div className="text-white/70 text-sm">Estimated Time</div>
                </div>
                <div>
                  <div className={`text-3xl font-bold mb-1 ${planData.confidence >= 80 ? 'text-green-400' :
                    planData.confidence >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                    {planData.confidence}%
                  </div>
                  <div className="text-white/70 text-sm">Confidence</div>
                </div>
              </div>
              <div className="flex space-x-4 mt-6">
                <Button
                  onClick={shareRoute}
                  variant="outline"
                  className="flex-1 border-white/30 text-white py-3"
                >
                  📤 Share Route
                </Button>
                <Button
                  className="flex-1 bg-green-600 text-white py-3 hover:bg-green-700"
                  onClick={() => window.location.href = '/share'}
                >
                  🚀 Start Challenge
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