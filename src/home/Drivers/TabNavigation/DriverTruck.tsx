import { IPA_BASE } from '@env'
import { MaterialIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native'
import axios from 'axios'
import React, { useCallback, useState } from 'react'
import { ActivityIndicator, StatusBar, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthStackParamList } from '../../../Navigation/type'

const ACTIVE_STATUSES = new Set(['BOOKED', 'ON_WAY', 'ARRIVED', 'LOADED', 'IN_TRANSIT'])

type ActiveJob = { id: string; status: string }

const DriverTruck = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      const load = async () => {
        setLoading(true)
        try {
          const token = await AsyncStorage.getItem('vToken')
          const res = await axios.get(`${IPA_BASE}/jobs/driver-jobs`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000,
          })
          const jobs: ActiveJob[] = res.data?.data ?? []
          const active = jobs.find((j) => ACTIVE_STATUSES.has(j.status)) ?? null
          if (cancelled) return
          if (active) {
            // Switch to Home tab first so back-press from HeadingToPickup
            // returns to Home instead of re-triggering this Truck tab.
            ;(navigation as any).navigate('Home')
            navigation.navigate('HeadingToPickup', { jobId: active.id })
            return
          }
        } catch (err) {
          console.error('DriverTruck load error:', err)
        } finally {
          if (!cancelled) setLoading(false)
        }
      }
      load()
      return () => { cancelled = true }
    }, [])
  )

  if (loading) {
    return (
      <SafeAreaView className='flex-1 bg-white items-center justify-center' edges={['top']}>
        <ActivityIndicator color='#43B047' size='large' />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className='flex-1 bg-white' edges={['top']}>
      <StatusBar barStyle='dark-content' />
      <View className='flex-1 items-center justify-center px-8'>
        <View className='w-24 h-24 rounded-full bg-gray-100 items-center justify-center mb-6'>
          <MaterialIcons name='local-shipping' size={48} color='#9CA3AF' />
        </View>
        <Text className='text-xl font-bold text-gray-800 text-center mb-2'>No Active Job</Text>
        <Text className='text-base text-gray-400 text-center'>
          You don't have any active jobs right now. New jobs will appear on your Home tab.
        </Text>
      </View>
    </SafeAreaView>
  )
}

export default DriverTruck
