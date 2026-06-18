import { IPA_BASE } from '@env'
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation, useRoute } from '@react-navigation/native'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type JobDetail = {
    id: string
    status: string
    distanceKm: number | null
    estimatedFare: number | null
    estimatedHours: number | null
    pickupAddress: string
    dropoffAddress: string
    workNote: string | null
    scheduledAt: string | null
    createdAt: string
    updatedAt: string
    truckType: { name: string } | null
    driver: { numberPlate: string | null; truckModel: string | null } | null
    customer: { user: { fullName: string } } | null
}

const STATUS_ORDER = ['BOOKED', 'ON_WAY', 'ARRIVED', 'LOADED', 'IN_TRANSIT', 'DELIVERED']

const STATUS_LABEL: Record<string, string> = {
    BOOKED: 'Booked',
    ON_WAY: 'Driver On The Way',
    ARRIVED: 'Driver Arrived',
    LOADED: 'Loaded',
    IN_TRANSIT: 'In Transit',
    DELIVERED: 'Delivered',
}

const STATUS_DESCRIPTION: Record<string, string> = {
    BOOKED: 'Job confirmed and driver assigned.',
    ON_WAY: 'Driver is heading to pickup location.',
    ARRIVED: 'Driver arrived at pickup location.',
    LOADED: 'Goods loaded onto the truck.',
    IN_TRANSIT: 'Shipment on the way to dropoff.',
    DELIVERED: 'Delivered successfully.',
}

const DriverJobsDetails = () => {
    const navigation = useNavigation()
    const route = useRoute<any>()
    const jobId: string = route.params?.jobId ?? ''

    const [job, setJob] = useState<JobDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const token = await AsyncStorage.getItem('vToken')
                const res = await axios.get(`${IPA_BASE}/jobs/${jobId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 15000,
                })
                setJob(res.data?.data ?? null)
            } catch (err: any) {
                setError(err?.response?.data?.message || 'Failed to load job details')
            } finally {
                setLoading(false)
            }
        }
        if (jobId) fetchJob()
    }, [jobId])

    if (loading) {
        return (
            <SafeAreaView className='flex-1 bg-gray-50 items-center justify-center' edges={['top']}>
                <ActivityIndicator color='#43B047' size='large' />
            </SafeAreaView>
        )
    }

    if (error || !job) {
        return (
            <SafeAreaView className='flex-1 bg-gray-50 items-center justify-center px-6' edges={['top']}>
                <MaterialCommunityIcons name='alert-circle-outline' size={48} color='#EF4444' />
                <Text className='text-gray-700 font-bold text-lg mt-3 text-center'>{error || 'Job not found'}</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} className='mt-5 bg-green-500 rounded-xl px-8 py-3'>
                    <Text className='text-white font-bold'>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        )
    }

    const currentStatusIndex = STATUS_ORDER.indexOf(job.status)
    const isDelivered = job.status === 'DELIVERED'

    const fare = job.estimatedFare ?? 0
    const platformFee = parseFloat((fare * 0.15).toFixed(2))
    const driverEarnings = parseFloat((fare - platformFee).toFixed(2))

    return (
        <SafeAreaView className='flex-1 bg-gray-50' edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className='flex-row items-center px-5 py-4 bg-white border-b border-gray-100'>
                    <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
                        <Ionicons name='arrow-back' size={26} color='#111827' />
                    </TouchableOpacity>
                    <Text className='text-xl font-bold text-gray-900 ml-4'>Job Details</Text>
                    <View className='ml-auto bg-green-50 rounded-xl px-3 py-1'>
                        <Text className='text-sm font-bold text-green-600'>
                            {STATUS_LABEL[job.status] ?? job.status}
                        </Text>
                    </View>
                </View>

                {/* Job ID + Date */}
                <View className='mx-4 mt-4 bg-white rounded-2xl p-4' style={{ elevation: 2 }}>
                    <View className='flex-row justify-between items-center'>
                        <View>
                            <Text className='text-xs font-bold text-gray-400 mb-1'>JOB ID</Text>
                            <Text className='text-base font-bold text-gray-900'>#{job.id.slice(-8).toUpperCase()}</Text>
                        </View>
                        <View className='items-end'>
                            <Text className='text-xs font-bold text-gray-400 mb-1'>DATE</Text>
                            <Text className='text-sm font-semibold text-gray-700'>
                                {new Date(job.createdAt).toLocaleDateString('en-US', {
                                    month: 'short', day: 'numeric', year: 'numeric',
                                })}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Status Timeline */}
                <View className='mx-4 mt-4 mb-2'>
                    <Text className='text-base font-black text-gray-900 mb-3'>STATUS TIMELINE</Text>
                    <View className='bg-white rounded-2xl p-5' style={{ elevation: 2 }}>
                        {STATUS_ORDER.map((s, index) => {
                            const isDone = index < currentStatusIndex || isDelivered
                            const isCurrent = index === currentStatusIndex && !isDelivered
                            const isPending = index > currentStatusIndex

                            return (
                                <View key={s}>
                                    <View className='flex-row'>
                                        <View className='items-center mr-4'>
                                            <View
                                                className='w-8 h-8 rounded-full border-2 items-center justify-center'
                                                style={{
                                                    backgroundColor: isDone ? '#43B047' : isCurrent ? '#43B047' : '#F3F4F6',
                                                    borderColor: isDone ? '#43B047' : isCurrent ? '#43B047' : '#E5E7EB',
                                                }}
                                            >
                                                {(isDone || isCurrent) ? (
                                                    <Ionicons name='checkmark' size={16} color='white' />
                                                ) : (
                                                    <View className='w-2 h-2 rounded-full bg-gray-400' />
                                                )}
                                            </View>
                                            {index !== STATUS_ORDER.length - 1 && (
                                                <View
                                                    className='w-0.5 h-10 my-1'
                                                    style={{ backgroundColor: isDone ? '#43B047' : '#E5E7EB' }}
                                                />
                                            )}
                                        </View>
                                        <View className='flex-1 pb-2 pt-1'>
                                            <Text
                                                className='text-sm font-bold mb-0.5'
                                                style={{ color: isPending ? '#9CA3AF' : '#111827' }}
                                            >
                                                {STATUS_LABEL[s]}
                                            </Text>
                                            <Text className='text-xs' style={{ color: isPending ? '#D1D5DB' : '#6B7280' }}>
                                                {STATUS_DESCRIPTION[s]}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            )
                        })}
                    </View>
                </View>

                {/* Route Details */}
                <View className='mx-4 mt-4'>
                    <Text className='text-base font-black text-gray-900 mb-3'>ROUTE DETAILS</Text>
                    <View className='bg-white rounded-2xl p-5' style={{ elevation: 2 }}>
                        <View className='flex-row mb-5 pb-5 border-b border-gray-100'>
                            <View className='mr-4'>
                                <View className='w-8 h-8 rounded-full bg-orange-100 items-center justify-center'>
                                    <Ionicons name='location' size={16} color='#F59E0B' />
                                </View>
                                <View className='w-0.5 h-8 bg-gray-200 mt-2 ml-3.5' />
                            </View>
                            <View className='flex-1 pt-1'>
                                <Text className='text-xs font-bold text-gray-400 mb-1'>PICKUP LOCATION</Text>
                                <Text className='text-sm font-semibold text-gray-900'>{job.pickupAddress}</Text>
                            </View>
                        </View>
                        <View className='flex-row'>
                            <View className='mr-4'>
                                <View className='w-8 h-8 rounded-full bg-green-100 items-center justify-center'>
                                    <MaterialCommunityIcons name='flag-checkered' size={14} color='#10B981' />
                                </View>
                            </View>
                            <View className='flex-1 pt-1'>
                                <Text className='text-xs font-bold text-gray-400 mb-1'>DROP-OFF LOCATION</Text>
                                <Text className='text-sm font-semibold text-gray-900'>{job.dropoffAddress}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Trip Stats */}
                <View className='mx-4 mt-4 flex-row gap-3'>
                    <View className='flex-1 bg-white rounded-2xl p-4 items-center' style={{ elevation: 2 }}>
                        <MaterialIcons name='local-shipping' size={20} color='#9CA3AF' />
                        <Text className='text-xs text-gray-400 mt-1'>Vehicle</Text>
                        <Text className='text-sm font-bold text-gray-900 mt-1 text-center'>
                            {job.truckType?.name ?? '—'}
                        </Text>
                    </View>
                    <View className='flex-1 bg-white rounded-2xl p-4 items-center' style={{ elevation: 2 }}>
                        <Ionicons name='navigate-outline' size={20} color='#9CA3AF' />
                        <Text className='text-xs text-gray-400 mt-1'>Distance</Text>
                        <Text className='text-sm font-bold text-gray-900 mt-1'>
                            {job.distanceKm != null ? `${job.distanceKm.toFixed(1)} km` : '—'}
                        </Text>
                    </View>
                </View>

                {/* Vehicle Info */}
                {(job.driver?.truckModel || job.driver?.numberPlate) && (
                    <View className='mx-4 mt-4'>
                        <Text className='text-base font-black text-gray-900 mb-3'>VEHICLE INFO</Text>
                        <View className='bg-white rounded-2xl p-5 flex-row gap-4' style={{ elevation: 2 }}>
                            {job.driver?.truckModel && (
                                <View className='flex-1'>
                                    <Text className='text-xs font-bold text-gray-400 mb-1'>MODEL</Text>
                                    <Text className='text-sm font-bold text-gray-900'>{job.driver.truckModel}</Text>
                                </View>
                            )}
                            {job.driver?.numberPlate && (
                                <View className='flex-1'>
                                    <Text className='text-xs font-bold text-gray-400 mb-1'>LICENSE PLATE</Text>
                                    <Text className='text-sm font-bold text-gray-900'>{job.driver.numberPlate}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Earnings (completed jobs only) */}
                {isDelivered && (
                    <View className='mx-4 mt-4 mb-8'>
                        <Text className='text-base font-black text-gray-900 mb-3'>EARNINGS BREAKDOWN</Text>
                        <View className='bg-white rounded-2xl p-5' style={{ elevation: 2 }}>
                            <View className='flex-row justify-between items-center py-3 border-b border-gray-100'>
                                <Text className='text-gray-500'>Estimated Fare</Text>
                                <Text className='text-gray-900 font-bold'>${fare.toFixed(2)}</Text>
                            </View>
                            <View className='flex-row justify-between items-center py-3 border-b border-gray-100'>
                                <Text className='text-gray-500'>Platform Fee (15%)</Text>
                                <Text className='text-red-500 font-bold'>−${platformFee.toFixed(2)}</Text>
                            </View>
                            <View className='flex-row justify-between items-center py-4'>
                                <Text className='text-gray-900 font-black'>Your Earnings</Text>
                                <Text className='text-2xl font-black text-green-500'>${driverEarnings.toFixed(2)}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {!isDelivered && <View className='mb-8' />}
            </ScrollView>
        </SafeAreaView>
    )
}

export default DriverJobsDetails
