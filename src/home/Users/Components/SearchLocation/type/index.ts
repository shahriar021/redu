export interface LocationData {
  id?: string
  title: string
  address: string
  latitude: number
  longitude: number
  distance?: string
  timestamp?: number
}

export interface SearchSuggestion {
  address: string
  lat: number
  lng: number
}

export interface RoutePoint {
  latitude: number
  longitude: number
}

export interface RouteData {
  points: RoutePoint[]
  distance: number
  duration: number
  polyline: string
}