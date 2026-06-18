import { IPA_BASE } from '@env'
import { FontAwesome, Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import axios from 'axios'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Images } from '../../../../constants'

type DriverProfile = {
  numberPlate: string | null
  truckModel: string | null
  hourlyRate: number
  driverStatus: string
  truckType: { name: string; description: string | null } | null
  truckPhotoUrl: string | null
  documents: Array<{ type: string; fileUrl: string }> | null
}

const VehicleDetails = () => {
  const navigation = useNavigation()
  const [profile, setProfile] = useState<DriverProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('vToken')
        const res = await axios.get(`${IPA_BASE}/driver/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        })
        setProfile(res.data?.data ?? null)
      } catch (err) {
        console.error('VehicleDetails fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  if (loading) {
    return (
      <SafeAreaView className='flex-1 bg-gray-100 items-center justify-center' edges={['top']}>
        <ActivityIndicator color='#43B047' size='large' />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className='flex-1 bg-gray-100' edges={['top']}>
      <StatusBar style='dark' />
      <ScrollView className='px-5' showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className='flex-row items-center py-4'>
          <TouchableOpacity onPress={() => navigation.goBack()} className='p-2'>
            <Ionicons name='arrow-back' size={24} color='#000' />
          </TouchableOpacity>
          <Text className='text-2xl font-extrabold ml-3'>Vehicle Details</Text>
        </View>

        {/* Truck Image Card */}
        <View className='mx-4 mt-6 mb-6'>
          <View className='rounded-3xl items-center justify-center bg-blue-300' style={{ elevation: 4, height: 280 }}>
            {(() => {
              const photoUri =
                profile?.truckPhotoUrl ||
                profile?.documents?.find((d) => d.type === 'TRUCK_PHOTO')?.fileUrl ||
                null
              return photoUri ? (
                <Image source={{ uri: photoUri }} className='w-full h-full rounded-3xl' resizeMode='cover' />
              ) : (
                <Image source={Images.Car3} className='w-56 h-36' resizeMode='contain' />
              )
            })()}
          </View>
        </View>

        {/* Details Grid */}
        <View className='mx-4 mb-8'>
          <View className='flex-row gap-4 mb-4'>
            <View className='flex-1 bg-white rounded-2xl p-5' style={{ elevation: 2 }}>
              <Text className='text-gray-400 text-xs font-bold mb-2'>TRUCK TYPE</Text>
              <Text className='text-xl font-bold text-gray-800'>{profile?.truckType?.name ?? '—'}</Text>
            </View>
            <View className='flex-1 bg-white rounded-2xl p-5' style={{ elevation: 2 }}>
              <Text className='text-gray-400 text-xs font-bold mb-2'>PLATE NO</Text>
              <Text className='text-xl font-bold text-gray-800'>{profile?.numberPlate ?? '—'}</Text>
            </View>
          </View>

          <View className='flex-row gap-4 mb-4'>
            <View className='flex-1 bg-white rounded-2xl p-5' style={{ elevation: 2 }}>
              <Text className='text-gray-400 text-xs font-bold mb-2'>TRUCK MODEL</Text>
              <Text className='text-xl font-bold text-gray-800'>{profile?.truckModel ?? '—'}</Text>
            </View>
            <View className='flex-1 bg-white rounded-2xl p-5' style={{ elevation: 2 }}>
              <Text className='text-gray-400 text-xs font-bold mb-2'>HOURLY RATE</Text>
              <Text className='text-xl font-bold text-gray-800'>
                {profile?.hourlyRate ? `$${profile.hourlyRate}/hr` : '—'}
              </Text>
            </View>
          </View>

          {/* Status */}
          <View className='bg-white rounded-2xl p-5 mb-4' style={{ elevation: 2 }}>
            <Text className='text-gray-400 text-xs font-bold mb-2'>APPROVAL STATUS</Text>
            <View className='flex-row items-center gap-2'>
              <View className={`w-2 h-2 rounded-full ${profile?.driverStatus === 'APPROVED' ? 'bg-green-500' : 'bg-orange-400'}`} />
              <Text className={`font-bold text-base ${profile?.driverStatus === 'APPROVED' ? 'text-green-600' : 'text-orange-500'}`}>
                {profile?.driverStatus ?? 'PENDING'}
              </Text>
            </View>
          </View>
        </View>

        {/* Info Message */}
        <View className='mx-4 mb-8 flex-row items-center p-4 rounded-xl' style={{ backgroundColor: '#F3F4F6' }}>
          <View className='w-8 h-8 rounded-full bg-gray-400 items-center justify-center mr-3'>
            <FontAwesome name='info' size={14} color='white' />
          </View>
          <Text className='flex-1 text-gray-500 text-sm leading-5'>
            Vehicle details are verified by our admin team. Contact support to request changes.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default VehicleDetails
