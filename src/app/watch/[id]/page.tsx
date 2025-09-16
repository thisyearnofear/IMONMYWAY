"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PremiumNavigation } from "@/components/layout/PremiumNavigation";
import { ToastContainer } from "@/components/ui/Toast";
import { UnifiedBettingInterface } from "@/components/betting/UnifiedBettingInterface";
import { ReputationBadge } from "@/components/reputation/ReputationBadge";
import { useLocationStore } from "@/stores/locationStore";
import { useUIStore } from "@/stores/uiStore";
import { useBettingStore } from "@/stores/bettingStore";
import { useWallet } from "@/hooks/useWallet";
import { useBetting } from "@/hooks/useBetting";
import { socketManager } from "@/lib/socket";
import { formatTime } from "@/lib/utils";
import { MapContainer } from "@/components/map/MapContainer";
import type { ActiveBet } from "@/stores/bettingStore";

export default function WatchPage() {
  const params = useParams();
  const sharingId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [activeBet, setActiveBet] = useState<ActiveBet | null>(null);
  const [userReputation, setUserReputation] = useState<number>(7500);
  const mapRef = useRef<any | null>(null);
  const markerRef = useRef<any | null>(null);
  const destinationMarkerRef = useRef<any | null>(null);
  const pathRef = useRef<any | null>(null);

  const {
    watchedSession,
    setWatchedSession,
    updateWatchedSession,
    clearWatchedSession,
    isWalletConnected,
  } = useLocationStore();

  const { isConnected, address } = useWallet();
  const { getCommitmentDetails, getUserReputation } = useBetting();
  const { activeBets } = useBettingStore();

  const { addToast, setConnected } = useUIStore();

  useEffect(() => {
    if (!sharingId) return;

    const socket = socketManager.connect();

    socket.on("connect", () => {
      setConnected(true);
      // Join the sharing room
      socket.emit("join", { sharingId });
    });

    socket.on("disconnect", () => {
      setConnected(false);
      addToast({ message: "Connection lost", type: "error" });
    });

    socket.on("watch", (data) => {
      setIsLoading(false);

      if (data.locationData) {
        const session = data.locationData;

        if (watchedSession) {
          updateWatchedSession(session);
        } else {
          setWatchedSession(session);
        }

        // Update map
        updateMap(session);

        // If this is a staked commitment, load betting details
        if (session.commitmentId && isConnected) {
          getCommitmentDetails(session.commitmentId);
        }
      }
    });

    // Initial connection
    socket.emit("join", { sharingId });

    return () => {
      clearWatchedSession();
      socket.disconnect();
    };
  }, [sharingId]);

  const updateMap = (session: any) => {
    if (!mapRef.current || typeof window === "undefined") return;

    const { latitude, longitude, path, destination, active } = session;

    // Skip if no valid coordinates
    if (latitude === 0 && longitude === 0) {
      return;
    }

    import("leaflet").then((L) => {
      // Update or create user marker
      if (!markerRef.current) {
        markerRef.current = L.marker([latitude, longitude]).addTo(
          mapRef.current
        );
        mapRef.current.setView([latitude, longitude], 16);
      } else {
        markerRef.current.setLatLng([latitude, longitude]);
      }

      // Update marker color based on active status
      const iconUrl = active
        ? "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png"
        : "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png";

      markerRef.current.setIcon(
        L.icon({
          iconUrl,
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        })
      );

      // Update destination marker
      if (destination) {
        if (!destinationMarkerRef.current) {
          destinationMarkerRef.current = L.marker(
            [destination.lat, destination.lng],
            {
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
            }
          ).addTo(mapRef.current);
        } else {
          destinationMarkerRef.current.setLatLng([
            destination.lat,
            destination.lng,
          ]);
        }
      }

      // Update path
      if (path && path.length > 1) {
        if (pathRef.current) {
          pathRef.current.setLatLngs(path);
        } else {
          pathRef.current = L.polyline(path, {
            color: active ? "blue" : "gray",
            weight: 3,
            opacity: 0.7,
          }).addTo(mapRef.current);
        }
      }

      // Auto-center map on current location
      mapRef.current.setView(
        [latitude, longitude],
        Math.max(mapRef.current.getZoom(), 13)
      );
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PremiumNavigation />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading location data...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!watchedSession) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PremiumNavigation />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Session Not Found
            </h1>
            <p className="text-gray-600 mb-4">
              The sharing session you&apos;re looking for doesn&apos;t exist or
              has ended.
            </p>
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              Return to Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PremiumNavigation />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📍 Live GPS Tracking
          </h1>
          <p className="text-gray-600">Watch real-time location updates on the map</p>
        </div>

        {/* Status Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className={`flex items-center space-x-2 ${
                  watchedSession.active ? "text-green-600" : "text-gray-500"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full ${
                    watchedSession.active
                      ? "bg-green-500 animate-pulse"
                      : "bg-gray-400"
                  }`}
                ></div>
                <span className="font-medium">
                  {watchedSession.active ? "🟢 Live Tracking" : "⚪ Offline"}
                </span>
              </div>

              <div className="text-gray-600">
                <span className="font-medium">🏃‍♂️ Pace:</span> {watchedSession.pace} min/mile
              </div>

              {watchedSession.isStaked && (
                <div className="flex items-center space-x-2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    💰 Staked Challenge
                  </span>
                  <ReputationBadge score={userReputation} size="sm" />
                </div>
              )}
            </div>

            {watchedSession.eta && watchedSession.destination && (
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {formatTime(watchedSession.eta)}
                </div>
                <div className="text-sm text-gray-600">⏰ Estimated Arrival</div>
              </div>
            )}
          </div>

          {watchedSession.stakeAmount && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <span className="font-medium">💵 Prize Pool:</span>
                <span className="ml-2 text-green-600 font-medium">
                  {(Number(watchedSession.stakeAmount) / 1e18).toFixed(3)} STT
                </span>
                <span className="ml-2 text-purple-600 text-xs">
                  (2.5x payout if successful!)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="relative">
            <span
              className={`absolute top-4 left-4 z-10 px-2 py-1 rounded text-sm font-medium ${
                watchedSession.active
                  ? "bg-green-600 text-white"
                  : "bg-gray-500 text-white"
              }`}
            >
              {watchedSession.active ? "Live Tracking" : "Last Known Location"}
            </span>

            <MapContainer
              className="h-96"
              center={[watchedSession.latitude, watchedSession.longitude]}
              onMapReady={(map) => {
                mapRef.current = map;
                updateMap(watchedSession);
              }}
            />
          </div>
        </div>

        {/* Betting Interface */}
        {activeBet && isConnected && (
          <div className="mb-6">
            <UnifiedBettingInterface
              mode="bet"
              commitment={activeBet}
              onBetPlaced={(success) => {
                if (success) {
                  console.log('Bet placed successfully');
                }
              }}
            />
          </div>
        )}

        {/* Betting Prompt for Non-Connected Users */}
        {watchedSession.isStaked && !isConnected && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              Want to Bet on This Commitment?
            </h3>
            <p className="text-blue-800 text-sm mb-3">
              Connect your wallet to bet on whether this person will make it on
              time!
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Connect Wallet to Bet
            </button>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📍 Current Location
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">Last Seen:</span>
                <span className="font-semibold text-gray-900">
                  {new Date(watchedSession.lastUpdated).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">GPS Accuracy:</span>
                <span className="font-semibold text-green-600">
                  High Precision
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">Update Frequency:</span>
                <span className="font-semibold text-blue-600">
                  Real-time
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🏁 Challenge Progress
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">Status:</span>
                <span
                  className={`font-semibold ${
                    watchedSession.active ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {watchedSession.active ? "🚀 Active Journey" : "⏸️ Paused"}
                </span>
              </div>
              {watchedSession.destination && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 font-medium">Destination:</span>
                  <span className="font-semibold text-purple-600">🎯 Set</span>
                </div>
              )}
              {watchedSession.isStaked && (
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                  <span className="text-gray-600 font-medium">Reward Type:</span>
                  <span className="font-semibold text-purple-600">💎 Staked Challenge</span>
                </div>
              )}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-600 font-medium">Track Length:</span>
                <span className="font-semibold text-blue-600">
                  {watchedSession.path.length} GPS points
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ToastContainer />
    </div>
  );
}
