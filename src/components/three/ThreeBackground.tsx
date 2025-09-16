"use client";

import { Canvas } from '@react-three/fiber';
import { Suspense, useRef, useMemo } from 'react';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useDevicePerformance } from '@/hooks/useDevicePerformance';

function Stars({ count = 5000, size = 0.05 }: { count?: number; size?: number }) {
  const ref = useRef<THREE.Points>(null!);
  const { prefersReducedMotion } = useDevicePerformance();

  const [sphere] = useMemo(() => {
    const sphere = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      sphere[i * 3] = (Math.random() - 0.5) * 20;
      sphere[i * 3 + 1] = (Math.random() - 0.5) * 20;
      sphere[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return [sphere];
  }, [count]);

  useFrame((state) => {
    if (ref.current && !prefersReducedMotion) {
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.1;
    }
  });

  return (
    <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={size}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function FloatingGeometry({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (meshRef.current && !prefersReducedMotion) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} position={[2, 0, -5]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#4f46e5"
        transparent
        opacity={0.3}
        wireframe
      />
    </mesh>
  );
}

export default function ThreeBackground() {
  const { isLowEnd, isMobile, supportsWebGL, prefersReducedMotion } = useDevicePerformance();

  // Don't render 3D background only if WebGL is not supported
  // Allow on low-end devices but reduce quality
  if (!supportsWebGL) {
    return null;
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 75 }}
      gl={{
        antialias: !isMobile,
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
        zIndex: -20
      }}
      dpr={isMobile ? 1 : [1, 2]}
    >
      <Suspense fallback={null}>
        <Scene isMobile={isMobile} prefersReducedMotion={prefersReducedMotion} />
      </Suspense>
    </Canvas>
  );
}

function Scene({ isMobile, prefersReducedMotion }: { isMobile: boolean; prefersReducedMotion: boolean }) {
  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <Stars count={isMobile ? 2000 : 5000} size={isMobile ? 0.03 : 0.05} />
      {!isMobile && <FloatingGeometry prefersReducedMotion={prefersReducedMotion} />}
    </>
  );
}