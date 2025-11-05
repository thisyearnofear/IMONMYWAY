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
import { useNavigationContext } from "@/hooks/useNavigationContext";
import { DelightfulEmptyState, EmptyStatePresets } from "@/components/ui/DelightfulEmptyState";
import { personalityEngine, getWelcomeMessage, getSuccessMessage } from "@/lib/personality-engine";
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

// Smart address suggestions with debouncing
const getAddressSuggestions = async (
  query: string,
  limit: number = 5
): Promise<string[]> => {
  if (query.length < 3) return [];
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=${limit}&addressdetails=1`
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.map((item: any) => item.display_name);
  } catch (error) {
    console.error("Suggestions error:", error);
    return [];
  }
};

// Debounced address input handler
const useDebounce = (callback: Function, delay: number) => {
  const timeoutRef = useCallback((fn: Function, ms: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), ms);
    };
  }, []);
  
  return timeoutRef(callback, delay);
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
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<{
    start: string[];
    end: string[];
  }>({ start: [], end: [] });
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
  const { 
    navigateWithContext, 
    markStepCompleted, 
    suggestedNextAction,
    preserveState,
    getPreservedState 
  } = useNavigationContext();

  // Smart address handling with debounced suggestions
  const debouncedGetSuggestions = useDebounce(async (query: string, field: 'start' | 'end') => {
    const suggestions = await getAddressSuggestions(query);
    setAddressSuggestions(prev => ({
      ...prev,
      [field]: suggestions
    }));
  }, 300);

  // Real-time preview when both addresses are available
  const debouncedPreview = useDebounce(async () => {
    if (startAddress.length > 3 && endAddress.length > 3 && !isPlanning) {
      setIsPreviewMode(true);
      try {
        const startCoords = await geocodeAddress(startAddress);
        const endCoords = await geocodeAddress(endAddress);
        
        if (startCoords && endCoords) {
          const distance = calculateDistance(
            startCoords[0], startCoords[1], endCoords[0], endCoords[1]
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
          triggerHaptic('light');
        }
      } catch (error) {
        console.error('Preview error:', error);
      } finally {
        setIsPreviewMode(false);
      }
    }
  }, 800);

  // Enhanced address change handlers
  const handleStartAddressChange = (value: string) => {
    setStartAddress(value);
    if (value.length > 2) {
      debouncedGetSuggestions(value, 'start');
    } else {
      setAddressSuggestions(prev => ({ ...prev, start: [] }));
    }
    debouncedPreview();
  };

  const handleEndAddressChange = (value: string) => {
    setEndAddress(value);
    if (value.length > 2) {
      debouncedGetSuggestions(value, 'end');
    } else {
      setAddressSuggestions(prev => ({ ...prev, end: [] }));
    }
    debouncedPreview();
  };

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
        message: `📍 Location found with ${Math.round(position.accuracy)}m accuracy`,
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

  // Use current location for start address
  const useCurrentLocationAsStart = useCallback(async () => {
    if (currentLocation) {
      setStartAddress("📍 Current Location");
      triggerHaptic('success');
      addToast({
        message: "🎯 Using your current location as start point",
        type: "success",
      });
      debouncedPreview();
    } else {
      await getCurrentLocation();
      if (currentLocation) {
        setStartAddress("📍 Current Location");
        triggerHaptic('success');
      }
    }
  }, [currentLocation, getCurrentLocation, triggerHaptic, addToast, debouncedPreview]);

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
      
      // Mark planning step as completed
      markStepCompleted('route-planned');
      
      // Preserve route data for next steps
      preserveState('plannedRoute', {
        startAddress,
        endAddress,
        distance,
        eta,
        confidence,
        selectedPace
      });
      
      // Personality-driven success message
      const personalizedMessage = personalityEngine.getMessage('celebration', undefined, { type: 'route_planned' });
      addToast({ 
        message: personalizedMessage, 
        type: "achievement",
        duration: 4000
      });
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
            <p className="text-white/70 text-base max-w-2xl mx-auto mb-3">
              Enter addresses or click on the map to plan your punctuality challenge
            </p>
            {/* Personality-driven welcome message */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="inline-block px-4 py-2 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full border border-violet-500/30"
            >
              <p className="text-violet-200 text-sm font-medium">
                {getWelcomeMessage()}
              </p>
            </motion.div>
          </motion.div>
        </ParallaxSection>

        {/* Hero Map Section - Full Width */}
        <motion.div
          className="mb-6 rounded-xl overflow-hidden shadow-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-bold text-white mb-1">
              📍 Interactive Map
            </h2>
            <p className="text-white/60 text-sm">
              Click to set points or use the controls below
            </p>
          </div>
          <div className="relative">
            <MapContainer
              className="h-[60vh] min-h-96"
              center={
                planData ? planData.startCoords :
                  currentLocation ? [currentLocation.lat, currentLocation.lng] :
                    [40.7128, -74.006]
              }
              onMapReady={handleMapReady}
            />
            {!planData && !isPreviewMode && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                <DelightfulEmptyState
                  {...EmptyStatePresets.noRoute(
                    () => {
                      // Focus on first input when user wants to plan
                      const startInput = document.querySelector('input[placeholder="From..."]') as HTMLInputElement;
                      startInput?.focus();
                      addToast({
                        message: getWelcomeMessage(),
                        type: "info",
                        duration: 3000
                      });
                    },
                    () => navigateWithContext('/challenges', { from: 'plan-page', action: 'browse-templates' })
                  )}
                  size="sm"
                  showAnimation={true}
                />
              </div>
            )}
            
            {/* Preview Mode Indicator */}
            {isPreviewMode && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                <div className="text-center">
                  <div className="animate-pulse text-3xl mb-2">🔍</div>
                  <p className="text-white text-sm font-medium">Previewing route...</p>
                </div>
              </div>
            )}
            
            {/* Route Confidence Indicator */}
            {planData && (
              <div className="absolute top-4 right-4 z-10">
                <div className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${
                  planData.confidence >= 80 
                    ? 'bg-green-500/20 border-green-500/50 text-green-200' 
                    : planData.confidence >= 60 
                    ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200' 
                    : 'bg-red-500/20 border-red-500/50 text-red-200'
                }`}>
                  {planData.confidence}% confidence
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Compact Controls Below Map */}
        <motion.div
          className="bg-white/5 rounded-xl p-6 border border-white/10 backdrop-blur-sm mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Enhanced Address Inputs with Autocomplete */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Start Location with Current Location Button */}
            <div className="relative">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    label="Start Location"
                    value={startAddress}
                    onChange={(e) => handleStartAddressChange(e.target.value)}
                    placeholder="From..."
                    variant="dark"
                  />
                  {/* Start Address Suggestions */}
                  {addressSuggestions.start.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-black/90 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
                      {addressSuggestions.start.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setStartAddress(suggestion);
                            setAddressSuggestions(prev => ({ ...prev, start: [] }));
                            triggerHaptic('light');
                            debouncedPreview();
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-white/90 hover:bg-white/10 transition-colors"
                        >
                          📍 {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={useCurrentLocationAsStart}
                  className="mt-6 px-3 border border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                  title="Use current location"
                >
                  📍
                </Button>
              </div>
            </div>

            {/* Destination Input */}
            <div className="relative">
              <Input
                label="Destination"
                value={endAddress}
                onChange={(e) => handleEndAddressChange(e.target.value)}
                placeholder="To..."
                variant="dark"
              />
              {/* End Address Suggestions */}
              {addressSuggestions.end.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-black/90 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
                  {addressSuggestions.end.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setEndAddress(suggestion);
                        setAddressSuggestions(prev => ({ ...prev, end: [] }));
                        triggerHaptic('light');
                        debouncedPreview();
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-white/90 hover:bg-white/10 transition-colors"
                    >
                      🎯 {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Speed Selection - Horizontal Pills */}
          <div className="mb-6">
            <h3 className="text-white font-medium mb-3">How fast will you move?</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {SPEED_PRESETS.slice(0, 6).map((preset) => (
                <Button
                  key={preset.id}
                  variant={currentPreset?.id === preset.id ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => handlePresetSelect(preset.pace)}
                  className="flex items-center gap-2 px-4 py-2"
                >
                  <span>{preset.icon}</span>
                  <span className="font-medium">{preset.label}</span>
                  <span className="text-xs opacity-70">{preset.pace} min/mile</span>
                </Button>
              ))}
              <Button
                variant={!currentPreset ? "primary" : "ghost"}
                size="sm"
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="flex items-center gap-2 px-4 py-2"
              >
                <span>⚙️</span>
                <span className="font-medium">Custom</span>
                {!currentPreset && <span className="text-xs opacity-70">{selectedPace} min/mile</span>}
              </Button>
            </div>

            {/* Custom Speed Input */}
            {showCustomInput && (
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Input
                    type="number"
                    value={customPace}
                    onChange={(e) => setCustomPace(e.target.value)}
                    placeholder="Minutes per mile"
                    step="0.1"
                    min="1"
                    max="30"
                    label="Custom pace"
                  />
                </div>
                <Button size="sm" onClick={handleCustomSubmit} className="px-4">
                  Apply
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowCustomInput(false)}
                  className="px-4"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Enhanced Calculate Button with Smart Messaging */}
          <div className="space-y-3">
            {/* Real-time preview feedback */}
            {planData && !isPlanning && (
              <div className="text-center p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="text-green-400 text-sm font-medium mb-1">
                  ✨ Live Preview Ready!
                </div>
                <div className="text-white/80 text-xs">
                  {formatDistance(planData.distance)} • {formatTime(planData.eta)} • {planData.confidence}% confidence
                </div>
              </div>
            )}
            
            <Button
              onClick={planRoute}
              className={`w-full font-bold py-4 rounded-xl shadow-xl text-lg transition-all duration-300 ${
                planData 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
              }`}
              isLoading={isPlanning}
              disabled={isPlanning || !startAddress.trim() || !endAddress.trim()}
            >
              {isPlanning ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin text-lg">⚡</div>
                  Calculating optimal route...
                </span>
              ) : planData ? (
                "🚀 Finalize & Start Challenge"
              ) : (
                "📍 Calculate Route"
              )}
            </Button>
            
            {/* Contextual help text */}
            <div className="text-center text-xs text-white/60">
              {!startAddress || !endAddress ? (
                "💡 Enter both locations to see live preview"
              ) : isPreviewMode ? (
                "🔄 Updating preview..."
              ) : planData ? (
                "Ready to create your punctuality challenge!"
              ) : (
                "Real-time preview available as you type"
              )}
            </div>
          </div>
        </motion.div>

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
                  onClick={() => {
                    markStepCompleted('route-shared');
                    navigateWithContext('/create', { 
                      from: 'plan-results', 
                      hasRoute: true,
                      confidence: planData.confidence 
                    });
                  }}
                >
                  🚀 Start Challenge
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-white/30 text-white py-2"
                  onClick={() => navigateWithContext('/challenges', { 
                    from: 'plan-results', 
                    action: 'browse-alternatives' 
                  })}
                >
                  🎯 Browse More
                </Button>
              </div>
              
              {/* Smart Navigation Suggestion */}
              {suggestedNextAction && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-violet-500/10 border border-violet-500/30 rounded-lg text-center"
                >
                  <p className="text-violet-200 text-sm mb-2">
                    💡 {suggestedNextAction.reason}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigateWithContext(suggestedNextAction.path)}
                    className="text-violet-300 hover:text-white border-violet-500/50"
                  >
                    {suggestedNextAction.icon} {suggestedNextAction.label}
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        <ToastContainer />
      </main>
    </div>
  );
}