import { IPA_BASE } from '@env'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import axios from 'axios'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type DriverProfile = {
  totalEarnings: number
  driverStatus: string
}

type ApiJob = {
  id: string
  estimatedFare: number | null
  updatedAt: string
  status: string
}

const DriverEarnings = () => {
  const navigation = useNavigation()
  const [activeTab, setActiveTab] = useState<'week' | 'month'>('week')
  const [profile, setProfile] = useState<DriverProfile | null>(null)
  const [completedJobs, setCompletedJobs] = useState<ApiJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
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
          }),
        ])
        setProfile(profileRes.data?.data ?? null)
        setCompletedJobs(jobsRes.data?.data ?? [])
      } catch (err) {
        console.error('Earnings fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const weekJobs = completedJobs.filter((j) => new Date(j.updatedAt) >= startOfWeek)
  const monthJobs = completedJobs.filter((j) => new Date(j.updatedAt) >= startOfMonth)

  const jobFare = (j: ApiJob) => (parseFloat(String(j.estimatedFare ?? '0')) || 0) * 0.85
  const weekEarnings = weekJobs.reduce((s, j) => s + jobFare(j), 0)
  const monthEarnings = monthJobs.reduce((s, j) => s + jobFare(j), 0)

  const displayEarnings = activeTab === 'week' ? weekEarnings : monthEarnings
  const displayJobs = activeTab === 'week' ? weekJobs.length : monthJobs.length

  if (loading) {
    return (
      <SafeAreaView className='flex-1 items-center justify-center' edges={['top']}>
        <ActivityIndicator color='#43B047' size='large' />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className='flex-1' edges={['top']}>
      <StatusBar style='dark' />
      <View className='px-5 py-2'>
        <View className='flex-row items-center'>
          <TouchableOpacity onPress={() => navigation.goBack()} className='p-2'>
            <Text className='text-3xl'>←</Text>
          </TouchableOpacity>
          <Text className='text-2xl font-bold text-gray-900 ml-2'>Earnings</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className='flex-1'>
        {/* Total Earnings Card */}
        <View className='mx-5 mt-6 mb-6'>
          <View className='rounded-3xl p-8 items-center'>
            <Text className='text-gray-400 text-sm font-bold tracking-wider mb-2'>TOTAL EARNINGS</Text>
            <Text className='text-5xl font-bold text-gray-900 mb-2'>
              ${(parseFloat(String(profile?.totalEarnings ?? '0')) || 0).toFixed(2)}
            </Text>
            <Text className='text-sm text-gray-400 font-semibold'>
              {completedJobs.length} total completed jobs
            </Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View className='mx-5 flex-row gap-4 mb-8'>
          {(['week', 'month'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setActiveTab(t)}
              className={`flex-1 py-4 rounded-2xl items-center justify-center border-2 ${activeTab === t ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}
              style={{ elevation: activeTab === t ? 3 : 1 }}
              activeOpacity={0.7}
            >
              <Text className={`text-lg font-bold ${activeTab === t ? 'text-green-600' : 'text-gray-600'}`}>
                {t === 'week' ? 'This Week' : 'This Month'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Breakdown Section */}
        <View className='mx-5 mb-8'>
          <Text className='text-2xl font-bold text-gray-900 mb-4'>Breakdown</Text>

          <TouchableOpacity
            className='bg-white rounded-2xl p-5 border border-gray-200 flex-row items-center justify-between mb-4'
            style={{ elevation: 2 }}
            activeOpacity={0.7}
          >
            <View>
              <Text className='text-gray-400 text-sm mb-1'>
                {activeTab === 'week' ? 'This Week' : 'This Month'}
              </Text>
              <Text className='text-2xl font-bold text-gray-900'>${displayEarnings.toFixed(2)}</Text>
            </View>
            <Ionicons name='chevron-forward' size={24} color='#9CA3AF' />
          </TouchableOpacity>

          <TouchableOpacity
            className='bg-white rounded-2xl p-5 border border-gray-200 flex-row items-center justify-between'
            style={{ elevation: 2 }}
            activeOpacity={0.7}
          >
            <View>
              <Text className='text-gray-400 text-sm mb-1'>Completed</Text>
              <Text className='text-2xl font-bold text-gray-900'>{displayJobs} Jobs</Text>
            </View>
            <Ionicons name='chevron-forward' size={24} color='#9CA3AF' />
          </TouchableOpacity>
        </View>

        {/* Recent Jobs */}
        <View className='mx-5 mb-12'>
          <Text className='text-2xl font-bold text-gray-900 mb-4'>Recent Jobs</Text>
          {completedJobs.slice(0, 5).map((job) => (
            <View key={job.id} className='bg-white rounded-2xl p-4 border border-gray-200 mb-3 flex-row items-center justify-between' style={{ elevation: 2 }}>
              <View>
                <Text className='text-base font-bold text-gray-900'>Job #{job.id.slice(-6).toUpperCase()}</Text>
                <Text className='text-sm text-gray-400'>{new Date(job.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
              </View>
              <Text className='text-lg font-bold text-green-600'>${jobFare(job).toFixed(2)}</Text>
            </View>
          ))}
          {completedJobs.length === 0 && (
            <View className='bg-white rounded-2xl p-6 border border-gray-200 items-center'>
              <Ionicons name='cash-outline' size={36} color='#D1D5DB' />
              <Text className='text-gray-400 font-semibold mt-2'>No completed jobs yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default DriverEarnings
