// Centralized speed/pace logic - DRY principle
export interface SpeedPreset {
  id: string
  label: string
  pace: number // minutes per mile
  speed: number // mph
  icon: string
  category: 'walking' | 'running' | 'cycling'
}

export const SPEED_PRESETS: SpeedPreset[] = [
  { id: 'walk-slow', label: 'Leisurely Walk', pace: 20, speed: 3, icon: '🚶', category: 'walking' },
  { id: 'walk-brisk', label: 'Brisk Walk', pace: 15, speed: 4, icon: '🚶‍♂️', category: 'walking' },
  { id: 'jog-light', label: 'Light Jog', pace: 12, speed: 5, icon: '🏃‍♀️', category: 'running' },
  { id: 'run-normal', label: 'Running', pace: 8, speed: 7.5, icon: '🏃', category: 'running' },
  { id: 'run-fast', label: 'Fast Run', pace: 6, speed: 10, icon: '🏃‍♂️', category: 'running' },
  { id: 'cycle', label: 'Cycling', pace: 3, speed: 20, icon: '🚴', category: 'cycling' }
]

export function findPresetByPace(pace: number): SpeedPreset | undefined {
  return SPEED_PRESETS.find(preset => Math.abs(preset.pace - pace) < 0.5)
}

export function findPresetBySpeed(speed: number): SpeedPreset | undefined {
  return SPEED_PRESETS.find(preset => Math.abs(preset.speed - speed) < 0.5)
}

export function paceToSpeed(pace: number): number {
  return 60 / pace
}

export function speedToPace(speed: number): number {
  return 60 / speed
}

export function getSpeedCategory(pace: number): 'walking' | 'running' | 'cycling' {
  if (pace >= 15) return 'walking'
  if (pace >= 4) return 'running'
  return 'cycling'
}

export function getConfidenceScore(pace: number, distance: number): number {
  let confidence = 85 // Base confidence
  
  // Adjust based on pace realism
  if (pace >= 6 && pace <= 12) confidence += 5 // Realistic running pace
  else if (pace > 15) confidence -= 10 // Walking pace - weather dependent
  else if (pace < 5) confidence -= 5 // Very fast - sustainability question
  
  // Adjust based on distance
  if (distance < 0.1) confidence += 10 // Very close
  else if (distance > 5) confidence -= 15 // Long distance
  
  return Math.max(50, Math.min(95, confidence))
}