import { IPA_BASE, STATUS_DRIVER } from '@env'
import { FontAwesome, FontAwesome6, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native'
import axios from 'axios'
import React, { useCallback, useState } from 'react'
import { driverSocketService } from '../services/driverSocket.service'
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../../Auth/AuthContext'
import { useUser } from '../../../Auth/UserContext'
import { AuthStackParamList } from '../../../Navigation/type'

type DriverData = {
  totalEarnings: number
  driverStatus: string
  truckType: { name: string } | null
  user: { fullName: string; email: string; avatar: string | null; mobileNumber: string | null }
  completedJobsCount?: number
}

const DriverProfile = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
  const { signOut } = useAuth()
  const { deleteAccount } = useUser()
  const [driver, setDriver] = useState<DriverData | null>(null)
  const [completedCount, setCompletedCount] = useState(0)

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const token = await AsyncStorage.getItem('vToken')
          const [profileRes, jobsRes] = await Promise.all([
            axios.get(`${IPA_BASE}/driver/profile`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 10000,
            }),
            axios.get(`${IPA_BASE}/jobs/driver-jobs?status=DELIVERED`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 10000,
            }).catch(() => ({ data: { data: [] } })),
          ])
          setDriver(profileRes.data?.data ?? null)
          setCompletedCount((jobsRes.data?.data ?? []).length)
        } catch (err) {
          console.error('DriverProfile fetch error:', err)
        }
      }
      loadData()
    }, [])
  )

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              driverSocketService.disconnect()
              const success = await deleteAccount()
              if (success) {
                navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] })
              } else {
                Alert.alert('Error', 'Failed to delete account. Please try again.')
              }
            } catch {
              Alert.alert('Error', 'Failed to delete account. Please try again.')
            }
          },
        },
      ],
    )
  }

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('vToken')
            if (token) {
              await axios.patch(
                `${IPA_BASE}${STATUS_DRIVER}`,
                { isAvailable: false },
                { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 },
              )
            }
          } catch {
            // non-critical — backend socket disconnect handler is the safety net
          } finally {
            driverSocketService.disconnect()
            await signOut()
            navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] })
          }
        },
      },
    ])
  }

  const name = driver?.user?.fullName ?? 'Driver'
  const email = driver?.user?.email ?? ''
  const phone = driver?.user?.mobileNumber ?? ''
  const avatar = driver?.user?.avatar ?? null
  const vehicleType = driver?.truckType?.name ?? ''
  const earnings = driver?.totalEarnings ?? 0

  return (
    <SafeAreaView className='flex-1 bg-gray-50' edges={['top']}>
      <View className='items-center p-2'>
        <Text className='text-2xl font-bold text-gray-900'>My Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className='mx-5' contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile Image Section */}
        <View className='items-center mb-6'>
          <View className='relative'>
            <View
              className='w-32 h-32 rounded-full bg-white items-center justify-center mt-6'
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8 }}
            >
              {avatar ? (
                <Image source={{ uri: avatar }} className='w-full h-full rounded-full' />
              ) : (
                <Ionicons name='person' size={64} color='#D1D5DB' />
              )}
            </View>
          </View>

          <Text className='text-2xl font-bold text-gray-900 mt-4'>{name}</Text>
          {vehicleType ? <Text className='text-base text-gray-400 mt-1'>{vehicleType}</Text> : null}
        </View>

        {/* Stats Row */}
        <View className='flex-row justify-between gap-3 mb-6'>
          <View className='flex-1 bg-white rounded-2xl py-6 border border-gray-100 items-center' style={{ elevation: 3 }}>
            <View className='w-14 h-14 rounded-full bg-green-100 items-center justify-center mb-3'>
              <FontAwesome6 name='truck' size={28} color='#26A201' />
            </View>
            <Text className='text-2xl font-bold text-gray-800'>{completedCount}</Text>
            <Text className='text-base text-gray-400 mt-1'>Jobs</Text>
          </View>
          <View className='flex-1 bg-white rounded-2xl py-6 border border-gray-100 items-center' style={{ elevation: 3 }}>
            <View className='w-14 h-14 rounded-full bg-green-100 items-center justify-center mb-3'>
              <FontAwesome6 name='money-bills' size={28} color='#26A201' />
            </View>
            <Text className='text-2xl font-bold text-gray-800'>${earnings.toFixed(0)}</Text>
            <Text className='text-base text-gray-400 mt-1'>Earned</Text>
          </View>
          <View className='flex-1 bg-white rounded-2xl py-6 border border-gray-100 items-center' style={{ elevation: 3 }}>
            <View className='w-14 h-14 rounded-full bg-green-100 items-center justify-center mb-3'>
              <MaterialCommunityIcons name='shield-check' size={28} color='#26A201' />
            </View>
            <Text className={`text-sm font-bold mt-1 ${driver?.driverStatus === 'APPROVED' ? 'text-green-600' : 'text-orange-500'}`}>
              {driver?.driverStatus ?? 'PENDING'}
            </Text>
            <Text className='text-base text-gray-400 mt-1'>Status</Text>
          </View>
        </View>

        {/* Personal Information Card */}
        <View className='mb-4'>
          <View className='bg-white rounded-3xl p-6 border border-gray-100'>
            <View className='flex-row items-center justify-between mb-4'>
              <Text className='text-xl font-bold text-gray-900'>Personal Information</Text>
              <TouchableOpacity onPress={() => navigation.navigate('DriverEditProfile')} activeOpacity={0.7}>
                <Ionicons name='create-outline' size={24} color='#9CA3AF' />
              </TouchableOpacity>
            </View>

            <View className='flex-row items-center mb-4'>
              <Ionicons name='person-outline' size={24} color='#9CA3AF' />
              <Text className='text-base text-gray-800 ml-4'>{name}</Text>
            </View>

            <View className='flex-row items-center mb-4'>
              <Ionicons name='mail-outline' size={24} color='#9CA3AF' />
              <Text className='text-base text-gray-800 ml-4'>{email}</Text>
            </View>

            {phone ? (
              <View className='flex-row items-center'>
                <Ionicons name='call-outline' size={24} color='#9CA3AF' />
                <Text className='text-base text-gray-800 ml-4'>{phone}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Job Information Card */}
        <View className='mb-4'>
          <View className='bg-white rounded-3xl p-6 border border-gray-100'>
            <Text className='text-xl font-bold text-gray-900 mb-4'>Job Information</Text>

            <MenuItem icon={<MaterialCommunityIcons name='dump-truck' size={24} color='#9CA3AF' />} label='Vehicle Details' onPress={() => navigation.navigate('VehicleDetails')} />
            <View className='h-px bg-gray-100 my-2' />
            <MenuItem icon={<MaterialIcons name='verified-user' size={24} color='#9CA3AF' />} label='Documents & Verification' onPress={() => navigation.navigate('DriverDocuments')} />
            <View className='h-px bg-gray-100 my-2' />
            <MenuItem icon={<MaterialIcons name='attach-money' size={24} color='#9CA3AF' />} label='Earnings Summary' onPress={() => navigation.navigate('DriverEarnings')} />
            <View className='h-px bg-gray-100 my-2' />
            <MenuItem icon={<FontAwesome name='cc-stripe' size={24} color='#9CA3AF' />} label='Payout & Stripe' onPress={() => navigation.navigate('DriverPayout')} />
          </View>
        </View>

        {/* Settings Card */}
        <View className='mb-4'>
          <View className='bg-white rounded-3xl p-6 border border-gray-100'>
            <Text className='text-xl font-bold text-gray-900 mb-4'>Settings</Text>

            <MenuItem icon={<Ionicons name='notifications-outline' size={24} color='#9CA3AF' />} label='Notifications' onPress={() => navigation.navigate('UserNotificationSettings')} />
            <View className='h-px bg-gray-100 my-2' />
            <MenuItem icon={<Ionicons name='lock-closed-outline' size={24} color='#9CA3AF' />} label='Change Password' onPress={() => navigation.navigate('UserPasswordChange')} />
            <View className='h-px bg-gray-100 my-2' />
            <MenuItem icon={<Ionicons name='shield-checkmark-outline' size={24} color='#9CA3AF' />} label='Privacy Policy' onPress={() => navigation.navigate('UserPrivacyPolicy')} />
            <View className='h-px bg-gray-100 my-2' />
            <MenuItem icon={<Ionicons name='help-circle-outline' size={24} color='#9CA3AF' />} label='Help & Support' onPress={() => navigation.navigate('UserHelpSupport')} />
          </View>
        </View>

        {/* Logout Button */}
        <View className='mb-4'>
          <TouchableOpacity
            onPress={handleLogout}
            className='bg-white rounded-2xl py-5 flex-row items-center justify-center border border-gray-100'
            activeOpacity={0.7}
          >
            <Ionicons name='log-out-outline' size={28} color='#EF4444' />
            <Text className='text-2xl font-bold text-red-500 ml-3'>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Delete Account */}
        <View className='mb-8'>
          <TouchableOpacity
            onPress={handleDeleteAccount}
            className='py-4 flex-row items-center justify-center'
            activeOpacity={0.7}
          >
            <Ionicons name='trash-outline' size={18} color='#9CA3AF' />
            <Text className='text-base font-semibold text-gray-400 ml-2'>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function MenuItem({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} className='flex-row items-center justify-between py-3' activeOpacity={0.7}>
      <View className='flex-row items-center flex-1'>
        {icon}
        <Text className='text-base text-gray-800 ml-4'>{label}</Text>
      </View>
      <Ionicons name='chevron-forward' size={20} color='#9CA3AF' />
    </TouchableOpacity>
  )
}

export default DriverProfile
