import { useState, useEffect, useRef, useCallback } from 'react'
import * as Location from 'expo-location'
import { reverseGeocode } from '../geocoding'

export interface LocationCoords {
  latitude: number
  longitude: number
}

export interface LocationAddress {
  city: string
  state: string
  country: string
  formattedAddress: string
}

export const useLocation = () => {
  const [currentLocation, setCurrentLocation] = useState<string>('Loading...')
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)
  const [locationCoords, setLocationCoords] = useState<LocationCoords | null>(null)
  const [locationAddress, setLocationAddress] = useState<LocationAddress | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean>(false)
  const locationWatcherRef = useRef<any>(null)

  // Request location permissions
  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      const granted = status === 'granted'
      setHasPermission(granted)
      return granted
    } catch {
      return false
    }
  }, [])

  // Request background location permission
  const requestBackgroundLocationPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestBackgroundPermissionsAsync()
      return status === 'granted'
    } catch {
      return false
    }
  }, [])

  // Get address from coordinates via Google Maps Geocoding API
  const getAddressFromCoordinates = useCallback(async (
    latitude: number,
    longitude: number
  ): Promise<string> => {
    const result = await reverseGeocode(latitude, longitude)
    if (result) {
      setLocationAddress(result)
      return result.formattedAddress
    }
    return 'Unknown Location'
  }, [])

  // Get detailed address with all components via Google Maps Geocoding API
  const getDetailedAddress = useCallback(async (
    latitude: number,
    longitude: number
  ): Promise<LocationAddress | null> => {
    return await reverseGeocode(latitude, longitude)
  }, [])

  // Get current location coordinates
  const getCurrentLocation = useCallback(async (): Promise<LocationCoords> => {
    try {
      const hasLocationPermission = await requestLocationPermission()
      if (!hasLocationPermission) {
        throw new Error('Location permission denied')
      }

      const isLocationAvailable = await Location.hasServicesEnabledAsync()
      if (!isLocationAvailable) {
        throw new Error('Location services are disabled')
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }
    } catch (error) {
      throw error
    }
  }, [requestLocationPermission])

  // Fetch current location with address
  const fetchCurrentLocation = useCallback(async () => {
    try {
      setIsLoadingLocation(true)
      
      const hasLocationPermission = await requestLocationPermission()
      if (!hasLocationPermission) {
        setCurrentLocation('Permission Denied')
        setIsLoadingLocation(false)
        return
      }

      const isLocationAvailable = await Location.hasServicesEnabledAsync()
      if (!isLocationAvailable) {
        setCurrentLocation('Location Services Off')
        setIsLoadingLocation(false)
        return
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      })

      const address = await getAddressFromCoordinates(
        location.coords.latitude,
        location.coords.longitude
      )

      setCurrentLocation(address)
      setLocationCoords({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      })
    } catch {
      setCurrentLocation('Error Getting Location')
    } finally {
      setIsLoadingLocation(false)
    }
  }, [requestLocationPermission, getAddressFromCoordinates])

  // Start watching location changes
  const startWatchingLocation = useCallback(async (
    onLocationChange?: (coords: LocationCoords, address: string) => void
  ) => {
    try {
      const hasLocationPermission = await requestLocationPermission()
      if (!hasLocationPermission) return null

      const watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 100
        },
        async (location) => {
          const address = await getAddressFromCoordinates(
            location.coords.latitude,
            location.coords.longitude
          )
          setCurrentLocation(address)
          setLocationCoords({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          })
          
          if (onLocationChange) {
            onLocationChange(
              {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
              }, 
              address
            )
          }
        }
      )
      
      return watcher
    } catch {
      return null
    }
  }, [requestLocationPermission, getAddressFromCoordinates])

  // Stop watching location
  const stopWatchingLocation = useCallback(() => {
    if (locationWatcherRef.current) {
      locationWatcherRef.current.remove()
      locationWatcherRef.current = null
    }
  }, [])

  // Initialize location watching on mount
  useEffect(() => {
    fetchCurrentLocation()

    const initLocationWatching = async () => {
      const watcher = await startWatchingLocation()
      if (watcher) {
        locationWatcherRef.current = watcher
      }
    }

    initLocationWatching()

    return () => {
      stopWatchingLocation()
    }
  }, [fetchCurrentLocation, startWatchingLocation, stopWatchingLocation])

  return {
    // State
    currentLocation,
    isLoadingLocation,
    locationCoords,
    locationAddress,
    hasPermission,
    
    // Methods
    fetchCurrentLocation,
    getCurrentLocation,
    getAddressFromCoordinates,
    getDetailedAddress,
    requestLocationPermission,
    requestBackgroundLocationPermission,
    startWatchingLocation,
    stopWatchingLocation,
  }
}