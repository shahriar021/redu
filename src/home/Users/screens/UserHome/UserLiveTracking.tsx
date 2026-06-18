import { Entypo, MaterialCommunityIcons } from '@expo/vector-icons'
import { NavigationProp, useNavigation, useRoute } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import { IPA_BASE } from '@env'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useRouteDirection } from '../../../../Utils/hooks/useRouteDirection'
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Linking,
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
import {
  DriverLocationData,
  JobStatus,
  JobStatusUpdateData,
  socketService,
} from '../../services/socket.service'

interface Driver {
  id: string
  name: string
  rating: number
  vehicle: string
  phone?: string
  image?: any
}

interface Coords {
  latitude: number
  longitude: number
}

interface JobDetails {
  pickup: Coords
  dropoff: Coords
  status: JobStatus
  driver: Driver | null
  routePoints?: Coords[]
}

type ScreenState = 'loading' | 'no_job' | 'broadcast' | 'tracking'

const STATUS_LABELS: Record<string, string> = {
  BOOKED: 'DRIVER ASSIGNED',
  ON_WAY: 'DRIVER ON THE WAY',
  ARRIVED: 'DRIVER ARRIVED',
  LOADED: 'GOODS LOADED',
  IN_TRANSIT: 'JOB IN PROGRESS',
  DELIVERED: 'JOB DELIVERED',
}

const PROGRESS: Record<string, number> = {
  BOOKED: 16, ON_WAY: 33, ARRIVED: 50, LOADED: 66, IN_TRANSIT: 83, DELIVERED: 100,
}

const UserLiveTracking = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
  const route = useRoute<any>()
  const mapRef = useRef<MapView>(null)
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current

  const { pickup: paramPickup, dropoff: paramDropoff, routeData, jobId, bookingId, driver: paramDriver } = route.params || {}
  const paramJobId: string | undefined = jobId || bookingId

  const [resolvedJobId, setResolvedJobId] = useState<string | undefined>(paramJobId)
  const [screen, setScreen] = useState<ScreenState>('loading')
  const [job, setJob] = useState<JobDetails | null>(null)
  const [jobStatus, setJobStatus] = useState<JobStatus>('BOOKED')
  const [driverLocation, setDriverLocation] = useState<Coords | null>(null)
  const [isCalling, setIsCalling] = useState(false)
  const { getRoute, routeData: fetchedRoute } = useRouteDirection()

  // ── Initial data load ──────────────────────────────────────────────────────
  useEffect(() => {
    // Full params passed directly (e.g. from UserFindingDrivers after driver accepted)
    if (paramJobId && paramPickup && paramDropoff) {
      setResolvedJobId(paramJobId)
      setJobStatus('BOOKED')
      setJob({
        pickup: paramPickup,
        dropoff: paramDropoff,
        status: 'BOOKED',
        driver: paramDriver ?? null,
        routePoints: routeData?.points ?? undefined,
      })
      setScreen('tracking')
      return
    }

    const loadJob = async (id: string) => {
      try {
        const token = await AsyncStorage.getItem('vToken')
        const res = await axios.get(`${IPA_BASE}/jobs/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        })
        const data = res.data?.data
        if (!data || !data.pickupLat || !data.pickupLng) {
          setScreen('no_job')
          return
        }
        const status = data.status as JobStatus
        setJobStatus(status)
        setJob({
          pickup: { latitude: data.pickupLat, longitude: data.pickupLng },
          dropoff: { latitude: data.dropoffLat, longitude: data.dropoffLng },
          status,
          driver: data.driver ? {
            id: data.driver.id,
            name: data.driver.user?.fullName ?? 'Driver',
            rating: 0,
            vehicle: data.driver.truckType?.name ?? 'Truck',
            phone: data.driver.user?.mobileNumber,
            image: data.driver.user?.avatar ? { uri: data.driver.user.avatar } : undefined,
          } : null,
        })
        setScreen(status === 'BROADCAST' ? 'broadcast' : 'tracking')
      } catch {
        setScreen('no_job')
      }
    }

    if (paramJobId) {
      // Specific job navigated to (e.g. from home TRACK JOB button)
      loadJob(paramJobId)
      return
    }

    // No jobId — opened from the FAB tab button. Find the user's latest active job.
    const findActiveJob = async () => {
      try {
        const token = await AsyncStorage.getItem('vToken')
        const res = await axios.get(`${IPA_BASE}/jobs/my-jobs`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        })
        const jobs: any[] = res.data?.data ?? []
        const ACTIVE_STATUSES = ['BROADCAST', 'BOOKED', 'ON_WAY', 'ARRIVED', 'LOADED', 'IN_TRANSIT']
        const active = jobs.find((j) => ACTIVE_STATUSES.includes(j.status))
        if (!active) {
          setScreen('no_job')
          return
        }
        setResolvedJobId(active.id)
        await loadJob(active.id)
      } catch {
        setScreen('no_job')
      }
    }

    findActiveJob()
  }, [])

  // ── Socket setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    pan.setOffset({ x: 0, y: 0 })
    socketService.connect()
  }, [])

  useEffect(() => {
    if (!resolvedJobId) return

    const onLocation = (data: DriverLocationData) => {
      if (data.jobId !== resolvedJobId) return
      setDriverLocation({ latitude: data.lat, longitude: data.lng })
    }

    const onStatusUpdate = (data: JobStatusUpdateData) => {
      if (data.jobId !== resolvedJobId) return
      const status = data.status
      setJobStatus(status)

      if (status === 'BROADCAST') {
        setScreen('broadcast')
        return
      }
      if (['BOOKED', 'ON_WAY', 'ARRIVED', 'LOADED', 'IN_TRANSIT', 'DELIVERED'].includes(status)) {
        setScreen('tracking')
      }

      switch (status) {
        case 'ARRIVED':
          Alert.alert('Driver Arrived', 'Your driver has arrived at the pickup location!')
          break
        case 'IN_TRANSIT':
          Alert.alert('Job Started', 'Goods have been loaded. Heading to destination.')
          break
        case 'DELIVERED':
          Alert.alert('Job Delivered', 'Your goods have been delivered!')
          setTimeout(() => (navigation as any).navigate('UserRateDriver', { jobId: resolvedJobId }), 2000)
          break
        case 'CANCELLED':
          Alert.alert('No Driver Available', 'No driver accepted your job. Please try again.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ])
          break
      }
    }

    socketService.onDriverLocation(onLocation)
    socketService.onJobStatusUpdate(onStatusUpdate)
    return () => {
      socketService.offDriverLocation(onLocation)
      socketService.offJobStatusUpdate(onStatusUpdate)
    }
  }, [resolvedJobId])

  // Fetch route when job has coords but no pre-computed route points (e.g. opened from active jobs list)
  useEffect(() => {
    if (!job?.pickup || !job?.dropoff || job.routePoints?.length) return
    getRoute(
      { id: 'pickup', title: 'Pickup', address: '', latitude: job.pickup.latitude, longitude: job.pickup.longitude },
      { id: 'dropoff', title: 'Dropoff', address: '', latitude: job.dropoff.latitude, longitude: job.dropoff.longitude }
    )
  }, [job?.pickup, job?.dropoff])

  // Fit map when real locations arrive
  useEffect(() => {
    if (!mapRef.current || !job?.pickup || !job?.dropoff) return
    const coords = [job.pickup, job.dropoff]
    if (driverLocation) coords.push(driverLocation)
    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 80, right: 50, bottom: 300, left: 50 },
      animated: true,
    })
  }, [driverLocation, job])

  // ── Helpers ────────────────────────────────────────────────────────────────
  const handleCallDriver = () => {
    const phone = job?.driver?.phone
    if (phone) {
      setIsCalling(true)
      Linking.openURL(`tel:${phone}`).catch(() => {}).finally(() => setIsCalling(false))
    } else {
      Alert.alert('No Phone Number', 'Driver phone number is not available')
    }
  }

  const handleCancelJob = () => {
    Alert.alert('Cancel Job', 'Are you sure you want to cancel this job?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('vToken')
            await axios.delete(`${IPA_BASE}/jobs/${resolvedJobId}/cancel`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 10000,
            })
            navigation.goBack()
          } catch {
            Alert.alert('Error', 'Failed to cancel job')
          }
        },
      },
    ])
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, { dy }) => Math.abs(dy) > 10,
      onPanResponderGrant: () => pan.flattenOffset(),
      onPanResponderMove: Animated.event([null, { dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_e, { dy, vy }) => {
        if (dy > 100 || vy > 0.5) {
          Animated.spring(pan, { toValue: { x: 0, y: 500 }, useNativeDriver: false, speed: 16 })
            .start(() => navigation.goBack())
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start()
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start()
      },
    })
  ).current

  // ── Render ─────────────────────────────────────────────────────────────────

  if (screen === 'loading') {
    return (
      <SafeAreaView className='flex-1 bg-white'>
        <StatusBar barStyle='dark-content' />
        <View className='flex-1 items-center justify-center gap-4'>
          <ActivityIndicator size='large' color='#4CAF50' />
          <Text className='text-gray-500 text-base'>Loading job details...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (screen === 'no_job') {
    return (
      <SafeAreaView className='flex-1 bg-white'>
        <StatusBar barStyle='dark-content' />
        <View className='flex-row items-center px-5 pt-4 pb-2'>
          <TouchableOpacity onPress={() => navigation.goBack()} className='mr-4'>
            <Entypo name='chevron-left' size={28} color='#000' />
          </TouchableOpacity>
          <Text className='text-2xl font-bold text-gray-800'>Live Tracking</Text>
        </View>
        <View className='flex-1 items-center justify-center px-8'>
          <View className='w-24 h-24 rounded-full bg-gray-100 items-center justify-center mb-6'>
            <MaterialCommunityIcons name='truck-outline' size={48} color='#9CA3AF' />
          </View>
          <Text className='text-2xl font-bold text-gray-800 mb-2'>No Active Job</Text>
          <Text className='text-base text-gray-500 text-center'>
            You don't have any active job right now. Book a truck to get started.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className='mt-8 bg-primary px-8 py-4 rounded-2xl'
          >
            <Text className='text-white font-bold text-base'>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (screen === 'broadcast') {
    return (
      <SafeAreaView className='flex-1 bg-white'>
        <StatusBar barStyle='dark-content' />
        <View className='flex-row items-center justify-between px-5 pt-4 pb-2'>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Entypo name='chevron-left' size={28} color='#000' />
          </TouchableOpacity>
          <Text className='text-2xl font-bold text-gray-800'>Live Tracking</Text>
          <TouchableOpacity onPress={handleCancelJob}>
            <MaterialCommunityIcons name='close' size={28} color='#EF4444' />
          </TouchableOpacity>
        </View>
        <View className='flex-1 items-center justify-center px-8'>
          <View className='w-24 h-24 rounded-full bg-blue-50 items-center justify-center mb-6'>
            <MaterialCommunityIcons name='truck-fast' size={48} color='#2196F3' />
          </View>
          <Text className='text-2xl font-bold text-gray-800 mb-2'>Finding a Driver</Text>
          <Text className='text-base text-gray-500 text-center mb-8'>
            We're searching for a nearby driver. This can take up to 30 minutes.
          </Text>
          <ActivityIndicator size='large' color='#2196F3' />
        </View>
      </SafeAreaView>
    )
  }

  // ── tracking — only rendered when job has real coords ──────────────────────
  const pickup = job!.pickup
  const dropoff = job!.dropoff

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <StatusBar barStyle='dark-content' />

      <View className='flex-1 bg-gray-100'>
        <MapView
          ref={mapRef}
          initialRegion={{
            latitude: pickup.latitude,
            longitude: pickup.longitude,
            latitudeDelta: 0.08,
            longitudeDelta: 0.04,
          }}
          style={{ flex: 1 }}
        >
          {/* Pickup marker */}
          <Marker coordinate={pickup} title='Pickup'>
            <View className='h-12 w-12 rounded-full bg-green-500 items-center justify-center border-4 border-white'>
              <MaterialCommunityIcons name='map-marker' size={24} color='white' />
            </View>
          </Marker>

          {/* Dropoff marker */}
          <Marker coordinate={dropoff} title='Destination'>
            <View className='h-8 w-8 rounded-full bg-red-500 items-center justify-center border-2 border-white'>
              <MaterialCommunityIcons name='flag-checkered' size={14} color='white' />
            </View>
          </Marker>

          {/* Route polyline — params route takes priority, falls back to freshly fetched */}
          {(() => {
            const pts = job!.routePoints?.length ? job!.routePoints : fetchedRoute?.points
            if (!pts?.length) return null
            return (
              <Polyline
                coordinates={pts}
                strokeColor='#FFA500'
                strokeWidth={4}
              />
            )
          })()}

          {/* Driver marker — only when real GPS is received from socket */}
          {driverLocation && (
            <Marker coordinate={driverLocation}>
              <View className='h-10 w-10 rounded-full bg-orange-400 items-center justify-center border-2 border-white'>
                <MaterialCommunityIcons name='truck' size={18} color='white' />
              </View>
            </Marker>
          )}
        </MapView>

        {/* Header overlay */}
        <View className='absolute top-0 left-0 right-0 flex-row items-center justify-between px-5 pt-4'>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Entypo name='chevron-left' size={28} color='#000' />
          </TouchableOpacity>
          <Text className='text-2xl font-bold text-gray-800'>Live Tracking</Text>
          <TouchableOpacity onPress={handleCancelJob}>
            <MaterialCommunityIcons name='close' size={28} color='#EF4444' />
          </TouchableOpacity>
        </View>
      </View>

      {/* Draggable bottom sheet */}
      <Animated.View
        style={[{ minHeight: '35%' }, { transform: [{ translateY: pan.y }] }]}
        {...panResponder.panHandlers}
        className='absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-lg'
      >
        <View className='items-center py-3'>
          <View className='h-1 w-12 rounded-full bg-gray-300' />
        </View>

        <View className='px-5 pb-6'>
          {/* Status label */}
          <View className='flex-row items-center gap-2 mb-4'>
            <View className='h-3 w-3 rounded-full bg-green-500' />
            <Text className='text-sm font-bold text-green-600'>
              {STATUS_LABELS[jobStatus] ?? 'ON THE WAY'}
            </Text>
          </View>

          {/* Progress bar */}
          <View className='mb-6'>
            <View className='flex-row items-center justify-between mb-2'>
              <Text className='text-xs font-semibold text-gray-600'>Driver</Text>
              <Text className='text-xs font-semibold text-gray-600'>Pickup</Text>
              <Text className='text-xs font-semibold text-gray-600'>Dropoff</Text>
            </View>
            <View className='h-2 bg-gray-200 rounded-full overflow-hidden'>
              <View
                className='h-full bg-green-500 rounded-full'
                style={{ width: `${PROGRESS[jobStatus] ?? 0}%` }}
              />
            </View>
          </View>

          {/* Driver card */}
          <View className='flex-row items-center gap-4 rounded-2xl bg-gray-50 p-4'>
            <Image
              source={job!.driver?.image || Images.MyProfile}
              className='h-16 w-16 rounded-full'
            />
            <View className='flex-1'>
              <View className='flex-row items-center gap-1 mb-1'>
                <Text className='text-base font-bold text-gray-800'>
                  {job!.driver?.name || 'Driver'}
                </Text>
                <MaterialCommunityIcons name='star' size={14} color='#FFD700' />
                <Text className='text-xs font-semibold text-gray-700'>
                  {job!.driver?.rating || '—'}
                </Text>
              </View>
              <Text className='text-xs text-gray-600'>{job!.driver?.vehicle || 'Truck'}</Text>
            </View>

            <TouchableOpacity
              onPress={handleCallDriver}
              disabled={isCalling}
              className='h-10 w-10 rounded-full bg-green-500 items-center justify-center'
            >
              <MaterialCommunityIcons name='phone' size={18} color='white' />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  )
}

export default UserLiveTracking
