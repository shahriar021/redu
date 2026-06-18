// UserSetDropOff.tsx - Fixed navigation
import { Entypo } from '@expo/vector-icons'
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native'
import React, { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useBooking } from '../../../../Auth/BookingContext'
import { AuthStackParamList } from '../../../../Navigation/type'
import { useLocationSearch } from '../../../../Utils/hooks/useLocationSearch'
import { useRecentLocations } from '../../../../Utils/hooks/useRecentLocations'
import { LocationSearchBar } from '../../Components/SearchLocation/LocationSearchBar'
import { RecentPlacesList } from '../../Components/SearchLocation/RecentPlacesList'
import { SearchResultsList } from '../../Components/SearchLocation/SearchResultsList'
import { LocationData, SearchSuggestion } from '../../Components/SearchLocation/type'


const UserSetDropOff = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
  const { setDropoffLocation } = useBooking()
  const [searchText, setSearchText] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const { suggestions, isLoading, searchLocations, clearSuggestions } = useLocationSearch()
  const {
    recentLocations,
    isLoading: recentLoading,
    saveLocation,
    clearAll,
    removeLocation,
    refresh
  } = useRecentLocations()

  useEffect(() => {
    refresh()
  }, [])

  useFocusEffect(
    useCallback(() => {
      refresh()
    }, [refresh])
  )

  const handleSearch = (text: string) => {
    setSearchText(text)
    if (text.length >= 2) {
      searchLocations(text)
      setShowSearch(true)
    } else {
      clearSuggestions()
      setShowSearch(false)
    }
  }

  const handleSelectSuggestion = async (suggestion: SearchSuggestion) => {
    const locationData: LocationData = {
      id: `loc_${Date.now()}`,
      title: suggestion.address.split(',')[0],
      address: suggestion.address,
      latitude: suggestion.lat,
      longitude: suggestion.lng,
      timestamp: Date.now()
    }

    await saveLocation(locationData)
    setDropoffLocation(locationData)
    navigation.goBack()
  }

  const handleSelectRecent = async (place: LocationData) => {
    setDropoffLocation(place)
    navigation.goBack()
  }

  const handleClearAll = async () => {
    Alert.alert(
      'Clear All',
      'Are you sure you want to clear all recent locations?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearAll()
            await refresh()
          }
        }
      ]
    )
  }

  const handleRemoveLocation = async (place: LocationData) => {
    Alert.alert(
      'Remove Location',
      `Remove "${place.title}" from recent locations?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeLocation(place.id || place.address)
            await refresh()
          }
        }
      ]
    )
  }

  const handleClearSearch = () => {
    setSearchText('')
    clearSuggestions()
    setShowSearch(false)
  }

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <StatusBar barStyle='dark-content' />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className='flex-1'
      >
        <View className='border-b border-gray-200 px-5 pt-4 pb-4'>
          <View className='flex-row items-center justify-between mb-4'>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Entypo name='chevron-left' size={28} color='#000' />
            </TouchableOpacity>
            <Text className='text-2xl font-bold text-gray-800'>Set Drop-off</Text>
            <View className='w-7' />
          </View>

          <LocationSearchBar
            value={searchText}
            onChangeText={handleSearch}
            placeholder='Search for drop-off address'
            onClear={handleClearSearch}
            onFocus={() => setShowSearch(true)}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          className='flex-1 px-5 pt-6'
          keyboardShouldPersistTaps='handled'
        >
          {showSearch ? (
            <SearchResultsList
              results={suggestions}
              isLoading={isLoading}
              onSelect={handleSelectSuggestion}
            />
          ) : (
            <RecentPlacesList
              places={recentLocations}
              isLoading={recentLoading}
              onSelect={handleSelectRecent}
              onClearAll={handleClearAll}
              onRemove={handleRemoveLocation}
              />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default UserSetDropOff