// Live Location Tracker - Real GPS tracking during journeys
// ENHANCEMENT FIRST: Building upon existing real-time service

"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/PremiumButton';
import { StatusIndicator, GPSStatusIndicator } from '@/components/ui/StatusIndicator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/PremiumCard';
import { useMobileExperience } from '@/hooks/useMobileExperience';
import { realtimeService, type LocationUpdate } from '@/lib/realtime-service';
import { formatTime, formatDistance } from '@/lib/utils';
import { calculateDistance } from '@/lib/distance';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveLocationTrackerProps {
    userId: string;
    commitmentId?: string;
    targetLocation?: {
        lat: number;
        lng: number;
        name: string;
    };
    onLocationUpdate?: (location: LocationUpdate) => void;
    onArrival?: (verification: any) => void;
    className?: string;
}

export function LiveLocationTracker({
    userId,
    commitmentId,
    targetLocation,
    onLocationUpdate,
    onArrival,
    className
}: LiveLocationTrackerProps) {
    const [isTracking, setIsTracking] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<LocationUpdate | null>(null);
    const [trackingDuration, setTrackingDuration] = useState(0);
    const [distanceToTarget, setDistanceToTarget] = useState<number | null>(null);
    const [isNearTarget, setIsNearTarget] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { triggerHaptic, isMobile } = useMobileExperience();

    // Update tracking duration
    useEffect(() => {
        if (!isTracking) return;

        const interval = setInterval(() => {
            setTrackingDuration(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isTracking]);

    // Listen for location updates
    useEffect(() => {
        const unsubscribe = realtimeService.on('location:update', (location) => {
            setCurrentLocation(location);
            onLocationUpdate?.(location);

            // Calculate distance to target
            if (targetLocation) {
                const distance = calculateDistance(
                    location.latitude,
                    location.longitude,
                    targetLocation.lat,
                    targetLocation.lng
                );
                setDistanceToTarget(distance);

                // Check if near target (within 100m)
                const wasNear = isNearTarget;
                const nowNear = distance <= 100;
                setIsNearTarget(nowNear);

                // Trigger haptic feedback when approaching target
                if (!wasNear && nowNear) {
                    triggerHaptic('success');
                }

                // Auto-verify arrival if very close (within 50m)
                if (distance <= 50) {
                    handleVerifyArrival();
                }
            }
        });

        return unsubscribe;
    }, [targetLocation, isNearTarget, onLocationUpdate, triggerHaptic]);

    // Listen for location errors
    useEffect(() => {
        const unsubscribe = realtimeService.on('location:error', (errorData) => {
            setError(errorData.message);
            setIsTracking(false);
            triggerHaptic('error');
        });

        return unsubscribe;
    }, [triggerHaptic]);

    const startTracking = useCallback(async () => {
        try {
            setError(null);
            setTrackingDuration(0);
            await realtimeService.startLocationTracking(userId, commitmentId);
            setIsTracking(true);
            triggerHaptic('success');
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to start tracking');
            triggerHaptic('error');
        }
    }, [userId, commitmentId, triggerHaptic]);

    const stopTracking = useCallback(() => {
        realtimeService.stopLocationTracking();
        setIsTracking(false);
        setTrackingDuration(0);
        triggerHaptic('light');
    }, [triggerHaptic]);

    const handleVerifyArrival = useCallback(() => {
        if (!targetLocation || !currentLocation) return;

        const verification = realtimeService.verifyLocation(
            targetLocation.lat,
            targetLocation.lng,
            100 // 100m threshold
        );

        if (verification) {
            onArrival?.(verification);

            if (verification.withinThreshold) {
                triggerHaptic('success');
            } else {
                triggerHaptic('warning');
            }
        }
    }, [targetLocation, currentLocation, onArrival, triggerHaptic]);

    const getAccuracyStatus = () => {
        if (!currentLocation) return 'offline';
        if (currentLocation.accuracy > 20) return 'warning';
        if (currentLocation.accuracy > 10) return 'connecting';
        return 'online';
    };

    const getAccuracyLabel = () => {
        if (!currentLocation) return 'No GPS signal';
        return `±${Math.round(currentLocation.accuracy)}m accuracy`;
    };

    return (
        <Card className={className} variant="premium">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        📍 Live Tracking
                        <StatusIndicator
                            status={isTracking ? 'online' : 'offline'}
                            showLabel={false}
                            premium
                            glow
                        />
                    </span>
                    {isTracking && (
                        <span className="text-sm text-white/70">
                            {formatTime(trackingDuration)}
                        </span>
                    )}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* GPS Status */}
                <div className="flex items-center justify-between">
                    <StatusIndicator
                        status={getAccuracyStatus()}
                        label={getAccuracyLabel()}
                        premium
                        size="sm"
                    />
                    {currentLocation && (
                        <span className="text-xs text-white/60">
                            {currentLocation.speed ? `${Math.round(currentLocation.speed * 3.6)} km/h` : 'Stationary'}
                        </span>
                    )}
                </div>

                {/* Current Location Info */}
                {currentLocation && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 rounded-lg p-3 space-y-2"
                    >
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-white/60">Latitude</span>
                                <div className="font-mono text-white">
                                    {currentLocation.latitude.toFixed(6)}
                                </div>
                            </div>
                            <div>
                                <span className="text-white/60">Longitude</span>
                                <div className="font-mono text-white">
                                    {currentLocation.longitude.toFixed(6)}
                                </div>
                            </div>
                        </div>

                        {currentLocation.altitude && (
                            <div className="text-sm">
                                <span className="text-white/60">Altitude: </span>
                                <span className="text-white">{Math.round(currentLocation.altitude)}m</span>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Target Distance */}
                {targetLocation && distanceToTarget !== null && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-3 rounded-lg border ${isNearTarget
                                ? 'bg-green-500/10 border-green-500/30'
                                : 'bg-blue-500/10 border-blue-500/30'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-white/70">Distance to {targetLocation.name}</div>
                                <div className={`text-lg font-bold ${isNearTarget ? 'text-green-400' : 'text-blue-400'
                                    }`}>
                                    {formatDistance(distanceToTarget)}
                                </div>
                            </div>
                            {isNearTarget && (
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="text-2xl"
                                >
                                    🎯
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Error Display */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-red-500/10 border border-red-500/30 rounded-lg p-3"
                        >
                            <div className="flex items-center gap-2 text-red-400">
                                <span>⚠️</span>
                                <span className="text-sm">{error}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Control Buttons */}
                <div className="flex gap-2">
                    {!isTracking ? (
                        <Button
                            onClick={startTracking}
                            variant="gradient"
                            className="flex-1"
                            emoji="🚀"
                            context="achievement"
                        >
                            Start Tracking
                        </Button>
                    ) : (
                        <>
                            <Button
                                onClick={stopTracking}
                                variant="outline"
                                className="flex-1"
                                emoji="⏹️"
                            >
                                Stop
                            </Button>
                            {targetLocation && distanceToTarget !== null && distanceToTarget <= 200 && (
                                <Button
                                    onClick={handleVerifyArrival}
                                    variant="success"
                                    className="flex-1"
                                    emoji="✅"
                                    context="achievement"
                                    glow
                                >
                                    Verify Arrival
                                </Button>
                            )}
                        </>
                    )}
                </div>

                {/* Mobile-specific features */}
                {isMobile && isTracking && (
                    <div className="text-xs text-white/50 text-center">
                        Keep this tab active for accurate tracking
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Simplified version for quick status display
export function LocationStatus({
    className
}: {
    className?: string
}) {
    const [status, setStatus] = useState(realtimeService.getLocationStatus());

    useEffect(() => {
        const interval = setInterval(() => {
            setStatus(realtimeService.getLocationStatus());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className={className}>
            <GPSStatusIndicator
                isEnabled={status.isTracking}
                accuracy={status.lastUpdate?.accuracy}
            />
        </div>
    );
}