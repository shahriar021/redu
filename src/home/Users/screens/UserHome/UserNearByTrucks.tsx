import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native'
import React, { useCallback } from 'react'
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  Text
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthStackParamList } from '../../../../Navigation/type'
import { useLocation } from '../../../../Utils/hooks/useLocation'


import { EmptyState } from '../../Components/NearByTrucks/EmptyState'
import { Header } from '../../Components/NearByTrucks/Header'
import { LoadingSkeleton } from '../../Components/NearByTrucks/LoadingSkeleton'
import { RadiusFilter } from '../../Components/NearByTrucks/RadiusFilter'
import { TruckCard } from '../../Components/NearByTrucks/TruckCard'
import { useNearbyTrucks } from '../../../../Utils/hooks/useNearbyTrucks'




const UserNearByTrucks = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
  const { currentLocation, locationCoords, fetchCurrentLocation } = useLocation()
  const {
    trucks,
    isLoading,
    isRefreshing,
    error,
    radius,
    changeRadius,
    refresh,
    fetchNearbyTrucks,
  } = useNearbyTrucks()

  // Fetch trucks when location is available
  useFocusEffect(
    useCallback(() => {
      if (locationCoords) {
        fetchNearbyTrucks(locationCoords, true)
      }
    }, [locationCoords])
  )

  const handleRadiusChange = (newRadius: number) => {
    changeRadius(newRadius, locationCoords)
  }

  const handleRefresh = () => {
    refresh(locationCoords)
  }

  const handleLocationPress = () => {
    fetchCurrentLocation()
    if (locationCoords) {
      fetchNearbyTrucks(locationCoords, true)
    }
  }

  const handleBookPress = (truck: any) => {
    if (!truck.driverUserId || !truck.truckTypeId) {
      // Fallback: open normal booking flow
      navigation.navigate('UserMappingView')
      return
    }
    navigation.navigate('UserDirectBooking', {
      driverUserId: truck.driverUserId,
      truckTypeId: truck.truckTypeId,
      truckName: truck.name,
      driverName: truck.driverName,
      driverAvatar: truck.driverAvatar,
    })
  }


  return (
    <SafeAreaView className='flex-1 bg-gray-50'>
      <StatusBar barStyle="dark-content" />

      <Header
        currentLocation={currentLocation}
        onBackPress={() => navigation.goBack()}
        onLocationPress={handleLocationPress}
      />

      <RadiusFilter radius={radius} onRadiusChange={handleRadiusChange} />

      {isLoading ? (
        <LoadingSkeleton />
      ) : error && trucks.length === 0 ? (
        <EmptyState
          error={error}
          radius={radius}
          onRadiusChange={handleRadiusChange}
        />
      ) : (
        <ScrollView
          className='flex-1 px-5'
          showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  colors={['#4CAF50']}
                  tintColor="#4CAF50"
                />
              }
            >
              <Text className='text-sm text-gray-500 mb-3'>
                Found {trucks.length} truck{trucks.length !== 1 ? 's' : ''} nearby
              </Text>

              {trucks.map((truck) => (
                <TruckCard
                  key={truck.id}
                  truck={truck}
                  onBookPress={handleBookPress}
                />
              ))}
            </ScrollView>
      )}
    </SafeAreaView>
  )
}

export default UserNearByTrucks