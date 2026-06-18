import { IPA_BASE } from '@env'
import { Entypo, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NavigationProp, useNavigation, useRoute } from '@react-navigation/native'
import axios from 'axios'
import * as Location from 'expo-location'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Toast, useToast } from '../../../../Components/useToost'
import { AuthStackParamList } from '../../../../Navigation/type'
import { useRouteDirection } from '../../../../Utils/useRouteDirection'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

type JobDetail = {
    id: string
    status: string
    distanceKm: number | null
    estimatedFare: number | null
    estimatedHours: number | null
    pickupAddress: string
    pickupLat: number
    pickupLng: number
    dropoffAddress: string
    dropoffLat: number
    dropoffLng: number
    workNote: string | null
    scheduledAt: string | null
    truckType: { name: string } | null
    customer: {
        user: {
            fullName: string
            avatar: string | null
            mobileNumber: string | null
        }
    } | null
    driver: {
        numberPlate: string | null
        truckModel: string | null
    } | null
}

const SkeletonCard = () => {
    const shimmer = useRef(new Animated.Value(0)).current
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
                Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
            ])
        ).start()
    }, [shimmer])
    const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.9] })
    const Box = ({ w, h, mb = 0, br = 8 }: { w: string | number; h: number; mb?: number; br?: number }) => (
        <Animated.View style={{ width: w as any, height: h, marginBottom: mb, borderRadius: br, backgroundColor: '#E5E7EB', opacity }} />
    )
    return (
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 14, elevation: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Box w={80} h={14} br={6} /><Box w={60} h={14} br={6} />
            </View>
            <Box w='90%' h={14} mb={10} br={6} />
            <Box w='75%' h={14} mb={14} br={6} />
            <Box w='100%' h={46} br={12} />
        </View>
    )
}

const JobAssigned = () => {
    const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
    const route = useRoute<any>()
    const toast = useToast()
    const mapRef = useRef<MapView>(null)
    const locationWatcherRef = useRef<Location.LocationSubscription | null>(null)
    const isFirstLoadRef = useRef(true)
    const isUpdatingRoutesRef = useRef(false)

    const jobId: string = route.params?.jobId ?? ''

    const [data, setData] = useState<JobDetail | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentCoords, setCurrentCoords] = useState<{ latitude: number; longitude: number } | null>(null)
    const [isStartingJob, setIsStartingJob] = useState(false)

    const { routeData: routeToPickup, getRoute: getRouteToPickup, isLoading: loadingPickupRoute } = useRouteDirection()
    const { routeData: routeToDropoff, getRoute: getRouteToDropoff, isLoading: loadingDropoffRoute } = useRouteDirection()

    const getCurrentLocation = useCallback(async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync()
            if (status !== 'granted') return null
            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
            return { latitude: location.coords.latitude, longitude: location.coords.longitude }
        } catch {
            return null
        }
    }, [])

    const updateRoutes = useCallback(async (current: { latitude: number; longitude: number }, job: JobDetail) => {
        if (isUpdatingRoutesRef.current) return
        isUpdatingRoutesRef.current = true
        try {
            await getRouteToPickup(
                { id: 'current', title: 'Current Location', address: 'Your Location', latitude: current.latitude, longitude: current.longitude },
                { id: 'pickup', title: 'Pickup', address: job.pickupAddress, latitude: job.pickupLat, longitude: job.pickupLng }
            )
            await getRouteToDropoff(
                { id: 'pickup', title: 'Pickup', address: job.pickupAddress, latitude: job.pickupLat, longitude: job.pickupLng },
                { id: 'dropoff', title: 'Dropoff', address: job.dropoffAddress, latitude: job.dropoffLat, longitude: job.dropoffLng }
            )
        } catch (err) {
            console.error('Route error:', err)
        } finally {
            isUpdatingRoutesRef.current = false
        }
    }, [getRouteToPickup, getRouteToDropoff])

    const startWatchingLocation = useCallback(async (job: JobDetail) => {
        if (locationWatcherRef.current) locationWatcherRef.current.remove()
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') return
        locationWatcherRef.current = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 50 },
            async (location) => {
                const newCoords = { latitude: location.coords.latitude, longitude: location.coords.longitude }
                const hasChanged = !currentCoords ||
                    Math.abs(currentCoords.latitude - newCoords.latitude) > 0.0001 ||
                    Math.abs(currentCoords.longitude - newCoords.longitude) > 0.0001
                if (hasChanged) {
                    setCurrentCoords(newCoords)
                    await updateRoutes(newCoords, job)
                }
            }
        )
    }, [updateRoutes, currentCoords])

    const fetchJobDetails = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)
            const token = await AsyncStorage.getItem('vToken')
            if (!token) {
                toast.show({ message: 'Authentication failed. Please login again.', type: 'error', style: 'top' })
                return
            }
            const res = await axios.get(`${IPA_BASE}/jobs/${jobId}`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 15000,
            })
            const job: JobDetail = res.data?.data
            if (!job) throw new Error('Invalid job data')
            setData(job)

            const currentLoc = await getCurrentLocation()
            if (currentLoc) {
                setCurrentCoords(currentLoc)
                await updateRoutes(currentLoc, job)
            }
            await startWatchingLocation(job)

            setTimeout(() => {
                if (mapRef.current) {
                    mapRef.current.fitToCoordinates(
                        [{ latitude: job.pickupLat, longitude: job.pickupLng },
                         { latitude: job.dropoffLat, longitude: job.dropoffLng }],
                        { edgePadding: { top: 80, right: 60, bottom: 60, left: 60 }, animated: true }
                    )
                }
            }, 1000)
        } catch (err: any) {
            console.error('Job fetch error:', err?.response?.data || err?.message)
            setError('Could not load job details.')
            toast.show({ message: err?.response?.data?.message || 'Failed to load job details', type: 'error', style: 'top' })
        } finally {
            setIsLoading(false)
        }
    }, [jobId, getCurrentLocation, updateRoutes, startWatchingLocation, toast])

    useEffect(() => {
        if (isFirstLoadRef.current) {
            isFirstLoadRef.current = false
            fetchJobDetails()
        }
        return () => {
            locationWatcherRef.current?.remove()
            locationWatcherRef.current = null
        }
    }, [fetchJobDetails])

    const handleStartJob = async () => {
        try {
            setIsStartingJob(true)
            const token = await AsyncStorage.getItem('vToken')
            if (!token) {
                toast.show({ message: 'Authentication failed. Please login again.', type: 'error', style: 'top' })
                return
            }
            const response = await axios.patch(
                `${IPA_BASE}/jobs/${jobId}/status`,
                {},
                { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
            )
            if (response.data?.success === true) {
                toast.show({ message: 'Job started! Heading to pickup.', type: 'success', style: 'top' })
                navigation.navigate('HeadingToPickup', { jobId })
            } else {
                toast.show({ message: response.data?.message || 'Failed to start job', type: 'error', style: 'top' })
            }
        } catch (err: any) {
            toast.show({ message: err?.response?.data?.message || 'Something went wrong', type: 'error', style: 'top' })
        } finally {
            setIsStartingJob(false)
        }
    }

    const handlePickupPress = () => {
        if (data && mapRef.current) {
            mapRef.current.animateToRegion({ latitude: data.pickupLat, longitude: data.pickupLng, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 1000)
        }
    }
    const handleDropoffPress = () => {
        if (data && mapRef.current) {
            mapRef.current.animateToRegion({ latitude: data.dropoffLat, longitude: data.dropoffLng, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 1000)
        }
    }
    const handleShowAllPress = () => {
        if (data && mapRef.current) {
            mapRef.current.fitToCoordinates(
                [{ latitude: data.pickupLat, longitude: data.pickupLng },
                 { latitude: data.dropoffLat, longitude: data.dropoffLng }],
                { edgePadding: { top: 80, right: 60, bottom: 60, left: 60 }, animated: true }
            )
        }
    }

    if (isLoading) {
        return (
            <SafeAreaView className='flex-1 bg-white' edges={['top']}>
                <StatusBar barStyle='dark-content' />
                <View className='flex-1 px-5 pt-4'>
                    <View style={{ height: SCREEN_HEIGHT * 0.45, backgroundColor: '#E5E7EB', borderRadius: 20, marginBottom: 16 }} />
                    <SkeletonCard /><SkeletonCard />
                </View>
            </SafeAreaView>
        )
    }

    if (error || !data) {
        return (
            <SafeAreaView className='flex-1 bg-white items-center justify-center px-6'>
                <MaterialCommunityIcons name='alert-circle-outline' size={48} color='#EF4444' />
                <Text className='text-gray-900 font-bold text-xl mt-4 text-center'>Failed to load job</Text>
                <Text className='text-gray-500 text-center mt-2'>{error}</Text>
                <TouchableOpacity onPress={() => { isFirstLoadRef.current = true; fetchJobDetails() }} className='bg-green-500 rounded-2xl px-8 py-4 mt-6'>
                    <Text className='text-white font-bold text-base'>Retry</Text>
                </TouchableOpacity>
            </SafeAreaView>
        )
    }

    const isRouteLoading = loadingPickupRoute || loadingDropoffRoute
    const customerName = data.customer?.user?.fullName ?? '—'
    const customerPhone = data.customer?.user?.mobileNumber ?? null

    return (
        <SafeAreaView className='flex-1 bg-white' edges={['top']}>
            <StatusBar barStyle='dark-content' />
            <View className='flex-1'>
                <View style={{ height: SCREEN_HEIGHT * 0.45 }}>
                    <MapView
                        ref={mapRef}
                        provider={Platform.OS === 'ios' ? PROVIDER_GOOGLE : undefined}
                        style={{ flex: 1 }}
                        showsUserLocation
                        showsMyLocationButton={false}
                        initialRegion={{ latitude: data.pickupLat, longitude: data.pickupLng, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
                    >
                        {currentCoords && (
                            <Marker coordinate={currentCoords} title='Your Location' pinColor='#3B82F6' />
                        )}
                        <Marker coordinate={{ latitude: data.pickupLat, longitude: data.pickupLng }} title='Pickup' pinColor='#F97316' />
                        <Marker coordinate={{ latitude: data.dropoffLat, longitude: data.dropoffLng }} title='Drop-off' pinColor='#22C55E' />
                        {routeToPickup?.points && routeToPickup.points.length > 0 && (
                            <Polyline coordinates={routeToPickup.points} strokeColor='#3B82F6' strokeWidth={6} />
                        )}
                        {routeToDropoff?.points && routeToDropoff.points.length > 0 && (
                            <Polyline coordinates={routeToDropoff.points} strokeColor='#10B981' strokeWidth={6} />
                        )}
                    </MapView>

                    <TouchableOpacity onPress={() => navigation.goBack()} className='absolute top-4 left-4 bg-white rounded-full p-2' style={{ elevation: 4 }}>
                        <Entypo name='chevron-left' size={24} color='#111827' />
                    </TouchableOpacity>
                    <View className='absolute bottom-4 right-4 gap-2'>
                        <TouchableOpacity onPress={handleShowAllPress} className='bg-white rounded-full p-3' style={{ elevation: 4 }}>
                            <MaterialCommunityIcons name='map-marker-radius' size={22} color='#4CAF50' />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handlePickupPress} className='bg-white rounded-full p-3' style={{ elevation: 4 }}>
                            <MaterialIcons name='location-on' size={22} color='#F59E0B' />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDropoffPress} className='bg-white rounded-full p-3' style={{ elevation: 4 }}>
                            <MaterialCommunityIcons name='flag-checkered' size={20} color='#10B981' />
                        </TouchableOpacity>
                    </View>
                    {isRouteLoading && (
                        <View className='absolute top-4 right-4 bg-white rounded-full px-3 py-2 flex-row items-center gap-2' style={{ elevation: 4 }}>
                            <ActivityIndicator size='small' color='#4CAF50' />
                            <Text className='text-xs text-gray-600 font-semibold'>Getting route...</Text>
                        </View>
                    )}
                </View>

                <View className='flex-1 bg-white rounded-t-3xl -mt-5' style={{ elevation: 8 }}>
                    <View className='items-center pt-3 pb-1'>
                        <View className='w-10 h-1 rounded-full bg-gray-300' />
                    </View>
                    <View className='flex-1 px-5' style={{ paddingBottom: 24 }}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                            <View className='flex-row items-center justify-between mt-1 mb-2'>
                                <Text className='text-2xl font-bold text-gray-900'>Job Assigned</Text>
                                <View className='bg-green-50 rounded-xl px-3 py-1'>
                                    <Text className='text-sm font-bold text-green-600'>{data.truckType?.name ?? 'Truck'}</Text>
                                </View>
                            </View>

                            <View className='flex-row gap-3 mb-3'>
                                <View className='flex-1 bg-white rounded-2xl p-4 border border-gray-100' style={{ elevation: 2 }}>
                                    <Text className='text-xs font-bold text-gray-400 mb-1'>Customer</Text>
                                    <Text className='text-sm font-bold text-gray-900'>{customerName}</Text>
                                </View>
                                <View className='flex-1 flex-row items-center bg-white rounded-2xl p-4 border border-gray-100' style={{ elevation: 2 }}>
                                    <View className='flex-1'>
                                        <Text className='text-xs font-bold text-gray-400 mb-1'>Phone</Text>
                                        <Text className='text-sm font-bold text-gray-900'>{customerPhone ?? 'N/A'}</Text>
                                    </View>
                                    {customerPhone && (
                                        <Pressable onPress={() => Linking.openURL(`tel:${customerPhone}`)}>
                                            <Ionicons name='call-outline' size={24} color='#4CAF50' />
                                        </Pressable>
                                    )}
                                </View>
                            </View>

                            {routeToPickup && (
                                <View className='bg-blue-50 rounded-2xl p-4 mb-4 flex-row justify-between items-center'>
                                    <View className='flex-row items-center gap-3'>
                                        <View className='w-12 h-12 rounded-full bg-blue-100 items-center justify-center'>
                                            <Ionicons name='navigate' size={24} color='#3B82F6' />
                                        </View>
                                        <View>
                                            <Text className='text-sm text-gray-500 font-medium'>Distance to Pickup</Text>
                                            <Text className='text-2xl font-bold text-gray-900'>{routeToPickup.distance.toFixed(1)} km</Text>
                                        </View>
                                    </View>
                                    <View className='items-end'>
                                        <Text className='text-sm text-gray-500 font-medium'>Est. time</Text>
                                        <Text className='text-xl font-bold text-gray-900'>{Math.round(routeToPickup.duration)} min</Text>
                                    </View>
                                </View>
                            )}

                            <View className='bg-white rounded-2xl p-4 mb-3 border border-gray-100' style={{ elevation: 2 }}>
                                <Text className='text-sm font-bold text-gray-400 mb-4'>ROUTE DETAILS</Text>
                                <TouchableOpacity onPress={handlePickupPress} className='flex-row mb-4'>
                                    <View className='items-center mr-4'>
                                        <View className='w-9 h-9 rounded-full bg-orange-100 items-center justify-center'>
                                            <MaterialIcons name='location-on' size={16} color='#F59E0B' />
                                        </View>
                                        <View className='w-0.5 h-8 bg-gray-200 mt-1' />
                                    </View>
                                    <View className='flex-1 pt-1'>
                                        <Text className='text-xs font-bold text-gray-400 mb-1'>PICKUP</Text>
                                        <Text className='text-sm font-semibold text-gray-900' numberOfLines={2}>{data.pickupAddress}</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleDropoffPress} className='flex-row'>
                                    <View className='mr-4'>
                                        <View className='w-9 h-9 rounded-full bg-green-100 items-center justify-center'>
                                            <MaterialCommunityIcons name='flag-checkered' size={14} color='#10B981' />
                                        </View>
                                    </View>
                                    <View className='flex-1 pt-1'>
                                        <Text className='text-xs font-bold text-gray-400 mb-1'>DROP-OFF</Text>
                                        <Text className='text-sm font-semibold text-gray-900' numberOfLines={2}>{data.dropoffAddress}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            {(data.scheduledAt || data.workNote) && (
                                <View className='bg-white rounded-2xl p-4 mb-3 border border-gray-100' style={{ elevation: 2 }}>
                                    {data.scheduledAt && (
                                        <View className='flex-row items-center mb-2'>
                                            <MaterialCommunityIcons name='calendar-clock' size={18} color='#6B7280' />
                                            <Text className='text-sm text-gray-600 ml-2'>
                                                {new Date(data.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </View>
                                    )}
                                    {data.workNote && (
                                        <View className='flex-row items-start'>
                                            <MaterialCommunityIcons name='note-text-outline' size={18} color='#6B7280' />
                                            <Text className='text-sm text-gray-600 ml-2 flex-1'>{data.workNote}</Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </ScrollView>

                        <TouchableOpacity
                            onPress={handleStartJob}
                            disabled={isStartingJob}
                            className={`bg-green-500 rounded-2xl py-4 items-center ${isStartingJob ? 'opacity-50' : ''}`}
                            style={{ elevation: 3 }}
                        >
                            {isStartingJob
                                ? <ActivityIndicator color='white' />
                                : <Text className='text-white font-bold text-base'>START JOB</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <Toast visible={toast.visible} message={toast.message} type={toast.type} fadeAnim={toast.fadeAnim} buttons={toast.buttons} style={toast.style} onHide={toast.hide} />
        </SafeAreaView>
    )
}

export default JobAssigned
