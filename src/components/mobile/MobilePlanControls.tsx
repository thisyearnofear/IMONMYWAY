'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/PremiumButton";
import { Input } from '@/components/ui/Input'
import { SpeedPicker } from '@/components/ui/SpeedPicker'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { FloatingButton } from "@/components/ui/PremiumButton";
import { useLocationStore } from '@/stores/locationStore'
import { formatTime, formatDistance } from '@/lib/utils'

interface MobilePlanControlsProps {
  startAddress: string
  endAddress: string
  onStartAddressChange: (value: string) => void
  onEndAddressChange: (value: string) => void
  onPlanRoute: () => void
  onShareRoute: () => void
  planData: any
  isPlanning?: boolean
}

export function MobilePlanControls({
  startAddress,
  endAddress,
  onStartAddressChange,
  onEndAddressChange,
  onPlanRoute,
  onShareRoute,
  planData,
  isPlanning = false
}: MobilePlanControlsProps) {
  const [showRouteForm, setShowRouteForm] = useState(false)
  const [showSpeedPicker, setShowSpeedPicker] = useState(false)
  const [showResults, setShowResults] = useState(false)
  
  const { selectedPace } = useLocationStore()

  const handlePlanRoute = () => {
    onPlanRoute()
    setShowRouteForm(false)
    // Results will be shown when planData is available
  }

  return (
    <>
      {/* Status Bar */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200 safe-area-top">
        <div className="container-mobile py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-sm">
                <div className="font-medium">Plan Mode</div>
                <div className="text-xs text-gray-600">
                  {selectedPace} min/mile pace
                </div>
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
      <FloatingButton
        onClick={() => setShowRouteForm(true)}
        position="bottom-right"
        size="lg"
      >
        <span className="text-xl">🗺️</span>
      </FloatingButton>

      {/* Results Button (when plan exists) */}
      {planData && (
        <FloatingButton
          onClick={() => setShowResults(true)}
          position="bottom-right"
          size="md"
        >
          <span className="text-lg">📊</span>
        </FloatingButton>
      )}

      {/* Route Planning Form */}
      <BottomSheet
        isOpen={showRouteForm}
        onClose={() => setShowRouteForm(false)}
        title="Plan Your Route"
      >
        <div className="space-y-4">
          <Input
            label="Start Address"
            value={startAddress}
            onChange={(e) => onStartAddressChange(e.target.value)}
            placeholder="e.g., Central Park, NYC"
            variant="adaptive"
          />
          
          <Input
            label="End Address"
            value={endAddress}
            onChange={(e) => onEndAddressChange(e.target.value)}
            placeholder="e.g., Times Square, NYC"
            variant="adaptive"
          />

          <div className="pt-2">
            <Button 
              onClick={handlePlanRoute}
              className="w-full"
              disabled={!startAddress.trim() || !endAddress.trim() || isPlanning}
              isLoading={isPlanning}
            >
              {isPlanning ? 'Planning...' : 'Calculate Route'}
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Speed Picker */}
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

      {/* Results Sheet */}
      {planData && (
        <BottomSheet
          isOpen={showResults}
          onClose={() => setShowResults(false)}
          title="Route Summary"
        >
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-blue-900">Your Route</h3>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  planData.confidence >= 80 
                    ? 'bg-green-100 text-green-700' 
                    : planData.confidence >= 65 
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {planData.confidence}% confident
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatDistance(planData.distance)}
                  </div>
                  <div className="text-xs text-gray-600">Distance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatTime(planData.eta)}
                  </div>
                  <div className="text-xs text-gray-600">ETA</div>
                </div>
              </div>
              
              <div className="text-center text-sm text-gray-600 mb-4">
                At {selectedPace} min/mile pace
              </div>
            </div>

            <Button
              onClick={onShareRoute}
              className="w-full"
              variant="secondary"
            >
              📤 Share Route
            </Button>
          </div>
        </BottomSheet>
      )}
    </>
  )
}