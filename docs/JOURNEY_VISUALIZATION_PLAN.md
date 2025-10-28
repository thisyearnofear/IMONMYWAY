# Journey Visualization Enhancement Plan

## Overview

Instead of generic particle systems, we should implement a journey visualization system inspired by the flight tracker project. This approach will create a more meaningful and contextual visualization that directly relates to your punctuality protocol concept.

## Core Concepts from Flight Tracker to Adapt

1. **Dynamic Path Visualization**: Curved trajectories showing progress over time
2. **Instanced Rendering**: Efficient display of multiple journeys/commitments
3. **Interactive Controls**: Adjustable parameters for viewing different data
4. **Real-time Updates**: Live status indicators for ongoing journeys
5. **Performance Optimization**: Efficient rendering of large datasets

## Implementation Plan

### Phase 1: Journey Path Visualization Component

#### File: `/src/components/visualization/JourneyPathVisualization.tsx`

```typescript
"use client";

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo, useState, useEffect } from 'react';
import { 
  Instances, 
  Instance,
  Line,
  Text,
  Html
} from '@react-three/drei';
import * as THREE from 'three';
import { useDevicePerformance } from '@/hooks/useDevicePerformance';
import { useUIStore } from '@/stores/uiStore';

interface JourneyPoint {
  lat: number;
  lng: number;
  timestamp: number;
  status: 'pending' | 'in_progress' | 'completed' | 'late';
}

interface JourneyPath {
  id: string;
  userId: string;
  start: JourneyPoint;
  end: JourneyPoint;
  waypoints: JourneyPoint[];
  progress: number; // 0-1
  estimatedArrival: Date;
  actualArrival?: Date;
  status: 'planned' | 'active' | 'completed' | 'delayed';
}

// Convert lat/lng to 3D coordinates for visualization
const latLngToVector3 = (lat: number, lng: number, radius: number = 10): THREE.Vector3 => {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lng + 180) * Math.PI / 180;
  
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

// Create curved path between two points
const createCurvedPath = (start: THREE.Vector3, end: THREE.Vector3, segments: number = 50): THREE.Vector3[] => {
  const points: THREE.Vector3[] = [];
  const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const height = start.distanceTo(end) * 0.3; // Arc height
  
  midPoint.normalize().multiplyScalar(midPoint.length() + height);
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = new THREE.Vector3().lerpVectors(start, midPoint, t);
    point.lerp(midPoint, t);
    point.lerp(end, t * t);
    points.push(point);
  }
  
  return points;
};

// Journey Path Component
function JourneyPathComponent({ 
  journey, 
  isSelected = false 
}: { 
  journey: JourneyPath; 
  isSelected?: boolean; 
}) {
  const lineRef = useRef<THREE.Line>(null!);
  const progressRef = useRef<THREE.Line>(null!);
  const { prefersReducedMotion } = useDevicePerformance();
  
  // Convert journey points to 3D coordinates
  const startVec = latLngToVector3(journey.start.lat, journey.start.lng);
  const endVec = latLngToVector3(journey.end.lat, journey.end.lng);
  const pathPoints = createCurvedPath(startVec, endVec);
  
  // Progress points (animated section)
  const progressPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const progressIndex = Math.floor(pathPoints.length * journey.progress);
    
    for (let i = 0; i <= progressIndex && i < pathPoints.length; i++) {
      points.push(pathPoints[i]);
    }
    
    return points;
  }, [pathPoints, journey.progress]);
  
  // Animate progress
  useFrame((state) => {
    if (!progressRef.current || prefersReducedMotion) return;
    
    // Pulse animation for active journeys
    if (journey.status === 'active') {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      progressRef.current.scale.set(scale, scale, scale);
    }
  });
  
  // Determine colors based on status
  const getPathColor = () => {
    switch (journey.status) {
      case 'completed': return '#10b981'; // green
      case 'delayed': return '#ef4444'; // red
      case 'active': return '#3b82f6'; // blue
      default: return '#94a3b8'; // gray
    }
  };
  
  const getProgressColor = () => {
    switch (journey.status) {
      case 'delayed': return '#f59e0b'; // amber for late
      case 'active': return '#60a5fa'; // light blue for active
      default: return '#8b5cf6'; // purple
    }
  };
  
  return (
    <group>
      {/* Full path */}
      <Line
        points={pathPoints}
        color={getPathColor()}
        lineWidth={isSelected ? 3 : 1}
        transparent
        opacity={isSelected ? 0.8 : 0.4}
      />
      
      {/* Progress section */}
      <Line
        ref={progressRef}
        points={progressPoints}
        color={getProgressColor()}
        lineWidth={isSelected ? 4 : 2}
        transparent
      />
      
      {/* Start marker */}
      <mesh position={startVec}>
        <sphereGeometry args={[isSelected ? 0.3 : 0.2, 16, 16]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>
      
      {/* End marker */}
      <mesh position={endVec}>
        <sphereGeometry args={[isSelected ? 0.3 : 0.2, 16, 16]} />
        <meshBasicMaterial 
          color={journey.status === 'completed' ? '#10b981' : 
                 journey.status === 'delayed' ? '#ef4444' : '#94a3b8'} 
        />
      </mesh>
      
      {/* Progress indicator */}
      {progressPoints.length > 0 && (
        <mesh position={progressPoints[progressPoints.length - 1]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial 
            color={getProgressColor()} 
            transparent
            opacity={0.8}
          />
        </mesh>
      )}
    </group>
  );
}

// Instanced Journey Visualization for Performance
function InstancedJourneyPaths({ journeys }: { journeys: JourneyPath[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const { isLowEnd, prefersReducedMotion } = useDevicePerformance();
  
  // Limit number of journeys based on device performance
  const visibleJourneys = isLowEnd ? journeys.slice(0, 50) : journeys.slice(0, 200);
  
  useFrame((state) => {
    if (!meshRef.current || prefersReducedMotion) return;
    
    // Animate instances
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    
    for (let i = 0; i < visibleJourneys.length; i++) {
      const journey = visibleJourneys[i];
      const startVec = latLngToVector3(journey.start.lat, journey.start.lng);
      const endVec = latLngToVector3(journey.end.lat, journey.end.lng);
      
      // Position along the path based on progress
      const progress = journey.progress;
      position.lerpVectors(startVec, endVec, progress);
      
      matrix.setPosition(position);
      meshRef.current.setMatrixAt(i, matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <instancedMesh 
      ref={meshRef} 
      args={[undefined, undefined, visibleJourneys.length]}
      frustumCulled={false}
    >
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshBasicMaterial color="#60a5fa" transparent opacity={0.6} />
    </instancedMesh>
  );
}

// Main Journey Visualization Scene
function JourneyVisualizationScene({ 
  journeys, 
  selectedJourney,
  onJourneySelect 
}: { 
  journeys: JourneyPath[]; 
  selectedJourney?: string;
  onJourneySelect?: (id: string) => void;
}) {
  const { isLowEnd } = useDevicePerformance();
  
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      
      {/* Individual journey paths for better interaction */}
      {!isLowEnd && journeys.map(journey => (
        <JourneyPathComponent 
          key={journey.id} 
          journey={journey} 
          isSelected={selectedJourney === journey.id}
        />
      ))}
      
      {/* Instanced rendering for performance on low-end devices */}
      {isLowEnd && (
        <InstancedJourneyPaths journeys={journeys} />
      )}
      
      {/* Grid for spatial reference */}
      <gridHelper args={[20, 20, '#4b5563', '#4b5563']} position={[0, -5, 0]} />
    </>
  );
}

// Main Component
export default function JourneyPathVisualization({ 
  journeys,
  selectedJourney,
  onJourneySelect,
  className = ""
}: {
  journeys: JourneyPath[];
  selectedJourney?: string;
  onJourneySelect?: (id: string) => void;
  className?: string;
}) {
  const { isLowEnd, isMobile, supportsWebGL } = useDevicePerformance();

  // Don't render if WebGL is not supported
  if (!supportsWebGL) {
    return null;
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 15], fov: 75 }}
      gl={{
        antialias: !isMobile,
        alpha: true,
        powerPreference: isMobile ? "low-power" : "high-performance"
      }}
      style={{
        background: 'transparent',
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        ...className ? {} : { position: 'relative' }
      }}
      className={className}
      dpr={isMobile ? 1 : [1, 2]}
    >
      <JourneyVisualizationScene 
        journeys={journeys} 
        selectedJourney={selectedJourney}
        onJourneySelect={onJourneySelect}
      />
    </Canvas>
  );
}
```

### Phase 2: Journey Dashboard Component

#### File: `/src/components/visualization/JourneyDashboard.tsx`

```typescript
"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import JourneyPathVisualization from './JourneyPathVisualization';
import { Button } from '@/components/ui/PremiumButton';
import { Input } from '@/components/ui/Input';
import { useUIStore } from '@/stores/uiStore';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

interface Journey {
  id: string;
  userId: string;
  start: { lat: number; lng: number; name: string };
  end: { lat: number; lng: number; name: string };
  startTime: Date;
  estimatedArrival: Date;
  actualArrival?: Date;
  status: 'planned' | 'active' | 'completed' | 'delayed';
  progress: number;
  stakeAmount: string;
  reputationImpact: number;
}

export default function JourneyDashboard() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [selectedJourney, setSelectedJourney] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'delayed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { isMobile } = useDeviceDetection();
  const { addToast } = useUIStore();
  
  // Mock data - in real implementation, this would come from API/db
  useEffect(() => {
    const mockJourneys: Journey[] = [
      {
        id: 'journey_1',
        userId: '0x1234...',
        start: { lat: 40.7128, lng: -74.0060, name: 'New York' },
        end: { lat: 41.8781, lng: -87.6298, name: 'Chicago' },
        startTime: new Date(Date.now() - 3600000),
        estimatedArrival: new Date(Date.now() + 7200000),
        status: 'active',
        progress: 0.3,
        stakeAmount: '2.5',
        reputationImpact: 15
      },
      {
        id: 'journey_2',
        userId: '0x5678...',
        start: { lat: 34.0522, lng: -118.2437, name: 'Los Angeles' },
        end: { lat: 37.7749, lng: -122.4194, name: 'San Francisco' },
        startTime: new Date(Date.now() - 1800000),
        estimatedArrival: new Date(Date.now() - 600000),
        actualArrival: new Date(Date.now() - 300000),
        status: 'completed',
        progress: 1,
        stakeAmount: '1.8',
        reputationImpact: 10
      },
      {
        id: 'journey_3',
        userId: '0x9abc...',
        start: { lat: 47.6062, lng: -122.3321, name: 'Seattle' },
        end: { lat: 39.9526, lng: -75.1652, name: 'Philadelphia' },
        startTime: new Date(Date.now() - 7200000),
        estimatedArrival: new Date(Date.now() - 3600000),
        status: 'delayed',
        progress: 0.8,
        stakeAmount: '3.2',
        reputationImpact: -5
      }
    ];
    
    setJourneys(mockJourneys);
  }, []);
  
  const filteredJourneys = journeys.filter(journey => {
    // Apply status filter
    if (filter !== 'all' && journey.status !== filter) return false;
    
    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        journey.start.name.toLowerCase().includes(term) ||
        journey.end.name.toLowerCase().includes(term) ||
        journey.userId.toLowerCase().includes(term)
      );
    }
    
    return true;
  });
  
  const selectedJourneyData = selectedJourney 
    ? journeys.find(j => j.id === selectedJourney) 
    : null;
  
  const getStatusColor = (status: Journey['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'delayed': return 'text-red-600 bg-red-100';
      case 'active': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  
  const getStatusText = (status: Journey['status']) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'delayed': return 'Delayed';
      case 'active': return 'In Progress';
      default: return 'Planned';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {(['all', 'active', 'completed', 'delayed'] as const).map(status => (
            <Button
              key={status}
              variant={filter === status ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
              className="capitalize"
            >
              {status === 'all' ? 'All Journeys' : getStatusText(status)}
            </Button>
          ))}
        </div>
        
        <div className="w-full md:w-auto">
          <Input
            placeholder="Search journeys..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
      </div>
      
      {/* Visualization and List */}
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-6`}>
        {/* 3D Visualization */}
        <motion.div
          className="bg-white/10 rounded-xl p-4 border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">Journey Visualization</h3>
          <div className="h-80 rounded-lg overflow-hidden">
            <JourneyPathVisualization
              journeys={filteredJourneys.map(journey => ({
                id: journey.id,
                userId: journey.userId,
                start: {
                  lat: journey.start.lat,
                  lng: journey.start.lng,
                  timestamp: journey.startTime.getTime(),
                  status: journey.status === 'completed' ? 'completed' : 'pending'
                },
                end: {
                  lat: journey.end.lat,
                  lng: journey.end.lng,
                  timestamp: journey.estimatedArrival.getTime(),
                  status: journey.status === 'completed' ? 'completed' : 'pending'
                },
                waypoints: [],
                progress: journey.progress,
                estimatedArrival: journey.estimatedArrival,
                actualArrival: journey.actualArrival,
                status: journey.status
              }))}
              selectedJourney={selectedJourney || undefined}
              onJourneySelect={setSelectedJourney}
            />
          </div>
        </motion.div>
        
        {/* Journey List */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-lg font-semibold text-white">Journey List</h3>
          
          {filteredJourneys.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
              <p className="text-white/70">No journeys found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJourneys.map(journey => (
                <motion.div
                  key={journey.id}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedJourney === journey.id 
                      ? 'bg-blue-500/20 border-blue-400/50' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                  onClick={() => setSelectedJourney(journey.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-white">
                        {journey.start.name} → {journey.end.name}
                      </h4>
                      <p className="text-sm text-white/70">
                        {journey.userId.slice(0, 6)}...{journey.userId.slice(-4)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(journey.status)}`}>
                      {getStatusText(journey.status)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-white/60">Progress</p>
                      <p className="text-white font-medium">{Math.round(journey.progress * 100)}%</p>
                    </div>
                    <div>
                      <p className="text-white/60">Stake</p>
                      <p className="text-white font-medium">{journey.stakeAmount} STT</p>
                    </div>
                    <div>
                      <p className="text-white/60">Reputation</p>
                      <p className={`font-medium ${
                        journey.reputationImpact > 0 ? 'text-green-400' : 
                        journey.reputationImpact < 0 ? 'text-red-400' : 'text-white'
                      }`}>
                        {journey.reputationImpact > 0 ? '+' : ''}{journey.reputationImpact}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60">ETA</p>
                      <p className="text-white font-medium">
                        {journey.estimatedArrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          journey.status === 'completed' ? 'bg-green-500' :
                          journey.status === 'delayed' ? 'bg-red-500' :
                          journey.status === 'active' ? 'bg-blue-500' : 'bg-gray-500'
                        }`}
                        style={{ width: `${journey.progress * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Selected Journey Details */}
      {selectedJourneyData && (
        <motion.div
          className="bg-white/10 rounded-xl p-6 border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-white">Journey Details</h3>
            <Button 
              variant="ghost" 
              onClick={() => setSelectedJourney(null)}
              className="text-white/70 hover:text-white"
            >
              Close
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-white mb-3">Route Information</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/70">From:</span>
                  <span className="text-white">{selectedJourneyData.start.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">To:</span>
                  <span className="text-white">{selectedJourneyData.end.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Started:</span>
                  <span className="text-white">
                    {selectedJourneyData.startTime.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Estimated Arrival:</span>
                  <span className="text-white">
                    {selectedJourneyData.estimatedArrival.toLocaleString()}
                  </span>
                </div>
                {selectedJourneyData.actualArrival && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Actual Arrival:</span>
                    <span className="text-white">
                      {selectedJourneyData.actualArrival.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-3">Commitment Details</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/70">Stake Amount:</span>
                  <span className="text-white font-medium">{selectedJourneyData.stakeAmount} STT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Reputation Impact:</span>
                  <span className={`font-medium ${
                    selectedJourneyData.reputationImpact > 0 ? 'text-green-400' : 
                    selectedJourneyData.reputationImpact < 0 ? 'text-red-400' : 'text-white'
                  }`}>
                    {selectedJourneyData.reputationImpact > 0 ? '+' : ''}{selectedJourneyData.reputationImpact}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedJourneyData.status)}`}>
                    {getStatusText(selectedJourneyData.status)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Progress:</span>
                  <span className="text-white font-medium">
                    {Math.round(selectedJourneyData.progress * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/10">
            <Button 
              variant="primary" 
              className="w-full"
              onClick={() => {
                addToast({
                  message: 'Navigating to journey tracking...',
                  type: 'success'
                });
                // In real implementation, this would navigate to the tracking page
              }}
            >
              Track This Journey
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
```

### Phase 3: Integration into Existing Pages

#### File: `/src/app/watch/[id]/page.tsx` (Enhanced)

```typescript
"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import JourneyPathVisualization from '@/components/visualization/JourneyPathVisualization';
import { Button } from '@/components/ui/PremiumButton';
import { useUIStore } from '@/stores/uiStore';
import { useRouter } from 'next/navigation';

export default function JourneyTrackingPage({ params }: { params: { id: string } }) {
  const [journey, setJourney] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useUIStore();
  const router = useRouter();
  
  // Mock data - in real implementation, this would come from API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setJourney({
        id: params.id,
        userId: '0x1234567890abcdef',
        start: { lat: 40.7128, lng: -74.0060, name: 'New York' },
        end: { lat: 41.8781, lng: -87.6298, name: 'Chicago' },
        startTime: new Date(Date.now() - 3600000),
        estimatedArrival: new Date(Date.now() + 7200000),
        progress: 0.45,
        status: 'active',
        stakeAmount: '2.5',
        reputationImpact: 15,
        waypoints: [
          { lat: 40.7589, lng: -73.9851, timestamp: Date.now() - 3000000, status: 'completed' },
          { lat: 40.7505, lng: -73.9934, timestamp: Date.now() - 2400000, status: 'completed' },
          { lat: 40.7282, lng: -74.0776, timestamp: Date.now() - 1800000, status: 'completed' }
        ]
      });
      setIsLoading(false);
    }, 1000);
  }, [params.id]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white/80">Loading journey tracking...</p>
        </div>
      </div>
    );
  }
  
  if (!journey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white/10 rounded-xl border border-white/20">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Journey Not Found</h2>
          <p className="text-white/70 mb-4">
            The journey you're looking for doesn't exist or has expired.
          </p>
          <Button 
            variant="primary"
            onClick={() => router.push('/watch')}
          >
            Back to Watch List
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Journey Tracking</h1>
          <Button 
            variant="outline"
            onClick={() => router.push('/watch')}
          >
            Back to List
          </Button>
        </div>
        
        {/* Journey Visualization */}
        <motion.div
          className="bg-white/10 rounded-xl p-4 mb-6 border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="h-96 rounded-lg overflow-hidden">
            <JourneyPathVisualization
              journeys={[{
                id: journey.id,
                userId: journey.userId,
                start: {
                  lat: journey.start.lat,
                  lng: journey.start.lng,
                  timestamp: journey.startTime.getTime(),
                  status: 'pending'
                },
                end: {
                  lat: journey.end.lat,
                  lng: journey.end.lng,
                  timestamp: journey.estimatedArrival.getTime(),
                  status: 'pending'
                },
                waypoints: journey.waypoints.map((wp: any) => ({
                  lat: wp.lat,
                  lng: wp.lng,
                  timestamp: wp.timestamp,
                  status: wp.status
                })),
                progress: journey.progress,
                estimatedArrival: journey.estimatedArrival,
                status: journey.status
              }]}
            />
          </div>
        </motion.div>
        
        {/* Journey Details */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Progress Card */}
          <div className="bg-white/10 rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Progress</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/70">Overall Progress</span>
                  <span className="text-white">{Math.round(journey.progress * 100)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                    style={{ width: `${journey.progress * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/70 text-sm">Started</p>
                  <p className="text-white font-medium">
                    {journey.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  <p className="text-white/70 text-sm">ETA</p>
                  <p className="text-white font-medium">
                    {journey.estimatedArrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Commitment Card */}
          <div className="bg-white/10 rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Commitment</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/70">Stake Amount</span>
                <span className="text-white font-medium">{journey.stakeAmount} STT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Reputation Impact</span>
                <span className="text-green-400 font-medium">+{journey.reputationImpact}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Status</span>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                  In Progress
                </span>
              </div>
            </div>
          </div>
          
          {/* Actions Card */}
          <div className="bg-white/10 rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
            <div className="space-y-3">
              <Button 
                variant="primary" 
                className="w-full"
                onClick={() => addToast({ message: 'Location updated', type: 'success' })}
              >
                Update Location
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => addToast({ message: 'Share link copied', type: 'success' })}
              >
                Share Tracking
              </Button>
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => router.push(`/watch/${journey.id}/bet`)}
              >
                Place a Bet
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
```

## Benefits of This Approach

1. **Contextual Visualization**: Shows actual journey paths rather than abstract particles
2. **Performance Optimized**: Uses instanced rendering for large datasets
3. **Interactive**: Users can select and track specific journeys
4. **Meaningful**: Directly relates to your punctuality protocol concept
5. **Scalable**: Can handle multiple concurrent journeys
6. **Aligned with Core Principles**: Enhances existing functionality without replacement

## Implementation Timeline

### Week 1: Core Visualization Component
- [ ] Create `JourneyPathVisualization.tsx`
- [ ] Implement curved path rendering
- [ ] Add status-based coloring
- [ ] Implement instanced rendering for performance

### Week 2: Dashboard Integration
- [ ] Create `JourneyDashboard.tsx`
- [ ] Add filtering and search capabilities
- [ ] Implement journey selection and details
- [ ] Integrate with existing UI components

### Week 3: Page Integration
- [ ] Enhance journey tracking page
- [ ] Add real-time updates
- [ ] Implement waypoint visualization
- [ ] Add interactive controls

### Week 4: Optimization and Polish
- [ ] Performance testing across devices
- [ ] Add accessibility features
- [ ] Implement loading states
- [ ] Add error handling

This approach directly applies the flight tracker's visualization concepts to your punctuality protocol, creating a more meaningful and engaging user experience.