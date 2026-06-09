'use client'

import { useEffect, useRef, useState } from 'react'

interface MapContainerProps {
  center?: [number, number]
  zoom?: number
  className?: string
  onMapReady?: (map: any) => void
  onClick?: (e: any) => void
  children?: React.ReactNode
}

export function MapContainer({
  center = [40.7128, -74.0060],
  zoom = 13,
  className = '',
  onMapReady,
  onClick,
  children
}: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const initMap = async () => {
      try {
        const L = await import('leaflet')

        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        })

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
        }

        if (!mapRef.current) return

        const map = L.map(mapRef.current).setView(center, zoom)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map)

        if (onClick) {
          map.on('click', onClick)
        }

        mapInstanceRef.current = map
        setIsMapLoaded(true)

        if (onMapReady) {
          onMapReady(map)
        }
      } catch (error) {
        console.error('Error initializing map:', error)
      }
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [center, zoom, onMapReady, onClick])

  return (
    <div className={`map-container ${className}`}>
      <div ref={mapRef} className="h-full w-full relative">
        {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-gray-500">Loading map...</div>
          </div>
        )}
      </div>
      {children}
    </div>
  )
}
