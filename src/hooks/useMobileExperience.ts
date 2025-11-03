// CONSOLIDATED: Single source of truth for mobile experience (AGGRESSIVE CONSOLIDATION)
// Replaces: useDeviceDetection, useTouchGestures, useMobileOptimization, useHaptics
// ENHANCEMENT FIRST: Building upon existing mobile components

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

interface SafeAreaInsets {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

interface DeviceInfo {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isTouchDevice: boolean;
    orientation: 'portrait' | 'landscape';
    screenSize: 'sm' | 'md' | 'lg' | 'xl';
    hasNotch: boolean;
    supportsHaptics: boolean;
    supportsGeolocation: boolean;
}

// ============================================================================
// MAIN HOOK: CONSOLIDATED MOBILE EXPERIENCE
// ============================================================================

export function useMobileExperience(config: {
    enableHaptics?: boolean;
    enableGestures?: boolean;
    optimizeForOneHand?: boolean;
    enablePullToRefresh?: boolean;
    enableSafeArea?: boolean;
} = {}) {
    const {
        enableHaptics = true,
        enableGestures = true,
        optimizeForOneHand = true,
        enablePullToRefresh = false,
        enableSafeArea = true,
    } = config;

    // ============================================================================
    // DEVICE DETECTION STATE
    // ============================================================================

    const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouchDevice: false,
        orientation: 'portrait',
        screenSize: 'lg',
        hasNotch: false,
        supportsHaptics: false,
        supportsGeolocation: false,
    });

    const [isOneHandMode, setIsOneHandMode] = useState(false);
    const [safeArea, setSafeArea] = useState<SafeAreaInsets>({
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    });

    // ============================================================================
    // DEVICE DETECTION LOGIC
    // ============================================================================

    useEffect(() => {
        const detectDevice = () => {
            const userAgent = navigator.userAgent;
            const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
            const isTabletDevice = /iPad|Android(?=.*Mobile)|Tablet/i.test(userAgent);
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isSmallScreen = window.innerWidth <= 768;

            const screenSize =
                window.innerWidth <= 640 ? 'sm' :
                    window.innerWidth <= 768 ? 'md' :
                        window.innerWidth <= 1024 ? 'lg' : 'xl';

            const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';

            // Detect notch (simplified)
            const hasNotch = window.screen.height > 800 && /iPhone|iPad/.test(userAgent);

            setDeviceInfo({
                isMobile: isMobileDevice || (isTouchDevice && isSmallScreen),
                isTablet: isTabletDevice && !isSmallScreen,
                isDesktop: !isMobileDevice && !isTouchDevice,
                isTouchDevice,
                orientation,
                screenSize,
                hasNotch,
                supportsHaptics: 'vibrate' in navigator,
                supportsGeolocation: 'geolocation' in navigator,
            });
        };

        detectDevice();
        window.addEventListener('resize', detectDevice);
        window.addEventListener('orientationchange', detectDevice);

        return () => {
            window.removeEventListener('resize', detectDevice);
            window.removeEventListener('orientationchange', detectDevice);
        };
    }, []);

    // ============================================================================
    // SAFE AREA DETECTION
    // ============================================================================

    useEffect(() => {
        if (!enableSafeArea) return;

        const updateSafeArea = () => {
            const computedStyle = getComputedStyle(document.documentElement);

            setSafeArea({
                top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
                right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0'),
                bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
                left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0'),
            });
        };

        updateSafeArea();
        window.addEventListener('resize', updateSafeArea);
        window.addEventListener('orientationchange', updateSafeArea);

        return () => {
            window.removeEventListener('resize', updateSafeArea);
            window.removeEventListener('orientationchange', updateSafeArea);
        };
    }, [enableSafeArea]);

    // ============================================================================
    // HAPTIC FEEDBACK
    // ============================================================================

    const triggerHaptic = useCallback(
        (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium') => {
            if (!enableHaptics || !deviceInfo.supportsHaptics) return;

            const patterns = {
                light: [25],
                medium: [50],
                heavy: [100],
                success: [50, 50, 50],
                warning: [100, 50, 100],
                error: [200, 100, 200],
            };

            navigator.vibrate(patterns[type]);
        },
        [enableHaptics, deviceInfo.supportsHaptics]
    );

    // ============================================================================
    // ONE-HAND MODE
    // ============================================================================

    const toggleOneHandMode = useCallback(() => {
        setIsOneHandMode((prev) => !prev);
        triggerHaptic('light');
    }, [triggerHaptic]);

    // ============================================================================
    // RETURN CONSOLIDATED API
    // ============================================================================

    return {
        // Device info
        ...deviceInfo,

        // Safe area
        safeArea: enableSafeArea ? safeArea : { top: 0, right: 0, bottom: 0, left: 0 },

        // One-hand mode
        isOneHandMode,
        toggleOneHandMode,

        // Haptics
        triggerHaptic,

        // Utility functions
        isSmallScreen: deviceInfo.screenSize === 'sm',
        isMediumScreen: deviceInfo.screenSize === 'md',
        isLargeScreen: deviceInfo.screenSize === 'lg' || deviceInfo.screenSize === 'xl',

        // Configuration
        config: {
            enableHaptics,
            enableGestures,
            optimizeForOneHand,
            enablePullToRefresh,
            enableSafeArea,
        },
    };
}

// ============================================================================
// SPECIALIZED HOOKS (MODULAR)
// ============================================================================

// Simple device detection hook
export function useDeviceDetection() {
    const { isMobile, isTablet, isDesktop, isTouchDevice, orientation, screenSize } = useMobileExperience();
    return { isMobile, isTablet, isDesktop, isTouchDevice, orientation, screenSize };
}

// Simple haptics hook
export function useHaptics() {
    const { triggerHaptic, supportsHaptics } = useMobileExperience({ enableHaptics: true });
    return { triggerHaptic, supportsHaptics };
}

// Simple safe area hook
export function useSafeArea() {
    const { safeArea } = useMobileExperience({ enableSafeArea: true });
    return safeArea;
}

// ============================================================================
// TOUCH GESTURES UTILITY (SEPARATE FROM HOOK)
// ============================================================================

interface TouchGestureConfig {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    onPinch?: (scale: number) => void;
    onLongPress?: () => void;
    threshold?: number;
    preventScroll?: boolean;
}

export function createTouchGestureHandler(
    gestureConfig: TouchGestureConfig,
    triggerHaptic?: (type: 'light' | 'medium' | 'heavy') => void
) {
    const {
        onSwipeLeft,
        onSwipeRight,
        onSwipeUp,
        onSwipeDown,
        onPinch,
        onLongPress,
        threshold = 50,
        preventScroll = false,
    } = gestureConfig;

    let touchStart: { x: number; y: number; time: number } | null = null;
    let touchEnd: { x: number; y: number; time: number } | null = null;
    let longPressTimer: NodeJS.Timeout | null = null;
    let pinchStart: number | null = null;

    const handleTouchStart = (e: TouchEvent) => {
        if (preventScroll) {
            e.preventDefault();
        }

        const touch = e.touches[0];
        touchStart = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now(),
        };

        // Start long press timer
        if (onLongPress) {
            longPressTimer = setTimeout(() => {
                onLongPress();
                triggerHaptic?.('heavy');
            }, 500);
        }

        // Handle pinch start
        if (e.touches.length === 2 && onPinch) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );
            pinchStart = distance;
        }
    };

    const handleTouchMove = (e: TouchEvent) => {
        // Clear long press timer on move
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }

        // Handle pinch
        if (e.touches.length === 2 && onPinch && pinchStart) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );
            const scale = distance / pinchStart;
            onPinch(scale);
        }
    };

    const handleTouchEnd = (e: TouchEvent) => {
        // Clear long press timer
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }

        if (!touchStart) return;

        const touch = e.changedTouches[0];
        touchEnd = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now(),
        };

        const deltaX = touchEnd.x - touchStart.x;
        const deltaY = touchEnd.y - touchStart.y;
        const deltaTime = touchEnd.time - touchStart.time;

        // Only process swipes that are fast enough and long enough
        if (
            deltaTime < 300 &&
            (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold)
        ) {
            // Determine swipe direction
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > threshold && onSwipeRight) {
                    onSwipeRight();
                    triggerHaptic?.('light');
                } else if (deltaX < -threshold && onSwipeLeft) {
                    onSwipeLeft();
                    triggerHaptic?.('light');
                }
            } else {
                // Vertical swipe
                if (deltaY > threshold && onSwipeDown) {
                    onSwipeDown();
                    triggerHaptic?.('light');
                } else if (deltaY < -threshold && onSwipeUp) {
                    onSwipeUp();
                    triggerHaptic?.('light');
                }
            }
        }

        // Reset
        touchStart = null;
        touchEnd = null;
        pinchStart = null;
    };

    const attachGestures = (element: HTMLElement | null) => {
        if (!element) return;

        element.addEventListener('touchstart', handleTouchStart, {
            passive: !preventScroll,
        });
        element.addEventListener('touchmove', handleTouchMove, { passive: true });
        element.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
        };
    };

    return { attachGestures };
}