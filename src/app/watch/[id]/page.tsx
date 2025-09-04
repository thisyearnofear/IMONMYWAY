'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Navigation } from '@/components/layout/Navigation'
import { ToastContainer } from '@/components/ui/Toast'
import { BetCard } from '@/components/betting/BetCard'
import { ReputationBadge } from '@/components/reputation/ReputationBadge'
import { useLocationStore } from '@/stores/locationStore'
import { useUIStore } from '@/stores/uiStore'
import { useBettingStore } from '@/stores/bettingStore'
import { useWallet } from '@/hooks/useWallet'
import { useBetting } from '@/hooks/useBetting'
import { socketManager } from '@/lib/socket'
import { formatTime } from '@/lib/utils'
import { MapContainer } from '@/components/map/MapContainer'
import type { ActiveBet } from '@/stores/bettingStore'

export default function WatchPage() {
  const params = useParams()
  const sharingId = params.id as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [activeBet, setActiveBet] = useState<ActiveBet | null>(null)
  const [userReputation, setUserReputation] = useState<number>(7500)
  const mapRef = useRef<any | null>(null)
  const markerRef = useRef<any | null>(null)
  const destinationMarkerRef = useRef<any | null>(null)
  const pathRef = useRef<any | null>(null)

  const {
    watchedSession,
    setWatchedSession,
    updateWatchedSession,
    clearWatchedSession,
    isWalletConnected
  } = useLocationStore()

  const { isConnected, address } = useWallet()
  const { getCommitmentDetails, getUserReputation } = useBetting()
  const { activeBets } = useBettingStore()

  const { addToast, setConnected } = useUIStore()

  useEffect(() => {
    if (!sharingId) return

    const socket = socketManager.connect()
    
    socket.on('connect', () => {
      setConnected(true)
      // Join the sharing room
      socket.emit('join', { sharingId })
    })

    socket.on('disconnect', () => {
      setConnected(false)
      addToast({ message: 'Connection lost', type: 'error' })
    })

    socket.on('watch', (data) => {
      setIsLoading(false)
      
      if (data.locationData) {
        const session = data.locationData
        
        if (watchedSession) {
          updateWatchedSession(session)
        } else {
          setWatchedSession(session)
        }

        // Update map
        updateMap(session)
        
        // If this is a staked commitment, load betting details
        if (session.commitmentId && isConnected) {
          loadCommitmentDetails(session.commitmentId)
        }
      }
    })

    // Initial connection
    socket.emit('join', { sharingId })

    return () => {
      clearWatchedSession()
      socket.disconnect()
    }
  }, [sharingId])

  const updateMap = (session: any) => {
    if (!mapRef.current || typeof window === 'undefined') return

    const { latitude, longitude, path, destination, active } = session

    // Skip if no valid coordinates
    if (latitude === 0 && longitude === 0) {
      return
    }

    import('leaflet').then((L) => {
      // Update or create user marker
      if (!markerRef.current) {
        markerRef.current = L.marker([latitude, longitude]).addTo(mapRef.current)
        mapRef.current.setView([latitude, longitude], 16)
      } else {
        markerRef.current.setLatLng([latitude, longitude])
      }

      // Update marker color based on active status
      const iconUrl = active 
        ? 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png'
        : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png'
      
      markerRef.current.setIcon(L.icon({
        iconUrl,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      }))

      // Update destination marker
      if (destination) {
        if (!destinationMarkerRef.current) {
          destinationMarkerRef.current = L.marker([destination.lat, destination.lng], {
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
          destinationMarkerRef.current.setLatLng([destination.lat, destination.lng])
        }
      }

      // Update path
      if (path && path.length > 1) {
        if (pathRef.current) {
          pathRef.current.setLatLngs(path)
        } else {
          pathRef.current = L.polyline(path, {
            color: active ? 'blue' : 'gray',
            weight: 3,
            opacity: 0.7
          }).addTo(mapRef.current)
        }
      }

      // Auto-center map on current location
      mapRef.current.setView([latitude, longitude], Math.max(mapRef.current.getZoom(), 13))
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading location data...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!watchedSession) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Session Not Found</h1>
            <p className="text-gray-600 mb-4">
              The sharing session you&apos;re looking for doesn&apos;t exist or has ended.
            </p>
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              Return to Home
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Live Location Tracking
          </h1>
          <p className="text-gray-600">
            Watching real-time location updates
          </p>
        </div>

        {/* Status Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${
                watchedSession.active ? 'text-green-600' : 'text-gray-500'
              }`}>
                <div className={`w-3 h-3 rounded-full ${
                  watchedSession.active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`}></div>
                <span className="font-medium">
                  {watchedSession.active ? 'Live' : 'Offline'}
                </span>
              </div>
              
              <div className="text-gray-600">
                <span className="font-medium">Pace:</span> {watchedSession.pace} min/mile
              </div>

              {watchedSession.isStaked && (
                <div className="flex items-center space-x-2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Staked
                  </span>
                  <ReputationBadge score={userReputation} size="sm" />
                </div>
              )}
            </div>

            {watchedSession.eta && watchedSession.destination && (
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {formatTime(watchedSession.eta)}
                </div>
                <div className="text-sm text-gray-600">ETA</div>
              </div>
            )}
          </div>

          {watchedSession.stakeAmount && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Stake:</span> 
                <span className="ml-2 text-green-600 font-medium">
                  {(Number(watchedSession.stakeAmount) / 1e18).toFixed(3)} STT
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="relative">
            <span className={`absolute top-4 left-4 z-10 px-2 py-1 rounded text-sm font-medium ${
              watchedSession.active 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-500 text-white'
            }`}>
              {watchedSession.active ? 'Live Tracking' : 'Last Known Location'}
            </span>
            
            <MapContainer
              className="h-96"
              center={[watchedSession.latitude, watchedSession.longitude]}
              onMapReady={(map) => { 
                mapRef.current = map
                updateMap(watchedSession)
              }}
            />
          </div>
        </div>

        {/* Betting Interface */}
        {activeBet && isConnected && (
          <div className="mb-6">
            <BetCard 
              bet={activeBet}
              canBet={activeBet.userAddress !== address}
              showBetInterface={activeBet.status === 'active'}
            />
          </div>
        )}

        {/* Betting Prompt for Non-Connected Users */}
        {watchedSession.isStaked && !isConnected && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Want to Bet on This Commitment?</h3>
            <p className="text-blue-800 text-sm mb-3">
              Connect your wallet to bet on whether this person will make it on time!
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Connect Wallet to Bet
            </button>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Latitude:</span>
                <span className="font-mono">{watchedSession.latitude.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Longitude:</span>
                <span className="font-mono">{watchedSession.longitude.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span>{new Date(watchedSession.lastUpdated).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Progress</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Path Points:</span>
                <span>{watchedSession.path.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={watchedSession.active ? 'text-green-600' : 'text-gray-500'}>
                  {watchedSession.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {watchedSession.destination && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Destination Set:</span>
                  <span className="text-green-600">Yes</span>
                </div>
              )}
              {watchedSession.isStaked && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Commitment Type:</span>
                  <span className="text-purple-600 font-medium">Staked</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <ToastContainer />
    </div>
  )
}