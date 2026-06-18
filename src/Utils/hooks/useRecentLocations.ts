import { useState, useEffect, useCallback } from 'react'
import {
  getRecentLocations,
  saveRecentLocation,
  clearRecentLocations,
  removeRecentLocation,
  updateRecentLocation,
  isLocationRecent,
  getRecentLocationsCount
} from '../recentLocations'
import { LocationData } from '../../home/Users/Components/SearchLocation/type'

export const useRecentLocations = () => {
  const [recentLocations, setRecentLocations] = useState<LocationData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [count, setCount] = useState(0)

  // Load recent locations
  const loadRecentLocations = useCallback(async () => {
    try {
      setIsLoading(true)
      const locations = await getRecentLocations()
      setRecentLocations(locations)
      setCount(locations.length)
    } catch (error) {
      console.error('Error loading recent locations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save a location
  const saveLocation = useCallback(async (location: LocationData) => {
    try {
      const updated = await saveRecentLocation(location)
      setRecentLocations(updated)
      setCount(updated.length)
      return true
    } catch (error) {
      console.error('Error saving location:', error)
      return false
    }
  }, [])

  // Clear all locations
  const clearAll = useCallback(async () => {
    try {
      await clearRecentLocations()
      setRecentLocations([])
      setCount(0)
      return true
    } catch (error) {
      console.error('Error clearing locations:', error)
      return false
    }
  }, [])

  // Remove a specific location
  const removeLocation = useCallback(async (identifier: string) => {
    try {
      const updated = await removeRecentLocation(identifier)
      setRecentLocations(updated)
      setCount(updated.length)
      return true
    } catch (error) {
      console.error('Error removing location:', error)
      return false
    }
  }, [])

  // Update a location
  const updateLocation = useCallback(async (location: LocationData) => {
    try {
      const updated = await updateRecentLocation(location)
      setRecentLocations(updated)
      return true
    } catch (error) {
      console.error('Error updating location:', error)
      return false
    }
  }, [])

  // Check if location exists
  const checkIfRecent = useCallback(async (address: string) => {
    try {
      return await isLocationRecent(address)
    } catch (error) {
      console.error('Error checking recent location:', error)
      return false
    }
  }, [])

  // Get count
  const getCount = useCallback(async () => {
    try {
      const locationCount = await getRecentLocationsCount()
      setCount(locationCount)
      return locationCount
    } catch (error) {
      console.error('Error getting count:', error)
      return 0
    }
  }, [])

  // Load on mount
  useEffect(() => {
    loadRecentLocations()
  }, [loadRecentLocations])

  return {
    recentLocations,
    isLoading,
    count,
    saveLocation,
    clearAll,
    removeLocation,
    updateLocation,
    checkIfRecent,
    getCount,
    refresh: loadRecentLocations
  }
}