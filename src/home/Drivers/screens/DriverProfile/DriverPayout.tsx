import { IPA_BASE } from '@env'
import { FontAwesome, Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import axios from 'axios'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type WithdrawalItem = {
  id: string
  amount: number
  status: string
  createdAt: string
}

type CompletedJob = {
  id: string
  estimatedFare: number | null
  finalFare: number | null
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'text-orange-400',
  COMPLETED: 'text-green-500',
  REJECTED: 'text-red-500',
}

const DriverPayout = () => {
  const navigation = useNavigation()

  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null)
  const [stripeOnboarded, setStripeOnboarded] = useState(false)
  const [payoutsEnabled, setPayoutsEnabled] = useState(false)
  const [currentBalance, setCurrentBalance] = useState(0)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [estimatedFromJobs, setEstimatedFromJobs] = useState(0)

  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [connectingStripe, setConnectingStripe] = useState(false)

  const [withdrawModal, setWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)

  const isStripeConnected = !!stripeAccountId && (stripeOnboarded || payoutsEnabled)
  const canWithdraw = isStripeConnected && currentBalance >= 10

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchData)
    return unsubscribe
  }, [navigation])

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('vToken')
      const headers = { Authorization: `Bearer ${token}` }

      const [profileRes, earningsRes, withdrawalRes, jobsRes] = await Promise.all([
        axios.get(`${IPA_BASE}/driver/profile`, { headers, timeout: 10000 }),
        axios.get(`${IPA_BASE}/driver/earnings`, { headers, timeout: 10000 }),
        axios.get(`${IPA_BASE}/withdrawals/history`, { headers, timeout: 10000 }).catch(() => ({ data: { data: [] } })),
        axios.get(`${IPA_BASE}/jobs/driver-jobs?status=DELIVERED`, { headers, timeout: 10000 }).catch(() => ({ data: { data: [] } })),
      ])

      const profile = profileRes.data?.data ?? {}
      const earnings = earningsRes.data?.data ?? {}
      const jobs: CompletedJob[] = jobsRes.data?.data ?? []

      setStripeAccountId(profile.stripeAccountId ?? null)
      setStripeOnboarded(!!profile.stripeOnboarded)
      setCurrentBalance(parseFloat(earnings.currentBalance ?? profile.currentBalance ?? '0') || 0)
      setTotalEarnings(parseFloat(earnings.totalEarnings ?? profile.totalEarnings ?? '0') || 0)
      setWithdrawals(withdrawalRes.data?.data ?? [])

      // Estimate from delivered jobs in case payment webhook hasn't fired yet
      const estimated = jobs.reduce((sum, j) => {
        const fare = parseFloat(String(j.finalFare ?? j.estimatedFare ?? '0')) || 0
        return sum + fare * 0.85
      }, 0)
      setEstimatedFromJobs(estimated)

      // If DB not synced yet, check Stripe directly
      if (profile.stripeAccountId && !profile.stripeOnboarded) {
        try {
          const statusRes = await axios.get(`${IPA_BASE}/driver/stripe/status`, { headers, timeout: 10000 })
          const enabled = statusRes.data?.data?.payoutsEnabled ?? false
          setPayoutsEnabled(enabled)
          if (enabled) {
            axios.post(`${IPA_BASE}/driver/stripe/complete-onboarding`, {}, { headers, timeout: 10000 }).catch(() => null)
          }
        } catch { /* leave as not connected */ }
      }
    } catch (err) {
      console.error('Payout fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectStripe = async () => {
    try {
      setConnectingStripe(true)
      const token = await AsyncStorage.getItem('vToken')
      const endpoint = isStripeConnected
        ? `${IPA_BASE}/driver/stripe/login-link`
        : `${IPA_BASE}/driver/stripe/onboarding-link`
      const res = await axios.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      })
      const url: string = res.data?.data?.url ?? res.data?.data?.onboardingUrl ?? ''
      if (url) await Linking.openURL(url)
      else Alert.alert('Error', 'Could not get Stripe link.')
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to open Stripe.')
    } finally {
      setConnectingStripe(false)
    }
  }

  const handleRequestWithdrawal = async () => {
    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount < 10) {
      Alert.alert('Invalid Amount', 'Minimum withdrawal is $10.00')
      return
    }
    if (amount > currentBalance) {
      Alert.alert('Insufficient Balance', `Your available balance is $${currentBalance.toFixed(2)}`)
      return
    }
    try {
      setWithdrawing(true)
      const token = await AsyncStorage.getItem('vToken')
      await axios.post(
        `${IPA_BASE}/withdrawals/request`,
        { amount },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 },
      )
      setWithdrawModal(false)
      setWithdrawAmount('')
      Alert.alert('Request Submitted', 'Your withdrawal request is pending admin approval.')
      fetchData()
    } catch (err: any) {
      const raw = err?.response?.data?.message
      const msg = Array.isArray(raw) ? raw.join('\n') : (raw ?? 'Failed to request withdrawal')
      Alert.alert('Error', msg)
    } finally {
      setWithdrawing(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView className='flex-1 items-center justify-center' edges={['top']}>
        <ActivityIndicator color='#43B047' size='large' />
      </SafeAreaView>
    )
  }

  // Show estimated if actual credited amount is 0 but jobs were done (payment pending from customer)
  const pendingPayment = totalEarnings === 0 && estimatedFromJobs > 0

  return (
    <SafeAreaView className='flex-1' edges={['top']}>
      <StatusBar style='dark' />
      <View className='px-4 py-4'>
        <View className='flex-row items-center'>
          <TouchableOpacity onPress={() => navigation.goBack()} className='p-2'>
            <Text className='text-3xl'>←</Text>
          </TouchableOpacity>
          <Text className='text-2xl font-bold text-gray-900 ml-2'>Payout & Stripe</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className='flex-1'>

        {/* Stripe Status Card */}
        <View className='mx-5 mt-4 mb-4'>
          <View className='bg-white rounded-3xl p-5 border border-gray-200' style={{ elevation: 2 }}>
            <View className='flex-row items-center mb-3'>
              <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isStripeConnected ? 'bg-green-500' : 'bg-orange-400'}`}>
                <Ionicons name={isStripeConnected ? 'checkmark' : 'warning-outline'} size={20} color='white' />
              </View>
              <View className='flex-1'>
                <Text className='text-xl font-bold text-gray-900'>
                  {isStripeConnected ? 'Stripe: Connected' : 'Stripe: Not Connected'}
                </Text>
              </View>
              <Text className={`font-bold text-base ${isStripeConnected ? 'text-green-500' : 'text-orange-400'}`}>
                {isStripeConnected ? 'Active' : 'Pending'}
              </Text>
            </View>
            <Text className='text-gray-400 text-sm leading-5'>
              {isStripeConnected
                ? 'Your account is linked and ready to receive automatic payouts.'
                : 'Connect your Stripe account to receive payouts from completed jobs.'}
            </Text>
          </View>
        </View>

        {/* Balance Cards */}
        <View className='mx-5 flex-row gap-3 mb-4'>
          <View className='flex-1 bg-white rounded-2xl p-5 border border-gray-200' style={{ elevation: 2 }}>
            <Text className='text-gray-400 text-sm mb-1'>Total Credited</Text>
            <Text className='text-xl font-bold text-gray-900'>${totalEarnings.toFixed(2)}</Text>
          </View>
          <View className='flex-1 bg-white rounded-2xl p-5 border border-gray-200' style={{ elevation: 2 }}>
            <Text className='text-gray-400 text-sm mb-1'>Available Balance</Text>
            <Text className={`text-xl font-bold ${currentBalance >= 10 ? 'text-green-500' : 'text-gray-900'}`}>
              ${currentBalance.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Pending payment notice */}
        {pendingPayment && (
          <View className='mx-5 mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex-row items-start'>
            <Ionicons name='time-outline' size={20} color='#D97706' style={{ marginTop: 1 }} />
            <View className='flex-1 ml-3'>
              <Text className='text-amber-700 font-semibold text-sm'>Payment Pending from Customer</Text>
              <Text className='text-amber-600 text-xs mt-1'>
                Estimated from your completed jobs: ${estimatedFromJobs.toFixed(2)}.{'\n'}
                Balance is credited once the customer pays through the app.
              </Text>
            </View>
          </View>
        )}

        {/* Withdraw Button */}
        <View className='mx-5 mb-6'>
          <TouchableOpacity
            onPress={() => canWithdraw ? setWithdrawModal(true) : null}
            disabled={!canWithdraw}
            className={`rounded-2xl py-4 flex-row items-center justify-center ${canWithdraw ? 'bg-primary' : 'bg-gray-200'}`}
            style={{ elevation: canWithdraw ? 3 : 0 }}
            activeOpacity={0.8}
          >
            <Ionicons name='cash-outline' size={22} color={canWithdraw ? 'white' : '#9CA3AF'} />
            <Text className={`font-bold text-base ml-2 ${canWithdraw ? 'text-white' : 'text-gray-400'}`}>
              {!isStripeConnected
                ? 'Connect Stripe to Withdraw'
                : currentBalance < 10
                  ? `Min $10 required · Balance: $${currentBalance.toFixed(2)}`
                  : 'Request Withdrawal'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Withdrawal History */}
        {withdrawals.length > 0 && (
          <>
            <View className='mx-5 mb-4'>
              <Text className='text-xl font-bold text-gray-900'>Withdrawal History</Text>
            </View>
            <View className='mx-5 mb-8'>
              {withdrawals.map((w) => (
                <View
                  key={w.id}
                  className='bg-white rounded-2xl p-4 border border-gray-200 mb-3 flex-row items-center justify-between'
                  style={{ elevation: 2 }}
                >
                  <View className='flex-1'>
                    <Text className={`font-bold text-sm capitalize ${STATUS_COLOR[w.status] ?? 'text-gray-500'}`}>
                      {w.status}
                    </Text>
                    <Text className='text-sm text-gray-400 mt-0.5'>
                      {new Date(w.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  <Text className='text-lg font-bold text-gray-900'>${parseFloat(String(w.amount)).toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Connect / Manage Stripe */}
        <View className='mx-5 mb-4'>
          <TouchableOpacity
            onPress={handleConnectStripe}
            disabled={connectingStripe}
            className='bg-gray-800 rounded-2xl py-4 flex-row items-center justify-center'
            style={{ elevation: 2, opacity: connectingStripe ? 0.7 : 1 }}
            activeOpacity={0.8}
          >
            {connectingStripe ? <ActivityIndicator color='white' /> : (
              <>
                <FontAwesome name='credit-card' size={20} color='white' />
                <Text className='text-white font-bold text-base ml-3'>
                  {isStripeConnected ? 'Manage Stripe Account' : 'Connect Stripe Account'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View className='mx-5 pb-10 flex-row items-center'>
          <Ionicons name='lock-closed' size={16} color='#9CA3AF' />
          <Text className='text-gray-400 text-xs ml-2'>Payments are secured by Stripe</Text>
        </View>
      </ScrollView>

      {/* Withdrawal Request Modal */}
      <Modal visible={withdrawModal} transparent animationType='slide' onRequestClose={() => setWithdrawModal(false)}>
        <View className='flex-1 justify-end bg-black/40'>
          <View className='bg-white rounded-t-3xl px-6 pt-6 pb-10'>
            <View className='flex-row items-center justify-between mb-6'>
              <Text className='text-xl font-bold text-gray-900'>Request Withdrawal</Text>
              <TouchableOpacity onPress={() => { setWithdrawModal(false); setWithdrawAmount('') }}>
                <Ionicons name='close' size={26} color='#6B7280' />
              </TouchableOpacity>
            </View>

            <View className='bg-gray-50 rounded-2xl p-4 mb-5'>
              <Text className='text-gray-400 text-sm'>Available Balance</Text>
              <Text className='text-3xl font-bold text-green-500 mt-1'>${currentBalance.toFixed(2)}</Text>
              <Text className='text-gray-400 text-xs mt-1'>Minimum withdrawal: $10.00</Text>
            </View>

            <Text className='text-sm font-semibold text-gray-700 mb-2'>Amount to Withdraw</Text>
            <View className='bg-gray-100 rounded-2xl px-5 py-4 flex-row items-center mb-5 border border-gray-200'>
              <Text className='text-xl font-bold text-gray-500 mr-2'>$</Text>
              <TextInput
                className='flex-1 text-xl font-bold text-gray-900'
                placeholder='0.00'
                placeholderTextColor='#D1D5DB'
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                keyboardType='decimal-pad'
                autoFocus
              />
              <TouchableOpacity onPress={() => setWithdrawAmount(currentBalance.toFixed(2))}>
                <Text className='text-green-500 font-semibold text-sm'>Max</Text>
              </TouchableOpacity>
            </View>

            <Text className='text-xs text-gray-400 mb-6 text-center'>
              Withdrawal requests are reviewed by admin before transfer.{'\n'}
              Funds typically arrive within 1–2 business days after approval.
            </Text>

            <TouchableOpacity
              onPress={handleRequestWithdrawal}
              disabled={withdrawing}
              className='bg-primary rounded-2xl py-5 items-center'
              style={{ opacity: withdrawing ? 0.7 : 1 }}
              activeOpacity={0.8}
            >
              {withdrawing
                ? <ActivityIndicator color='white' />
                : <Text className='text-white font-bold text-lg'>Submit Request</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

export default DriverPayout
