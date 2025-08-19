'use client'

import { Button } from './Button'
import { Input } from './Input'
import { SPEED_PRESETS, findPresetByPace } from '@/lib/speed'
import { useLocationStore } from '@/stores/locationStore'
import { useState } from 'react'

interface SpeedPickerProps {
  className?: string
  showCustom?: boolean
}

export function SpeedPicker({ className, showCustom = true }: SpeedPickerProps) {
  const { selectedPace, setSelectedPace } = useLocationStore()
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customPace, setCustomPace] = useState(selectedPace.toString())

  const currentPreset = findPresetByPace(selectedPace)

  const handlePresetSelect = (pace: number) => {
    setSelectedPace(pace)
    setShowCustomInput(false)
  }

  const handleCustomSubmit = () => {
    const pace = parseFloat(customPace)
    if (pace > 0 && pace <= 30) {
      setSelectedPace(pace)
      setShowCustomInput(false)
    }
  }

  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">How fast will you move?</h3>
        <p className="text-sm text-gray-600">This helps us calculate accurate arrival times</p>
      </div>

      {/* Current Selection */}
      <div className="bg-blue-50 rounded-xl p-4 mb-4 text-center">
        <div className="text-2xl mb-1">{currentPreset?.icon || '⚡'}</div>
        <div className="font-medium">{currentPreset?.label || 'Custom Speed'}</div>
        <div className="text-sm text-gray-600">{selectedPace} min/mile</div>
      </div>

      {/* Preset Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {SPEED_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            variant="secondary"
            size="sm"
            icon={preset.icon}
            selected={currentPreset?.id === preset.id}
            onClick={() => handlePresetSelect(preset.pace)}
            className="text-left justify-start h-auto py-3"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{preset.label}</div>
              <div className="text-xs text-gray-500">{preset.pace} min/mile</div>
            </div>
          </Button>
        ))}
      </div>

      {/* Custom Input */}
      {showCustom && (
        <div className="border-t pt-4">
          {!showCustomInput ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCustomInput(true)}
              className="w-full border-2 border-dashed border-gray-300"
            >
              ⚙️ Custom Speed
            </Button>
          ) : (
            <div className="space-y-2">
              <Input
                type="number"
                value={customPace}
                onChange={(e) => setCustomPace(e.target.value)}
                placeholder="Minutes per mile"
                step="0.1"
                min="1"
                max="30"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCustomSubmit} className="flex-1">
                  Apply
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setShowCustomInput(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}