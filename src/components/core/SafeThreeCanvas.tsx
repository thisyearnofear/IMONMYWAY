"use client";

import { Canvas, CanvasProps } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { ClientOnly } from './ClientOnly';

interface SafeThreeCanvasProps extends CanvasProps {
    fallback?: React.ReactNode;
    onWebGLError?: (error: Event) => void;
    disabled?: boolean;
}

/**
 * Safe Three.js Canvas wrapper that handles WebGL context loss gracefully
 */
export function SafeThreeCanvas({
    children,
    fallback = null,
    onWebGLError,
    disabled = false,
    ...canvasProps
}: SafeThreeCanvasProps) {
    const [hasWebGLError, setHasWebGLError] = useState(false);
    const [isWebGLSupported, setIsWebGLSupported] = useState(true);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Check WebGL support
    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

            if (!gl) {
                setIsWebGLSupported(false);
                return;
            }

            // Test if WebGL is actually working
            if (gl instanceof WebGLRenderingContext || gl instanceof WebGL2RenderingContext) {
                const supported = gl.getParameter(gl.VERSION);
                if (!supported) {
                    setIsWebGLSupported(false);
                }
            } else {
                setIsWebGLSupported(false);
            }
        } catch (error) {
            console.warn('WebGL support check failed:', error);
            setIsWebGLSupported(false);
        }
    }, []);

    // Handle WebGL context loss
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleContextLost = (event: Event) => {
            console.warn('WebGL context lost');
            event.preventDefault();
            setHasWebGLError(true);
            onWebGLError?.(event);
        };

        const handleContextRestored = () => {
            console.log('WebGL context restored');
            setHasWebGLError(false);
        };

        canvas.addEventListener('webglcontextlost', handleContextLost, false);
        canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

        return () => {
            canvas.removeEventListener('webglcontextlost', handleContextLost);
            canvas.removeEventListener('webglcontextrestored', handleContextRestored);
        };
    }, [onWebGLError]);

    // Show fallback if WebGL is disabled, not supported, or has errors
    if (disabled || !isWebGLSupported || hasWebGLError) {
        return (
            <div className="flex items-center justify-center w-full h-full bg-graphite-800/50 rounded-lg">
                {fallback || (
                    <div className="text-center text-gray-400">
                        <div className="text-2xl mb-2">🎨</div>
                        <p className="text-sm">
                            {disabled
                                ? 'Graphics disabled'
                                : !isWebGLSupported
                                    ? 'WebGL not supported'
                                    : 'Graphics temporarily unavailable'
                            }
                        </p>
                        {hasWebGLError && !disabled && (
                            <button
                                onClick={() => setHasWebGLError(false)}
                                className="mt-2 text-xs text-violet-400 hover:text-violet-300"
                            >
                                Try again
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <ClientOnly fallback={fallback}>
            <Canvas
                ref={canvasRef}
                {...canvasProps}
                gl={{
                    antialias: false, // Disable for better performance
                    alpha: true,
                    powerPreference: 'high-performance',
                    failIfMajorPerformanceCaveat: false,
                    preserveDrawingBuffer: false,
                    ...canvasProps.gl
                }}
                onCreated={(state) => {
                    try {
                        // Add error handling to the WebGL context
                        const gl = state.gl.getContext();

                        // Handle context loss gracefully
                        gl.canvas.addEventListener('webglcontextlost', (event) => {
                            console.warn('WebGL context lost during render');
                            event.preventDefault();
                            setHasWebGLError(true);
                        }, false);

                        // Call original onCreated if provided
                        canvasProps.onCreated?.(state);
                    } catch (error) {
                        console.warn('Error setting up WebGL context:', error);
                        setHasWebGLError(true);
                    }
                }}
            >
                {children}
            </Canvas>
        </ClientOnly>
    );
}