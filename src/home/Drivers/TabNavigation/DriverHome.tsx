import { AVAILABLE_JOBS, DRIVER_DETAILS, IPA_BASE, LOCATION_UPDATE, STATUS_DRIVER } from '@env'
import { Entypo, FontAwesome6, Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native'
import axios from 'axios'
import * as Location from 'expo-location'
import { reverseGeocodeString } from '../../../Utils/geocoding'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Animated,
    AppState,
    AppStateStatus,
    Easing,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SafeUser } from '../../../Auth/SignIn'
import JobCard, { JobCardData } from '../../../Components/JobCard'
import { Toast, useToast } from '../../../Components/useToost'
import { Images } from '../../../constants'
import { AuthStackParamList } from '../../../Navigation/type'
import { driverSocketService, JobNewData } from '../services/driverSocket.service'

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE_URL = IPA_BASE
const END_POINTS = {
    STATUS_DRIVER,
    LOCATION_UPDATE,
    AVAILABLE_JOBS,
    DRIVER_DETAILS,
}

export type SafeDriver = {
    id: string
    vehicleType: string
    numberPlate: string | null
    truckModel: string | null
    hourlyRate: number
    driverStatus: string
    isAvailable: boolean
    isProfileComplete: boolean
    totalEarnings: number
}

type ApiJob = {
    id: string
    pickupAddress: string
    dropoffAddress: string
    distanceKm: number
    estimatedFare: number
    workNote?: string
    scheduledAt?: string
    truckType?: { name: string }
    customer?: { user?: { fullName?: string; email?: string } }
}

const mapApiJob = (item: ApiJob): JobCardData => ({
    id: item.id,
    jobId: item.id,
    vehicleType: item.truckType?.name ?? 'Truck',
    status: 'pending',
    pickupAddress: item.pickupAddress,
    dropAddress: item.dropoffAddress,
    distance: item.distanceKm,
    duration: 0,
    fare: item.estimatedFare,
    scheduleDate: item.scheduledAt,
    scheduleTime: undefined,
    workNotes: item.workNote,
    customerEmail: item.customer?.user?.email,
})

const distanceItem = [
    { label: 'Within 5 km', value: 5 },
    { label: 'Within 10 km', value: 10 },
    { label: 'Within 20 km', value: 20 },
    { label: 'Within 30 km', value: 30 },
    { label: 'Within 50 km', value: 50 },
]

// ─── Skeleton Card ────────────────────────────────────────────────────────────

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
                <Box w={80} h={14} br={6} />
                <Box w={60} h={14} br={6} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                <Box w='48%' h={48} br={10} />
                <Box w='48%' h={48} br={10} />
            </View>
            <Box w='30%' h={10} mb={6} br={4} />
            <Box w='90%' h={14} mb={14} br={6} />
            <Box w='30%' h={10} mb={6} br={4} />
            <Box w='75%' h={14} mb={14} br={6} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
                <Box w={60} h={32} br={8} />
                <Box w={60} h={32} br={8} />
                <Box w={60} h={32} br={8} />
            </View>
            <Box w='100%' h={46} br={12} />
        </View>
    )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = ({ isOnline }: { isOnline: boolean }) => (
    <View style={{ alignItems: 'center', paddingTop: 16, paddingBottom: 40 }}>
        <Image source={Images.FindTruck} style={{ marginBottom: 24 }} />
        <Text style={{ fontSize: 26, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 10, lineHeight: 34 }}>
            {isOnline ? 'No jobs nearby' : 'You are offline'}
        </Text>
        <Text style={{ fontSize: 15, color: '#9CA3AF', textAlign: 'center', lineHeight: 22, paddingHorizontal: 24 }}>
            {isOnline
                ? 'No available jobs in this area.\nTry a larger radius or check back later.'
                : 'Go online to start\nreceiving job assignments.'}
        </Text>
    </View>
)

// ─── Component ────────────────────────────────────────────────────────────────

const DriverHome = () => {
    const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
    const toast = useToast()
    const toastRef = useRef(toast)
    useEffect(() => { toastRef.current = toast })
    const rotateAnim = useRef(new Animated.Value(0)).current
    const locationWatcherRef = useRef<Location.LocationSubscription | null>(null)
    const lastSentCoordsRef = useRef<{ latitude: number; longitude: number } | null>(null)
    const isFirstStatusSyncRef = useRef(true)

    const [user, setUser] = useState<SafeUser | null>(null)
    const [driver, setDriver] = useState<SafeDriver | null>(null)
    const [isOnline, setIsOnline] = useState(false)
    const isOnlineRef = useRef(false)
    const locationCoordsRef = useRef<{ latitude: number; longitude: number } | null>(null)
    const fetchNearbyJobsRef = useRef<typeof fetchNearbyJobs | null>(null)
    const [currentLocation, setCurrentLocation] = useState<string>('Loading...')
    const [isLoadingLocation, setIsLoadingLocation] = useState(true)
    const [showLocationModal, setShowLocationModal] = useState(false)
    const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null)
    const [selectedRadius, setSelectedRadius] = useState<number>(20)
    const [jobs, setJobs] = useState<JobCardData[]>([])
    const [isStartingJob, setIsStartingJob] = useState(false)

    // ── Loading states ────────────────────────────────────────────────────────
    // isFirstLoad → skeleton দেখায় (page first open)
    // jobsLoading → pull-to-refresh spinner
    const [isFirstLoad, setIsFirstLoad] = useState(true)
    const [jobsLoading, setJobsLoading] = useState(false)
    const [jobsError, setJobsError] = useState<string | null>(null)

    const getToken = async () => AsyncStorage.getItem('vToken')

    // Keep refs in sync so callbacks can read latest values without causing re-renders
    useEffect(() => { isOnlineRef.current = isOnline }, [isOnline])
    useEffect(() => { locationCoordsRef.current = locationCoords }, [locationCoords])

    // ─── Load vUser ───────────────────────────────────────────────────────────

    useEffect(() => {
        const loadUser = async () => {
            try {
                const raw = await AsyncStorage.getItem('vUser')
                if (raw) {
                    const p = JSON.parse(raw)
                    setUser({
                        _id: p._id ?? p.id ?? '',
                        fullName: p.fullName ?? '',
                        email: p.email ?? '',
                        phoneNumber: p.phoneNumber ?? '',
                        role: p.role ?? 'DRIVER',
                        status: p.status ?? 'ACTIVE',
                        isVerified: p.isVerified ?? false,
                        imageUrl: p.imageUrl ?? p.profile ?? null,
                        subscriptionStatus: p.subscriptionStatus ?? null,
                    })
                }
            } catch {
                // non-critical
            }
        }
        loadUser()
    }, [])

    // ─── Fetch Driver Details ─────────────────────────────────────────────────

    const fetchAndSaveDriverDetails = useCallback(async () => {
        try {
            const cached = await AsyncStorage.getItem('vDriver')
            if (cached) setDriver(JSON.parse(cached) as SafeDriver)

            const token = await getToken()
            if (!token) return

            const res = await axios.get(`${API_BASE_URL}${END_POINTS.DRIVER_DETAILS}`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 15000,
            })

            const d = res.data?.data
            if (!d) return

            const safeDriver: SafeDriver = {
                id: d.id,
                vehicleType: d.truckType?.name ?? 'Truck',
                numberPlate: d.numberPlate ?? null,
                truckModel: d.truckModel ?? null,
                hourlyRate: d.hourlyRate ?? 0,
                driverStatus: d.driverStatus ?? 'PENDING',
                isAvailable: d.isAvailable ?? false,
                isProfileComplete: d.isProfileComplete ?? false,
                totalEarnings: d.totalEarnings ?? 0,
            }

            setDriver(safeDriver)
            // Sync toggle with actual server state on every app open
            setIsOnline(safeDriver.isAvailable)
            await AsyncStorage.setItem('vDriver', JSON.stringify(safeDriver))
        } catch {
            // non-critical; cached value still displayed
        }
    }, [])

    useEffect(() => {
        fetchAndSaveDriverDetails()
    }, [fetchAndSaveDriverDetails])

    // ─── Approval guard — redirect if not yet approved ────────────────────────

    useFocusEffect(
        useCallback(() => {
            const checkApproval = async () => {
                try {
                    const token = await AsyncStorage.getItem('vToken')
                    if (!token) return
                    const res = await axios.get(`${API_BASE_URL}${END_POINTS.DRIVER_DETAILS}`, {
                        headers: { Authorization: `Bearer ${token}` },
                        timeout: 10000,
                    })
                    const d = res.data?.data
                    if (!d) return
                    if (!d.isProfileComplete) {
                        navigation.reset({ index: 0, routes: [{ name: 'ProfileSetup' }] })
                        return
                    } else if (d.driverStatus !== 'APPROVED') {
                        navigation.reset({ index: 0, routes: [{ name: 'DriverPendingVerification' }] })
                        return
                    }

                    // If driver has an active job, redirect them to it
                    const jobsRes = await axios.get(`${API_BASE_URL}/jobs/driver-jobs`, {
                        headers: { Authorization: `Bearer ${token}` },
                        timeout: 10000,
                    })
                    const allJobs: any[] = jobsRes.data?.data ?? []
                    const active = allJobs.find((j: any) =>
                        ['BOOKED', 'ON_WAY', 'ARRIVED', 'LOADED', 'IN_TRANSIT'].includes(j.status)
                    )
                    if (active) {
                        navigation.navigate('JobAssigned', { jobId: active.id })
                    }
                } catch {
                    // network error — stay on screen; guard will re-run on next focus
                }
            }
            checkApproval()
        }, [navigation])
    )

    // ─── Rotate animation ─────────────────────────────────────────────────────

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

    // ─── Location Helpers ─────────────────────────────────────────────────────

    const getAddressFromCoordinates = (latitude: number, longitude: number) =>
        reverseGeocodeString(latitude, longitude)

    const shouldSendLocation = (latitude: number, longitude: number) => {
        const last = lastSentCoordsRef.current
        if (!last) return true
        return Math.abs(last.latitude - latitude) > 0.0003 || Math.abs(last.longitude - longitude) > 0.0003
    }

    // ─── Fetch Nearby Jobs ────────────────────────────────────────────────────
    //
    //  isRefresh=true  → pull-to-refresh (jobsLoading spinner)
    //  isRefresh=false → first load (skeleton)
    //

    const fetchNearbyJobs = useCallback(
        async (lat: number, lng: number, radius: number = selectedRadius, isRefresh = false) => {
            try {
                if (isRefresh) setJobsLoading(true)
                setJobsError(null)

                const token = await getToken()
                if (!token) return

                const res = await axios.get(`${API_BASE_URL}${END_POINTS.AVAILABLE_JOBS}`, {
                    params: { lat, lng, radiusKm: radius },
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    timeout: 15000,
                })

                const data: ApiJob[] = res.data?.data ?? []
                setJobs(data.map(mapApiJob))
            } catch (error: any) {
                console.error('Jobs fetch error:', error?.response?.data || error?.message)
                setJobsError('Could not load nearby jobs.')
            } finally {
                setJobsLoading(false)
                setIsFirstLoad(false)
            }
        },
        [selectedRadius]
    )

    useEffect(() => { fetchNearbyJobsRef.current = fetchNearbyJobs }, [fetchNearbyJobs])

    // ─── Radius Change ────────────────────────────────────────────────────────

    const handleRadiusChange = async (radius: number) => {
        setSelectedRadius(radius)
        setIsFirstLoad(true)   // নতুন radius skeleton দেখাও
        if (!locationCoords) return
        await fetchNearbyJobs(locationCoords.latitude, locationCoords.longitude, radius)
    }

    // ─── Driver Status ────────────────────────────────────────────────────────

    const updateDriverStatus = useCallback(async (status: 'active' | 'inactive') => {
        try {
            const token = await getToken()
            if (!token) return
            await axios.patch(
                `${API_BASE_URL}${END_POINTS.STATUS_DRIVER}`,
                { isAvailable: status === 'active' },
                { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
            )
        } catch (error: any) {
            const msg: string = error?.response?.data?.message ?? 'Could not update status'
            toastRef.current.show({ message: msg, type: 'error', style: 'top' })
            // Roll back the toggle on error
            if (status === 'active') setIsOnline(false)
        }
    }, [])

    // ─── Location ─────────────────────────────────────────────────────────────

    const updateDriverLocation = useCallback(async (latitude: number, longitude: number) => {
        try {
            const token = await getToken()
            if (!token) return
            await axios.patch(
                `${API_BASE_URL}${END_POINTS.LOCATION_UPDATE}`,
                { latitude: Number(latitude), longitude: Number(longitude) },
                { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
            )
        } catch (error: any) {
            console.error('Location update error:', error?.response?.data || error?.message)
        }
    }, [])

    const fetchCurrentLocation = useCallback(async () => {
        try {
            setIsLoadingLocation(true)
            const { status } = await Location.requestForegroundPermissionsAsync()
            if (status !== 'granted') {
                setCurrentLocation('Permission Denied')
                Alert.alert('Permission needed', 'Location permission allow koro.')
                return
            }
            const isAvailable = await Location.hasServicesEnabledAsync()
            if (!isAvailable) {
                setCurrentLocation('Location Services Off')
                Alert.alert('Location Services Off', 'Device er location service on koro.')
                return
            }
            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
            const { latitude, longitude } = location.coords

            const address = await getAddressFromCoordinates(latitude, longitude)
            setCurrentLocation(address)
            setLocationCoords({ latitude, longitude })

            if (isOnlineRef.current) {
                await updateDriverLocation(latitude, longitude)
                lastSentCoordsRef.current = { latitude, longitude }
                await fetchNearbyJobs(latitude, longitude)
            }
        } catch (error) {
            console.error('Error fetching location:', error)
            setCurrentLocation('Error Getting Location')
            setIsFirstLoad(false)
        } finally {
            setIsLoadingLocation(false)
        }
    }, [updateDriverLocation, fetchNearbyJobs])

    const startWatchingLocation = useCallback(async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync()
            if (status !== 'granted') return
            const isAvailable = await Location.hasServicesEnabledAsync()
            if (!isAvailable) return

            if (locationWatcherRef.current) {
                locationWatcherRef.current.remove()
                locationWatcherRef.current = null
            }

            locationWatcherRef.current = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 50 },
                async (location) => {
                    const { latitude, longitude } = location.coords
                    setLocationCoords({ latitude, longitude })
                    const address = await getAddressFromCoordinates(latitude, longitude)
                    setCurrentLocation(address)
                    if (isOnlineRef.current && shouldSendLocation(latitude, longitude)) {
                        await updateDriverLocation(latitude, longitude)
                        lastSentCoordsRef.current = { latitude, longitude }
                    }
                }
            )
        } catch (error) {
            console.error('Error watching location:', error)
        }
    }, [updateDriverLocation])

    // ─── Effects ──────────────────────────────────────────────────────────────

    useEffect(() => {
        fetchCurrentLocation()
        startWatchingLocation()
        return () => {
            locationWatcherRef.current?.remove()
            locationWatcherRef.current = null
        }
    }, [fetchCurrentLocation, startWatchingLocation])

    // ─── Socket: connect + subscribe/unsubscribe + listen for new jobs ───────
    //
    // onJobNew is registered AFTER connect() resolves so the socket instance
    // exists. Registering it in a separate [] effect causes a race where the
    // socket is still null when socket?.on() is called.
    //

    useEffect(() => {
        let mounted = true

        const handleNewJob = (data: JobNewData) => {
            setJobs((prev) => {
                if (prev.some((j) => j.id === data.jobId)) return prev
                const newCard: JobCardData = {
                    id: data.jobId,
                    jobId: data.jobId,
                    vehicleType: data.truckType,
                    status: 'pending',
                    pickupAddress: data.pickupAddress,
                    dropAddress: data.dropoffAddress,
                    distance: data.distanceKm,
                    duration: 0,
                    fare: data.estimatedFare,
                }
                return [newCard, ...prev]
            })
        }

        const connectAndSubscribe = async () => {
            try {
                await driverSocketService.connect()
                if (!mounted) return
                driverSocketService.onJobNew(handleNewJob)
                if (isOnline) {
                    driverSocketService.subscribeJobs(selectedRadius)
                } else {
                    driverSocketService.unsubscribeJobs()
                }
            } catch {
                // socket connection failed; will retry on next focus
            }
        }

        connectAndSubscribe()

        return () => {
            mounted = false
            driverSocketService.offJobNew(handleNewJob)
        }
    }, [isOnline, selectedRadius])

    // ─── AppState: mark driver offline when app is backgrounded/killed ───────
    //
    //  Covers controlled exits (home button, task switcher). Crashes/network
    //  drops are handled by the backend socket disconnect handler (see NestJS
    //  gateway handleDisconnect → set isAvailable=false for DRIVER role).
    //

    useEffect(() => {
        const handleAppStateChange = async (nextState: AppStateStatus) => {
            // Only go offline when truly backgrounded — not on 'inactive' which fires
            // during system dialogs (location permission, notifications, etc.)
            if (nextState === 'background') {
                setIsOnline(false)
                driverSocketService.unsubscribeJobs()
                await updateDriverStatus('inactive')
            }
        }

        const subscription = AppState.addEventListener('change', handleAppStateChange)
        return () => subscription.remove()
    }, [updateDriverStatus])

    useEffect(() => {
        if (isFirstStatusSyncRef.current) {
            isFirstStatusSyncRef.current = false
            return
        }
        updateDriverStatus(isOnline ? 'active' : 'inactive')
        if (isOnline) {
            // Fetch jobs immediately when going online using latest coords + jobs fn via refs
            const coords = locationCoordsRef.current
            if (coords) fetchNearbyJobsRef.current?.(coords.latitude, coords.longitude)
        } else {
            setJobs([])
        }
    }, [isOnline, updateDriverStatus])

    // ─── Handlers ─────────────────────────────────────────────────────────────

    const handleJobPress = async (job: JobCardData) => {
        try {
            setIsStartingJob(true)

            const token = await AsyncStorage.getItem('vToken')
            if (!token) {
                toast.show({
                    message: 'Authentication failed. Please login again.',
                    type: 'error',
                    style: 'top',
                })
                return
            }

            const response = await axios.post(
                `${API_BASE_URL}/jobs/${job.id}/accept`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 15000,
                }
            )

            if (response.data?.success === true) {
                navigation.navigate('JobAssigned', { jobId: job.id })
                toast.show({
                    message: 'Job accepted successfully!',
                    type: 'success',
                    style: 'top',
                })


            } else {
                toast.show({
                    message: response.data?.message || 'Failed to accept job',
                    type: 'error',
                    style: 'top',
                })
            }
        } catch (err: any) {
            console.error('Accept job error:', err)
            toast.show({
                message: err?.response?.data?.message || 'Something went wrong',
                type: 'error',
                style: 'top',
            })
        } finally {
            setIsStartingJob(false)
        }

    }

    const handleRefresh = async () => {
        if (!locationCoords) return
        await fetchNearbyJobs(locationCoords.latitude, locationCoords.longitude, selectedRadius, true)
    }

    // ─── Location Modal ───────────────────────────────────────────────────────

    const LocationModal = () => (
        <Modal visible={showLocationModal} transparent animationType='fade' onRequestClose={() => setShowLocationModal(false)}>
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
                    <Text className='text-2xl font-bold text-gray-900 text-center mb-4'>{currentLocation}</Text>
                    {locationCoords && (
                        <View className='bg-gray-50 rounded-2xl p-4 mb-6'>
                            <View className='flex-row justify-between mb-3'>
                                <Text className='text-gray-500 font-semibold'>Latitude:</Text>
                                <Text className='text-gray-900 font-bold'>{locationCoords.latitude.toFixed(6)}</Text>
                            </View>
                            <View className='flex-row justify-between'>
                                <Text className='text-gray-500 font-semibold'>Longitude:</Text>
                                <Text className='text-gray-900 font-bold'>{locationCoords.longitude.toFixed(6)}</Text>
                            </View>
                        </View>
                    )}
                    <TouchableOpacity onPress={fetchCurrentLocation} className='bg-primary py-4 rounded-2xl mb-3'>
                        <Text className='text-white text-center font-bold text-lg'>Refresh Location</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowLocationModal(false)} className='bg-gray-200 py-3 rounded-2xl'>
                        <Text className='text-gray-900 text-center font-semibold text-lg'>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    )

    // ─── FlatList Header ──────────────────────────────────────────────────────

    const ListHeader = () => (
        <View>
            {/* Driver Status Card */}
            <View className='bg-white rounded-3xl p-5 mb-4' style={{ elevation: 3 }}>
                <View className='flex-row justify-between items-center'>
                    <View style={{ flex: 1 }}>
                        <Text className='text-2xl font-bold text-gray-900'>Driver Status</Text>
                        <Text className='text-base text-gray-500 mt-1 leading-5'>
                            {isOnline
                                ? 'You are online and\navailable for new job assignments.'
                                : 'You are offline and\nnot receiving job assignments.'}
                        </Text>
                        {driver?.vehicleType && (
                            <View style={{ marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#DCFCE7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#16A34A' }}>{driver.vehicleType}</Text>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity
                        onPress={() => setIsOnline((prev) => !prev)}
                        className={`w-16 h-10 rounded-full flex-row items-center px-1 ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                        <Animated.View className={`w-8 h-8 rounded-full bg-white ${isOnline ? 'ml-auto' : ''}`} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Distance Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4, gap: 10, marginBottom: 12 }}>
                {distanceItem.map((item) => {
                    const isSelected = selectedRadius === item.value
                    return (
                        <TouchableOpacity
                            key={item.value}
                            onPress={() => handleRadiusChange(item.value)}
                            style={{
                                backgroundColor: isSelected ? '#43B047' : '#FFFFFF',
                                paddingHorizontal: 16,
                                paddingVertical: 10,
                                borderRadius: 20,
                                borderWidth: 1,
                                borderColor: isSelected ? '#43B047' : '#E5E7EB',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Text style={{ color: isSelected ? '#FFFFFF' : '#374151', fontWeight: isSelected ? '700' : '500', fontSize: 13 }}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    )
                })}
            </ScrollView>

            {/* Title + count */}
            <View className='flex-row justify-between items-center mb-4'>
                <Text className='text-xl font-bold text-gray-900'>
                    {isOnline ? 'Nearby Jobs' : 'Go online to see jobs'}
                </Text>
                {!isFirstLoad && jobs.length > 0 && (
                    <View style={{ backgroundColor: '#DCFCE7', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#16A34A' }}>
                            {jobs.length} available
                        </Text>
                    </View>
                )}
            </View>
        </View>
    )

    // ─── ListEmptyComponent ───────────────────────────────────────────────────
    //
    //  State          → What shows
    //  isFirstLoad    → Skeleton cards (shimmer)
    //  jobsError      → Error card + Retry button
    //  jobs=[]        → EmptyState (no jobs image)
    //

    const ListEmpty = () => {
        if (isFirstLoad) {
            return (
                <>
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </>
            )
        }

        if (jobsError) {
            return (
                <View style={{ backgroundColor: '#FEF2F2', borderRadius: 16, padding: 20, alignItems: 'center' }}>
                    <Ionicons name='alert-circle-outline' size={36} color='#EF4444' />
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 10 }}>
                        Failed to load jobs
                    </Text>
                    <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 4, textAlign: 'center' }}>
                        {jobsError}
                    </Text>
                    <TouchableOpacity
                        onPress={handleRefresh}
                        style={{ marginTop: 14, backgroundColor: '#43B047', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 }}
                    >
                        <Text style={{ color: '#fff', fontWeight: '800' }}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )
        }

        return <EmptyState isOnline={isOnline} />
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <SafeAreaView className='flex-1 bg-primary'>
            <LocationModal />
            <StatusBar barStyle='light-content' />

            <View className='flex-1'>
                {/* Top Bar */}
                <View className='flex-row justify-between px-5 py-6'>
                    <View className='flex-row items-center justify-center gap-4'>
                        <View className='w-16 h-16 items-center justify-center rounded-full bg-white'>
                            <FontAwesome6 name='location-dot' size={24} color='#43B047' />
                        </View>
                        <View>
                            <Text className='text-[#FFFFFF] font-thin text-lg'>Current Location</Text>
                            <TouchableOpacity onPress={() => setShowLocationModal(true)}>
                                <View className='flex-row items-center gap-2'>
                                    {isLoadingLocation && <ActivityIndicator size='small' color='white' />}
                                    <Text className='text-xl font-bold text-white'>{currentLocation}</Text>
                                    <Entypo name='chevron-down' size={24} color='white' />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className='relative w-[72px] h-[72px]'>
                        <Animated.View
                            style={{ transform: [{ rotate }] }}
                            className='absolute inset-0 border-2 border-dashed border-white rounded-full'
                        />
                        <TouchableOpacity
                            onPress={() => navigation.navigate('DriverProfile')}
                            className='absolute inset-0 items-center justify-center'
                        >
                            {user?.imageUrl ? (
                                <Image source={{ uri: user.imageUrl }} className='w-16 h-16 rounded-full' />
                            ) : (
                                <View className='w-16 h-16 rounded-full bg-white items-center justify-center'>
                                    <Ionicons name='person' size={32} color='#43B047' />
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Main FlatList */}
                <FlatList
                    data={jobs}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{
                        paddingHorizontal: 20,
                        paddingTop: 28,
                        paddingBottom: 120,
                        backgroundColor: '#F9FAFB',
                        borderTopLeftRadius: 28,
                        borderTopRightRadius: 28,
                        flexGrow: 1,
                    }}
                    style={{ backgroundColor: '#F9FAFB', borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
                    showsVerticalScrollIndicator={false}
                    refreshing={jobsLoading}
                    onRefresh={handleRefresh}
                    ListHeaderComponent={<ListHeader />}
                    ListEmptyComponent={<ListEmpty />}
                    renderItem={({ item }) => (
                        <JobCard job={item} onPress={handleJobPress} />
                    )}
                />
            </View>
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                fadeAnim={toast.fadeAnim}
                buttons={toast.buttons}
                style={toast.style}
                onHide={toast.hide}
            />
        </SafeAreaView>
    )
}

export default DriverHome