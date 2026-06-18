import { IPA_BASE } from '@env'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NavigationProp, useNavigation, useRoute } from '@react-navigation/native'
import { useStripe } from '@stripe/stripe-react-native'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthStackParamList } from '../../../../Navigation/type'

type JobDetail = {
  id: string
  status: string
  pickupAddress: string
  dropoffAddress: string
  estimatedFare: number | null
  finalFare: number | null
  distanceKm: number | null
  workNote: string | null
  updatedAt: string
  truckType: { id: string; name: string } | null
  driver: {
    id: string
    numberPlate: string | null
    truckModel: string | null
    user: { id: string; fullName: string; avatar: string | null }
  } | null
  review: { rating: number } | null
  payment: { status: string } | null
}

const GREEN = '#43B047'
const TEXT = '#111827'
const MUTED = '#8B95A1'
const ORANGE = '#F59E0B'

export default function UserCompleteJobsDetails() {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
  const route = useRoute<any>()
  const jobId: string = route.params?.jobId ?? ''
  const [job, setJob] = useState<JobDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const { initPaymentSheet, presentPaymentSheet } = useStripe()

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

  const handlePay = async () => {
    if (!job) return
    try {
      setPaying(true)
      const token = await AsyncStorage.getItem('vToken')

      // 1. Create PaymentIntent on backend
      const res = await axios.post(
        `${IPA_BASE}/payment/job/${job.id}/intent`,
        {},
        { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 },
      )
      const { clientSecret } = res.data?.data ?? res.data ?? {}
      if (!clientSecret) throw new Error('No client secret returned')

      // 2. Initialise Stripe Payment Sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'JobsiteX',
        style: 'automatic',
      })
      if (initError) throw new Error(initError.message)

      // 3. Present the sheet — Stripe handles card entry
      const { error: payError } = await presentPaymentSheet()
      if (payError) {
        if (payError.code !== 'Canceled') {
          Alert.alert('Payment Failed', payError.message)
        }
        return
      }

      // 4. Success — refresh job so payment status updates
      Alert.alert('Payment Successful', 'Your payment has been processed. The driver will receive their earnings shortly.')
      const updated = await axios.get(`${IPA_BASE}/jobs/${job.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      })
      setJob(updated.data?.data ?? job)
    } catch (err: any) {
      const raw = err?.response?.data?.message
      const msg = Array.isArray(raw) ? raw.join('\n') : (raw ?? err?.message ?? 'Payment failed')
      Alert.alert('Error', msg)
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={GREEN} size='large' style={{ flex: 1 }} />
      </SafeAreaView>
    )
  }

  if (error || !job) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Ionicons name='alert-circle-outline' size={48} color='#EF4444' />
          <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 16, marginTop: 12, textAlign: 'center' }}>{error || 'Job not found'}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16, backgroundColor: GREEN, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12 }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const fare = job.finalFare ?? job.estimatedFare ?? 0
  const platformFee = parseFloat((fare * 0.15).toFixed(2))
  const isPaid = job.payment?.status === 'COMPLETED'
  const isFinal = job.finalFare != null
  const deliveryDate = new Date(job.updatedAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} style={styles.backBtn}>
          <Ionicons name='chevron-back' size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Route Details */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Route Details</Text>
          <View style={{ marginTop: 12 }}>
            <View style={styles.routeRow}>
              <View style={styles.routeIconCol}><Ionicons name='radio-button-on' size={18} color={ORANGE} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.routeTitle}>PICKUP LOCATION</Text>
                <View style={styles.routeInputLike}><Text numberOfLines={2} style={styles.routeValue}>{job.pickupAddress}</Text></View>
              </View>
            </View>
            <View style={styles.routeDivider} />
            <View style={styles.routeRow}>
              <View style={styles.routeIconCol}><Ionicons name='flag' size={18} color={GREEN} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.routeTitle}>DROP-OFF LOCATION</Text>
                <View style={styles.routeInputLike}><Text numberOfLines={2} style={styles.routeValue}>{job.dropoffAddress}</Text></View>
              </View>
            </View>
          </View>
        </View>

        {/* Delivered Summary */}
        <View style={styles.deliveryCard}>
          <View style={styles.deliveryLeft}>
            <View style={styles.doneIcon}><Ionicons name='checkmark' size={18} color='#fff' /></View>
            <View>
              <Text style={styles.deliveryTitle}>Delivered Successfully</Text>
              <Text style={styles.deliveryDate}>{deliveryDate}</Text>
            </View>
          </View>
          <View style={styles.statusPill}><Text style={styles.statusPillText}>Completed</Text></View>
        </View>

        {/* Driver Details */}
        {job.driver && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>DRIVER DETAILS</Text>
            <View style={styles.driverRow}>
              <View style={styles.avatarWrap}>
                {job.driver.user.avatar ? (
                  <Image source={{ uri: job.driver.user.avatar }} style={styles.avatar} />
                ) : (
                  <Ionicons name='person' size={26} color='#9AA4B2' />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>{job.driver.user.fullName}</Text>
                {(job.driver.truckModel || job.driver.numberPlate) && (
                  <Text style={styles.driverSub}>
                    {[job.driver.truckModel, job.driver.numberPlate].filter(Boolean).join(' • ')}
                  </Text>
                )}
                {job.review && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                    <Ionicons name='star' size={14} color='#F4B400' />
                    <Text style={{ fontSize: 13, fontWeight: '900', color: TEXT }}>{job.review.rating}/5</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Payment Details */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>PAYMENT DETAILS</Text>
          <View style={styles.hr} />
          {!isFinal && <Row left='Estimated Fare' right={`$${fare.toFixed(2)}`} />}
          {isFinal && <Row left='Final Fare' right={`$${fare.toFixed(2)}`} />}
          <View style={styles.hr} />
          <Row left='Platform Fee (15%)' right={`$${platformFee.toFixed(2)}`} />
          {job.distanceKm != null && (
            <>
              <View style={styles.hr} />
              <Row left='Distance' right={`${job.distanceKm.toFixed(1)} km`} />
            </>
          )}
          <View style={styles.hr} />
          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLeft}>Total</Text>
              {!isFinal && <Text style={styles.totalSub}>(Estimated)</Text>}
            </View>
            <Text style={styles.totalValue}>${fare.toFixed(2)}</Text>
          </View>
        </View>

        <View style={{ height: 130 }} />
      </ScrollView>

      {/* Bottom Sticky Buttons */}
      {(!job.review || !isPaid) && (
        <View style={styles.bottomBar}>
          {!isPaid && (
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.payBtn, paying && { opacity: 0.7 }]}
              onPress={handlePay}
              disabled={paying}
            >
              {paying
                ? <ActivityIndicator color='#fff' />
                : <>
                    <Ionicons name='card-outline' size={18} color='#fff' />
                    <Text style={styles.payText}>PAY ${fare.toFixed(2)}</Text>
                  </>
              }
            </TouchableOpacity>
          )}
          {isPaid && !job.review && (
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.reviewBtn}
              onPress={() => navigation.navigate('UserRateDriver', { jobId: job.id })}
            >
              <Ionicons name='star-outline' size={18} color='#fff' />
              <Text style={styles.reviewText}>RATE DRIVER</Text>
            </TouchableOpacity>
          )}
          {isPaid && job.review && null}
        </View>
      )}
    </SafeAreaView>
  )
}

function Row({ left, right }: { left: string; right: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLeft}>{left}</Text>
      <Text style={styles.rowRight}>{right}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7F9' },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: TEXT },
  content: { paddingHorizontal: 16, paddingBottom: 30 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 10 } },
      android: { elevation: 2 },
    }),
  },

  sectionLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 0.6, color: TEXT, textTransform: 'uppercase' },

  routeRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  routeIconCol: { width: 22, alignItems: 'center', paddingTop: 18 },
  routeTitle: { fontSize: 11, fontWeight: '900', color: TEXT, letterSpacing: 0.5 },
  routeInputLike: { marginTop: 8, minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: '#E6EAF0', backgroundColor: '#FBFCFD', paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'center' },
  routeValue: { fontSize: 13, fontWeight: '800', color: TEXT },
  routeDivider: { height: 22, marginLeft: 10, borderLeftWidth: 2, borderLeftColor: '#CFE6CF', marginBottom: 6 },

  deliveryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: GREEN,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 10 } },
      android: { elevation: 2 },
    }),
  },
  deliveryLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  doneIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  deliveryTitle: { fontSize: 14, fontWeight: '900', color: TEXT },
  deliveryDate: { marginTop: 4, fontSize: 12, fontWeight: '700', color: MUTED },
  statusPill: { height: 26, paddingHorizontal: 10, borderRadius: 999, backgroundColor: '#E9F7EA', alignItems: 'center', justifyContent: 'center' },
  statusPillText: { color: GREEN, fontWeight: '900', fontSize: 12 },

  driverRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F6F7F9', borderRadius: 16, padding: 12 },
  avatarWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E9EDF3', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatar: { width: 44, height: 44 },
  driverName: { fontSize: 15, fontWeight: '900', color: TEXT },
  driverSub: { marginTop: 4, fontSize: 12, fontWeight: '700', color: MUTED },

  hr: { height: 1, backgroundColor: '#EEF2F7', marginVertical: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLeft: { color: MUTED, fontWeight: '800' },
  rowRight: { color: TEXT, fontWeight: '900' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 6 },
  totalLeft: { fontSize: 13, fontWeight: '900', color: TEXT },
  totalSub: { marginTop: 2, fontSize: 12, fontWeight: '700', color: MUTED },
  totalValue: { fontSize: 30, fontWeight: '900', color: ORANGE },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 22 : 14,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: -6 } },
      android: { elevation: 10 },
    }),
  },
  payBtn: { height: 54, borderRadius: 16, backgroundColor: ORANGE, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 },
  payText: { color: '#fff', fontWeight: '900', letterSpacing: 0.6, fontSize: 16 },
  reviewBtn: { height: 54, borderRadius: 16, backgroundColor: GREEN, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  reviewText: { color: '#fff', fontWeight: '900', letterSpacing: 0.6 },
})
