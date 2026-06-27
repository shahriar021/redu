import { IPA_BASE, LOCATION_UPDATE, STATUS_DRIVER } from '@env'
import { Entypo, FontAwesome6, Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native'
import axios from 'axios'
import * as Location from 'expo-location'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Images } from '../../../constants'
import { AuthStackParamList } from '../../../Navigation/type'

const API_BASE_URL = IPA_BASE
const END_POINTS = { STATUS_DRIVER, LOCATION_UPDATE }

const DriverHome = () => {
  console.log('DriverHome RENDERED')
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
  const rotateAnim = useRef(new Animated.Value(0)).current
  const locationWatcherRef = useRef<Location.LocationSubscription | null>(null)
  const lastSentCoordsRef = useRef<{ latitude: number; longitude: number } | null>(null)

  const [isOnline, setIsOnline] = useState(true)
  const [currentLocation, setCurrentLocation] = useState<string>('Loading...')
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null)

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 7000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start()
  }, [rotateAnim])

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const getToken = async () => {
    const token = await AsyncStorage.getItem('vToken')
    return token
  }

  // const getAddressFromCoordinates = async (latitude: number, longitude: number) => {
  //   try {
  //     const addresses = await Location.reverseGeocodeAsync({
  //       latitude,
  //       longitude,
  //     })

  //     if (addresses.length > 0) {
  //       const address = addresses[0]
  //       const city = address.city || address.region || address.district || 'Unknown'
  //       const state = address.region || ''
  //       const stateCode = state ? state.substring(0, 2).toUpperCase() : ''
  //       return `${city}${stateCode ? ', ' + stateCode : ''}`
  //     }

  //     return 'Unknown Location'
  //   } catch (error) {
  //     console.error('Error getting address:', error)
  //     return 'Unknown Location'
  //   }
  // }

  const getAddressFromCoordinates = async (latitude: number, longitude: number) => {
  try {
    const addresses = await Location.reverseGeocodeAsync({ latitude, longitude })

    console.log('Reverse geocode result:', JSON.stringify(addresses, null, 2))

    if (addresses.length > 0) {
      const address = addresses[0]
      const city = address.city || address.region || address.district || 'Unknown'
      const state = address.region || ''
      const stateCode = state ? state.substring(0, 2).toUpperCase() : ''
      return `${city}${stateCode ? ', ' + stateCode : ''}`
    }

    console.log('Reverse geocode returned empty array for', latitude, longitude)
    return 'Unknown Location'
  } catch (error) {
    console.error('Error getting address:', error)
    return 'Unknown Location'
  }
}

  const updateDriverStatus = useCallback(async (status: 'active' | 'inactive') => {
    try {
      const token = await getToken()

      if (!token) {
        console.log('No token found for status update')
        return
      }

      const res = await axios.patch(
        `${API_BASE_URL}${END_POINTS.STATUS_DRIVER}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      )

      console.log('Driver status updated:', res.data)
    } catch (error: any) {
      console.error('Status update error:', error?.response?.data || error?.message || error)
    }
  }, [])

  const updateDriverLocation = useCallback(async (latitude: number, longitude: number) => {
    try {
      const token = await getToken()

      if (!token) {
        console.log('No token found for location update')
        return
      }

      const res = await axios.patch(
        `${API_BASE_URL}${END_POINTS.LOCATION_UPDATE}`,
        {
          latitude: Number(latitude),
          longitude: Number(longitude),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      )

      console.log('Location updated:', res.data)
    } catch (error: any) {
      console.error('Location update error:', error?.response?.data || error?.message || error)
    }
  }, [])

  const shouldSendLocation = (latitude: number, longitude: number) => {
    const last = lastSentCoordsRef.current
    if (!last) return true

    const latDiff = Math.abs(last.latitude - latitude)
    const lngDiff = Math.abs(last.longitude - longitude)

    return latDiff > 0.0003 || lngDiff > 0.0003
  }

  // const fetchCurrentLocation = useCallback(async () => {
  //   try {
  //     setIsLoadingLocation(true)

  //     const { status } = await Location.requestForegroundPermissionsAsync()
  //     console.log('permission status:', status)

  //     if (status !== 'granted') {
  //       setCurrentLocation('Permission Denied')
  //       Alert.alert('Permission needed', 'Location permission allow koro.')
  //       return
  //     }

  //     const isLocationAvailable = await Location.hasServicesEnabledAsync()
  //     if (!isLocationAvailable) {
  //       setCurrentLocation('Location Services Off')
  //       Alert.alert('Location Services Off', 'Device er location service on koro.')
  //       return
  //     }

  //     const location = await Location.getCurrentPositionAsync({
  //       accuracy: Location.Accuracy.High,
  //     })

  //     const { latitude, longitude } = location.coords

  //     const address = await getAddressFromCoordinates(latitude, longitude)

  //     setCurrentLocation(address)
  //     setLocationCoords({ latitude, longitude })

  //     if (isOnline) {
  //       await updateDriverLocation(latitude, longitude)
  //       lastSentCoordsRef.current = { latitude, longitude }
  //     }
  //   } catch (error) {
  //     console.error('Error fetching location:', error)
  //     setCurrentLocation('Error Getting Location')
  //   } finally {
  //     setIsLoadingLocation(false)
  //   }
  // }, [isOnline, updateDriverLocation])
  const fetchCurrentLocation = useCallback(async () => {
  console.log('STEP 1: fetchCurrentLocation start')
  try {
    setIsLoadingLocation(true)

    const { status } = await Location.requestForegroundPermissionsAsync()
    console.log('STEP 2: permission status:', status)

    if (status !== 'granted') {
      setCurrentLocation('Permission Denied')
      return
    }

    const isLocationAvailable = await Location.hasServicesEnabledAsync()
    console.log('STEP 3: services enabled:', isLocationAvailable)
    if (!isLocationAvailable) {
      setCurrentLocation('Location Services Off')
      return
    }

    console.log('STEP 4: calling getCurrentPositionAsync...')
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    })
    console.log('STEP 5: got coords', location.coords)

    const { latitude, longitude } = location.coords
    const address = await getAddressFromCoordinates(latitude, longitude)
    console.log('STEP 6: resolved address', address)

    setCurrentLocation(address)
    setLocationCoords({ latitude, longitude })
  } catch (error) {
    console.error('STEP X: ERROR', error)
    setCurrentLocation('Error Getting Location')
  } finally {
    setIsLoadingLocation(false)
  }
}, [isOnline, updateDriverLocation])

  const startWatchingLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return

      const isLocationAvailable = await Location.hasServicesEnabledAsync()
      if (!isLocationAvailable) return

      if (locationWatcherRef.current) {
        locationWatcherRef.current.remove()
        locationWatcherRef.current = null
      }

      locationWatcherRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 50,
        },
        async (location) => {
          const { latitude, longitude } = location.coords

          setLocationCoords({ latitude, longitude })

          const address = await getAddressFromCoordinates(latitude, longitude)
          setCurrentLocation(address)

          if (isOnline && shouldSendLocation(latitude, longitude)) {
            await updateDriverLocation(latitude, longitude)
            lastSentCoordsRef.current = { latitude, longitude }
          }
        }
      )
    } catch (error) {
      console.error('Error watching location:', error)
    }
  }, [isOnline, updateDriverLocation])

  useEffect(() => {
    fetchCurrentLocation()
    startWatchingLocation()

    return () => {
      if (locationWatcherRef.current) {
        locationWatcherRef.current.remove()
        locationWatcherRef.current = null
      }
    }
  }, [fetchCurrentLocation, startWatchingLocation])

  useFocusEffect(
    useCallback(() => {
      updateDriverStatus(isOnline ? 'active' : 'inactive')

      if (isOnline) {
        fetchCurrentLocation()
      }
    }, [isOnline, updateDriverStatus, fetchCurrentLocation])
  )

  useEffect(() => {
    updateDriverStatus(isOnline ? 'active' : 'inactive')
  }, [isOnline, updateDriverStatus])

  const LocationModal = () => (
    <Modal
      visible={showLocationModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowLocationModal(false)}
    >
      <View className='flex-1 bg-black/50 items-center justify-center p-6'>
        <View className='bg-white rounded-3xl p-6 w-full max-w-sm'>
          <View className='flex-row items-center justify-between mb-6'>
            <Text className='text-2xl font-bold text-gray-900'>Current Location</Text>
            <TouchableOpacity onPress={() => setShowLocationModal(false)}>
              <Ionicons name='close-circle' size={28} color='#999' />
            </TouchableOpacity>
          </View>

          <View className='w-20 h-20 rounded-full items-center justify-center bg-green-100 mb-4 self-center'>
            <FontAwesome6 name='location-dot' size={32} color='#4CAF50' />
          </View>

          <Text className='text-2xl font-bold text-gray-900 text-center mb-4'>
            {currentLocation}
          </Text>

          {locationCoords && (
            <View className='bg-gray-50 rounded-2xl p-4 mb-6'>
              <View className='flex-row justify-between mb-3'>
                <Text className='text-gray-500 font-semibold'>Latitude:</Text>
                <Text className='text-gray-900 font-bold'>
                  {locationCoords.latitude.toFixed(6)}
                </Text>
              </View>

              <View className='flex-row justify-between'>
                <Text className='text-gray-500 font-semibold'>Longitude:</Text>
                <Text className='text-gray-900 font-bold'>
                  {locationCoords.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            onPress={async () => {
              await fetchCurrentLocation()
              setTimeout(() => setShowLocationModal(false), 500)
            }}
            className='bg-primary py-4 rounded-2xl mb-3'
          >
            <Text className='text-white text-center font-bold text-lg'>
              Refresh Location
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowLocationModal(false)}
            className='bg-gray-200 py-3 rounded-2xl'
          >
            <Text className='text-gray-900 text-center font-semibold text-lg'>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )

  return (
    <SafeAreaView className='flex-1 bg-primary'>
      <LocationModal />
      <StatusBar barStyle='light-content' />

      <View className='flex-1'>
        <View className='flex-row justify-between px-5 py-6'>
          <View className='flex-row items-center justify-center gap-4'>
            <View className='w-16 h-16 items-center justify-center rounded-full bg-white'>
              <FontAwesome6 name='location-dot' size={24} color='#43B047' />
            </View>

            <View>
              <Text className='text-[#FFFFFF] font-thin text-lg'>Current Location</Text>

              <TouchableOpacity onPress={() => setShowLocationModal(true)}>
                <View className='flex-row items-center gap-2'>
                  {isLoadingLocation ? (
                    <ActivityIndicator size='small' color='white' />
                  ) : null}

                  <Text className='text-xl font-bold text-white'>{currentLocation}</Text>
                  <Entypo name='chevron-down' size={24} color='white' />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View className='relative w-[72px] h-[72px]'>
            <Animated.View
              style={{
                transform: [{ rotate }],
              }}
              className='absolute inset-0 border-2 border-dashed border-white rounded-full'
            />
            <TouchableOpacity
              onPress={() => navigation.navigate('DriverProfile')}
              className='absolute inset-0 items-center justify-center'
            >
              <Image source={Images.MyProfile} className='w-16 h-16 rounded-full' />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          className='bg-gray-50 flex-1 rounded-t-3xl px-6 pt-8'
          showsVerticalScrollIndicator={false}
        >
          <View className='bg-white rounded-3xl p-5 mb-8' style={{ elevation: 3 }}>
            <View className='flex-row justify-between items-center'>
              <View>
                <Text className='text-2xl font-bold text-gray-900'>Driver Status</Text>
                <Text className='text-base text-gray-500 mt-1 leading-5'>
                  {isOnline
                    ? "You are online and\navailable for new job assignments."
                    : "You are offline and\nnot receiving job assignments."}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setIsOnline((prev) => !prev)}
                className={`w-16 h-10 rounded-full flex-row items-center px-1 ${isOnline ? 'bg-green-500' : 'bg-gray-300'
                  }`}
              >
                <Animated.View
                  className={`w-8 h-8 rounded-full bg-white ${isOnline ? 'ml-auto' : ''}`}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View className='items-center mb-12 mt-8'>
            <Image source={Images.FindTruck} />
          </View>

          <View className='items-center mb-16'>
            <Text className='text-4xl font-bold text-gray-900 text-center mb-3 leading-tight'>
              Waiting for job{'\n'}assignment
            </Text>
            <Text className='text-base text-gray-400 text-center leading-6 px-4'>
              Relax. You'll get a notification when{'\n'}dispatch assigns a route.
            </Text>
          </View>

          <View className='h-20' />
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

export default DriverHome