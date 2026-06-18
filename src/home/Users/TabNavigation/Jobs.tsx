import { IPA_BASE } from '@env'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native'
import axios from 'axios'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthStackParamList } from '../../../Navigation/type'

type JobStatus = 'active' | 'completed'

const ACTIVE_STATUSES = new Set(['BOOKED', 'ON_WAY', 'ARRIVED', 'LOADED', 'IN_TRANSIT', 'PENDING', 'BROADCAST'])

type ApiJob = {
  id: string
  status: string
  pickupAddress: string
  dropoffAddress: string
  estimatedFare: number | null
  distanceKm: number | null
  truckType?: { name: string } | null
  scheduledAt?: string | null
  createdAt: string
  updatedAt: string
}

type Job = {
  id: string
  title: string
  dateText: string
  status: JobStatus
  apiStatus: string
  price: number
}

const mapJob = (item: ApiJob): Job => ({
  id: item.id,
  title: item.truckType?.name ?? 'Truck Job',
  dateText: new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  status: ACTIVE_STATUSES.has(item.status) ? 'active' : 'completed',
  apiStatus: item.status,
  price: item.estimatedFare ?? 0,
})

const SkeletonCard = () => {
  const shimmer = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start()
  }, [shimmer])
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.9] })
  const Box = ({ w, h, mb = 0, br = 8 }: { w: string | number; h: number; mb?: number; br?: number }) => (
    <Animated.View style={{ width: w as any, height: h, marginBottom: mb, borderRadius: br, backgroundColor: '#E5E7EB', opacity }} />
  )
  return (
    <View style={[styles.card, { marginBottom: 14 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <Box w='60%' h={14} br={6} />
        <Box w={60} h={14} br={6} />
      </View>
      <Box w='40%' h={10} mb={16} br={4} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Box w='48%' h={46} br={12} />
        <Box w='48%' h={46} br={12} />
      </View>
    </View>
  )
}

export default function Jobs() {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
  const [tab, setTab] = useState<JobStatus>('active')
  const [allJobs, setAllJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true)
      setError(null)
      const token = await AsyncStorage.getItem('vToken')
      if (!token) return
      const res = await axios.get(`${IPA_BASE}/jobs/my-jobs`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      })
      const jobs: ApiJob[] = res.data?.data ?? []
      setAllJobs(jobs.map(mapJob))
    } catch (err: any) {
      console.error('Jobs fetch error:', err?.response?.data || err?.message)
      setError('Could not load jobs.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  useFocusEffect(useCallback(() => { fetchJobs() }, [fetchJobs]))

  const list = allJobs.filter((j) => j.status === tab)

  const goDetails = (job: Job) => {
    if (job.status === 'active') {
      navigation.navigate('UserActiveJobsDetails', { jobId: job.id })
    } else {
      navigation.navigate('UserCompleteJobsDetails', { jobId: job.id })
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>My Jobs</Text>

        <View style={styles.segmentWrap}>
          <View style={styles.segment}>
            {(['active', 'completed'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                activeOpacity={0.85}
                onPress={() => setTab(t)}
                style={[styles.segmentBtn, tab === t && styles.segmentBtnActive]}
              >
                <Text style={[styles.segmentText, tab === t && styles.segmentTextActive]}>
                  {t === 'active' ? 'Active' : 'Completed'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {isLoading ? (
          <FlatList
            data={[1, 2, 3]}
            keyExtractor={(i) => String(i)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={() => <SkeletonCard />}
          />
        ) : error ? (
          <View style={[styles.emptyBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <Ionicons name='alert-circle-outline' size={40} color='#EF4444' />
            <Text style={[styles.emptyTitle, { color: '#EF4444' }]}>Failed to load</Text>
            <TouchableOpacity
              onPress={() => { setIsLoading(true); fetchJobs() }}
              style={{ marginTop: 12, backgroundColor: '#43B047', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 }}
            >
              <Text style={{ color: '#fff', fontWeight: '800' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={isRefreshing}
            onRefresh={() => fetchJobs(true)}
            renderItem={({ item }) => (
              <JobCard job={item} onView={() => goDetails(item)} onPrimary={() => goDetails(item)} />
            )}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Ionicons
                  name={tab === 'active' ? 'briefcase-outline' : 'checkmark-circle-outline'}
                  size={40}
                  color='#D1D5DB'
                />
                <Text style={styles.emptyTitle}>
                  {tab === 'active' ? 'No active jobs' : 'No completed jobs'}
                </Text>
                <Text style={styles.emptyText}>
                  {tab === 'active' ? 'Book a job to get started.' : 'Completed jobs will appear here.'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  )
}

function JobCard({
  job,
  onView,
  onPrimary,
}: {
  job: Job
  onView: () => void
  onPrimary: () => void
}) {
  const isCancelled = job.apiStatus === 'CANCELLED'
  const primaryLabel = job.status === 'active' ? 'TRACK JOB' : 'VIEW DETAILS'

  const statusLabel = isCancelled ? 'Cancelled' : job.status === 'active' ? 'Active' : 'Completed'
  const subText = `${job.dateText} • ${statusLabel}`

  return (
    <View style={[styles.card, isCancelled && styles.cardCancelled]}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{job.title}</Text>
          <Text style={[styles.cardSub, isCancelled && { color: '#EF4444' }]}>{subText}</Text>
        </View>
        <Text style={[styles.price, isCancelled && { color: '#9CA3AF' }]}>
          ${job.price.toFixed(2)}
        </Text>
      </View>

      {!isCancelled && (
        <View style={styles.cardBottom}>
          {job.status === 'active' && (
            <TouchableOpacity activeOpacity={0.85} onPress={onView} style={styles.btnGhost}>
              <Text style={styles.btnGhostText}>View</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity activeOpacity={0.85} onPress={onPrimary} style={styles.btnPrimary}>
            <Text style={styles.btnPrimaryText}>{primaryLabel}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const GREEN = '#43B047'
const BORDER = '#D6DCE3'
const TEXT_GRAY = '#8B95A1'

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  container: { flex: 1, paddingHorizontal: 18, paddingTop: 10 },

  title: { fontSize: 26, fontWeight: '800', color: '#111827', marginTop: 4, marginBottom: 14 },

  segmentWrap: { marginBottom: 14 },
  segment: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#F2F4F7',
    padding: 4,
    flexDirection: 'row',
  },
  segmentBtn: { flex: 1, borderRadius: 10, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EBF0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 3 },
    }),
  },
  segmentText: { fontSize: 14, fontWeight: '700', color: '#111827' },
  segmentTextActive: { color: '#111827' },

  listContent: { paddingBottom: 120 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 2 },
    }),
  },
  cardCancelled: {
    backgroundColor: '#FFF8F8',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#111827' },
  cardSub: { marginTop: 4, fontSize: 12, fontWeight: '600', color: TEXT_GRAY },

  price: { fontSize: 16, fontWeight: '800', color: GREEN },

  cardBottom: { flexDirection: 'row', gap: 12, marginTop: 14 },

  btnGhost: { flex: 1, height: 46, borderRadius: 12, backgroundColor: '#EAF6EA', alignItems: 'center', justifyContent: 'center' },
  btnGhostText: { color: GREEN, fontSize: 14, fontWeight: '800' },

  btnPrimary: { flex: 1, height: 46, borderRadius: 12, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 0.4 },

  emptyBox: {
    marginTop: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  emptyText: { marginTop: 6, fontSize: 13, fontWeight: '600', color: TEXT_GRAY, textAlign: 'center' },
})
