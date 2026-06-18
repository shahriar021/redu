// BookingContext.tsx - Updated with all needed methods
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

import { LocationData, RouteData } from '../home/Users/Components/SearchLocation/type'
import { getRecentLocations, saveRecentLocation } from '../Utils/recentLocations'

export interface SelectedTruck {
  id: string
  name: string
  capacity: string
  icon?: string
  iconBg?: string
  iconColor?: string
  driverId?: string
  hourlyRate?: number
  basePrice?: number
  description?: string
}

export interface CostBreakdown {
  basePrice: number
  distanceCost: number
  serviceCharge: number
  total: number
}

export interface BookingState {
  // Location data
  pickupLocation: LocationData | null
  dropoffLocation: LocationData | null
  routeData: RouteData | null

  // Schedule data
  scheduleDate: string | null
  scheduleTime: string | null
  workNotes: string

  // Truck selection
  selectedTruck: SelectedTruck | null
  
  // Cost calculation
  estimatedPrice: number | null
  distance: number | null
  duration: number | null
}

interface BookingContextValue extends BookingState {
  setPickupLocation: (location: LocationData | null) => void
  setDropoffLocation: (location: LocationData | null) => void
  setRouteData: (routeData: RouteData | null) => void
  setScheduleDate: (date: string | null) => void
  setScheduleTime: (time: string | null) => void
  setWorkNotes: (notes: string) => void
  setSelectedTruck: (truck: SelectedTruck | null) => void
  setEstimatedPrice: (price: number | null) => void
  setDistance: (distance: number | null) => void
  setDuration: (duration: number | null) => void
  resetBooking: () => void
  clearLocationData: () => void
  saveLocation: (location: LocationData) => Promise<boolean>
  getRecentLocations: () => Promise<LocationData[]>
}

const initialState: BookingState = {
  pickupLocation: null,
  dropoffLocation: null,
  routeData: null,
  scheduleDate: null,
  scheduleTime: null,
  workNotes: '',
  selectedTruck: null,
  estimatedPrice: null,
  distance: null,
  duration: null,
}

const BookingContext = createContext<BookingContextValue | undefined>(undefined)

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(null)
  const [dropoffLocation, setDropoffLocation] = useState<LocationData | null>(null)
  const [routeData, setRouteData] = useState<RouteData | null>(null)
  const [scheduleDate, setScheduleDate] = useState<string | null>(null)
  const [scheduleTime, setScheduleTime] = useState<string | null>(null)
  const [workNotes, setWorkNotes] = useState<string>('')
  const [selectedTruck, setSelectedTruck] = useState<SelectedTruck | null>(null)
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [duration, setDuration] = useState<number | null>(null)

  const saveLocation = useCallback(async (location: LocationData): Promise<boolean> => {
    try {
      await saveRecentLocation(location)
      return true
    } catch (error) {
      console.error('Error saving location:', error)
      return false
    }
  }, [])

  const getRecentLocationsList = useCallback(async (): Promise<LocationData[]> => {
    try {
      return await getRecentLocations()
    } catch (error) {
      console.error('Error getting recent locations:', error)
      return []
    }
  }, [])

  const resetBooking = useCallback(() => {
    setPickupLocation(null)
    setDropoffLocation(null)
    setRouteData(null)
    setScheduleDate(null)
    setScheduleTime(null)
    setWorkNotes('')
    setSelectedTruck(null)
    setEstimatedPrice(null)
    setDistance(null)
    setDuration(null)
  }, [])

  const clearLocationData = useCallback(() => {
    setPickupLocation(null)
    setDropoffLocation(null)
    setRouteData(null)
  }, [])

  return (
    <BookingContext.Provider
      value={{
        pickupLocation,
        dropoffLocation,
        routeData,
        scheduleDate,
        scheduleTime,
        workNotes,
        selectedTruck,
        estimatedPrice,
        distance,
        duration,
        setPickupLocation,
        setDropoffLocation,
        setRouteData,
        setScheduleDate,
        setScheduleTime,
        setWorkNotes,
        setSelectedTruck,
        setEstimatedPrice,
        setDistance,
        setDuration,
        resetBooking,
        clearLocationData,
        saveLocation,
        getRecentLocations: getRecentLocationsList,
      }}
    >
      {children}
    </BookingContext.Provider>
  )
}

export const useBooking = () => {
  const context = useContext(BookingContext)
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider')
  }
  return context
}