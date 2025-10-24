"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import WebGLParticleSystem from "@/components/three/ParticleSystem";
import { PremiumNavigation } from "@/components/layout/PremiumNavigation";
import { ToastContainer } from "@/components/ui/Toast";
import { ReputationBadge } from "@/components/reputation/ReputationBadge";
import { UnifiedBettingInterface } from "@/components/ai/UnifiedBettingInterface";
import { useLocationStore } from "@/stores/locationStore";
import { useUIStore } from "@/stores/uiStore";
import { useWallet } from "@/hooks/useWallet";
import { socketManager } from "@/lib/socket";
import { formatTime } from "@/lib/utils";
import { MapContainer } from "@/components/map/MapContainer";
import { createUserMarker, createDestinationMarker, createPolyline } from "@/lib/map-utils";

export default function WatchPage() {
  const params = useParams();
  const sharingId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [activeBet, setActiveBet] = useState<any | null>(null);
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

  // Simple mocks for deleted hooks
  const getCommitmentDetails = (_id: string) => {}; // No-op
  const getUserReputation = (_address: string) => {}; // No-op
  const activeBets = []; // Empty array

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharingId]);

  const updateMap = async (session: any) => {
    if (!mapRef.current || typeof window === "undefined") return;

    const { latitude, longitude, path, destination, active } = session;

    // Skip if no valid coordinates
    if (latitude === 0 && longitude === 0) {
      return;
    }

    try {
      const L = await import("leaflet");

      // Update or create user marker
      if (!markerRef.current) {
        markerRef.current = (await createUserMarker([latitude, longitude], active)).addTo(
          mapRef.current
        );
        mapRef.current.setView([latitude, longitude], 16);
      } else {
        markerRef.current.setLatLng([latitude, longitude]);
        // Update icon if active state changed
        const newMarker = await createUserMarker([latitude, longitude], active);
        markerRef.current.setIcon(newMarker.options.icon);
      }

      // Update destination marker
      if (destination) {
        if (!destinationMarkerRef.current) {
          destinationMarkerRef.current = (await createDestinationMarker(
            [destination.lat, destination.lng]
          )).addTo(mapRef.current);
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
          pathRef.current = (await createPolyline(path, active)).addTo(mapRef.current);
        }
      }

      // Auto-center map on current location
      mapRef.current.setView(
        [latitude, longitude],
        Math.max(mapRef.current.getZoom(), 13)
      );
    } catch (error) {
      console.error("Error updating map:", error);
    }
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
        <motion.div
          className="glass-enhanced rounded-2xl shadow-2xl p-6 mb-6 border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className={`flex items-center space-x-2 ${
                  watchedSession.active ? "text-green-400" : "text-gray-400"
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

              <div className="text-white/70">
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
                <div className="text-2xl font-bold text-blue-400">
                  {formatTime(watchedSession.eta)}
                </div>
                <div className="text-sm text-white/70">⏰ Estimated Arrival</div>
              </div>
            )}
          </div>

          {watchedSession.stakeAmount && (
            <div className="mt-3 pt-3 border-t border-white/20">
              <div className="text-sm text-white/70">
                <span className="font-medium">💵 Prize Pool:</span>
                <span className="ml-2 text-green-400 font-medium">
                  {(Number(watchedSession.stakeAmount) / 1e18).toFixed(3)} STT
                </span>
                <span className="ml-2 text-purple-400 text-xs">
                  (2.5x payout if successful!)
                </span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Map */}
        <motion.div
          className="glass-enhanced rounded-2xl shadow-2xl overflow-hidden mb-6 border border-white/20"
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="relative">
            <span
              className={`absolute top-4 left-4 z-10 px-3 py-2 rounded-full text-sm font-medium backdrop-blur-sm ${
                watchedSession.active
                  ? "bg-green-500/90 text-white shadow-lg"
                  : "bg-gray-500/90 text-white shadow-lg"
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
        </motion.div>

        {/* AI-Enhanced Unified Betting Interface */}
        {watchedSession && watchedSession.isStaked && isConnected && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <UnifiedBettingInterface
              commitmentId={watchedSession.commitmentId || ''}
              stakeAmount={Number(watchedSession.stakeAmount || 0) / 1e18}
              deadline={new Date()} // Placeholder - would be actual deadline
              currentProgress={watchedSession.path?.length ? Math.min(100, watchedSession.path.length * 2) : 0}
              status={watchedSession.active ? 'active' : watchedSession.eta ? 'completed' : 'failed'}
              destinationReached={!!watchedSession.eta}
              estimatedArrival={watchedSession.eta ? new Date(watchedSession.eta) : null}
              timeRemaining={watchedSession.eta ? Math.max(0, (watchedSession.eta - Date.now()) / 1000) : null}
            />
          </motion.div>
        )}

        {/* Betting Prompt for Non-Connected Users */}
        {watchedSession.isStaked && !isConnected && (
          <motion.div
            className="glass-modern bg-blue-500/10 border border-blue-400/30 rounded-xl p-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="font-semibold text-blue-300 mb-2">
              Want to Bet on This Commitment?
            </h3>
            <p className="text-blue-200 text-sm mb-3">
              Connect your wallet to bet on whether this person will make it on
              time!
            </p>
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg transform hover:scale-105">
              Connect Wallet to Bet
            </button>
          </motion.div>
        )}

        {/* Info Cards */}
        <motion.div
          className="grid md:grid-cols-2 gap-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, staggerChildren: 0.2 }}
          viewport={{ once: true }}
        >
          <motion.div
            className="glass-enhanced rounded-2xl shadow-2xl p-6 border border-white/20"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h3 className="text-lg font-bold text-white mb-4">
              📍 Current Location
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-4 glass-modern rounded-lg">
                <span className="text-white/70 font-medium">Last Seen:</span>
                <span className="font-semibold text-white">
                  {new Date(watchedSession.lastUpdated).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 glass-modern rounded-lg bg-green-500/10 border border-green-400/30">
                <span className="text-white/70 font-medium">GPS Accuracy:</span>
                <span className="font-semibold text-green-400">
                  High Precision
                </span>
              </div>
              <div className="flex items-center justify-between p-4 glass-modern rounded-lg bg-blue-500/10 border border-blue-400/30">
                <span className="text-white/70 font-medium">Update Frequency:</span>
                <span className="font-semibold text-blue-400">
                  Real-time
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="glass-enhanced rounded-2xl shadow-2xl p-6 border border-white/20"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h3 className="text-lg font-bold text-white mb-4">
              🏁 Challenge Progress
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-4 glass-modern rounded-lg">
                <span className="text-white/70 font-medium">Status:</span>
                <span
                  className={`font-semibold ${
                    watchedSession.active ? "text-green-400" : "text-gray-400"
                  }`}
                >
                  {watchedSession.active ? "🚀 Active Journey" : "⏸️ Paused"}
                </span>
              </div>
              {watchedSession.destination && (
                <div className="flex items-center justify-between p-4 glass-modern rounded-lg bg-purple-500/10 border border-purple-400/30">
                  <span className="text-white/70 font-medium">Destination:</span>
                  <span className="font-semibold text-purple-400">🎯 Set</span>
                </div>
              )}
              {watchedSession.isStaked && (
                <div className="flex items-center justify-between p-4 glass-modern rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-400/30">
                  <span className="text-white/70 font-medium">Reward Type:</span>
                  <span className="font-semibold text-purple-400">💎 Staked Challenge</span>
                </div>
              )}
              <div className="flex items-center justify-between p-4 glass-modern rounded-lg bg-blue-500/10 border border-blue-400/30">
                <span className="text-white/70 font-medium">Track Length:</span>
                <span className="font-semibold text-blue-400">
                  {watchedSession.path.length} GPS points
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      <ToastContainer />
    </div>
  );
}
