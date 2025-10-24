'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAIEngine } from '@/hooks/useAIEngine'

interface MapContainerProps {
  center?: [number, number]
  zoom?: number
  className?: string
  onMapReady?: (map: any) => void
  onClick?: (e: any) => void
  userId?: string // For AI route optimization
  destination?: [number, number] // Destination coordinates for route optimization
  children?: React.ReactNode
}

export function MapContainer({
  center = [40.7128, -74.0060], // Default to NYC
  zoom = 13,
  className = '',
  onMapReady,
  onClick,
  userId,
  destination,
  children
}: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const { optimizeRoute, aiPerformanceMetrics } = useAIEngine()
  const [optimizedRoute, setOptimizedRoute] = useState<any | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [showOptimizedRoute, setShowOptimizedRoute] = useState(true)
  const routeRef = useRef<any | null>(null)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    const initMap = async () => {
      try {
        // Dynamically import Leaflet
        const L = await import('leaflet')

        // Fix for default markers in Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        })

        // Clean up existing map if any
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
        }

        if (!mapRef.current) return

        // Initialize map
        const map = L.map(mapRef.current).setView(center, zoom)

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map)

        // Add click handler
        if (onClick) {
          map.on('click', onClick)
        }

        mapInstanceRef.current = map
        setIsMapLoaded(true)

        // Call onMapReady callback
        if (onMapReady) {
          onMapReady(map)
        }

        // Load AI-optimized route if userId and destination are provided
        if (userId && destination) {
          loadOptimizedRoute()
        }
      } catch (error) {
        console.error('Error initializing map:', error)
      }
    }

    initMap()

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
      if (routeRef.current) {
        routeRef.current.remove()
        routeRef.current = null
      }
    }
  }, [center, zoom, onMapReady, onClick, userId, destination])

  // Load AI-optimized route when userId and destination change
  const loadOptimizedRoute = useCallback(async () => {
    if (!userId || !destination || !center || !optimizeRoute) return
    
    setIsOptimizing(true)
    try {
      // Get AI-optimized route
      const routeOptimization = await optimizeRoute(userId, 
        { lat: center[0], lng: center[1] }, 
        { lat: destination[0], lng: destination[1] }
      )
      
      setOptimizedRoute(routeOptimization)
      
      // Draw the optimized route on the map
      drawOptimizedRoute(routeOptimization)
    } catch (error) {
      console.error('Error loading optimized route:', error)
    } finally {
      setIsOptimizing(false)
    }
  }, [userId, destination, center, optimizeRoute])

  // Draw the optimized route on the map
  const drawOptimizedRoute = useCallback(async (routeOptimization: any) => {
    if (!mapInstanceRef.current || !routeOptimization || routeOptimization.alternativeRoutes.length === 0) return
    
    const L = await import('leaflet')
    
    // Remove existing route if present
    if (routeRef.current) {
      mapInstanceRef.current.removeLayer(routeRef.current)
      routeRef.current = null
    }
    
    // Get the best alternative route (first one)
    const bestRoute = routeOptimization.alternativeRoutes[0]
    
    // Create polyline for the route
    const routePoints = bestRoute.routeDetails?.points || []
    if (routePoints.length === 0) return
    
    const polyline = L.polyline(routePoints, {
      color: '#8B5CF6', // Purple color for optimized routes
      weight: 6,
      opacity: 0.8,
      dashArray: '10, 10', // Dashed line to distinguish from regular routes
      lineCap: 'round',
      lineJoin: 'round'
    })
    
    // Add tooltip with route information
    const timeSaved = Math.round(bestRoute.timeSaved / 60) // Convert to minutes
    polyline.bindTooltip(
      `<div class="text-sm">
        <div class="font-bold">AI-Optimized Route</div>
        <div>⏱️ Time saved: ${timeSaved} min</div>
        <div>🛣️ Distance: ${(bestRoute.distance / 1000).toFixed(1)} km</div>
        <div class="text-xs mt-1">Confidence: ${Math.round(routeOptimization.confidence * 100)}%</div>
      </div>`,
      { 
        permanent: false, 
        direction: 'top',
        className: 'bg-white/90 text-gray-900 p-2 rounded shadow-lg'
      }
    )
    
    // Add to map
    polyline.addTo(mapInstanceRef.current)
    routeRef.current = polyline
    
    // Fit map bounds to show the route
    const bounds = L.latLngBounds(routePoints)
    mapInstanceRef.current.fitBounds(bounds.pad(0.1))
  }, [])

  // Toggle optimized route visibility
  const toggleOptimizedRoute = useCallback(() => {
    if (!routeRef.current || !mapInstanceRef.current) return
    
    setShowOptimizedRoute(prev => {
      const newShow = !prev
      if (newShow) {
        mapInstanceRef.current.addLayer(routeRef.current)
      } else {
        mapInstanceRef.current.removeLayer(routeRef.current)
      }
      return newShow
    })
  }, [])

  // Refresh optimized route
  const refreshOptimizedRoute = useCallback(() => {
    if (userId && destination && center) {
      loadOptimizedRoute()
    }
  }, [userId, destination, center, loadOptimizedRoute])

  return (
    <div className={`map-container ${className}`}>
      <div ref={mapRef} className="h-full w-full relative">
        {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-gray-500">Loading map...</div>
          </div>
        )}
        
        {/* AI Route Optimization Controls */}
        {userId && destination && isMapLoaded && (
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            {/* AI Confidence Indicator */}
            {aiPerformanceMetrics.modelConfidence > 0.7 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-gray-200">
                <div className="flex items-center text-xs text-gray-700">
                  <span className="mr-1">🤖</span>
                  <span>AI Confidence: {Math.round(aiPerformanceMetrics.modelConfidence * 100)}%</span>
                </div>
              </div>
            )}
            
            {/* Route Optimization Controls */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              <button
                onClick={toggleOptimizedRoute}
                className={`w-full px-3 py-2 text-xs font-medium flex items-center justify-between ${
                  showOptimizedRoute 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={showOptimizedRoute ? 'Hide optimized route' : 'Show optimized route'}
              >
                <span className="flex items-center">
                  <span className="mr-1">🔮</span>
                  AI Route
                </span>
                <span>{showOptimizedRoute ? '👁️' : '🙈'}</span>
              </button>
              
              <button
                onClick={refreshOptimizedRoute}
                disabled={isOptimizing}
                className="w-full px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                title="Refresh optimized route"
              >
                {isOptimizing ? (
                  <>
                    <span className="mr-1 animate-spin">🔄</span>
                    Optimizing...
                  </>
                ) : (
                  <>
                    <span className="mr-1">🔄</span>
                    Refresh
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        
        {/* Optimized Route Info Panel */}
        {optimizedRoute && showOptimizedRoute && isMapLoaded && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[1000]">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <span className="text-xl mr-2">🔮</span>
                  <div>
                    <h3 className="font-bold text-gray-900">AI-Optimized Route</h3>
                    <p className="text-xs text-gray-600">
                      Confidence: {Math.round(optimizedRoute.confidence * 100)}%
                    </p>
                  </div>
                </div>
                <button 
                  onClick={toggleOptimizedRoute}
                  className="text-gray-500 hover:text-gray-700"
                  title="Close"
                >
                  ✕
                </button>
              </div>
              
              {optimizedRoute.alternativeRoutes.length > 0 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-blue-50 rounded-lg p-2">
                      <div className="text-lg font-bold text-blue-600">
                        {Math.round(optimizedRoute.alternativeRoutes[0].timeSaved / 60)}m
                      </div>
                      <div className="text-xs text-gray-600">Saved</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2">
                      <div className="text-lg font-bold text-green-600">
                        {(optimizedRoute.alternativeRoutes[0].distance / 1000).toFixed(1)}km
                      </div>
                      <div className="text-xs text-gray-600">Distance</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-2">
                      <div className="text-lg font-bold text-purple-600">
                        {optimizedRoute.alternativeRoutes.length}
                      </div>
                      <div className="text-xs text-gray-600">Alternatives</div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-700 bg-gray-50 rounded-lg p-3">
                    <div className="font-medium mb-1">💡 AI Recommendation</div>
                    <div>
                      Take {optimizedRoute.alternativeRoutes[0].routeDetails?.highwayAvoidance ? 'surface streets' : 'highways'} 
                      to save {Math.round(optimizedRoute.alternativeRoutes[0].timeSaved / 60)} minutes. 
                      Traffic conditions: {optimizedRoute.trafficConditions}.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {children}
    </div>
  )
}