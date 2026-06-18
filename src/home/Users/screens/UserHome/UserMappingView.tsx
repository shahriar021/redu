import { IPA_BASE } from '@env'
import { Entypo, MaterialCommunityIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NavigationProp, useNavigation, useRoute } from '@react-navigation/native'
import axios from 'axios'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useBooking } from '../../../../Auth/BookingContext'
import { AuthStackParamList } from '../../../../Navigation/type'
import { useLocation } from '../../../../Utils/hooks/useLocation'
import { useRouteDirection } from '../../../../Utils/hooks/useRouteDirection'
import { RouteMap } from '../../Components/SearchLocation/RouteMap'
import { LocationData } from '../../Components/SearchLocation/type'

const UserMappingView = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
  const route = useRoute<any>()
  const { locationCoords, currentLocation, fetchCurrentLocation } = useLocation()
  const { getRoute } = useRouteDirection()
  const {
    pickupLocation,
    dropoffLocation,
    routeData,
    setPickupLocation,
    setDropoffLocation,
    setRouteData,
  } = useBooking()

  const [isRouteLoading, setIsRouteLoading] = useState(false)
  const [isGettingRoute, setIsGettingRoute] = useState(false)
  // Track whether we already set the default pickup this session
  const didSetDefaultPickup = useRef(false)

  // Default pickup to current location when screen first opens
  // The ref prevents re-overriding after the user changes pickup via search
  useEffect(() => {
    if (locationCoords && !didSetDefaultPickup.current) {
      didSetDefaultPickup.current = true
      setPickupLocation({
        id: 'current',
        title: 'Current Location',
        address: currentLocation || 'Current Location',
        latitude: locationCoords.latitude,
        longitude: locationCoords.longitude,
      })
    }
  }, [locationCoords, currentLocation])

  // Reset the flag when the screen unmounts so next visit starts fresh
  useEffect(() => {
    return () => {
      didSetDefaultPickup.current = false
    }
  }, [])

  // Accept a dropoff injected via nav params (e.g. from rebooking)
  useEffect(() => {
    if (route.params?.dropoffLocation) {
      setDropoffLocation(route.params.dropoffLocation)
      setRouteData(null)
    }
  }, [route.params?.dropoffLocation])

  // Auto-fetch route when both locations are set
  useEffect(() => {
    const fetchRoute = async () => {
      if (pickupLocation && dropoffLocation && !routeData && !isGettingRoute) {
        setIsGettingRoute(true)
        setIsRouteLoading(true)
        try {
          const result = await getRoute(pickupLocation, dropoffLocation)
          if (result) setRouteData(result)
        } catch {
          Alert.alert('Error', 'Failed to calculate route. Please try again.')
        } finally {
          setIsGettingRoute(false)
          setIsRouteLoading(false)
        }
      }
    }
    fetchRoute()
  }, [pickupLocation, dropoffLocation, routeData, getRoute])

  const handlePickupChange = useCallback(
    (location: LocationData) => {
      setPickupLocation(location)
      setRouteData(null)
    },
    [setPickupLocation, setRouteData],
  )

  const handleDropoffChange = useCallback(
    (location: LocationData) => {
      setDropoffLocation(location)
      setRouteData(null)
    },
    [setDropoffLocation, setRouteData],
  )

  const handlePickupPress = () => {
    navigation.navigate('UserSearchLocation', { type: 'pickup' })
  }

  const handleDropoffPress = () => {
    navigation.navigate('UserSetDropOff')
  }

  const handleClearDropoff = () => {
    setDropoffLocation(null)
    setRouteData(null)
  }

  const handleCenterOnCurrentLocation = async () => {
    await fetchCurrentLocation()
    if (locationCoords) {
      setPickupLocation({
        id: 'current',
        title: 'Current Location',
        address: currentLocation || 'Current Location',
        latitude: locationCoords.latitude,
        longitude: locationCoords.longitude,
      })
      setRouteData(null)
    }
  }

  const handleNextPress = () => {
    if (!pickupLocation) {
      Alert.alert('Missing Info', 'Please select a pickup location')
      return
    }
    if (!dropoffLocation) {
      Alert.alert('Missing Info', 'Please select a drop-off location')
      return
    }
    if (!routeData) {
      Alert.alert('Please wait', 'Route is still calculating...')
      return
    }
    navigation.navigate('UserScheduleShifting')
  }

  const canProceed = !!(pickupLocation && dropoffLocation && !isRouteLoading)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle='dark-content' />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Entypo name='chevron-left' size={28} color='#111827' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Location</Text>
        <TouchableOpacity onPress={handleCenterOnCurrentLocation} style={styles.headerBtn}>
          <MaterialCommunityIcons name='crosshairs-gps' size={24} color='#4CAF50' />
        </TouchableOpacity>
      </View>

      {/* Map — fixed height, no overlay issues */}
      <View style={styles.mapContainer}>
        <RouteMap
          pickup={pickupLocation}
          dropoff={dropoffLocation}
          routeData={routeData}
          onPickupChange={handlePickupChange}
          onDropoffChange={handleDropoffChange}
          isLoading={isRouteLoading}
        />
      </View>

      {/* Input form — scrollable, below the map */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps='handled'
        >
          {/* Pickup */}
          <Text style={styles.fieldLabel}>PICKUP LOCATION</Text>
          <TouchableOpacity onPress={handlePickupPress} style={styles.locationRow}>
            <View style={[styles.dot, { backgroundColor: '#22C55E' }]}>
              <MaterialCommunityIcons name='circle' size={10} color='#fff' />
            </View>
            <View style={styles.locationText}>
              <Text style={styles.locationTitle} numberOfLines={1}>
                {pickupLocation?.title || 'Select pickup location'}
              </Text>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {pickupLocation?.address || 'Tap to select'}
              </Text>
            </View>
            <MaterialCommunityIcons name='chevron-right' size={20} color='#9CA3AF' />
          </TouchableOpacity>

          {/* Dropoff */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>DROP-OFF LOCATION</Text>
          <TouchableOpacity onPress={handleDropoffPress} style={styles.locationRow}>
            <View style={[styles.dot, { backgroundColor: '#EF4444' }]}>
              <MaterialCommunityIcons name='flag' size={10} color='#fff' />
            </View>
            <View style={styles.locationText}>
              <Text style={styles.locationTitle} numberOfLines={1}>
                {dropoffLocation?.title || 'Select drop-off location'}
              </Text>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {dropoffLocation?.address || 'Tap to select'}
              </Text>
            </View>
            {dropoffLocation ? (
              <TouchableOpacity onPress={handleClearDropoff} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name='close-circle' size={20} color='#9CA3AF' />
              </TouchableOpacity>
            ) : (
              <MaterialCommunityIcons name='chevron-right' size={20} color='#9CA3AF' />
            )}
          </TouchableOpacity>

          {/* Route info */}
          {isRouteLoading && (
            <View style={styles.routeCard}>
              <ActivityIndicator size='small' color='#4CAF50' />
              <Text style={styles.routeLoadingText}>Calculating route…</Text>
            </View>
          )}

          {routeData && !isRouteLoading && (
            <View style={styles.routeCard}>
              <View style={styles.routeRow}>
                <View style={styles.routeLeft}>
                  <MaterialCommunityIcons name='map-marker-distance' size={18} color='#4CAF50' />
                  <Text style={styles.routeLabel}>Distance</Text>
                </View>
                <Text style={styles.routeValue}>{routeData.distance?.toFixed(1)} km</Text>
              </View>
              <View style={[styles.routeRow, { marginTop: 10 }]}>
                <View style={styles.routeLeft}>
                  <MaterialCommunityIcons name='clock-outline' size={18} color='#4CAF50' />
                  <Text style={styles.routeLabel}>Duration</Text>
                </View>
                <Text style={styles.routeValue}>{Math.round(routeData.duration)} min</Text>
              </View>
            </View>
          )}

          {/* Next */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleNextPress}
            disabled={!canProceed}
            style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
          >
            <Text style={styles.nextBtnText}>
              {isRouteLoading ? 'CALCULATING…' : 'NEXT'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.hint}>Drag markers on map to fine-tune locations</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default UserMappingView

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },

  mapContainer: { height: 220 },

  formContent: { padding: 20, paddingBottom: 40 },

  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.6,
    marginBottom: 8,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
    paddingVertical: 13,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: { flex: 1, marginLeft: 12 },
  locationTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  locationAddress: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  routeCard: {
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    padding: 14,
    alignItems: 'center',
  },
  routeLoadingText: { fontSize: 13, color: '#6B7280', marginTop: 8 },
  routeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  routeLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  routeLabel: { fontSize: 14, color: '#6B7280' },
  routeValue: { fontSize: 15, fontWeight: '700', color: '#111827' },

  nextBtn: {
    marginTop: 20,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
  },
  nextBtnDisabled: { backgroundColor: '#D1D5DB' },
  nextBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.4 },

  hint: { marginTop: 12, textAlign: 'center', fontSize: 12, color: '#9CA3AF' },
})
