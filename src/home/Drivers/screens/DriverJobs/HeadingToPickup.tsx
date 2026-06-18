// HeadingToPickup.tsx – Full driver ride screen with socket-only status updates
import { IPA_BASE } from '@env';
import {
    Entypo,
    Ionicons,
    MaterialCommunityIcons,
    MaterialIcons,
} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp, useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Toast, useToast } from '../../../../Components/useToost';
import { AuthStackParamList } from '../../../../Navigation/type';
import { useRouteDirection } from '../../../../Utils/useRouteDirection';
import { driverSocketService } from '../../services/driverSocket.service';

const API_BASE_URL = IPA_BASE;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const ARRIVED_RADIUS_METERS = 50;
const LOCATION_UPDATE_INTERVAL_MS = 5000;

type JobApiResponse = {
    id: string;
    status?: string;
    distanceKm?: number;
    estimatedFare?: number;
    estimatedHours?: number;
    workNote?: string;
    scheduledAt?: string;
    pickupAddress: string;
    pickupLat: number;
    pickupLng: number;
    dropoffAddress: string;
    dropoffLat: number;
    dropoffLng: number;
    truckType?: { name?: string };
    customer?: { user?: { fullName?: string; mobileNumber?: string | null } };
    driver?: { numberPlate?: string | null; truckModel?: string | null };
};

const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const RouteProgressBar = ({ progress }: { progress: number }) => {
    const clamp = Math.min(Math.max(progress, 0), 1);
    return (
        <View className="mb-5">
            <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-1">
                    <Ionicons name="navigate" size={14} color="#3B82F6" />
                    <Text className="text-xs font-semibold text-gray-500">Driver</Text>
                </View>
                <View className="flex-row items-center gap-1">
                    <Text className="text-xs font-semibold text-gray-500">Pickup</Text>
                    <MaterialIcons name="location-on" size={14} color="#F59E0B" />
                </View>
            </View>
            <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <View style={{ width: `${clamp * 100}%` }} className="h-full bg-green-500 rounded-full" />
            </View>
        </View>
    );
};

type RidePhase = 'heading_to_pickup' | 'arrived_at_pickup' | 'ride_started' | 'heading_to_dropoff' | 'completed';

const HeadingToPickup = () => {
    const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
    const route = useRoute<any>();
    const toast = useToast();
    const mapRef = useRef<MapView>(null);
    const locationWatcherRef = useRef<Location.LocationSubscription | null>(null);
    const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isUpdatingRouteRef = useRef(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const ridePhaseRef = useRef<RidePhase>('heading_to_pickup');
    const isMountedRef = useRef(true);
    const hasFetchedRef = useRef(false);

    const jobId: string = route.params?.jobId ?? '';

    const [data, setData] = useState<JobApiResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentCoords, setCurrentCoords] = useState<{ latitude: number; longitude: number } | null>(null);
    const [distanceToPickup, setDistanceToPickup] = useState<number | null>(null);
    const [distanceToDropoff, setDistanceToDropoff] = useState<number | null>(null);
    const [isNearPickup, setIsNearPickup] = useState(false);
    const [routeProgress, setRouteProgress] = useState(0);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [eta, setEta] = useState<number | null>(null);
    const [ridePhase, setRidePhase] = useState<RidePhase>('heading_to_pickup');
    const [dropoffEta, setDropoffEta] = useState<number | null>(null);

    const { routeData: routeToPickup, getRoute: getRouteToPickup, isLoading: loadingRoute } = useRouteDirection();
    const { routeData: routeToDropoff, getRoute: getRouteToDropoff, isLoading: loadingDropRoute } = useRouteDirection();

    useEffect(() => {
        ridePhaseRef.current = ridePhase;
    }, [ridePhase]);

    useEffect(() => {
        if (!isNearPickup) return;
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.06, duration: 600, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, [isNearPickup]);

    const getCurrentLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return null;
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        } catch {
            return null;
        }
    };

    // ---------- Route building functions ----------
    const buildRoute = async (current: { latitude: number; longitude: number }, jobData: JobApiResponse) => {
        if (isUpdatingRouteRef.current) return;
        if (!jobData?.pickupLat || !jobData?.pickupLng) return;
        isUpdatingRouteRef.current = true;
        try {
            const pickup = { latitude: jobData.pickupLat, longitude: jobData.pickupLng };
            await getRouteToPickup(
                { id: 'current', title: 'Current Location', address: 'Your Location', ...current },
                { id: 'pickup', title: 'Pickup', address: jobData.pickupAddress, ...pickup }
            );
            const dist = getDistanceMeters(current.latitude, current.longitude, pickup.latitude, pickup.longitude);
            setDistanceToPickup(dist);
            setIsNearPickup(dist <= ARRIVED_RADIUS_METERS);
            setEta(Math.round((dist / 1000 / 30) * 60));
            if (routeToPickup?.distance) {
                const totalMeters = routeToPickup.distance * 1000;
                setRouteProgress(Math.min(1, Math.max(0, 1 - dist / totalMeters)));
            }
        } catch (err) {
            console.error('Route error:', err);
        } finally {
            isUpdatingRouteRef.current = false;
        }
    };

    const buildRouteToDropoff = async (current: { latitude: number; longitude: number }, jobDataOverride?: JobApiResponse) => {
        const jobData = jobDataOverride ?? data;
        if (!jobData?.dropoffLat || !jobData?.dropoffLng) return;
        const drop = { latitude: jobData.dropoffLat, longitude: jobData.dropoffLng };
        await getRouteToDropoff(
            { id: 'current', title: 'Current Location', address: 'Your Location', ...current },
            { id: 'dropoff', title: 'Dropoff', address: jobData.dropoffAddress, ...drop }
        );
        const dist = getDistanceMeters(current.latitude, current.longitude, drop.latitude, drop.longitude);
        setDistanceToDropoff(dist);
        setDropoffEta(Math.round((dist / 1000 / 30) * 60));
    };

    const startWatchingLocation = async (jobData: JobApiResponse) => {
        locationWatcherRef.current?.remove();
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        locationWatcherRef.current = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
            async (loc) => {
                if (!isMountedRef.current) return;
                const newCoords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
                setCurrentCoords(newCoords);
                const phase = ridePhaseRef.current;
                if (phase === 'heading_to_pickup' || phase === 'arrived_at_pickup') {
                    await buildRoute(newCoords, jobData);
                } else if (phase === 'ride_started' || phase === 'heading_to_dropoff') {
                    await buildRouteToDropoff(newCoords);
                }
                mapRef.current?.animateToRegion({ ...newCoords, latitudeDelta: 0.015, longitudeDelta: 0.015 }, 800);
            }
        );
    };

    const sendLiveLocation = () => {
        if (!currentCoords) return;
        driverSocketService.sendLocation({
            lat: currentCoords.latitude,
            lng: currentCoords.longitude,
        });
    };

    const startPeriodicLocationUpdates = () => {
        if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = setInterval(sendLiveLocation, LOCATION_UPDATE_INTERVAL_MS);
    };

    // ---------- Fetch job details (HTTP only for job data, not status) ----------
    const fetchJobDetails = useCallback(async () => {
        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;

        try {
            setIsLoading(true);
            const token = await AsyncStorage.getItem('vToken');
            if (!token) throw new Error('No token found');

            const res = await axios.get(`${API_BASE_URL}/jobs/${jobId}`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 15000,
            });
            const job: JobApiResponse = res.data?.data;
            if (!job) throw new Error('Invalid job data');
            setData(job);

            // Restore phase from API status so re-opening app mid-job works correctly
            const statusToPhase: Record<string, RidePhase> = {
                ON_WAY: 'heading_to_pickup',
                ARRIVED: 'arrived_at_pickup',
                LOADED: 'ride_started',
                IN_TRANSIT: 'heading_to_dropoff',
            };
            if (job.status && statusToPhase[job.status]) {
                setRidePhase(statusToPhase[job.status]);
            }

            await driverSocketService.connect();

            const loc = await getCurrentLocation();
            if (loc) {
                setCurrentCoords(loc);
                const isDropoffPhase = job.status === 'LOADED' || job.status === 'IN_TRANSIT';
                if (isDropoffPhase) {
                    await buildRouteToDropoff(loc, job);
                } else if (job?.pickupLat && job?.pickupLng) {
                    await buildRoute(loc, job);
                }
            }
            await startWatchingLocation(job);
            startPeriodicLocationUpdates();

            setTimeout(() => {
                if (mapRef.current && job?.pickupLat && job?.pickupLng) {
                    mapRef.current.fitToCoordinates(
                        [{ latitude: job.pickupLat, longitude: job.pickupLng }],
                        { edgePadding: { top: 120, right: 60, bottom: 300, left: 60 }, animated: true }
                    );
                }
            }, 800);
        } catch (err: any) {
            console.error('Fetch error:', err);
            if (isMountedRef.current) {
                setError(err?.message || 'Failed to load job');
                toast.show({ message: 'Failed to load job', type: 'error', style: 'top' });
            }
        } finally {
            if (isMountedRef.current) setIsLoading(false);
        }
    }, [jobId, toast, navigation, getRouteToPickup, routeToPickup?.distance, getRouteToDropoff]);

    useEffect(() => {
        isMountedRef.current = true;
        fetchJobDetails();

        return () => {
            isMountedRef.current = false;
            if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
            locationWatcherRef.current?.remove();
            driverSocketService.disconnect();
        };
    }, [fetchJobDetails, jobId]);

    const advanceJobStatus = async (label: string) => {
        const token = await AsyncStorage.getItem('vToken');
        if (!token) throw new Error('Not authenticated');
        const res = await axios.patch(
            `${API_BASE_URL}/jobs/${jobId}/status`,
            {},
            { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
        );
        if (!res.data?.success) throw new Error(res.data?.message || `Failed to ${label}`);
    };

    const handleArrived = async () => {
        if (!isNearPickup) {
            toast.show({ message: `You are ${Math.round(distanceToPickup || 0)}m away. Get closer.`, type: 'warning', style: 'top' });
            return;
        }
        setIsActionLoading(true);
        try {
            await advanceJobStatus('mark arrived');
            setRidePhase('arrived_at_pickup');
            toast.show({ message: 'Marked as arrived at pickup!', type: 'success', style: 'top' });
        } catch (err: any) {
            toast.show({ message: err.message || 'Failed to update status', type: 'error', style: 'top' });
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleStartRide = () => {
        Alert.alert('Start Ride', 'Have you loaded the goods?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Yes, Start',
                onPress: async () => {
                    setIsActionLoading(true);
                    try {
                        await advanceJobStatus('start ride');
                        setRidePhase('ride_started');
                        if (currentCoords) {
                            await buildRouteToDropoff(currentCoords);
                        }
                        toast.show({ message: 'Ride started! Heading to dropoff.', type: 'success', style: 'top' });
                    } catch (err: any) {
                        toast.show({ message: err.message || 'Failed to start ride', type: 'error', style: 'top' });
                    } finally {
                        setIsActionLoading(false);
                    }
                },
            },
        ]);
    };

    const handleCompleteRide = async () => {
        setIsActionLoading(true);
        try {
            // LOADED → IN_TRANSIT
            await advanceJobStatus('start transit');
            // IN_TRANSIT → DELIVERED
            await advanceJobStatus('complete delivery');
            setRidePhase('completed');
            toast.show({ message: 'Job delivered successfully!', type: 'success', style: 'top' });
            navigation.navigate('DriverJobsComplete', { jobId });
        } catch (err: any) {
            toast.show({ message: err.message || 'Failed to complete ride', type: 'error', style: 'top' });
        } finally {
            setIsActionLoading(false);
        }
    };

    const pickupCoords = data?.pickupLat && data?.pickupLng ? { latitude: data.pickupLat, longitude: data.pickupLng } : null;
    const dropCoords = data?.dropoffLat && data?.dropoffLng ? { latitude: data.dropoffLat, longitude: data.dropoffLng } : null;

    const getArrivalTime = () => {
        if (ridePhase === 'heading_to_pickup' && eta) {
            const now = new Date();
            now.setMinutes(now.getMinutes() + eta);
            return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
        if ((ridePhase === 'ride_started' || ridePhase === 'heading_to_dropoff') && dropoffEta) {
            const now = new Date();
            now.setMinutes(now.getMinutes() + dropoffEta);
            return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
        return '--:--';
    };

    const getDistanceDisplay = () => {
        if (ridePhase === 'heading_to_pickup' || ridePhase === 'arrived_at_pickup') {
            if (distanceToPickup === null) {
                if (routeToPickup) return `${routeToPickup.distance.toFixed(1)} km`;
                return '-- km';
            }
            if (distanceToPickup < 1000) return `${Math.round(distanceToPickup)} m`;
            return `${(distanceToPickup / 1000).toFixed(1)} km`;
        } else {
            if (distanceToDropoff === null) {
                if (routeToDropoff) return `${routeToDropoff.distance.toFixed(1)} km`;
                if (data?.distanceKm) return `${data.distanceKm.toFixed(1)} km`;
                return '-- km';
            }
            if (distanceToDropoff < 1000) return `${Math.round(distanceToDropoff)} m`;
            return `${(distanceToDropoff / 1000).toFixed(1)} km`;
        }
    };

    const focusOnCurrentLocation = () => {
        if (currentCoords) mapRef.current?.animateToRegion({ ...currentCoords, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 800);
    };
    const focusOnPickup = () => {
        if (pickupCoords) mapRef.current?.animateToRegion({ ...pickupCoords, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 800);
    };
    const focusOnDrop = () => {
        if (dropCoords) mapRef.current?.animateToRegion({ ...dropCoords, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 800);
    };

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#10B981" />
                <Text className="text-gray-500 mt-3">Loading ride details...</Text>
            </SafeAreaView>
        );
    }

    if (error || !data) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
                <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text className="text-gray-900 font-bold text-xl mt-4">Failed to load job</Text>
                <Text className="text-gray-500 text-center mt-2">{error}</Text>
                <TouchableOpacity onPress={() => {
                    hasFetchedRef.current = false;
                    fetchJobDetails();
                }} className="bg-green-500 rounded-2xl px-8 py-4 mt-6">
                    <Text className="text-white font-bold">Retry</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const isShowArrivedButton = ridePhase === 'heading_to_pickup';
    const isShowStartButton = ridePhase === 'arrived_at_pickup';
    const isShowCompleteButton = ridePhase === 'ride_started' || ridePhase === 'heading_to_dropoff';

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <StatusBar barStyle="dark-content" />
            <View className="flex-1">
                {/* Map View */}
                <View style={{ height: SCREEN_HEIGHT * 0.5 }}>
                    <MapView
                        ref={mapRef}
                        provider={Platform.OS === 'ios' ? PROVIDER_GOOGLE : undefined}
                        style={{ flex: 1 }}
                        showsUserLocation={false}
                        showsMyLocationButton={false}
                        initialRegion={{
                            latitude: data!.pickupLat,
                            longitude: data!.pickupLng,
                            latitudeDelta: 0.04,
                            longitudeDelta: 0.04,
                        }}
                    >
                        {currentCoords && (
                            <Marker coordinate={currentCoords} title="You" pinColor='#3B82F6' />
                        )}
                        {pickupCoords && (
                            <Marker coordinate={pickupCoords} title="Pickup" pinColor='#F97316' />
                        )}
                        {dropCoords && (
                            <Marker coordinate={dropCoords} title="Dropoff" pinColor='#EF4444' />
                        )}
                        {(ridePhase === 'heading_to_pickup' || ridePhase === 'arrived_at_pickup') && routeToPickup?.points && (
                            <Polyline coordinates={routeToPickup.points} strokeColor="#10B981" strokeWidth={6} />
                        )}
                        {(ridePhase === 'ride_started' || ridePhase === 'heading_to_dropoff') && routeToDropoff?.points && (
                            <Polyline coordinates={routeToDropoff.points} strokeColor="#F59E0B" strokeWidth={6} />
                        )}
                    </MapView>

                    <TouchableOpacity onPress={() => navigation.goBack()} className="absolute top-4 left-4 bg-white rounded-full p-2" style={{ elevation: 4 }}>
                        <Entypo name="chevron-left" size={24} color="#111827" />
                    </TouchableOpacity>

                    <View className="absolute top-4 left-0 right-0 items-center">
                        <Text className="text-base font-bold text-gray-800 bg-white px-4 py-1.5 rounded-full" style={{ elevation: 3 }}>
                            {ridePhase === 'heading_to_pickup' ? 'Heading to Pickup' :
                                ridePhase === 'arrived_at_pickup' ? 'Arrived at Pickup' :
                                    ridePhase === 'ride_started' ? 'Ride Started' :
                                        ridePhase === 'heading_to_dropoff' ? 'Heading to Dropoff' : 'Completed'}
                        </Text>
                    </View>

                    <View className="absolute bottom-4 right-4 flex-col space-y-2">
                        <TouchableOpacity onPress={focusOnCurrentLocation} className="bg-white rounded-full p-3 shadow-lg" style={{ elevation: 5 }}>
                            <Ionicons name="locate" size={24} color="#3B82F6" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={focusOnPickup} className="bg-white rounded-full p-3 shadow-lg" style={{ elevation: 5 }}>
                            <MaterialIcons name="location-on" size={24} color="#F59E0B" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={focusOnDrop} className="bg-white rounded-full p-3 shadow-lg" style={{ elevation: 5 }}>
                            <MaterialIcons name="flag" size={24} color="#EF4444" />
                        </TouchableOpacity>
                    </View>

                    {(loadingRoute || loadingDropRoute) && (
                        <View className="absolute top-16 right-4 bg-white rounded-full px-3 py-2 flex-row items-center gap-2" style={{ elevation: 4 }}>
                            <ActivityIndicator size="small" color="#10B981" />
                            <Text className="text-xs text-gray-600">Routing...</Text>
                        </View>
                    )}

                    {isNearPickup && ridePhase === 'heading_to_pickup' && (
                        <View className="absolute bottom-4 left-0 right-0 items-center">
                            <View className="bg-green-500 rounded-full px-5 py-2 flex-row items-center gap-2" style={{ elevation: 4 }}>
                                <MaterialCommunityIcons name="map-marker-check" size={18} color="white" />
                                <Text className="text-white font-bold text-sm">You're at pickup!</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Bottom Sheet */}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    className="flex-1 bg-white rounded-t-3xl -mt-5 px-5 pt-4"
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center gap-2">
                            <View className="w-2.5 h-2.5 rounded-full bg-green-500" />
                            <Text className="text-sm font-bold text-green-600">
                                {ridePhase === 'heading_to_pickup' ? 'ON THE WAY' :
                                    ridePhase === 'arrived_at_pickup' ? 'AT PICKUP' :
                                        ridePhase === 'ride_started' ? 'RIDE STARTED' :
                                            ridePhase === 'heading_to_dropoff' ? 'HEADING TO DROPOFF' : 'COMPLETED'}
                            </Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-xs text-gray-400">ARRIVAL</Text>
                            <Text className="text-base font-bold text-orange-500">{getArrivalTime()}</Text>
                        </View>
                    </View>

                    <View className="flex-row gap-3 mb-4">
                        <View className="flex-1 bg-orange-50 rounded-2xl p-4">
                            <Text className="text-xs text-gray-500 mb-1">
                                {ridePhase === 'heading_to_pickup' || ridePhase === 'arrived_at_pickup' ? 'To Pickup' : 'To Dropoff'}
                            </Text>
                            <Text className="text-2xl font-bold text-orange-500">
                                {ridePhase === 'heading_to_pickup' || ridePhase === 'arrived_at_pickup'
                                    ? eta !== null ? `${eta} min` : routeToPickup ? `${Math.round(routeToPickup.duration)} min` : '-- min'
                                    : dropoffEta !== null ? `${dropoffEta} min` : routeToDropoff ? `${Math.round(routeToDropoff.duration)} min` : '-- min'}
                            </Text>
                        </View>
                        <View className="flex-1 bg-gray-50 rounded-2xl p-4">
                            <Text className="text-xs text-gray-500 mb-1">Distance</Text>
                            <Text className="text-2xl font-bold text-gray-900">{getDistanceDisplay()}</Text>
                        </View>
                    </View>

                    {(ridePhase === 'heading_to_pickup' || ridePhase === 'arrived_at_pickup') && <RouteProgressBar progress={routeProgress} />}

                    <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                        <View className="flex-row items-start gap-3">
                            <View className="w-9 h-9 rounded-full bg-orange-100 items-center justify-center">
                                <MaterialIcons name="location-on" size={18} color="#F59E0B" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-xs font-bold text-gray-400 mb-1">PICKUP LOCATION</Text>
                                <Text className="text-sm font-semibold text-gray-900">{data?.pickupAddress || '—'}</Text>
                            </View>
                        </View>
                        {dropCoords && (
                            <View className="flex-row items-start gap-3 mt-3 pt-3 border-t border-gray-200">
                                <View className="w-9 h-9 rounded-full bg-red-100 items-center justify-center">
                                    <MaterialIcons name="flag" size={18} color="#EF4444" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs font-bold text-gray-400 mb-1">DROPOFF LOCATION</Text>
                                    <Text className="text-sm font-semibold text-gray-900">{data?.dropoffAddress || '—'}</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    <View className="flex-row gap-3 mb-5">
                        <View className="flex-1 bg-white border border-gray-100 rounded-2xl p-3" style={{ elevation: 1 }}>
                            <Text className="text-xs text-gray-400 mb-1">VEHICLE</Text>
                            <Text className="text-sm font-bold text-gray-900">{data?.truckType?.name || '—'}</Text>
                            <Text className="text-xs text-gray-500 mt-0.5">Plate: {data?.driver?.numberPlate || '—'}</Text>
                        </View>
                        <View className="flex-1 bg-white border border-gray-100 rounded-2xl p-3 flex-row items-center justify-between" style={{ elevation: 1 }}>
                            <View>
                                <Text className="text-xs text-gray-400 mb-1">CUSTOMER</Text>
                                <Text className="text-sm font-bold text-gray-900">{data?.customer?.user?.fullName || '—'}</Text>
                            </View>
                            {data?.customer?.user?.mobileNumber ? (
                                <Pressable onPress={() => Linking.openURL(`tel:${data.customer!.user!.mobileNumber}`)} className="w-10 h-10 rounded-full bg-green-50 items-center justify-center">
                                    <Ionicons name="call-outline" size={20} color="#10B981" />
                                </Pressable>
                            ) : null}
                        </View>
                    </View>

                    {isShowArrivedButton && (
                        <Animated.View style={{ transform: [{ scale: isNearPickup ? pulseAnim : 1 }] }} className="mb-3">
                            <TouchableOpacity
                                onPress={handleArrived}
                                disabled={isActionLoading}
                                className="rounded-2xl py-4 items-center justify-center"
                                style={{ backgroundColor: isNearPickup ? '#10B981' : '#D1FAE5' }}
                            >
                                {isActionLoading ? <ActivityIndicator size="small" color="white" /> : (
                                    <View className="flex-row items-center gap-2">
                                        <MaterialCommunityIcons name="map-marker-check" size={22} color={isNearPickup ? 'white' : '#6EE7B7'} />
                                        <Text className="font-bold text-lg" style={{ color: isNearPickup ? 'white' : '#6EE7B7' }}>
                                            {isNearPickup ? 'ARRIVED AT PICKUP' : `${getDistanceDisplay()} away`}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    {isShowStartButton && (
                        <TouchableOpacity onPress={handleStartRide} disabled={isActionLoading} className="bg-blue-500 rounded-2xl py-4 items-center justify-center mb-3">
                            {isActionLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">START RIDE</Text>}
                        </TouchableOpacity>
                    )}

                    {isShowCompleteButton && (
                        <View className="mb-20">
                            <TouchableOpacity
                                onPress={handleCompleteRide}
                                disabled={isActionLoading}
                                className="rounded-2xl py-4 items-center justify-center"
                                style={{ backgroundColor: '#10B981' }}
                            >
                                {isActionLoading ? <ActivityIndicator size="small" color="white" /> : (
                                    <View className="flex-row items-center gap-2">
                                        <MaterialCommunityIcons name="check-circle" size={22} color="white" />
                                        <Text className="font-bold text-lg" style={{ color: 'white' }}>COMPLETE RIDE</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
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
    );
};

export default HeadingToPickup;