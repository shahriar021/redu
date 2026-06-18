// UserSearchLocation.tsx - Fixed navigation params
import { NavigationProp, useNavigation, useRoute } from '@react-navigation/native'
import React, { useState } from 'react'
import {
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthStackParamList } from '../../../../Navigation/type'
import { useLocation } from '../../../../Utils/hooks/useLocation'
import { LocationData, SearchSuggestion } from '../../Components/SearchLocation/type'

import { useBooking } from '../../../../Auth/BookingContext'
import { useLocationSearch } from '../../../../Utils/hooks/useLocationSearch'
import { LocationBottomSheet } from '../../Components/SearchLocation/LocationBottomSheet'
import { LocationSearchBar } from '../../Components/SearchLocation/LocationSearchBar'
import { RouteMap } from '../../Components/SearchLocation/RouteMap'
import { SearchResultsList } from '../../Components/SearchLocation/SearchResultsList'




// Define route params type
interface UserSearchLocationParams {
  type?: 'pickup' | 'dropoff'
}

const UserSearchLocation = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
  const route = useRoute()
  const params = route.params as UserSearchLocationParams | undefined
  const searchType = params?.type || 'dropoff'
  const { locationCoords, currentLocation } = useLocation()
  const { saveLocation, pickupLocation, setPickupLocation, setDropoffLocation } = useBooking()

  const [searchText, setSearchText] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null)
  const [showBottomSheet, setShowBottomSheet] = useState(false)

  const { suggestions, isLoading, searchLocations, clearSuggestions, error } = useLocationSearch()

  // Set current location as pickup for map display
  const mapPickupLocation: LocationData | null = pickupLocation || (locationCoords ? {
    id: 'current',
    title: 'Current Location',
    address: currentLocation || 'Current Location',
    latitude: locationCoords.latitude,
    longitude: locationCoords.longitude
  } : null)

  const handleSearch = (text: string) => {
    setSearchText(text)
    if (text.length >= 2) {
      searchLocations(text)
    } else {
      clearSuggestions()
    }
  }

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    const location: LocationData = {
      id: `loc_${Date.now()}`,
      title: suggestion.address.split(',')[0],
      address: suggestion.address,
      latitude: suggestion.lat,
      longitude: suggestion.lng,
      timestamp: Date.now()
    }
    setSelectedLocation(location)
    setShowBottomSheet(true)
    clearSuggestions()
    setSearchText('')
  }

  const handleConfirmLocation = async () => {
    if (selectedLocation) {
      await saveLocation(selectedLocation)

      if (searchType === 'pickup') {
        setPickupLocation(selectedLocation)
      } else {
        setDropoffLocation(selectedLocation)
      }

      navigation.goBack()
    }
  }

  const handleCloseSheet = () => {
    setShowBottomSheet(false)
    setSelectedLocation(null)
  }

  const handleClearSearch = () => {
    setSearchText('')
    clearSuggestions()
  }

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <StatusBar barStyle='dark-content' />

      <View className='flex-1'>
        {/* Map */}
        <RouteMap
          pickup={mapPickupLocation}
          dropoff={selectedLocation}
          routeData={null}
        />

        {/* Search Bar Overlay */}
        <View className='absolute top-0 left-0 right-0 px-4 pt-4'>
          <LocationSearchBar
            value={searchText}
            onChangeText={handleSearch}
            placeholder={`Search for ${searchType} location`}
            onClear={handleClearSearch}
            showBackButton
            onBackPress={() => navigation.goBack()}
          />
        </View>

        {/* Error Message */}
        {error && (
          <View className='absolute top-24 left-4 right-4 bg-red-50 rounded-xl p-3'>
            <Text className='text-red-600 text-sm text-center'>{error}</Text>
          </View>
        )}

        {/* Search Results */}
        {(searchText.length >= 2 || isLoading) && (
          <View className='absolute top-24 left-0 right-0 bg-white rounded-t-3xl px-4 pt-4 max-h-96 shadow-lg'>
            <View className='flex-row justify-between items-center mb-4'>
              <Text className='text-sm font-semibold text-gray-600'>
                {isLoading ? 'Searching...' : 'Search Results'}
              </Text>
              <TouchableOpacity onPress={handleClearSearch}>
                <Text className='text-sm text-green-500'>Close</Text>
              </TouchableOpacity>
            </View>
            <SearchResultsList
              results={suggestions}
              isLoading={isLoading}
              onSelect={handleSelectSuggestion}
            />
          </View>
        )}
      </View>

      {/* Bottom Sheet */}
      <LocationBottomSheet
        visible={showBottomSheet}
        location={selectedLocation}
        onConfirm={handleConfirmLocation}
        onClose={handleCloseSheet}
      />
    </SafeAreaView>
  )
}

export default UserSearchLocation