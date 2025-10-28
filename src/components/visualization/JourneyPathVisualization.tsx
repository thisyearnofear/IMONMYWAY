"use client";

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useDevicePerformance } from '@/hooks/useDevicePerformance';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

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
  const lineRef = useRef<any>(null!);
  const progressRef = useRef<any>(null!);
  const { prefersReducedMotion, isMobile } = useDevicePerformance();
  
  // Convert journey points to 3D coordinates
  const startVec = latLngToVector3(journey.start.lat, journey.start.lng);
  const endVec = latLngToVector3(journey.end.lat, journey.end.lng);
  const pathPoints = createCurvedPath(startVec, endVec, isMobile ? 20 : 50);
  
  // Progress points (animated section)
  const progressPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const progressIndex = Math.floor(pathPoints.length * journey.progress);
    
    for (let i = 0; i <= progressIndex && i < pathPoints.length; i++) {
      points.push(pathPoints[i]);
    }
    
    return points;
  }, [pathPoints, journey.progress]);
  
  // Type guard for journey status
  const isJourneyPointStatus = (status: string): status is JourneyPoint['status'] => {
    return ['pending', 'in_progress', 'completed', 'late'].includes(status);
  };
  
  const isJourneyStatus = (status: string): status is JourneyPath['status'] => {
    return ['planned', 'active', 'completed', 'delayed'].includes(status);
  };
  
  // Animate progress
  useFrame((state) => {
    if (!progressRef.current || prefersReducedMotion) return;
    
    // Simplified animation for mobile
    if (isMobile) {
      if (journey.status === 'active') {
        progressRef.current.scale.set(1.05, 1.05, 1.05);
      }
    } else {
      // Pulse animation for active journeys
      if (journey.status === 'active') {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        progressRef.current.scale.set(scale, scale, scale);
      }
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
  
  // Marker sizes for mobile
  const markerSize = isMobile ? 0.15 : 0.2;
  const selectedMarkerSize = isMobile ? 0.2 : 0.3;
  const lineWidth = isMobile ? 1 : 2;
  const selectedLineWidth = isMobile ? 2 : 3;
  
  return (
    <group>
      {/* Full path */}
      <Line
        points={pathPoints}
        color={getPathColor()}
        lineWidth={isSelected ? selectedLineWidth : lineWidth}
        transparent
        opacity={isSelected ? 0.8 : 0.4}
      />
      
      {/* Progress section */}
      <Line
        ref={progressRef}
        points={progressPoints}
        color={getProgressColor()}
        lineWidth={isSelected ? selectedLineWidth + 1 : lineWidth + 1}
        transparent
      />
      
      {/* Start marker */}
      <mesh position={startVec}>
        <sphereGeometry args={[isSelected ? selectedMarkerSize : markerSize, isMobile ? 8 : 16, isMobile ? 8 : 16]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>
      
      {/* End marker */}
      <mesh position={endVec}>
        <sphereGeometry args={[isSelected ? selectedMarkerSize : markerSize, isMobile ? 8 : 16, isMobile ? 8 : 16]} />
        <meshBasicMaterial 
          color={journey.status === 'completed' ? '#10b981' : 
                 journey.status === 'delayed' ? '#ef4444' : '#94a3b8'} 
        />
      </mesh>
      
      {/* Progress indicator */}
      {progressPoints.length > 0 && (
        <mesh position={progressPoints[progressPoints.length - 1]}>
          <sphereGeometry args={[isMobile ? 0.1 : 0.15, isMobile ? 8 : 16, isMobile ? 8 : 16]} />
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
  const { isLowEnd, isMobile } = useDevicePerformance();
  
  // Reduce complexity for mobile devices
  const maxJourneys = isMobile ? Math.min(50, journeys.length) : journeys.length;
  const visibleJourneys = journeys.slice(0, maxJourneys);
  
  // Simplify visualization on mobile
  const lineWidth = isMobile ? 1 : 2;
  const selectedLineWidth = isMobile ? 2 : 3;
  
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      
      {/* Individual journey paths for better interaction */}
      {!isLowEnd && visibleJourneys.map(journey => (
        <JourneyPathComponent 
          key={journey.id} 
          journey={journey} 
          isSelected={selectedJourney === journey.id}
        />
      ))}
      
      {/* Instanced rendering for performance on low-end devices */}
      {isLowEnd && (
        <InstancedJourneyPaths journeys={visibleJourneys} />
      )}
      
      {/* Simplified grid for mobile */}
      <gridHelper 
        args={[
          20, 
          isMobile ? 10 : 20, 
          isMobile ? '#374151' : '#4b5563', 
          isMobile ? '#374151' : '#4b5563'
        ]} 
        position={[0, -5, 0]} 
      />
    </>
  );
}

// Main Component
export default function JourneyPathVisualization({ 
  journeys,
  selectedJourney,
  onJourneySelect,
  className = "",
  onError
}: {
  journeys: JourneyPath[];
  selectedJourney?: string;
  onJourneySelect?: (id: string) => void;
  className?: string;
  onError?: (error: Error) => void;
}) {
  const { isLowEnd, isMobile, supportsWebGL } = useDevicePerformance();
  const [error, setError] = useState<string | null>(null);
  const { trackVisualizationInteraction, trackError } = useAnalytics();
  
  // Track when the visualization is loaded
  useEffect(() => {
    if (journeys.length > 0) {
      trackVisualizationInteraction('loaded');
    }
  }, [journeys.length, trackVisualizationInteraction]);
  
  // Track when a journey is selected
  const handleJourneySelect = useCallback((id: string) => {
    trackVisualizationInteraction('journey_select');
    if (onJourneySelect) {
      onJourneySelect(id);
    }
  }, [onJourneySelect, trackVisualizationInteraction]);
  
  // Keyboard navigation support
  const { isFocused, handleFocus, handleBlur } = useKeyboardNavigation({
    enabled: !isMobile,
    onEscape: () => {
      if (selectedJourney && onJourneySelect) {
        onJourneySelect('');
        trackVisualizationInteraction('keyboard_escape');
      }
    },
    onSpace: () => {
      trackVisualizationInteraction('keyboard_space');
    },
    onArrowUp: () => {
      trackVisualizationInteraction('keyboard_arrow_up');
    },
    onArrowDown: () => {
      trackVisualizationInteraction('keyboard_arrow_down');
    },
    onArrowLeft: () => {
      trackVisualizationInteraction('keyboard_arrow_left');
    },
    onArrowRight: () => {
      trackVisualizationInteraction('keyboard_arrow_right');
    }
  });

  // Don't render if WebGL is not supported
  if (!supportsWebGL) {
    trackError('WebGL', 'Not supported');
    return (
      <div className={`flex items-center justify-center bg-white/5 rounded-lg ${className}`}>
        <div className="text-center p-4">
          <div className="text-2xl mb-2">⚠️</div>
          <p className="text-white/70">WebGL is not supported in your browser</p>
          <p className="text-white/50 text-sm mt-1">Please try a different browser or enable WebGL</p>
        </div>
      </div>
    );
  }

  // Handle WebGL context loss
  const handleWebGLError = (e: any) => {
    console.error('WebGL Error:', e);
    setError('Failed to initialize 3D visualization');
    trackError('WebGL', 'Initialization failed');
    if (onError) {
      onError(new Error('WebGL initialization failed'));
    }
  };

  // Handle empty journeys
  if (!journeys || journeys.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-white/5 rounded-lg ${className}`}>
        <div className="text-center p-4">
          <div className="text-2xl mb-2">📍</div>
          <p className="text-white/70">No journey data available</p>
          <p className="text-white/50 text-sm mt-1">Create a journey to see visualization</p>
        </div>
      </div>
    );
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
      onCreated={(state) => {
        state.gl.getContext().canvas.addEventListener('webglcontextlost', handleWebGLError, false);
        trackVisualizationInteraction('canvas_created');
      }}
      role="img"
      aria-label="3D Journey Visualization"
      tabIndex={0}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {error ? (
        <Html center>
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-center" role="alert" aria-live="assertive">
            <div className="text-red-400 font-bold mb-1">Visualization Error</div>
            <p className="text-white/80 text-sm">{error}</p>
            <button 
              className="mt-2 px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-white text-xs"
              onClick={() => {
                window.location.reload();
                trackVisualizationInteraction('reload');
              }}
              aria-label="Reload visualization"
            >
              Reload Visualization
            </button>
          </div>
        </Html>
      ) : (
        <JourneyVisualizationScene 
          journeys={journeys} 
          selectedJourney={selectedJourney}
          onJourneySelect={onJourneySelect}
        />
      )}
    </Canvas>
  );
}