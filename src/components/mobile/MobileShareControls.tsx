'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { SpeedPicker } from '@/components/ui/SpeedPicker'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { FloatingButton } from '@/components/ui/FloatingButton'
import { StatusIndicator } from '@/components/ui/StatusIndicator'
import { useLocationStore } from '@/stores/locationStore'
import { useUIStore } from '@/stores/uiStore'
import { copyToClipboard } from '@/lib/utils'

interface MobileShareControlsProps {
  shareUrl: string
  onCreateSession: () => void
  isCreatingSession: boolean
  currentLocation: any
  locationAccuracy: number | null
  isSharing: boolean
}

export function MobileShareControls({
  shareUrl,
  onCreateSession,
  isCreatingSession,
  currentLocation,
  locationAccuracy,
  isSharing
}: MobileShareControlsProps) {
  const [showSpeedPicker, setShowSpeedPicker] = useState(false)
  const [showShareOptions, setShowShareOptions] = useState(false)
  
  const { selectedPace } = useLocationStore()
  const { addToast } = useUIStore()

  const copyShareUrl = async () => {
    try {
      await copyToClipboard(shareUrl)
      addToast({ message: 'Share link copied!', type: 'success' })
      setShowShareOptions(false)
    } catch (error) {
      addToast({ message: 'Failed to copy link', type: 'error' })
    }
  }

  const shareViaSystem = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Track my location',
          text: `Follow my live location and ETA`,
          url: shareUrl
        })
        setShowShareOptions(false)
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      copyShareUrl()
    }
  }

  return (
    <>
      {/* Status Bar - Always visible */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200 safe-area-top">
        <div className="container-mobile py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <StatusIndicator 
                status={currentLocation ? 'online' : 'connecting'} 
                size="sm"
              />
              <div className="text-sm">
                <div className="font-medium">
                  {selectedPace} min/mile pace
                </div>
                {locationAccuracy && (
                  <div className={`text-xs ${
                    locationAccuracy < 50 ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    ±{Math.round(locationAccuracy)}m accuracy
                  </div>
                )}
              </div>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowSpeedPicker(true)}
            >
              ⚙️
            </Button>
          </div>
        </div>
      </div>

      {/* Main Action Button */}
      {!isSharing ? (
        <FloatingButton
          onClick={onCreateSession}
          variant="primary"
          position="bottom-center"
          size="lg"
          className={isCreatingSession ? 'animate-pulse' : ''}
        >
          {isCreatingSession ? (
            <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <span className="text-xl">📍</span>
          )}
        </FloatingButton>
      ) : (
        <FloatingButton
          onClick={() => setShowShareOptions(true)}
          variant="success"
          position="bottom-center"
          size="lg"
        >
          <span className="text-xl">📤</span>
        </FloatingButton>
      )}

      {/* Speed Picker Bottom Sheet */}
      <BottomSheet
        isOpen={showSpeedPicker}
        onClose={() => setShowSpeedPicker(false)}
        title="Set Your Speed"
      >
        <SpeedPicker showCustom={true} />
        <div className="mt-6">
          <Button 
            onClick={() => setShowSpeedPicker(false)}
            className="w-full"
          >
            Done
          </Button>
        </div>
      </BottomSheet>

      {/* Share Options Bottom Sheet */}
      <BottomSheet
        isOpen={showShareOptions}
        onClose={() => setShowShareOptions(false)}
        title="Share Your Location"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <div className="text-2xl mb-2">🎯</div>
            <div className="font-medium text-blue-900">Live Tracking Active</div>
            <div className="text-sm text-blue-700">
              Others can see your real-time location and ETA
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={shareViaSystem}
              className="w-full justify-start"
              variant="secondary"
            >
              <span className="mr-3">📱</span>
              Share via Apps
            </Button>
            
            <Button
              onClick={copyShareUrl}
              className="w-full justify-start"
              variant="secondary"
            >
              <span className="mr-3">📋</span>
              Copy Link
            </Button>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 break-all">
              {shareUrl}
            </div>
          </div>
        </div>
      </BottomSheet>
    </>
  )
}