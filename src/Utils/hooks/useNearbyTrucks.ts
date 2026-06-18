import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import { useCallback, useState } from 'react'
import { useAuth } from '../../Auth/AuthContext'
import { LocationCoords } from '../../home/Users/Components/HomeScreen/types'
import { IPA_BASE } from '@env'

export interface Truck {
    id: string
    name: string
    description: string
    capacity: string
    distance: string
    distanceInMeters?: number
    icon: string
    iconBg: string
    iconColor: string
    isBooked?: boolean
    driverId?: string
    driverUserId?: string
    truckTypeId?: string
    driverName?: string
    driverAvatar?: string | null
    rating?: number
}

type ApiDriver = {
    id: string
    numberPlate: string | null
    truckModel: string | null
    hourlyRate: number
    driverStatus: string
    isAvailable: boolean
    latitude: number | null
    longitude: number | null
    distanceKm: number
    truckType: { id: string; name: string; description: string | null } | null
    user: { id: string; fullName: string; avatar: string | null }
}

const ICON_MAP: Record<string, { icon: string; bg: string; color: string }> = {
    truck: { icon: 'truck', bg: '#E8F5E9', color: '#4CAF50' },
    van: { icon: 'truck-delivery', bg: '#E3F2FD', color: '#2196F3' },
    trailer: { icon: 'truck-trailer', bg: '#FFEBEE', color: '#FF5252' },
    flatbed: { icon: 'truck-flatbed', bg: '#FFF3E0', color: '#FF9800' },
    refrigerated: { icon: 'snowflake', bg: '#E0F7FA', color: '#00BCD4' },
    tanker: { icon: 'water', bg: '#E8EAF6', color: '#3F51B5' },
    container: { icon: 'truck-cargo-container', bg: '#F3E5F5', color: '#9C27B0' },
}

const getIconDetails = (typeName: string) => {
    const key = typeName?.toLowerCase().split(' ')[0] ?? ''
    return ICON_MAP[key] ?? { icon: 'truck', bg: '#F5F5F5', color: '#757575' }
}

const mapDriverToTruck = (item: ApiDriver): Truck => {
    const typeName = item.truckType?.name ?? 'Truck'
    const iconDetails = getIconDetails(typeName)
    const distanceInMeters = (item.distanceKm ?? 0) * 1000
    const distanceStr = distanceInMeters < 1000
        ? `${Math.round(distanceInMeters)} m`
        : `${item.distanceKm.toFixed(1)} km`

    return {
        id: item.id,
        name: typeName,
        description: item.truckModel ? `${item.truckModel}` : `${typeName} available for delivery`,
        capacity: item.hourlyRate ? `$${item.hourlyRate}/hr` : '',
        distance: distanceStr,
        distanceInMeters,
        icon: iconDetails.icon,
        iconBg: iconDetails.bg,
        iconColor: iconDetails.color,
        isBooked: !item.isAvailable,
        driverId: item.id,
        driverUserId: item.user?.id,
        truckTypeId: item.truckType?.id,
        driverName: item.user?.fullName,
        driverAvatar: item.user?.avatar,
        rating: undefined,
    }
}

export const useNearbyTrucks = () => {
    const [trucks, setTrucks] = useState<Truck[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [radius, setRadius] = useState(20)

    const { signOut } = useAuth()

    const fetchNearbyTrucks = useCallback(async (
        locationCoords: LocationCoords | null,
        showLoading = true,
        truckTypeId?: string,
    ) => {
        if (!locationCoords) {
            setError('Location not available. Please enable location services.')
            setIsLoading(false)
            setIsRefreshing(false)
            return
        }

        try {
            if (showLoading) setIsLoading(true)
            setError(null)

            const token = await AsyncStorage.getItem('vToken')
            const params: Record<string, string | number> = {
                lat: locationCoords.latitude,
                lng: locationCoords.longitude,
                radiusKm: radius,
            }
            if (truckTypeId) params.truckTypeId = truckTypeId

            const response = await axios.get<{ data: ApiDriver[] }>(
                `${IPA_BASE}/jobs/nearby-drivers`,
                {
                    params,
                    headers: { Authorization: token ? `Bearer ${token}` : '' },
                    timeout: 15000,
                }
            )

            const drivers: ApiDriver[] = response.data?.data ?? []
            const mapped = drivers.map(mapDriverToTruck)
            mapped.sort((a, b) => (a.distanceInMeters ?? 0) - (b.distanceInMeters ?? 0))
            setTrucks(mapped)

            if (mapped.length === 0) {
                setError('No available trucks found in your area.')
            }
        } catch (err: any) {
            if (err?.response?.status === 401) await signOut()
            const msg = err?.response?.data?.message ?? 'Failed to load nearby trucks.'
            setError(msg)
            setTrucks([])
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [radius])

    const changeRadius = useCallback((newRadius: number, locationCoords: LocationCoords | null) => {
        setRadius(newRadius)
        fetchNearbyTrucks(locationCoords, true)
    }, [fetchNearbyTrucks])

    const refresh = useCallback((locationCoords: LocationCoords | null) => {
        setIsRefreshing(true)
        fetchNearbyTrucks(locationCoords, false)
    }, [fetchNearbyTrucks])

    return {
        trucks,
        isLoading,
        isRefreshing,
        error,
        radius,
        changeRadius,
        refresh,
        fetchNearbyTrucks,
    }
}
