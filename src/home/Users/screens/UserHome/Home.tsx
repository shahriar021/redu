import { Ionicons } from '@expo/vector-icons'
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AppState,
  AppStateStatus,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useBooking } from '../../../../Auth/BookingContext'
import { useUser } from '../../../../Auth/UserContext'
import { AuthStackParamList } from '../../../../Navigation/type'
import { UnpaidJob, useJobs } from '../../../../Utils/hooks/useJobs'
import { useLocation } from '../../../../Utils/hooks/useLocation'
import { Truck as NearbyTruck, useNearbyTrucks } from '../../../../Utils/hooks/useNearbyTrucks'
import { AllVendorsContent } from '../../Components/HomeScreen/AllVendorsContent'
import { HeroBanner } from '../../Components/HomeScreen/HeroBanner'
import { LocationHeader } from '../../Components/HomeScreen/LocationHeader'
import { LocationModal } from '../../Components/HomeScreen/LocationModal'

// ─── Payment Modal ────────────────────────────────────────────────────────────

function PaymentRequiredModal({
  job,
  onPayNow,
  onLater,
}: {
  job: UnpaidJob
  onPayNow: () => void
  onLater: () => void
}) {
  return (
    <Modal transparent animationType='slide' visible statusBarTranslucent>
      <View style={sheet.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onLater} />
        <View style={sheet.container}>
          {/* Handle */}
          <View style={sheet.handle} />

          {/* Icon */}
          <View style={sheet.iconWrap}>
            <Ionicons name='card' size={30} color='#FF9800' />
          </View>

          <Text style={sheet.title}>Payment Required</Text>
          <Text style={sheet.subtitle}>
            You have a completed delivery that requires payment before you can book again.
          </Text>

          {job.fareLabel ? (
            <View style={sheet.amountRow}>
              <Text style={sheet.amountLabel}>Amount Due</Text>
              <Text style={sheet.amountValue}>{job.fareLabel}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={sheet.payBtn} activeOpacity={0.85} onPress={onPayNow}>
            <Ionicons name='card-outline' size={18} color='#fff' />
            <Text style={sheet.payBtnText}>Pay Now</Text>
          </TouchableOpacity>

          <TouchableOpacity style={sheet.laterBtn} activeOpacity={0.7} onPress={onLater}>
            <Text style={sheet.laterText}>Remind Me Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const sheet = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 28,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginBottom: 24,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  amountValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FF9800',
  },
  payBtn: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#FF9800', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 },
    }),
  },
  payBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.4,
  },
  laterBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9CA3AF',
  },
})

// ─── Home Screen ──────────────────────────────────────────────────────────────

const Home = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
  const { fetchUserProfile } = useUser()
  const { setSelectedTruck } = useBooking()
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [paymentModal, setPaymentModal] = useState<UnpaidJob | null>(null)
  const paymentShownRef = useRef(false)

  const {
    currentLocation,
    isLoadingLocation,
    locationCoords,
    fetchCurrentLocation,
  } = useLocation()

  const {
    activeJobs,
    recentJobs,
    unpaidDeliveredJob,
    isLoading: jobsLoading,
    refetch: refetchJobs,
  } = useJobs()

  const {
    trucks: nearByTrucks,
    isLoading: trucksLoading,
    refresh: refreshTrucks,
    fetchNearbyTrucks,
  } = useNearbyTrucks()

  const activeJob = useMemo(() => {
    if (activeJobs && activeJobs.length > 0) {
      const firstJob = activeJobs[0]
      return {
        id: firstJob.id,
        name: firstJob.name,
        date: firstJob.date || new Date().toISOString(),
        status: 'active' as const,
        statusText: firstJob.statusText || 'On the way',
        pickupAddress: firstJob.pickupAddress || 'Pickup address not available',
        dropoffAddress: firstJob.dropoffAddress || 'Dropoff address not available',
      }
    }
    return null
  }, [activeJobs])

  // Reset "already shown" flag each time screen gains focus
  useFocusEffect(
    useCallback(() => {
      paymentShownRef.current = false
    }, []),
  )

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile()
    }, []),
  )

  useFocusEffect(
    useCallback(() => {
      if (locationCoords) fetchNearbyTrucks(locationCoords, true)
    }, [locationCoords, fetchNearbyTrucks]),
  )

  useFocusEffect(
    useCallback(() => {
      const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          if (locationCoords) fetchNearbyTrucks(locationCoords, false)
          refetchJobs()
        }
      })
      return () => subscription.remove()
    }, [locationCoords, fetchNearbyTrucks, refetchJobs]),
  )

  // Show payment modal once per focus session when an unpaid job is detected
  useEffect(() => {
    if (unpaidDeliveredJob && !paymentShownRef.current) {
      paymentShownRef.current = true
      setPaymentModal(unpaidDeliveredJob)
    }
    if (!unpaidDeliveredJob) {
      setPaymentModal(null)
    }
  }, [unpaidDeliveredJob])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await fetchCurrentLocation()
      if (locationCoords) {
        await Promise.all([refreshTrucks(locationCoords), refetchJobs()])
      } else {
        await refetchJobs()
      }
    } catch (error) {
      console.error('Refresh error:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [locationCoords, fetchCurrentLocation, refreshTrucks, refetchJobs])

  const handleBookPress = useCallback((truck?: NearbyTruck) => {
    if (unpaidDeliveredJob) {
      setPaymentModal(unpaidDeliveredJob)
      return
    }
    if (truck?.truckTypeId) {
      // Book Now: pre-select this driver's truck so UserScheduleShifting skips truck selection
      setSelectedTruck({
        id: truck.truckTypeId,
        name: truck.name,
        capacity: truck.capacity,
        icon: truck.icon,
        iconBg: truck.iconBg,
        iconColor: truck.iconColor,
        driverId: truck.driverUserId,  // used as targetDriverId in job creation
      })
    } else {
      // Start Booking: clear any pre-selection so user picks truck type manually
      setSelectedTruck(null)
    }
    navigation.navigate('UserMappingView')
  }, [unpaidDeliveredJob, navigation, setSelectedTruck])

  const isLoading = jobsLoading || trucksLoading

  return (
    <SafeAreaView className='flex-1 bg-primary'>
      {paymentModal && (
        <PaymentRequiredModal
          job={paymentModal}
          onPayNow={() => {
            setPaymentModal(null)
            navigation.navigate('UserCompleteJobsDetails', { jobId: paymentModal.id })
          }}
          onLater={() => setPaymentModal(null)}
        />
      )}

      <LocationModal
        visible={showLocationModal}
        currentLocation={currentLocation}
        locationCoords={locationCoords}
        onClose={() => setShowLocationModal(false)}
        onRefresh={async () => {
          await fetchCurrentLocation()
          if (locationCoords) await fetchNearbyTrucks(locationCoords, true)
        }}
      />

      <StatusBar barStyle='light-content' />

      <View className='flex-1'>
        <LocationHeader
          currentLocation={currentLocation}
          isLoadingLocation={isLoadingLocation}
          onLocationPress={() => setShowLocationModal(true)}
          onProfilePress={() => navigation.navigate('UserProfile')}
        />

        <ScrollView
          className='bg-gray-50 flex-1 rounded-t-3xl px-5 pt-6'
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing || isLoading}
              onRefresh={handleRefresh}
              colors={['#4CAF50']}
              tintColor='#4CAF50'
            />
          }
        >
          <HeroBanner onBookPress={() => handleBookPress()} />

          <AllVendorsContent
            nearByTrucks={nearByTrucks}
            activeJobs={activeJobs}
            recentJobs={recentJobs}
            activeJob={activeJob}
            isLoading={isLoading}
            onSeeAllNearby={() => navigation.navigate('UserNearByTrucks')}
            onBookPress={(truck) => handleBookPress(truck)}
            onTrackPress={() => {
              if (activeJob?.id) navigation.navigate('UserLiveTracking', { jobId: activeJob.id })
            }}
            onViewPress={(jobId) => navigation.navigate('UserCompleteJobsDetails', { jobId })}
            onSeeAllRecent={() => {}}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

export default Home
