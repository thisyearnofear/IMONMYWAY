"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer } from "@/components/map/MapContainer";
import { Button } from "@/components/ui/PremiumButton";
import { createStartMarker, createDestinationMarker, createPolyline, fitBoundsToMarkers } from "@/lib/map-utils";
import { formatTime, formatDistance } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useLocationStore } from "@/stores/locationStore";

interface JourneyTrackerProps {
  commitmentId: string;
  startLocation: [number, number];
  endLocation: [number, number];
  currentLocation?: [number, number];
  progress: number;
  timeRemaining?: number;
  distanceRemaining?: number;
  onProgressUpdate?: (progress: number) => void;
  showMilestones?: boolean;
  enableSharing?: boolean;
  enableSocialFeatures?: boolean;
  onDestinationSet?: (location: [number, number]) => void;
  onLocationUpdate?: (location: [number, number]) => void;
}

export function InteractiveJourneyTracker({
  commitmentId,
  startLocation,
  endLocation,
  currentLocation,
  progress = 0,
  timeRemaining,
  distanceRemaining,
  onProgressUpdate,
  showMilestones = true,
  enableSharing = true,
  enableSocialFeatures = true,
  onDestinationSet,
  onLocationUpdate
}: JourneyTrackerProps) {
  const { setCurrentLocation } = useLocationStore();
  const [isFollowing, setIsFollowing] = useState(true);
  const [showProgressDetail, setShowProgressDetail] = useState(false);
  const [milestoneProgress, setMilestoneProgress] = useState<number[]>([0.25, 0.5, 0.75, 1.0]);
  const [completedMilestones, setCompletedMilestones] = useState<boolean[]>([false, false, false, false]);

  // Calculate milestone completion
  useEffect(() => {
    const newCompleted = milestoneProgress.map(milestone => progress >= milestone);
    setCompletedMilestones(newCompleted);
  }, [progress, milestoneProgress]);

  // Update current location in store
  useEffect(() => {
    if (currentLocation) {
      setCurrentLocation({
        latitude: currentLocation[0],
        longitude: currentLocation[1],
        accuracy: 10 // Default accuracy
      });
    }
  }, [currentLocation, setCurrentLocation]);

  // Handle map click for destination setting
  const handleMapClick = useCallback((latlng: [number, number]) => {
    if (onDestinationSet) {
      onDestinationSet(latlng);
    }
  }, [onDestinationSet]);

  // Calculate distance between two points
  const calculateDistance = (start: [number, number], end: [number, number]) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (end[0] - start[0]) * Math.PI / 180;
    const dLng = (end[1] - start[1]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(start[0] * Math.PI / 180) * Math.cos(end[0] * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  };

  // Calculate remaining distance
  const getRemainingDistance = () => {
    if (!currentLocation) return distanceRemaining || 0;
    return calculateDistance(currentLocation, endLocation) * (1 - progress);
  };

  // Calculate progress percentage
  const getProgressPercentage = () => Math.round(progress * 100);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-indigo-950/30 to-purple-950/30 rounded-xl overflow-hidden border border-white/20 shadow-2xl">
      {/* Progress Overlay */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/80 text-sm font-medium">Progress</span>
            <span className="text-white font-bold text-lg">{getProgressPercentage()}%</span>
          </div>

          <div className="w-full bg-gray-700 rounded-full h-3 mb-3 relative overflow-hidden">
            <motion.div
              className="h-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
            {showMilestones && milestoneProgress.map((milestone, index) => (
              <motion.div
                key={index}
                className={cn(
                  "absolute top-0 w-1 h-4 -ml-0.5 bg-white/50 rounded-full",
                  completedMilestones[index] ? "bg-green-400" : ""
                )}
                style={{ left: `${milestone * 100}%` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <AnimatePresence>
                  {completedMilestones[index] && (
                    <motion.div
                      className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-green-400 font-bold"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      ✓
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-between text-xs text-white/70">
            <span>Start</span>
            <span>Destination</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="absolute inset-0">
        <MapContainer
          className="h-full w-full rounded-xl"
          center={isFollowing && currentLocation ? currentLocation : startLocation}
          onClick={onDestinationSet ? handleMapClick : undefined}
          onMapReady={async (map) => {
            // Add start marker
            const startMarker = await createStartMarker(startLocation);
            startMarker.addTo(map);

            // Add destination marker
            const endMarker = await createDestinationMarker(endLocation);
            endMarker.addTo(map);

            // Add current location marker if available
            if (currentLocation) {
              const L = require("leaflet");
              const currentLocationMarker = L.marker(currentLocation, {
                icon: L.divIcon({
                  className: 'current-location-marker',
                  html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>',
                  iconSize: [16, 16],
                  iconAnchor: [8, 8]
                })
              }).bindPopup(`Current Location`);
              currentLocationMarker.addTo(map);
            }

            // Draw route if progress > 0
            if (progress > 0) {
              const progressEndLat = startLocation[0] + (endLocation[0] - startLocation[0]) * progress;
              const progressEndLng = startLocation[1] + (endLocation[1] - startLocation[1]) * progress;

              const routePoints: [number, number][] = [startLocation, [progressEndLat, progressEndLng]];
              if (currentLocation) {
                routePoints.unshift(currentLocation);
              }

              const polyline = await createPolyline(routePoints, true);
              polyline.addTo(map);
            }

            // Fit bounds to include all markers
            const L = require("leaflet");
            const group = L.featureGroup([startMarker, endMarker]);
            if (currentLocation) {
              const currentLocationGroup = L.marker(currentLocation);
              group.addLayer(currentLocationGroup);
            }
            fitBoundsToMarkers(map, group);
          }}
        />
      </div>

      {/* Progress Details Panel */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 backdrop-blur-sm"
        animate={{ height: showProgressDetail ? "auto" : "80px" }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-white font-bold text-lg">
              {getProgressPercentage()}% Complete
            </h3>
            <p className="text-white/70 text-sm">
              {currentLocation ? "Tracking in progress" : "Waiting for location"}
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowProgressDetail(!showProgressDetail)}
            className="text-white/70"
          >
            {showProgressDetail ? "Hide" : "Details"} ▼
          </Button>
        </div>

        <AnimatePresence>
          {showProgressDetail && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 space-y-2"
            >
              <div className="grid grid-cols-2 gap-4">
                {timeRemaining !== undefined && (
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="text-white/60 text-xs">Time Remaining</div>
                    <div className="text-white font-bold">{formatTime(timeRemaining)}</div>
                  </div>
                )}

                <div className="bg-white/10 rounded-lg p-3">
                  <div className="text-white/60 text-xs">Distance Left</div>
                  <div className="text-white font-bold">
                    {formatDistance(getRemainingDistance())}
                  </div>
                </div>
              </div>

              {enableSocialFeatures && (
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    👥 Bet on Success
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    🚫 Bet Against
                  </Button>
                </div>
              )}

              {enableSharing && (
                <Button variant="glass" size="sm" className="w-full">
                  📤 Share this Journey
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Floating Action Button for Following */}
      <div className="absolute bottom-4 right-4 z-10">
        <Button
          variant="glass"
          size="sm"
          onClick={() => setIsFollowing(!isFollowing)}
          className="w-12 h-12 rounded-full flex items-center justify-center p-0"
          pulse={isFollowing}
        >
          {isFollowing ? "📍" : "🎯"}
        </Button>
      </div>

      {/* Milestone Celebration Effects */}
      <AnimatePresence>
        {completedMilestones.some(m => m) && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {completedMilestones.map((completed, index) => completed && (
              <motion.div
                key={index}
                className="absolute text-4xl"
                style={{
                  top: `${20 + index * 15}%`,
                  left: `${10 + index * 20}%`,
                }}
                initial={{ scale: 0, y: 0 }}
                animate={{
                  scale: [0, 1.5, 1],
                  y: [-50, 0],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ duration: 1.5 }}
              >
                🎉
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}