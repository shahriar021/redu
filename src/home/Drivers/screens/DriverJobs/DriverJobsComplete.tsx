import { IPA_BASE } from '@env'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation, useRoute } from '@react-navigation/native'
import axios from 'axios'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type JobDetail = {
  id: string
  status: string
  distanceKm: number | null
  estimatedFare: number | null
  pickupAddress: string
  dropoffAddress: string
  updatedAt: string
  truckType: { name: string } | null
  customer: { user: { fullName: string; avatar: string | null } } | null
  payment: { status: string } | null
}

const DriverJobsComplete = () => {
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
          timeout: 10000,
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
        <Ionicons name='alert-circle-outline' size={48} color='#EF4444' />
        <Text className='text-gray-700 font-bold text-lg mt-3 text-center'>{error || 'Job not found'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className='mt-5 bg-green-500 rounded-xl px-8 py-3'>
          <Text className='text-white font-bold'>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const fare = parseFloat(String(job.estimatedFare ?? '0')) || 0
  const platformFee = parseFloat((fare * 0.15).toFixed(2))
  const driverEarnings = parseFloat((fare - platformFee).toFixed(2))
  const isPaid = job.payment?.status === 'COMPLETED'
  const deliveryDate = new Date(job.updatedAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  return (
    <SafeAreaView className='flex-1 bg-gray-50' edges={['top']}>
      <StatusBar style='dark' />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className='px-4 py-4 bg-white border-b border-gray-200 flex-row items-center'>
          <TouchableOpacity onPress={() => navigation.goBack()} className='p-2'>
            <Ionicons name='arrow-back' size={24} color='#000' />
          </TouchableOpacity>
          <Text className='text-xl font-bold text-gray-900 ml-2'>Job Complete</Text>
        </View>

        {/* Status Banner */}
        <View className={`mx-4 mt-4 mb-4 rounded-2xl p-5 flex-row items-center ${isPaid ? 'bg-green-500' : 'bg-orange-400'}`}>
          <View className='w-12 h-12 rounded-full bg-white/20 items-center justify-center mr-4'>
            <Ionicons name={isPaid ? 'checkmark-circle' : 'time-outline'} size={28} color='white' />
          </View>
          <View className='flex-1'>
            <Text className='text-white font-black text-lg'>
              {isPaid ? 'Delivered & Paid' : 'Delivered — Awaiting Payment'}
            </Text>
            <Text className='text-white/80 text-sm mt-0.5'>
              {isPaid ? deliveryDate : 'Customer has been notified to pay'}
            </Text>
          </View>
        </View>

        {/* Route Details */}
        <View className='mx-4 mb-4 bg-white rounded-2xl p-5' style={{ elevation: 2 }}>
          <Text className='text-base font-black text-gray-900 mb-4'>ROUTE DETAILS</Text>

          <View className='flex-row mb-4 pb-4 border-b border-gray-100'>
            <View className='mr-4'>
              <View className='w-8 h-8 rounded-full bg-orange-100 items-center justify-center'>
                <Ionicons name='location' size={16} color='#F59E0B' />
              </View>
              <View className='w-0.5 h-8 bg-gray-200 mt-2 ml-3.5' />
            </View>
            <View className='flex-1'>
              <Text className='text-xs font-bold text-gray-400 mb-1'>PICKUP LOCATION</Text>
              <Text className='text-sm font-semibold text-gray-900'>{job.pickupAddress}</Text>
            </View>
          </View>

          <View className='flex-row'>
            <View className='mr-4'>
              <View className='w-8 h-8 rounded-full bg-green-100 items-center justify-center'>
                <Ionicons name='flag' size={16} color='#10B981' />
              </View>
            </View>
            <View className='flex-1'>
              <Text className='text-xs font-bold text-gray-400 mb-1'>DROP-OFF LOCATION</Text>
              <Text className='text-sm font-semibold text-gray-900'>{job.dropoffAddress}</Text>
            </View>
          </View>
        </View>

        {/* Trip Info */}
        <View className='mx-4 mb-4 flex-row gap-3'>
          <View className='flex-1 bg-white rounded-2xl p-4 items-center' style={{ elevation: 2 }}>
            <MaterialIcons name='local-shipping' size={20} color='#9CA3AF' />
            <Text className='text-xs text-gray-400 mt-1'>Vehicle</Text>
            <Text className='text-sm font-bold text-gray-900 mt-1 text-center'>{job.truckType?.name ?? '—'}</Text>
          </View>
          <View className='flex-1 bg-white rounded-2xl p-4 items-center' style={{ elevation: 2 }}>
            <Ionicons name='navigate-outline' size={20} color='#9CA3AF' />
            <Text className='text-xs text-gray-400 mt-1'>Distance</Text>
            <Text className='text-sm font-bold text-gray-900 mt-1'>{job.distanceKm?.toFixed(1) ?? '—'} km</Text>
          </View>
        </View>

        {/* Earnings Breakdown */}
        <View className='mx-4 mb-6'>
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
            <View className='flex-row justify-between items-center py-4 mt-1'>
              <View>
                <Text className='text-gray-900 font-black'>Your Earnings</Text>
                <Text className='text-xs text-gray-400'>
                  {isPaid ? 'Added to your balance' : 'Pending customer payment'}
                </Text>
              </View>
              <View className='items-end'>
                <Text className={`text-3xl font-black ${isPaid ? 'text-green-500' : 'text-orange-400'}`}>
                  ${driverEarnings.toFixed(2)}
                </Text>
                {!isPaid && (
                  <Text className='text-xs text-orange-400 font-semibold mt-0.5'>PENDING</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default DriverJobsComplete
