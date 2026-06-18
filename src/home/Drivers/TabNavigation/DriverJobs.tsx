import { IPA_BASE } from '@env'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native'
import axios from 'axios'
import { StatusBar } from 'expo-status-bar'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
    Animated,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthStackParamList } from '../../../Navigation/type'

// ─── API Types ────────────────────────────────────────────────────────────────

const ACTIVE_STATUSES = new Set(['BOOKED', 'ON_WAY', 'ARRIVED', 'LOADED', 'IN_TRANSIT'])

type ApiJob = {
    id: string
    status: string
    pickupAddress: string
    dropoffAddress: string
    distanceKm: number | null
    estimatedFare: number | null
    workNote?: string | null
    scheduledAt?: string | null
    truckType?: { name: string } | null
    customer?: { user?: { fullName?: string } } | null
    createdAt: string
    updatedAt: string
}

// ─── UI Job Type ──────────────────────────────────────────────────────────────

type Job = {
    id: string
    jobId: string
    status: 'active' | 'completed'
    rawStatus: string
    vehicleType: string
    pickupAddress: string
    dropAddress: string
    distance: number
    duration: number
    fare: number
    scheduleDate?: string
    workNotes?: string
    completionDate?: string
    totalEarnings?: number
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

const mapJob = (item: ApiJob): Job => {
    const isActive = ACTIVE_STATUSES.has(item.status)
    return {
        id: item.id,
        jobId: item.id.slice(-8).toUpperCase(),
        status: isActive ? 'active' : 'completed',
        rawStatus: item.status,
        vehicleType: item.truckType?.name ?? 'Truck',
        pickupAddress: item.pickupAddress,
        dropAddress: item.dropoffAddress,
        distance: item.distanceKm ?? 0,
        duration: 0,
        fare: item.estimatedFare ?? 0,
        scheduleDate: item.scheduledAt ?? undefined,
        workNotes: item.workNote ?? undefined,
        completionDate: !isActive ? new Date(item.updatedAt).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
        }) : undefined,
        totalEarnings: !isActive ? (item.estimatedFare ?? 0) : undefined,
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDistance = (d: number) => `${d.toFixed(1)} km`

const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60)
    const m = Math.round(mins % 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const formatDate = (iso?: string, time?: string) => {
    if (!iso) return null
    const d = new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return time ? `${d} • ${time}` : d
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

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
                <Box w={80} h={14} br={6} />
                <Box w={60} h={14} br={6} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                <Box w='48%' h={48} br={10} />
                <Box w='48%' h={48} br={10} />
            </View>
            <Box w='30%' h={10} mb={6} br={4} />
            <Box w='90%' h={14} mb={14} br={6} />
            <Box w='30%' h={10} mb={6} br={4} />
            <Box w='75%' h={14} mb={14} br={6} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
                <Box w={60} h={32} br={8} />
                <Box w={60} h={32} br={8} />
                <Box w={60} h={32} br={8} />
            </View>
            <Box w='100%' h={46} br={12} />
        </View>
    )
}

// ─── Job Card ─────────────────────────────────────────────────────────────────

const JobCard = ({ job, onPress }: { job: Job; onPress: () => void }) => {
    const isActive = job.status === 'active'

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.card}>

            {/* Header */}
            <View style={styles.cardHeader}>
                <Text style={styles.jobId}>{job.jobId}</Text>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.statusBadge, { color: isActive ? '#F59E0B' : '#10B981' }]}>
                        {isActive ? 'DISPATCHED' : 'COMPLETED'}
                    </Text>
                    {!isActive && job.totalEarnings != null && (
                        <Text style={styles.headerEarnings}>${job.totalEarnings.toFixed(2)}</Text>
                    )}
                </View>
            </View>

            {/* Info Pills */}
            <View style={styles.infoRow}>
                <View style={styles.infoPill}>
                    <Text style={styles.infoPillLabel}>Vehicle</Text>
                    <Text style={styles.infoPillValue}>{job.vehicleType}</Text>
                </View>
                <View style={styles.infoPill}>
                    <Text style={styles.infoPillLabel}>Fare</Text>
                    <Text style={styles.infoPillValue}>${job.fare}</Text>
                </View>
            </View>

            {/* Pickup */}
            <View style={styles.locationRow}>
                <Ionicons name='location' size={18} color='#F59E0B' style={{ marginRight: 10, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.locationLabel}>PICKUP LOCATION</Text>
                    <Text style={styles.locationText}>{job.pickupAddress}</Text>
                </View>
            </View>

            {/* Dropoff */}
            <View style={styles.locationRow}>
                <Ionicons name='location' size={18} color='#10B981' style={{ marginRight: 10, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.locationLabel}>DROP-OFF LOCATION</Text>
                    <Text style={styles.locationText}>{job.dropAddress}</Text>
                </View>
            </View>

            {/* Meta */}
            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Ionicons name='navigate' size={15} color='#9CA3AF' />
                    <Text style={styles.metaLabel}>Distance</Text>
                    <Text style={styles.metaValue}>{formatDistance(job.distance)}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Ionicons name='time' size={15} color='#9CA3AF' />
                    <Text style={styles.metaLabel}>Est. Time</Text>
                    <Text style={styles.metaValue}>{formatDuration(job.duration)}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Ionicons name='cash-outline' size={15} color='#9CA3AF' />
                    <Text style={styles.metaLabel}>Fare</Text>
                    <Text style={styles.metaValue}>${job.fare}</Text>
                </View>
            </View>

            {/* Schedule + Notes */}
            {(job.scheduleDate || job.workNotes) && (
                <View style={styles.scheduleBox}>
                    {job.scheduleDate && (
                        <View style={styles.scheduleRow}>
                            <Ionicons name='calendar-outline' size={14} color='#6B7280' />
                            <Text style={styles.scheduleText}>
                                {formatDate(job.scheduleDate)}
                            </Text>
                        </View>
                    )}
                    {job.workNotes && (
                        <View style={styles.scheduleRow}>
                            <Ionicons name='document-text-outline' size={14} color='#6B7280' />
                            <Text style={styles.scheduleText} numberOfLines={2}>{job.workNotes}</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Completion Date */}
            {!isActive && job.completionDate && (
                <View style={styles.completionRow}>
                    <Ionicons name='calendar' size={14} color='#9CA3AF' />
                    <View style={{ marginLeft: 8 }}>
                        <Text style={styles.completionLabel}>Completion Date</Text>
                        <Text style={styles.completionText}>{job.completionDate}</Text>
                    </View>
                </View>
            )}

            {/* Total Earnings */}
            {!isActive && job.totalEarnings != null && (
                <View style={styles.earningsRow}>
                    <Text style={styles.earningsLabel}>TOTAL EARNINGS</Text>
                    <Text style={styles.earningsValue}>${job.totalEarnings.toFixed(2)}</Text>
                </View>
            )}

            {/* Action Button — active only */}
            {isActive && (
                <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.btnFull}>
                    <Text style={styles.btnText}>
                        {job.rawStatus === 'BOOKED' ? 'START JOB' : 'CONTINUE JOB'}
                    </Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = ({ tab }: { tab: 'active' | 'completed' }) => (
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
            {tab === 'active'
                ? 'You have no active jobs right now.'
                : 'Completed jobs will appear here.'}
        </Text>
    </View>
)

// ─── Main Component ───────────────────────────────────────────────────────────

const DriverJobs=()=> {
    const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
    const [tab, setTab] = useState<'active' | 'completed'>('active')

    const [activeJobs, setActiveJobs] = useState<Job[]>([])
    const [completedJobs, setCompletedJobs] = useState<Job[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const getToken = async () => AsyncStorage.getItem('vToken')

    // ─── Fetch Jobs ───────────────────────────────────────────────────────────

    const fetchJobs = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setIsRefreshing(true)
            setError(null)

            const token = await getToken()
            if (!token) return

            const res = await axios.get(`${IPA_BASE}/jobs/driver-jobs`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 15000,
            })

            const all: ApiJob[] = res.data?.data ?? []
            setActiveJobs(all.filter((j) => ACTIVE_STATUSES.has(j.status)).map(mapJob))
            setCompletedJobs(all.filter((j) => j.status === 'DELIVERED').map(mapJob))
        } catch (err: any) {
            console.error('Jobs fetch error:', err?.response?.data || err?.message)
            setError('Could not load jobs.')
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [])

    useEffect(() => {
        fetchJobs()
    }, [fetchJobs])

    useFocusEffect(
        useCallback(() => {
            fetchJobs()
        }, [fetchJobs])
    )

    const handlePress = (job: Job) => {
        if (job.status === 'active') {
            if (job.rawStatus === 'BOOKED') {
                navigation.navigate('JobAssigned', { jobId: job.id })
            } else {
                // ON_WAY / ARRIVED / LOADED / IN_TRANSIT — driver is on the road
                navigation.navigate('HeadingToPickup', { jobId: job.id })
            }
        } else {
            navigation.navigate('DriverJobsDetails', { jobId: job.id })
        }
    }

    const list = tab === 'active' ? activeJobs : completedJobs

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar style='dark' />
            <View style={styles.container}>

                {/* Title */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <Text style={styles.title}>My Jobs</Text>
                    {!isLoading && (
                        <View style={{ backgroundColor: '#DCFCE7', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#16A34A' }}>
                                {activeJobs.length} active
                            </Text>
                        </View>
                    )}
                </View>

                {/* Tabs */}
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
                                    {t === 'completed' && completedJobs.length > 0 && (
                                        <Text style={{ color: '#3B82F6' }}> {completedJobs.length}</Text>
                                    )}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* List */}
                {isLoading ? (
                    // Skeleton
                    <FlatList
                        data={[1, 2, 3]}
                        keyExtractor={(i) => String(i)}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                        renderItem={() => <SkeletonCard />}
                    />
                ) : error ? (
                    // Error
                    <View style={[styles.emptyBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                        <Ionicons name='alert-circle-outline' size={40} color='#EF4444' />
                        <Text style={[styles.emptyTitle, { color: '#EF4444' }]}>Failed to load</Text>
                        <Text style={styles.emptyText}>{error}</Text>
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
                            <JobCard job={item} onPress={() => handlePress(item)} />
                        )}
                        ListEmptyComponent={<EmptyState tab={tab} />}
                    />
                )}
            </View>
        </SafeAreaView>
    )
}

export default DriverJobs

// ─── Styles ───────────────────────────────────────────────────────────────────

const GREEN = '#43B047'
const BORDER = '#D6DCE3'
const TEXT_GRAY = '#8B95A1'

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F7F8FA' },
    container: { flex: 1, paddingHorizontal: 18, paddingTop: 10 },

    title: { fontSize: 26, fontWeight: '800', color: '#111827', marginTop: 4 },

    segmentWrap: { marginBottom: 14 },
    segment: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: '#F2F4F7',
        padding: 4,
        flexDirection: 'row',
    },
    segmentBtn: {
        flex: 1,
        borderRadius: 10,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentBtnActive: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E7EBF0',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
            android: { elevation: 3 },
        }),
    },
    segmentText: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
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

    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    jobId: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
    statusBadge: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
    headerEarnings: { fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 4 },

    infoRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    infoPill: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
    infoPillLabel: { fontSize: 11, fontWeight: '600', color: '#9CA3AF', marginBottom: 2 },
    infoPillValue: { fontSize: 14, fontWeight: '700', color: '#111827' },

    locationRow: { flexDirection: 'row', marginBottom: 10 },
    locationLabel: { fontSize: 10, fontWeight: '700', color: '#6B7280', letterSpacing: 0.3, marginBottom: 2 },
    locationText: { fontSize: 13, fontWeight: '600', color: '#111827', lineHeight: 18 },

    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    metaItem: { alignItems: 'center', gap: 4 },
    metaLabel: { fontSize: 10, fontWeight: '600', color: TEXT_GRAY },
    metaValue: { fontSize: 12, fontWeight: '700', color: '#111827', marginTop: 2 },

    scheduleBox: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 10, gap: 6, marginBottom: 10 },
    scheduleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
    scheduleText: { fontSize: 12, fontWeight: '600', color: '#374151', flex: 1 },

    completionRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
    completionLabel: { fontSize: 10, fontWeight: '600', color: TEXT_GRAY },
    completionText: { fontSize: 12, fontWeight: '700', color: '#111827', marginTop: 2 },

    earningsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        marginBottom: 4,
    },
    earningsLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', letterSpacing: 0.3 },
    earningsValue: { fontSize: 18, fontWeight: '800', color: '#111827' },

    btnFull: { width: '100%', height: 46, borderRadius: 12, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
    btnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 0.4 },

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
    emptyText: { fontSize: 13, fontWeight: '600', color: TEXT_GRAY, textAlign: 'center' },
})