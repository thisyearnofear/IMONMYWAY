import { useState, useEffect } from 'react';

export function useDevicePerformance() {
    const [performance, setPerformance] = useState({
        isLowEnd: false,
        isMobile: false,
        prefersReducedMotion: false,
        supportsWebGL: true,
    });

    useEffect(() => {
        // Check device capabilities
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        );

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // More nuanced performance check - only disable on very low-end devices
        // Allow 3D effects on most modern devices including mobile
        const isVeryLowEnd = navigator.hardwareConcurrency <= 1;

        // Check WebGL support
        let supportsWebGL = true;
        try {
            const canvas = document.createElement('canvas');
            supportsWebGL = !!(window.WebGLRenderingContext &&
                canvas.getContext('webgl'));
        } catch (e) {
            supportsWebGL = false;
        }

        setPerformance({
            isLowEnd: isVeryLowEnd,
            isMobile,
            prefersReducedMotion,
            supportsWebGL,
        });
    }, []);

    return performance;
}