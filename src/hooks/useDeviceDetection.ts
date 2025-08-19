'use client'

import { useState, useEffect } from 'react'

interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouchDevice: boolean
  screenWidth: number
  screenHeight: number
  orientation: 'portrait' | 'landscape'
}

const defaultDeviceInfo: DeviceInfo = {
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isTouchDevice: false,
  screenWidth: 1024,
  screenHeight: 768,
  orientation: 'landscape'
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(defaultDeviceInfo)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    const updateDeviceInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      // Mobile: < 768px
      // Tablet: 768px - 1024px
      // Desktop: > 1024px
      const isMobile = width < 768
      const isTablet = width >= 768 && width <= 1024
      const isDesktop = width > 1024
      
      const orientation = height > width ? 'portrait' : 'landscape'

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        screenWidth: width,
        screenHeight: height,
        orientation
      })
    }

    // Initial detection
    updateDeviceInfo()

    // Listen for resize and orientation changes
    window.addEventListener('resize', updateDeviceInfo)
    window.addEventListener('orientationchange', updateDeviceInfo)

    return () => {
      window.removeEventListener('resize', updateDeviceInfo)
      window.removeEventListener('orientationchange', updateDeviceInfo)
    }
  }, [])

  return deviceInfo
}