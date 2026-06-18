import { Entypo, MaterialCommunityIcons } from '@expo/vector-icons'
import { NavigationProp, useNavigation, useRoute } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import { IPA_BASE } from '@env'
import React, { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  PanResponder,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import MapView, { Marker, Polyline } from 'react-native-maps'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Images } from '../../../../constants'
import { AuthStackParamList } from '../../../../Navigation/type'
import { JobStatusUpdateData, socketService } from '../../services/socket.service'

const { height } = Dimensions.get('window')

type SearchStatus = 'searching' | 'driver_assigned' | 'cancelled' | 'error'

const UserFindingDrivers = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
  const route = useRoute<any>()
  const mapRef = useRef<MapView>(null)
  const pan = useRef(new Animated.ValueXY()).current
  const scaleAnim = useRef(new Animated.Value(1)).current

  const {
    pickup,
    dropoff,
    routeData,
    selectedTruck,
    scheduleDate,
    scheduleTime,
    workNotes,
    costBreakdown,
    jobId,
    bookingId,
  } = route.params || {}

  // support both param names for backward compat
  const activeJobId: string = jobId || bookingId

  const [searchStatus, setSearchStatus] = useState<SearchStatus>('searching')
  const [searchMessage, setSearchMessage] = useState('Finding nearby drivers...')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start()
  }, [scaleAnim])

  // Fit map to show full route once map is ready
  const handleMapReady = () => {
    if (routeCoordinates.length >= 2) {
      mapRef.current?.fitToCoordinates(routeCoordinates, {
        edgePadding: { top: 80, right: 60, bottom: Math.round(height * 0.5), left: 60 },
        animated: true,
      })
    }
  }

  useEffect(() => {
    if (!activeJobId) {
      setSearchStatus('error')
      setErrorMessage('Invalid job information')
      return
    }

    const handleJobStatusUpdate = async (data: JobStatusUpdateData) => {
      if (data.jobId !== activeJobId) return

      switch (data.status) {
        case 'BOOKED': {
          setSearchMessage('Driver found! Loading details...')
          setSearchStatus('driver_assigned')
          try {
            const token = await AsyncStorage.getItem('vToken')
            const res = await axios.get(`${IPA_BASE}/jobs/${activeJobId}`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 10000,
            })
            const job = res.data?.data
            setTimeout(() => {
              ;(navigation as any).navigate('UserLiveTracking', {
                pickup,
                dropoff,
                routeData,
                selectedTruck,
                scheduleDate,
                scheduleTime,
                workNotes,
                costBreakdown,
                jobId: activeJobId,
                driver: job?.driver
                  ? {
                      id: job.driver.id,
                      name: job.driver.user?.fullName ?? 'Driver',
                      rating: null,
                      vehicle: job.driver.truckType?.name ?? '',
                      plate: job.driver.numberPlate ?? '',
                      phone: job.driver.user?.mobileNumber ?? '',
                      image: job.driver.user?.avatar ?? null,
                    }
                  : null,
              })
            }, 1500)
          } catch {
            // navigate without driver detail rather than blocking
            setTimeout(() => {
              ;(navigation as any).navigate('UserLiveTracking', {
                pickup,
                dropoff,
                routeData,
                selectedTruck,
                jobId: activeJobId,
                driver: null,
              })
            }, 1500)
          }
          break
        }
        case 'CANCELLED':
          setSearchStatus('cancelled')
          setErrorMessage('Your job request was cancelled')
          Alert.alert('Job Cancelled', 'Your job request was cancelled', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ])
          break
      }
    }

    const setup = async () => {
      try {
        await socketService.connect()
        socketService.onJobStatusUpdate(handleJobStatusUpdate)

        const timeout = setTimeout(() => {
          if (searchStatus === 'searching') {
            setSearchStatus('error')
            setErrorMessage('No drivers available at the moment. Please try again.')
          }
        }, 60000)

        return () => clearTimeout(timeout)
      } catch {
        setSearchStatus('error')
        setErrorMessage('Failed to connect to driver service')
      }
    }

    const cleanup = setup()
    return () => {
      socketService.offJobStatusUpdate(handleJobStatusUpdate)
      cleanup.then((fn) => fn?.())
    }
  }, [activeJobId])

  const handleCancelSearch = async () => {
    Alert.alert('Cancel Search', 'Are you sure you want to cancel your job request?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          setIsCancelling(true)
          try {
            const token = await AsyncStorage.getItem('vToken')
            await axios.delete(`${IPA_BASE}/jobs/${activeJobId}/cancel`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 10000,
            })
            setSearchStatus('cancelled')
            Alert.alert('Cancelled', 'Your job request has been cancelled', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ])
          } catch {
            Alert.alert('Error', 'Failed to cancel job request')
          } finally {
            setIsCancelling(false)
          }
        },
      },
    ])
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, { dy }) => Math.abs(dy) > 10,
      onPanResponderRelease: (_evt, { dy }) => {
        if (dy > 100) {
          if (searchStatus === 'searching') handleCancelSearch()
          else navigation.goBack()
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start()
        }
      },
    })
  ).current

  const routeCoordinates: { latitude: number; longitude: number }[] =
    routeData?.points?.length > 1
      ? routeData.points
      : pickup && dropoff
      ? [
          { latitude: pickup.latitude, longitude: pickup.longitude },
          { latitude: dropoff.latitude, longitude: dropoff.longitude },
        ]
      : []

  const renderContent = () => {
    if (searchStatus === 'error') {
      return (
        <View className='flex-1 items-center justify-center px-6'>
          <View className='h-20 w-20 rounded-full bg-red-100 items-center justify-center mb-6'>
            <MaterialCommunityIcons name='alert-circle' size={48} color='#EF4444' />
          </View>
          <Text className='text-2xl font-bold text-red-500 mb-3 text-center'>Search Failed</Text>
          <Text className='text-base text-gray-600 text-center mb-6'>
            {errorMessage || 'Unable to find drivers. Please try again.'}
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()} className='bg-green-500 rounded-xl px-6 py-3'>
            <Text className='text-white font-semibold'>Go Back</Text>
          </TouchableOpacity>
        </View>
      )
    }

    if (searchStatus === 'cancelled') {
      return (
        <View className='flex-1 items-center justify-center px-6'>
          <View className='h-20 w-20 rounded-full bg-yellow-100 items-center justify-center mb-6'>
            <MaterialCommunityIcons name='close-circle' size={48} color='#F59E0B' />
          </View>
          <Text className='text-2xl font-bold text-yellow-500 mb-3 text-center'>Search Cancelled</Text>
          <Text className='text-base text-gray-600 text-center mb-6'>
            Your job request has been cancelled
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()} className='bg-green-500 rounded-xl px-6 py-3'>
            <Text className='text-white font-semibold'>Go Back</Text>
          </TouchableOpacity>
        </View>
      )
    }

    return (
      <>
        <Animated.View
          style={[{ transform: [{ scale: scaleAnim }] }]}
          className='mb-6 h-24 w-24 rounded-full bg-green-50 items-center justify-center'
        >
          <View className='h-20 w-20 rounded-full bg-green-100 items-center justify-center'>
            <Image source={Images.FindTruck} className='h-16 w-16' resizeMode='contain' />
          </View>
        </Animated.View>

        <Text className='text-2xl font-bold text-green-500 mb-3 text-center'>
          {searchStatus === 'driver_assigned' ? 'Driver Found!' : 'Finding nearby drivers...'}
        </Text>

        <Text className='text-base text-gray-600 text-center'>{searchMessage}</Text>

        {searchStatus === 'searching' && (
          <>
            <View className='mt-6 flex-row items-center gap-1'>
              <View className='h-2 w-2 rounded-full bg-green-500' />
              <View className='h-2 w-2 rounded-full bg-green-500' />
              <View className='h-2 w-2 rounded-full bg-green-500' />
            </View>

            <TouchableOpacity
              onPress={handleCancelSearch}
              disabled={isCancelling}
              className='mt-8 rounded-xl px-6 py-3 border border-red-500'
            >
              <Text className='text-red-500 font-semibold'>
                {isCancelling ? 'Cancelling...' : 'Cancel Search'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {searchStatus === 'driver_assigned' && (
          <View className='mt-6 bg-green-50 rounded-xl px-4 py-2'>
            <Text className='text-green-600 font-semibold'>Redirecting to tracking...</Text>
          </View>
        )}
      </>
    )
  }

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <StatusBar barStyle='dark-content' />

      <View className='flex-1 bg-gray-100'>
        <MapView
          ref={mapRef}
          style={{ flex: 1, width: '100%', height: '100%' }}
          initialRegion={{
            latitude: pickup?.latitude ?? 0,
            longitude: pickup?.longitude ?? 0,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onMapReady={handleMapReady}
        >
          {pickup && (
            <Marker coordinate={{ latitude: pickup.latitude, longitude: pickup.longitude }}>
              <View className='h-10 w-10 rounded-full bg-green-500 items-center justify-center border-2 border-white'>
                <MaterialCommunityIcons name='circle' size={16} color='white' />
              </View>
            </Marker>
          )}

          {dropoff && (
            <Marker coordinate={{ latitude: dropoff.latitude, longitude: dropoff.longitude }}>
              <View className='h-8 w-8 rounded-full bg-red-500 items-center justify-center border-2 border-white'>
                <MaterialCommunityIcons name='flag' size={14} color='white' />
              </View>
            </Marker>
          )}

          {routeCoordinates.length > 1 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor='#4CAF50'
              strokeWidth={4}
            />
          )}
        </MapView>

        <View className='absolute top-0 left-0 right-0 flex-row items-center justify-between px-5 pt-4'>
          <TouchableOpacity
            onPress={() => {
              if (searchStatus === 'searching') handleCancelSearch()
              else navigation.goBack()
            }}
          >
            <Entypo name='chevron-left' size={28} color='#000' />
          </TouchableOpacity>
          <Text className='text-2xl font-bold text-gray-800'>Finding Drivers</Text>
          <View className='w-7' />
        </View>
      </View>

      <Animated.View
        style={[{ height: height * 0.45 }, { transform: [{ translateY: pan.y }] }]}
        {...panResponder.panHandlers}
        className='absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-lg'
      >
        <View className='items-center py-3'>
          <View className='h-1 w-12 rounded-full bg-gray-300' />
        </View>
        <View className='flex-1 items-center justify-center px-6 pb-6'>{renderContent()}</View>
      </Animated.View>
    </SafeAreaView>
  )
}

export default UserFindingDrivers
