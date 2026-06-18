import { IPA_BASE } from '@env'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NavigationProp, useNavigation, useRoute } from '@react-navigation/native'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthStackParamList } from '../../../../Navigation/type'

type JobDetail = {
  id: string
  status: string
  pickupAddress: string
  dropoffAddress: string
  estimatedFare: number | null
  distanceKm: number | null
  workNote: string | null
  scheduledAt: string | null
  truckType: { name: string } | null
  driver: {
    numberPlate: string | null
    truckModel: string | null
    user: { fullName: string; avatar: string | null }
  } | null
  review: { rating: number } | null
}

const STATUS_STEPS = ['BOOKED', 'ON_WAY', 'ARRIVED', 'LOADED', 'IN_TRANSIT', 'DELIVERED']
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  BROADCAST: 'Finding Driver',
  BOOKED: 'Driver Booked',
  ON_WAY: 'Driver On Way',
  ARRIVED: 'Driver Arrived',
  LOADED: 'Loaded',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

const GREEN = '#43B047'
const TEXT = '#111827'
const MUTED = '#8B95A1'

export default function UserActiveJobsDetails() {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
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

  const currentStepIdx = STATUS_STEPS.indexOf(job.status)

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
        {/* Status Card */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.sectionLabel}>STATUS</Text>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{STATUS_LABELS[job.status] ?? job.status}</Text>
            </View>
          </View>

          <View style={{ marginTop: 12 }}>
            {STATUS_STEPS.map((step, i) => {
              const isDone = i < currentStepIdx
              const isCurrent = i === currentStepIdx
              const isLast = i === STATUS_STEPS.length - 1
              const dotStyle = isDone ? styles.dotDone : isCurrent ? styles.dotCurrent : styles.dotPending

              return (
                <View key={step} style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.dotBase, dotStyle]}>
                      {isDone && <Ionicons name='checkmark' size={12} color='#fff' />}
                    </View>
                    {!isLast && <View style={[styles.line, isDone ? styles.lineDone : styles.linePending]} />}
                  </View>
                  <View style={styles.timelineBody}>
                    <Text style={[styles.stepTitle, isCurrent && { color: GREEN }]}>{STATUS_LABELS[step] ?? step}</Text>
                  </View>
                </View>
              )
            })}
          </View>
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
              </View>
            </View>
          </View>
        )}

        {/* Route Details */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>ROUTE DETAILS</Text>
          <View style={{ marginTop: 12 }}>
            <View style={styles.routeRow}>
              <View style={styles.routeIconCol}><Ionicons name='radio-button-on' size={18} color='#F59E0B' /></View>
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

        {/* Job Info */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>JOB INFO</Text>
          <View style={{ marginTop: 10, gap: 10 }}>
            {job.truckType && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Vehicle Type</Text>
                <Text style={styles.infoValue}>{job.truckType.name}</Text>
              </View>
            )}
            {job.distanceKm != null && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Distance</Text>
                <Text style={styles.infoValue}>{job.distanceKm.toFixed(1)} km</Text>
              </View>
            )}
            {job.estimatedFare != null && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Estimated Fare</Text>
                <Text style={[styles.infoValue, { color: GREEN, fontWeight: '900' }]}>${job.estimatedFare.toFixed(2)}</Text>
              </View>
            )}
            {job.scheduledAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Scheduled</Text>
                <Text style={styles.infoValue}>{new Date(job.scheduledAt).toLocaleString()}</Text>
              </View>
            )}
            {job.workNote && (
              <View>
                <Text style={styles.infoLabel}>Work Notes</Text>
                <Text style={[styles.infoValue, { marginTop: 4 }]}>{job.workNote}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
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

  statusPill: { height: 26, paddingHorizontal: 10, borderRadius: 999, backgroundColor: '#E9F7EA', alignItems: 'center', justifyContent: 'center' },
  statusPillText: { color: GREEN, fontWeight: '900', fontSize: 12 },

  timelineRow: { flexDirection: 'row', gap: 12, paddingVertical: 8 },
  timelineLeft: { width: 24, alignItems: 'center' },
  dotBase: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: GREEN },
  dotCurrent: { backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: GREEN },
  dotPending: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#D1D5DB' },
  line: { width: 2, flex: 1, marginTop: 4, borderRadius: 1 },
  lineDone: { backgroundColor: GREEN },
  linePending: { backgroundColor: '#E5E7EB' },
  timelineBody: { flex: 1, justifyContent: 'center' },
  stepTitle: { fontSize: 13, fontWeight: '800', color: TEXT },

  driverRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F6F7F9', borderRadius: 16, padding: 12 },
  avatarWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E9EDF3', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatar: { width: 44, height: 44 },
  driverName: { fontSize: 15, fontWeight: '900', color: TEXT },
  driverSub: { marginTop: 4, fontSize: 12, fontWeight: '700', color: MUTED },

  routeRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  routeIconCol: { width: 22, alignItems: 'center', paddingTop: 18 },
  routeTitle: { fontSize: 11, fontWeight: '900', color: TEXT, letterSpacing: 0.5 },
  routeInputLike: { marginTop: 8, minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: '#E6EAF0', backgroundColor: '#FBFCFD', paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'center' },
  routeValue: { fontSize: 13, fontWeight: '800', color: TEXT },
  routeDivider: { height: 22, marginLeft: 10, borderLeftWidth: 2, borderLeftColor: '#CFE6CF', marginBottom: 6 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 12, fontWeight: '700', color: MUTED },
  infoValue: { fontSize: 14, fontWeight: '800', color: TEXT },
})
