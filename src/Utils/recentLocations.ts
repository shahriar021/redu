import AsyncStorage from '@react-native-async-storage/async-storage'
import { LocationData } from '../home/Users/Components/SearchLocation/type'

const RECENT_LOCATIONS_KEY = 'recent_dropoff_locations'
const MAX_RECENT_LOCATIONS = 10

// Save a recent location
export const saveRecentLocation = async (location: LocationData): Promise<LocationData[]> => {
  try {
    const existing = await getRecentLocations()
    
    // Remove duplicate if exists (by address or coordinates)
    const filtered = existing.filter(loc => 
      loc.address !== location.address && 
      !(Math.abs(loc.latitude - location.latitude) < 0.0001 && 
        Math.abs(loc.longitude - location.longitude) < 0.0001)
    )
    
    // Add new location with timestamp
    const newLocation = { 
      ...location, 
      timestamp: Date.now(),
      id: location.id || `loc_${Date.now()}`
    }
    const updated = [newLocation, ...filtered].slice(0, MAX_RECENT_LOCATIONS)
    
    await AsyncStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(updated))
    return updated
  } catch (error) {
    console.error('Error saving recent location:', error)
    return []
  }
}

// Get all recent locations
export const getRecentLocations = async (): Promise<LocationData[]> => {
  try {
    const data = await AsyncStorage.getItem(RECENT_LOCATIONS_KEY)
    if (data) {
      const locations = JSON.parse(data)
      // Sort by timestamp descending
      return locations.sort((a: LocationData, b: LocationData) => 
        (b.timestamp || 0) - (a.timestamp || 0)
      )
    }
    return []
  } catch (error) {
    console.error('Error getting recent locations:', error)
    return []
  }
}

// Clear all recent locations
export const clearRecentLocations = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(RECENT_LOCATIONS_KEY)
  } catch (error) {
    console.error('Error clearing recent locations:', error)
  }
}

// Remove a specific recent location by id or address
export const removeRecentLocation = async (identifier: string): Promise<LocationData[]> => {
  try {
    const locations = await getRecentLocations()
    const filtered = locations.filter(loc => 
      loc.id !== identifier && loc.address !== identifier
    )
    await AsyncStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(filtered))
    return filtered
  } catch (error) {
    console.error('Error removing recent location:', error)
    return []
  }
}

// Update a recent location
export const updateRecentLocation = async (location: LocationData): Promise<LocationData[]> => {
  try {
    const locations = await getRecentLocations()
    const index = locations.findIndex(loc => loc.id === location.id)
    
    if (index !== -1) {
      locations[index] = { ...location, timestamp: Date.now() }
      await AsyncStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(locations))
      return locations
    }
    return locations
  } catch (error) {
    console.error('Error updating recent location:', error)
    return []
  }
}

// Check if a location exists in recent list
export const isLocationRecent = async (address: string): Promise<boolean> => {
  try {
    const locations = await getRecentLocations()
    return locations.some(loc => loc.address === address)
  } catch (error) {
    console.error('Error checking recent location:', error)
    return false
  }
}

// Get recent locations count
export const getRecentLocationsCount = async (): Promise<number> => {
  try {
    const locations = await getRecentLocations()
    return locations.length
  } catch (error) {
    console.error('Error getting recent locations count:', error)
    return 0
  }
}