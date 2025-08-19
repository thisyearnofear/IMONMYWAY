export interface LocationData {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp?: number
}

export interface Destination {
  lat: number
  lng: number
  address?: string
}

export interface SharingSession {
  sharingId: string
  latitude: number
  longitude: number
  path: [number, number][]
  active: boolean
  pace: number // minutes per mile
  destination: Destination | null
  eta: number | null
  createdAt: Date
  lastUpdated: Date
}

export interface SocketEvents {
  // Client to Server
  createSharingID: (data: { pace: number }) => void
  updateLocation: (data: LocationData & { sharingId: string }) => void
  setDestination: (data: { sharingId: string; destination: Destination }) => void
  join: (data: { sharingId: string }) => void
  
  // Server to Client
  watch: (data: { locationData: SharingSession }) => void
  sessionCreated: (data: { success: boolean; sharingId?: string; message?: string }) => void
}

export interface RunPlan {
  id: string
  startAddress: string
  endAddress: string
  startCoords: LocationData
  endCoords: LocationData
  distance: number
  estimatedTime: number
  pace: number
  createdAt: Date
}