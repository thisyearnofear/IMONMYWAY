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

  // Mobile-first rendering
  if (deviceInfo.isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Full-screen map on mobile */}
        <div className="fixed inset-0">
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

        {/* Mobile controls overlay */}
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

        <ToastContainer />
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="min-h-screen bg-gray-50">
      <PremiumNavigation />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Plan Your Run
          </h1>
          <p className="text-gray-600">
            Enter start and end locations to calculate distance and estimated
            time
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Planning Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Route Details
            </h2>

            <div className="space-y-6">
              <div className="space-y-4">
                <Input
                  label="Start Address"
                  value={startAddress}
                  onChange={(e) => setStartAddress(e.target.value)}
                  placeholder="e.g., Central Park, NYC"
                />

                <Input
                  label="End Address"
                  value={endAddress}
                  onChange={(e) => setEndAddress(e.target.value)}
                  placeholder="e.g., Times Square, NYC"
                />
              </div>

              <SpeedPicker />

              <Button
                onClick={planRoute}
                className="w-full"
                isLoading={isPlanning}
                disabled={isPlanning}
              >
                {isPlanning ? "Planning Route..." : "Plan Route"}
              </Button>
            </div>

            {/* Route Summary */}
            {planData && (
              <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-blue-900">Route Summary</h3>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      planData.confidence >= 80
                        ? "bg-green-100 text-green-700"
                        : planData.confidence >= 65
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {planData.confidence >= 80
                      ? "High"
                      : planData.confidence >= 65
                      ? "Med"
                      : "Low"}{" "}
                    {planData.confidence}% confident
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {formatDistance(planData.distance)}
                    </div>
                    <div className="text-xs text-gray-600">Distance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">
                      {formatTime(planData.eta)}
                    </div>
                    <div className="text-xs text-gray-600">Estimated Time</div>
                  </div>
                </div>
                <div className="text-center mb-3">
                  <div className="text-sm text-gray-600">
                    <strong>Pace:</strong> {selectedPace} min/mile
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareRoute}
                  className="w-full"
                >
                  Share Route
                </Button>
              </div>
            )}
          </div>

          {/* Map with loading state */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {!planData ? (
              <MapSkeleton className="h-96" />
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
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Planning Tips
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-900 mb-1">
                Accurate Addresses
              </h3>
              <p>
                Use specific landmarks or full addresses for better route
                planning
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Realistic Pace</h3>
              <p>Consider terrain and weather when setting your target pace</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">
                Share Your Plan
              </h3>
              <p>
                Let others know your route and expected arrival time for safety
              </p>
            </div>
          </div>
        </div>
      </main>

      <ToastContainer />
    </div>
  );
}
