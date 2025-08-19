'use client'

import { useState, useEffect, useRef } from 'react'
import { Navigation } from '@/components/layout/Navigation'
import { ToastContainer } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { SpeedPicker } from '@/components/ui/SpeedPicker'
import { MobileShareControls } from '@/components/mobile/MobileShareControls'
import { useLocationStore } from '@/stores/locationStore'
import { useUIStore } from '@/stores/uiStore'
import { useDeviceDetection } from '@/hooks/useDeviceDetection'
import { socketManager } from '@/lib/socket'
import { generateShareUrl, copyToClipboard } from '@/lib/utils'
import { MapContainer } from '@/components/map/MapContainer'

export default function SharePage() {
  const [shareUrl, setShareUrl] = useState('')
  const [isWatchingPosition, setIsWatchingPosition] = useState(false)
  const deviceInfo = useDeviceDetection()
  
  const mapRef = useRef<any | null>(null)
  const markerRef = useRef<any | null>(null)
  const destinationMarkerRef = useRef<any | null>(null)
  const watchIdRef = useRef<number | null>(null)

  const {
    currentLocation,
    locationAccuracy,
    sharingSession,
    isSharing,
    selectedPace,
    setCurrentLocation,
    setLocationAccuracy,
    setSharingSession,
    setDestination,
    startTracking,
    stopTracking
  } = useLocationStore()

  const {
    addToast,
    isCreatingSession,
    setCreatingSession,
    setConnected,
    isMapFollowing,
    setMapFollowing
  } = useUIStore()

  useEffect(() => {
    const socket = socketManager.connect()
    
    socket.on('connect', () => {
      setConnected(true)
      addToast({ message: 'Connected to server', type: 'success' })
    })

    socket.on('disconnect', () => {
      setConnected(false)
      addToast({ message: 'Disconnected from server', type: 'error' })
    })

    socket.on('sessionCreated', (data) => {
      setCreatingSession(false)
      if (data.success && data.sharingId) {
        const url = generateShareUrl(data.sharingId)
        setShareUrl(url)
        setSharingSession({
          sharingId: data.sharingId,
          latitude: currentLocation?.latitude || 0,
          longitude: currentLocation?.longitude || 0,
          path: [],
          active: true,
          pace: selectedPace,
          destination: null,
          eta: null,
          createdAt: new Date(),
          lastUpdated: new Date()
        })
        addToast({ message: 'Share link created successfully!', type: 'success' })
      } else {
        addToast({ message: data.message || 'Failed to create share link', type: 'error' })
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const startLocationTracking = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      addToast({ message: 'Geolocation is not supported', type: 'error' })
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    }

    const success = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords
      
      setCurrentLocation({ latitude, longitude, accuracy })
      setLocationAccuracy(accuracy || 0)

      // Update map marker
      if (mapRef.current) {
        if (typeof window !== 'undefined') {
          import('leaflet').then((L) => {
            if (!markerRef.current) {
              markerRef.current = L.marker([latitude, longitude]).addTo(mapRef.current)
              mapRef.current.setView([latitude, longitude], 16)
            } else {
              markerRef.current.setLatLng([latitude, longitude])
            }

            // Follow mode
            if (isMapFollowing) {
              mapRef.current.setView([latitude, longitude], Math.max(mapRef.current.getZoom(), 13))
            }
          })
        }
      }

      // Send to server if sharing
      if (isSharing && sharingSession) {
        const socket = socketManager.getSocket()
        if (socket) {
          socket.emit('updateLocation', {
            sharingId: sharingSession.sharingId,
            latitude,
            longitude,
            active: true
          })
        }
      }
    }

    const error = (err: GeolocationPositionError) => {
      addToast({ 
        message: `Location error: ${err.message}`, 
        type: 'error' 
      })
    }

    watchIdRef.current = navigator.geolocation.watchPosition(success, error, options)
    setIsWatchingPosition(true)
    startTracking()
  }

  const stopLocationTracking = () => {
    if (typeof navigator !== 'undefined' && watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsWatchingPosition(false)
    stopTracking()
  }

  const createSharingSession = async () => {
    if (!currentLocation) {
      addToast({ message: 'Please enable location tracking first', type: 'warning' })
      return
    }

    setCreatingSession(true)
    const socket = socketManager.getSocket()
    
    if (socket) {
      socket.emit('createSharingID', { pace: selectedPace })
    } else {
      setCreatingSession(false)
      addToast({ message: 'Not connected to server', type: 'error' })
    }
  }

  const handleMapClick = (e: any) => {
    if (!isSharing || !sharingSession) {
      addToast({ message: 'Create a share link first', type: 'warning' })
      return
    }

    const { lat, lng } = e.latlng
    
    // Update destination marker
    if (mapRef.current && typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        if (!destinationMarkerRef.current) {
          destinationMarkerRef.current = L.marker([lat, lng], {
            icon: L.icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })
          }).addTo(mapRef.current)
        } else {
          destinationMarkerRef.current.setLatLng([lat, lng])
        }
      })
    }

    // Update store and send to server
    const destination = { lat, lng }
    setDestination(destination)
    
    const socket = socketManager.getSocket()
    if (socket) {
      socket.emit('setDestination', {
        sharingId: sharingSession.sharingId,
        destination
      })
    }

    addToast({ message: 'Destination set', type: 'info' })
  }

  const copyShareUrl = async () => {
    try {
      await copyToClipboard(shareUrl)
      addToast({ message: 'Share link copied to clipboard', type: 'success' })
    } catch (error) {
      addToast({ message: 'Failed to copy link', type: 'error' })
    }
  }

  useEffect(() => {
    startLocationTracking()
    return () => stopLocationTracking()
  }, [])

  // Mobile-first rendering
  if (deviceInfo.isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Full-screen map on mobile */}
        <div className="fixed inset-0">
          <MapContainer
            className="h-full"
            onMapReady={(map) => { mapRef.current = map }}
            onClick={handleMapClick}
          />
        </div>

        {/* Mobile controls overlay */}
        <MobileShareControls
          shareUrl={shareUrl}
          onCreateSession={createSharingSession}
          isCreatingSession={isCreatingSession}
          currentLocation={currentLocation}
          locationAccuracy={locationAccuracy}
          isSharing={isSharing}
        />

        <ToastContainer />
      </div>
    )
  }

  // Desktop layout
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Share Your Live Location
          </h1>
          <p className="text-gray-600">
            Set your pace, click the map to set a destination, and share your real-time location
          </p>
        </div>

        {/* Map */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="relative">
            <span className="absolute top-4 left-4 z-10 bg-green-600 text-white px-2 py-1 rounded text-sm font-medium">
              Live
            </span>
            <MapContainer
              className="h-96"
              onMapReady={(map) => { mapRef.current = map }}
              onClick={handleMapClick}
            />
            <div className="absolute bottom-4 right-4 z-10">
              <Button
                size="sm"
                variant={isMapFollowing ? 'primary' : 'outline'}
                onClick={() => setMapFollowing(!isMapFollowing)}
              >
                📍 Follow
              </Button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-6">
            <SpeedPicker />
            <div className="flex items-end">
              <Button
                onClick={createSharingSession}
                isLoading={isCreatingSession}
                disabled={!currentLocation || isSharing}
                className="w-full"
              >
                {isSharing ? 'Sharing Active' : 'Create Share Link'}
              </Button>
            </div>
          </div>

          {/* GPS Status */}
          <div className="mt-4 text-center">
            <p className={`text-sm ${
              locationAccuracy && locationAccuracy < 50 
                ? 'text-green-600' 
                : 'text-yellow-600'
            }`}>
              GPS Accuracy: {
                locationAccuracy 
                  ? `${Math.round(locationAccuracy)} meters`
                  : 'Acquiring...'
              }
            </p>
          </div>
        </div>

        {/* Share Link */}
        {shareUrl && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Link</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
              <Button onClick={copyShareUrl}>
                Copy
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Click the map to set a destination for ETA calculation
            </p>
          </div>
        )}
      </main>

      <ToastContainer />
    </div>
  )
}