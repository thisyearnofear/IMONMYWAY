"use client";

import { Canvas } from '@react-three/fiber';
import { Suspense, useRef, useMemo } from 'react';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useDevicePerformance } from '@/hooks/useDevicePerformance';

interface ParticleSystemProps {
  count?: number;
  color?: string;
  size?: number;
}

function Particles({ count = 2000, color = "#60a5fa", size = 0.02 }: ParticleSystemProps) {
  const ref = useRef<THREE.Points>(null!);
  const { prefersReducedMotion } = useDevicePerformance();

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Create a more spread out distribution that's visible
      positions[i * 3] = (Math.random() - 0.5) * 20; // X: -10 to 10
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20; // Y: -10 to 10
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10; // Z: -5 to 5

      // Color variation - brighter colors
      const colorVariation = Math.random() * 0.4;
      colors[i * 3] = 0.4 + colorVariation; // Blue
      colors[i * 3 + 1] = 0.6 + colorVariation; // Green
      colors[i * 3 + 2] = 1.0; // Red - full brightness
    }

    return [positions, colors];
  }, [count]);

  useFrame((state) => {
    if (ref.current && !prefersReducedMotion) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.05;
      ref.current.rotation.y = state.clock.elapsedTime * 0.03;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        vertexColors
        size={size}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.8}
      />
    </Points>
  );
}

export default function WebGLParticleSystem(props: ParticleSystemProps) {
  const { isLowEnd, isMobile, supportsWebGL } = useDevicePerformance();

  // Don't render particle system only if WebGL is not supported
  // Allow on low-end devices but reduce quality
  if (!supportsWebGL) {
    return null;
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 15], fov: 75 }}
      gl={{
        antialias: false,
        alpha: true,
        powerPreference: isMobile ? "low-power" : "high-performance"
      }}
      style={{
        background: 'transparent',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: -10
      }}
      dpr={isMobile ? 1 : [1, 2]}
    >
      <Suspense fallback={null}>
        <Particles {...props} count={isMobile ? Math.floor(props.count! * 0.5) : props.count} size={0.08} />
      </Suspense>
    </Canvas>
  );
}