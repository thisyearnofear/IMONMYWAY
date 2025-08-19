// Analytics and prediction engine for ETA accuracy
// This will be the foundation for Strava integration and ML predictions

export interface UserProfile {
  id: string
  averagePace: number
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  preferredActivities: ('walking' | 'running' | 'cycling')[]
  historicalAccuracy: number
  totalDistance: number
  totalSessions: number
}

export interface RouteConditions {
  elevation: {
    gain: number
    loss: number
    maxGrade: number
  }
  weather: {
    temperature: number
    humidity: number
    windSpeed: number
    precipitation: number
  }
  terrain: 'road' | 'trail' | 'mixed'
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
}

export interface PredictionFactors {
  basePace: number
  userProfile: UserProfile
  routeConditions: RouteConditions
  historicalData: SessionData[]
}

export interface SessionData {
  id: string
  userId: string
  startTime: Date
  endTime: Date
  plannedDuration: number
  actualDuration: number
  distance: number
  averagePace: number
  conditions: RouteConditions
  accuracy: number // How close the prediction was (0-100%)
}

// Enhanced ETA calculation with multiple factors
export function calculateEnhancedETA(factors: Partial<PredictionFactors>): {
  estimatedTime: number
  confidence: number
  adjustmentFactors: string[]
} {
  const { basePace = 8, userProfile, routeConditions } = factors
  let adjustedPace = basePace
  let confidence = 75
  const adjustmentFactors: string[] = []

  // User profile adjustments
  if (userProfile) {
    // Adjust based on historical accuracy
    if (userProfile.historicalAccuracy > 85) {
      confidence += 10
      adjustmentFactors.push('High historical accuracy')
    } else if (userProfile.historicalAccuracy < 60) {
      confidence -= 15
      adjustmentFactors.push('Variable historical performance')
    }

    // Adjust based on fitness level
    switch (userProfile.fitnessLevel) {
      case 'elite':
        confidence += 5
        adjustmentFactors.push('Elite fitness level')
        break
      case 'advanced':
        confidence += 3
        break
      case 'beginner':
        confidence -= 5
        adjustedPace *= 1.1 // Slower than stated pace
        adjustmentFactors.push('Beginner pace adjustment')
        break
    }
  }

  // Route condition adjustments
  if (routeConditions) {
    // Elevation adjustments
    if (routeConditions.elevation.gain > 100) {
      const elevationFactor = Math.min(1.5, 1 + (routeConditions.elevation.gain / 1000))
      adjustedPace *= elevationFactor
      adjustmentFactors.push(`Elevation gain: +${Math.round((elevationFactor - 1) * 100)}% time`)
    }

    // Weather adjustments
    if (routeConditions.weather.temperature > 85 || routeConditions.weather.temperature < 32) {
      adjustedPace *= 1.1
      adjustmentFactors.push('Extreme temperature')
    }

    if (routeConditions.weather.windSpeed > 15) {
      adjustedPace *= 1.05
      adjustmentFactors.push('High wind speed')
    }

    if (routeConditions.weather.precipitation > 0.1) {
      adjustedPace *= 1.15
      confidence -= 10
      adjustmentFactors.push('Precipitation affecting pace')
    }

    // Terrain adjustments
    if (routeConditions.terrain === 'trail') {
      adjustedPace *= 1.2
      confidence -= 5
      adjustmentFactors.push('Trail terrain')
    }

    // Time of day adjustments
    if (routeConditions.timeOfDay === 'night') {
      adjustedPace *= 1.05
      confidence -= 5
      adjustmentFactors.push('Night time conditions')
    }
  }

  return {
    estimatedTime: adjustedPace,
    confidence: Math.max(30, Math.min(95, confidence)),
    adjustmentFactors
  }
}

// Strava integration preparation
export interface StravaData {
  athleteId: string
  recentActivities: {
    type: string
    distance: number
    movingTime: number
    averageSpeed: number
    elevationGain: number
    date: Date
  }[]
  athleteStats: {
    recentRunTotals: {
      count: number
      distance: number
      movingTime: number
      elevationGain: number
    }
    allRunTotals: {
      count: number
      distance: number
      movingTime: number
      elevationGain: number
    }
  }
}

export function analyzeStravaData(stravaData: StravaData): UserProfile {
  const recentRuns = stravaData.recentActivities.filter(a => a.type === 'Run')
  const averageSpeed = recentRuns.reduce((sum, run) => sum + run.averageSpeed, 0) / recentRuns.length
  const averagePace = 60 / averageSpeed // Convert to min/mile
  
  // Determine fitness level based on pace and volume
  let fitnessLevel: UserProfile['fitnessLevel'] = 'beginner'
  if (averagePace < 6) fitnessLevel = 'elite'
  else if (averagePace < 7) fitnessLevel = 'advanced'
  else if (averagePace < 9) fitnessLevel = 'intermediate'

  return {
    id: stravaData.athleteId,
    averagePace,
    fitnessLevel,
    preferredActivities: ['running'], // Infer from Strava data
    historicalAccuracy: 80, // Default, will be calculated over time
    totalDistance: stravaData.athleteStats.allRunTotals.distance,
    totalSessions: stravaData.athleteStats.allRunTotals.count
  }
}

// Machine learning preparation - feature extraction
export function extractFeatures(sessionData: SessionData[]): number[][] {
  return sessionData.map(session => [
    session.distance,
    session.plannedDuration,
    session.conditions.elevation.gain,
    session.conditions.weather.temperature,
    session.conditions.weather.humidity,
    session.conditions.weather.windSpeed,
    session.conditions.timeOfDay === 'morning' ? 1 : 0,
    session.conditions.timeOfDay === 'afternoon' ? 1 : 0,
    session.conditions.timeOfDay === 'evening' ? 1 : 0,
    session.conditions.terrain === 'road' ? 1 : 0,
    session.conditions.terrain === 'trail' ? 1 : 0
  ])
}

// Accuracy tracking
export function calculateAccuracy(predicted: number, actual: number): number {
  const difference = Math.abs(predicted - actual)
  const accuracy = Math.max(0, 100 - (difference / predicted) * 100)
  return Math.round(accuracy)
}

// Learning from user behavior
export function updateUserProfile(
  profile: UserProfile, 
  sessionData: SessionData
): UserProfile {
  const newAccuracy = calculateAccuracy(sessionData.plannedDuration, sessionData.actualDuration)
  
  return {
    ...profile,
    historicalAccuracy: (profile.historicalAccuracy * profile.totalSessions + newAccuracy) / (profile.totalSessions + 1),
    averagePace: (profile.averagePace * profile.totalSessions + sessionData.averagePace) / (profile.totalSessions + 1),
    totalDistance: profile.totalDistance + sessionData.distance,
    totalSessions: profile.totalSessions + 1
  }
}