// UserOrderDetails.tsx - Fixed version
import { Entypo, MaterialCommunityIcons } from '@expo/vector-icons'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import React, { useState, useEffect } from 'react'
import {
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthStackParamList } from '../../../../Navigation/type'
import axios from 'axios'
import { IPA_BASE } from '@env'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useBooking } from '../../../../Auth/BookingContext'
import { kmToMiles } from '../../../../Utils/kmtoMiles'

interface CostBreakdown {
  basePrice: number
  distanceCost: number
  serviceCharge: number
  total: number
}

const UserOrderDetails = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
  const {
    pickupLocation,
    dropoffLocation,
    routeData,
    selectedTruck,
    scheduleDate,
    scheduleTime,
    workNotes,
    estimatedPrice,
    distance,
    duration
  } = useBooking()

  const [localWorkNotes, setLocalWorkNotes] = useState(workNotes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown>({
    basePrice: 0,
    distanceCost: 0,
    serviceCharge: 0,
    total: 0
  })

  useEffect(() => {
    calculateCostBreakdown()
  }, [estimatedPrice, routeData])

  const calculateCostBreakdown = () => {
    const basePrice = selectedTruck?.basePrice || 20
    const distanceInKm = routeData?.distance || 0
    const distanceCost = distanceInKm * 2.5
    const serviceCharge = (basePrice + distanceCost) * 0.1
    const total = estimatedPrice || (basePrice + distanceCost + serviceCharge)

    setCostBreakdown({
      basePrice,
      distanceCost: Math.round(distanceCost * 100) / 100,
      serviceCharge: Math.round(serviceCharge * 100) / 100,
      total: Math.round(total * 100) / 100
    })
  }

  const handleProceed = async () => {
    if (!pickupLocation || !dropoffLocation) {
      Alert.alert('Missing Info', 'Please ensure pickup and dropoff locations are selected')
      navigation.navigate('UserMappingView')
      return
    }

    if (!selectedTruck) {
      Alert.alert('Missing Info', 'Please select a truck')
      navigation.navigate('UserSelectTruck')
      return
    }

    setIsSubmitting(true)

    try {
      const token = await AsyncStorage.getItem('vToken')

      let scheduledAt: string | undefined
      if (scheduleDate && scheduleTime) {
        const d = new Date(`${scheduleDate}T${scheduleTime}:00`)
        scheduledAt = isNaN(d.getTime()) ? undefined : d.toISOString()
      }

      const jobData: Record<string, any> = {
        pickupAddress: pickupLocation.address,
        pickupLat: pickupLocation.latitude,
        pickupLng: pickupLocation.longitude,
        dropoffAddress: dropoffLocation.address,
        dropoffLat: dropoffLocation.latitude,
        dropoffLng: dropoffLocation.longitude,
        truckTypeId: selectedTruck.id,
        workNote: localWorkNotes || undefined,
      }
      if (selectedTruck.driverId) jobData.targetDriverId = selectedTruck.driverId
      if (scheduledAt) jobData.scheduledAt = scheduledAt

      const response = await axios.post(
        `${IPA_BASE}/jobs`,
        jobData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          timeout: 15000,
        }
      )

      if (response.data?.success) {
        const jobId = response.data.data?.job?.id ?? response.data.data?.id
          ; (navigation as any).navigate('UserFindingDrivers', {
            jobId,
            pickup: pickupLocation,
            dropoff: dropoffLocation,
            routeData,
            selectedTruck,
            scheduleDate,
            scheduleTime,
            workNotes: localWorkNotes,
            costBreakdown,
          })
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to create booking')
      }
    } catch (error: any) {
      console.error('Booking error:', error)
      const msg: string = error.response?.data?.message || 'Failed to create booking. Please try again.'
      const isBlockedByActiveJob = msg.toLowerCase().includes('active job') || msg.toLowerCase().includes('outstanding payment')
      Alert.alert(
        isBlockedByActiveJob ? 'Cannot Book' : 'Error',
        msg,
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!pickupLocation || !dropoffLocation) {
    return (
      <SafeAreaView className='flex-1 bg-gray-50'>
        <StatusBar barStyle='dark-content' />
        <View className='flex-1 items-center justify-center px-5'>
          <MaterialCommunityIcons name='map-marker-off' size={64} color='#ccc' />
          <Text className='text-lg font-semibold text-gray-800 mt-4 text-center'>
            Missing Location Information
          </Text>
          <Text className='text-gray-500 text-center mt-2'>
            Please select pickup and dropoff locations first
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('UserMappingView')}
            className='mt-6 bg-green-500 px-6 py-3 rounded-xl'
          >
            <Text className='text-white font-semibold'>Go to Location Selection</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className='flex-1 bg-gray-50'>
      <StatusBar barStyle='dark-content' />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className='flex-row items-center justify-between bg-white px-5 py-4 border-b border-gray-200'>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Entypo name='chevron-left' size={28} color='#000' />
          </TouchableOpacity>
          <Text className='text-2xl font-bold text-gray-800'>Order Details</Text>
          <View className='w-7' />
        </View>

        {/* Location Summary */}
        <View className='bg-white mx-5 mt-6 rounded-2xl p-4 border border-gray-200'>
          {/* Pickup */}
          <View className='mb-4 flex-row items-center'>
            <View className='h-8 w-8 rounded-full bg-green-100 items-center justify-center flex-shrink-0'>
              <MaterialCommunityIcons name='circle' size={14} color='#4CAF50' />
            </View>
            <View className='ml-3 flex-1'>
              <Text className='text-xs font-semibold text-gray-500'>PICKUP</Text>
              <Text className='text-sm font-bold text-gray-800' numberOfLines={2}>
                {pickupLocation.address}
              </Text>
            </View>
          </View>

          {/* Dropoff */}
          <View className='flex-row items-center'>
            <View className='h-8 w-8 rounded-full bg-red-100 items-center justify-center flex-shrink-0'>
              <MaterialCommunityIcons name='flag' size={14} color='#FF5252' />
            </View>
            <View className='ml-3 flex-1'>
              <Text className='text-xs font-semibold text-gray-500'>DROP-OFF</Text>
              <Text className='text-sm font-bold text-gray-800' numberOfLines={2}>
                {dropoffLocation.address}
              </Text>
            </View>
          </View>
        </View>

        {/* Truck Info */}
        {selectedTruck && (
          <View className='bg-white mx-5 mt-4 rounded-2xl p-4 border border-gray-200'>
            <Text className='text-xs font-semibold text-gray-500 mb-2'>SELECTED TRUCK</Text>
            <View className='flex-row items-center'>
              <View
                className='h-12 w-12 rounded-xl items-center justify-center'
                style={{ backgroundColor: selectedTruck.iconBg || '#E8F5E9' }}
              >
                <MaterialCommunityIcons
                  name='truck'
                  size={24}
                  color={selectedTruck.iconColor || '#4CAF50'}
                />
              </View>
              <View className='ml-3'>
                <Text className='text-base font-bold text-gray-800'>{selectedTruck.name}</Text>
                <Text className='text-xs text-gray-500'>{selectedTruck.capacity}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Schedule Info */}
        {(scheduleDate || scheduleTime) && (
          <View className='bg-white mx-5 mt-4 rounded-2xl p-4 border border-gray-200'>
            <Text className='text-xs font-semibold text-gray-500 mb-2'>SCHEDULED TIME</Text>
            <View className='flex-row items-center'>
              <MaterialCommunityIcons name='calendar-clock' size={20} color='#4CAF50' />
              <Text className='ml-2 text-sm font-semibold text-gray-800'>
                {scheduleDate} at {scheduleTime}
              </Text>
            </View>
          </View>
        )}

        {/* Order Details Section */}
        <View className='bg-white mx-5 mt-6 rounded-2xl p-5 border border-gray-200'>
          <View className='flex-row items-center justify-between mb-4'>
            <Text className='text-lg font-bold text-gray-800'>Price Breakdown</Text>
          </View>

          <View className='flex-row items-center justify-between py-2'>
            <Text className='text-sm text-gray-600'>Base Price ({selectedTruck?.name || 'Truck'})</Text>
            <Text className='text-sm font-bold text-gray-800'>${costBreakdown.basePrice}</Text>
          </View>

          <View className='flex-row items-center justify-between py-2'>
            <Text className='text-sm text-gray-600'>
              Distance Cost ({kmToMiles(routeData?.distance)} mi @ ${(2.5 / 0.621371).toFixed(2)}/mi)
            </Text>
            <Text className='text-sm font-bold text-gray-800'>${costBreakdown.distanceCost}</Text>
          </View>

          <View className='flex-row items-center justify-between py-2 border-b border-gray-100 pb-3'>
            <Text className='text-sm text-gray-600'>Service Charge (10%)</Text>
            <Text className='text-sm font-bold text-gray-800'>${costBreakdown.serviceCharge}</Text>
          </View>

          <View className='flex-row items-center justify-between pt-4'>
            <View>
              <Text className='text-base font-bold text-gray-800'>Total</Text>
              <Text className='text-xs text-gray-500'>(Estimated Cost)</Text>
            </View>
            <Text className='text-3xl font-bold text-green-600'>${costBreakdown.total}</Text>
          </View>
        </View>

        {/* Proceed Button */}
        <View className='px-5 mb-8 mt-8'>
          <TouchableOpacity
            onPress={handleProceed}
            activeOpacity={0.8}
            disabled={isSubmitting}
            className={`rounded-2xl py-4 ${isSubmitting ? 'bg-gray-400' : 'bg-green-500'}`}
          >
            <Text className='text-center text-lg font-bold text-white'>
              {isSubmitting ? 'PROCESSING...' : 'FIND DRIVERS'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default UserOrderDetails