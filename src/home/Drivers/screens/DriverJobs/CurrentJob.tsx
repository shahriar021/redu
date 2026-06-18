import { IPA_BASE } from '@env'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NavigationProp, useNavigation, useRoute } from '@react-navigation/native'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthStackParamList } from '../../../../Navigation/type'

type JobDetail = {
  id: string
  status: string
  pickupAddress: string
  dropoffAddress: string
  distanceKm: number | null
  estimatedFare: number | null
  truckType: { name: string } | null
}

const STATUS_LABEL: Record<string, string> = {
  BOOKED: 'Driver Booked',
  ON_WAY: 'Heading to Pickup',
  ARRIVED: 'Driver Arrived',
  LOADED: 'Loaded',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
}

const CurrentJob = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
  const route = useRoute<any>()
  const jobId: string = route.params?.jobId ?? ''

  const [job, setJob] = useState<JobDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const token = await AsyncStorage.getItem('vToken')
        const res = await axios.get(`${IPA_BASE}/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        })
        setJob(res.data?.data ?? null)
      } catch (err) {
        console.error('CurrentJob fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    if (jobId) fetchJob()
  }, [jobId])

  if (loading) {
    return (
      <SafeAreaView className='flex-1 bg-white items-center justify-center' edges={['top']}>
        <ActivityIndicator color='#43B047' size='large' />
      </SafeAreaView>
    )
  }

  if (!job) {
    return (
      <SafeAreaView className='flex-1 bg-white items-center justify-center' edges={['top']}>
        <Text className='text-gray-500 font-semibold'>Job not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className='mt-4'>
          <Text className='text-green-500 font-bold'>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const handleComplete = () => {
    navigation.navigate('DriverJobsComplete', { jobId: job.id })
  }

  return (
    <SafeAreaView className='flex-1 bg-white' edges={['top']}>
      <StatusBar barStyle='dark-content' />

      <ScrollView className='flex-1 bg-white px-5 pt-6 pb-6' showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className='flex-row items-center mb-4'>
          <TouchableOpacity onPress={() => navigation.goBack()} className='mr-3'>
            <Ionicons name='arrow-back' size={24} color='#000' />
          </TouchableOpacity>
          <Text className='text-xl font-bold text-gray-900'>Current Job</Text>
        </View>

        {/* Status */}
        <View className='bg-green-50 rounded-2xl px-4 py-3 mb-5 flex-row items-center'>
          <View className='w-2 h-2 rounded-full bg-green-500 mr-3' />
          <Text className='text-green-700 font-bold text-base'>
            {STATUS_LABEL[job.status] ?? job.status}
          </Text>
        </View>

        {/* Job ID */}
        <Text className='text-base text-gray-500 mb-6'>
          Job #{job.id.slice(-8).toUpperCase()}
        </Text>

        {/* Route Details */}
        <View className='bg-white rounded-2xl p-5 mb-6' style={{ elevation: 2 }}>
          <Text className='text-base font-bold text-gray-900 mb-4'>ROUTE DETAILS</Text>

          <View className='flex-row mb-6 pb-6 border-b border-gray-200'>
            <View className='mr-4'>
              <View className='w-8 h-8 rounded-full bg-orange-100 items-center justify-center'>
                <MaterialIcons name='location-on' size={16} color='#F59E0B' />
              </View>
              <View className='w-0.5 h-8 bg-gray-300 mt-2 ml-3.5' />
            </View>
            <View className='flex-1'>
              <Text className='text-xs font-bold text-gray-500 mb-1'>PICKUP LOCATION</Text>
              <Text className='text-sm font-semibold text-gray-900'>{job.pickupAddress}</Text>
            </View>
          </View>

          <View className='flex-row'>
            <View className='mr-4'>
              <View className='w-8 h-8 rounded-full bg-green-100 items-center justify-center'>
                <MaterialIcons name='location-on' size={16} color='#10B981' />
              </View>
            </View>
            <View className='flex-1'>
              <Text className='text-xs font-bold text-gray-500 mb-1'>DROP-OFF LOCATION</Text>
              <Text className='text-sm font-semibold text-gray-900'>{job.dropoffAddress}</Text>
            </View>
          </View>
        </View>

        {/* Trip Details Grid */}
        <View className='flex-row gap-3 mb-6'>
          <View className='flex-1 bg-gray-50 rounded-2xl p-4'>
            <View className='flex-row items-center gap-2 mb-2'>
              <MaterialIcons name='local-shipping' size={16} color='#6B7280' />
              <Text className='text-xs text-gray-600'>Vehicle</Text>
            </View>
            <Text className='text-base font-bold text-gray-900'>{job.truckType?.name ?? '—'}</Text>
          </View>
          <View className='flex-1 bg-gray-50 rounded-2xl p-4'>
            <View className='flex-row items-center gap-2 mb-2'>
              <MaterialIcons name='location-on' size={16} color='#6B7280' />
              <Text className='text-xs text-gray-600'>Distance</Text>
            </View>
            <Text className='text-base font-bold text-gray-900'>
              {job.distanceKm != null ? `${job.distanceKm.toFixed(1)} km` : '—'}
            </Text>
          </View>
        </View>

        {/* Complete Job Button */}
        {job.status === 'IN_TRANSIT' && (
          <TouchableOpacity
            onPress={handleComplete}
            className='bg-green-500 rounded-2xl py-4 items-center justify-center flex-row gap-2'
            style={{ elevation: 3 }}
          >
            <MaterialIcons name='check-circle' size={24} color='white' />
            <Text className='text-white font-bold text-lg'>Mark as Delivered</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default CurrentJob
