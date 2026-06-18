import { IPA_BASE } from '@env'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NavigationProp, useNavigation, useRoute } from '@react-navigation/native'
import axios from 'axios'
import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useBooking } from '../../../../Auth/BookingContext'
import { AuthStackParamList } from '../../../../Navigation/type'
import { useLocation } from '../../../../Utils/hooks/useLocation'
import { useRouteDirection } from '../../../../Utils/hooks/useRouteDirection'

const GREEN = '#4CAF50'
const TEXT = '#111827'
const MUTED = '#8B95A1'

const UserDirectBooking = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
  const route = useRoute<any>()
  const { driverUserId, truckTypeId, truckName, driverName, driverAvatar } = route.params ?? {}

  const { locationCoords, currentLocation } = useLocation()
  const { getRoute } = useRouteDirection()
  const {
    pickupLocation,
    dropoffLocation,
    setPickupLocation,
    setDropoffLocation,
    setRouteData,
    clearLocationData,
  } = useBooking()

  const [workNote, setWorkNote] = useState('')
  const [booking, setBooking] = useState(false)
  const didSetDefaultPickup = useRef(false)

  // Clear stale booking state once on mount
  useEffect(() => {
    clearLocationData()
  }, [])

  // Set pickup to current location once coords resolve (may arrive after mount)
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

  // Fetch route whenever both locations are ready
  useEffect(() => {
    if (!pickupLocation || !dropoffLocation) return
    setRouteData(null)
    getRoute(pickupLocation, dropoffLocation).then((r) => {
      if (r) setRouteData(r)
    })
  }, [pickupLocation?.latitude, pickupLocation?.longitude, dropoffLocation?.latitude, dropoffLocation?.longitude])

  const canBook = !!pickupLocation && !!dropoffLocation && !booking

  const handleConfirm = async () => {
    if (!pickupLocation || !dropoffLocation) {
      Alert.alert('Missing Info', 'Please select pickup and drop-off locations.')
      return
    }
    try {
      setBooking(true)
      const token = await AsyncStorage.getItem('vToken')
      const res = await axios.post(
        `${IPA_BASE}/jobs`,
        {
          pickupAddress: pickupLocation.address || pickupLocation.title,
          pickupLat: pickupLocation.latitude,
          pickupLng: pickupLocation.longitude,
          dropoffAddress: dropoffLocation.address || dropoffLocation.title,
          dropoffLat: dropoffLocation.latitude,
          dropoffLng: dropoffLocation.longitude,
          truckTypeId,
          targetDriverId: driverUserId,
          workNote: workNote.trim() || undefined,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 20000,
        }
      )

      const jobId: string = res.data?.data?.job?.id ?? res.data?.data?.id ?? res.data?.job?.id

      clearLocationData()

      ;(navigation as any).navigate('UserFindingDrivers', { jobId })
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Booking failed. Please try again.'
      Alert.alert('Booking Failed', msg)
    } finally {
      setBooking(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F7F9' }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F2F5' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chevron-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '800', color: TEXT, flex: 1, textAlign: 'center' }}>Book Driver</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Driver Card */}
          <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 16, elevation: 2 }}>
            <Text style={{ fontSize: 12, fontWeight: '900', color: TEXT, letterSpacing: 0.6, marginBottom: 12 }}>DRIVER</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#E9EDF3', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {driverAvatar ? (
                  <Image source={{ uri: driverAvatar }} style={{ width: 52, height: 52 }} />
                ) : (
                  <Ionicons name="person" size={28} color="#9AA4B2" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: TEXT }}>{driverName || 'Driver'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
                  <MaterialCommunityIcons name="truck" size={14} color={GREEN} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: GREEN }}>{truckName}</Text>
                </View>
              </View>
              <View style={{ backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                <Text style={{ color: GREEN, fontWeight: '800', fontSize: 12 }}>Available</Text>
              </View>
            </View>
          </View>

          {/* Locations */}
          <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 16, elevation: 2 }}>
            <Text style={{ fontSize: 12, fontWeight: '900', color: TEXT, letterSpacing: 0.6, marginBottom: 12 }}>LOCATIONS</Text>

            {/* Pickup */}
            <Text style={{ fontSize: 11, fontWeight: '900', color: TEXT, letterSpacing: 0.5, marginBottom: 6 }}>PICKUP</Text>
            <TouchableOpacity
              onPress={() => (navigation as any).navigate('UserSearchLocation', { type: 'pickup' })}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F6F7F9', borderRadius: 14, borderWidth: 1, borderColor: pickupLocation ? GREEN : '#E6EAF0', padding: 12, marginBottom: 10 }}
              activeOpacity={0.7}
            >
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: pickupLocation ? '#E8F5E9' : '#F0F2F5', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Ionicons name="radio-button-on" size={16} color={pickupLocation ? GREEN : '#9AA4B2'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: pickupLocation ? TEXT : MUTED }} numberOfLines={1}>
                  {pickupLocation ? (pickupLocation.title || pickupLocation.address) : 'Select pickup location'}
                </Text>
                {pickupLocation?.address && pickupLocation.address !== pickupLocation.title && (
                  <Text style={{ fontSize: 12, color: MUTED, marginTop: 2 }} numberOfLines={1}>{pickupLocation.address}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={16} color={MUTED} />
            </TouchableOpacity>

            {/* Connector */}
            <View style={{ height: 1, backgroundColor: '#F0F2F5', marginHorizontal: 8, marginBottom: 10 }} />

            {/* Dropoff */}
            <Text style={{ fontSize: 11, fontWeight: '900', color: TEXT, letterSpacing: 0.5, marginBottom: 6 }}>DROP-OFF</Text>
            <TouchableOpacity
              onPress={() => (navigation as any).navigate('UserSearchLocation', { type: 'dropoff' })}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F6F7F9', borderRadius: 14, borderWidth: 1, borderColor: dropoffLocation ? '#EF4444' : '#E6EAF0', padding: 12 }}
              activeOpacity={0.7}
            >
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: dropoffLocation ? '#FEF2F2' : '#F0F2F5', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Ionicons name="flag" size={16} color={dropoffLocation ? '#EF4444' : '#9AA4B2'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: dropoffLocation ? TEXT : MUTED }} numberOfLines={1}>
                  {dropoffLocation ? (dropoffLocation.title || dropoffLocation.address) : 'Select drop-off location'}
                </Text>
                {dropoffLocation?.address && dropoffLocation.address !== dropoffLocation.title && (
                  <Text style={{ fontSize: 12, color: MUTED, marginTop: 2 }} numberOfLines={1}>{dropoffLocation.address}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={16} color={MUTED} />
            </TouchableOpacity>
          </View>

          {/* Work Notes */}
          <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 16, elevation: 2 }}>
            <Text style={{ fontSize: 12, fontWeight: '900', color: TEXT, letterSpacing: 0.6, marginBottom: 12 }}>WORK NOTES (OPTIONAL)</Text>
            <TextInput
              value={workNote}
              onChangeText={setWorkNote}
              placeholder="Add any special instructions..."
              placeholderTextColor={MUTED}
              multiline
              numberOfLines={3}
              style={{ backgroundColor: '#F6F7F9', borderRadius: 12, borderWidth: 1, borderColor: '#E6EAF0', padding: 12, fontSize: 14, color: TEXT, minHeight: 80, textAlignVertical: 'top' }}
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Confirm Button */}
      <View style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        paddingHorizontal: 16, paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 28 : 16,
        backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22,
        ...Platform.select({
          ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: -6 } },
          android: { elevation: 10 },
        }),
      }}>
        <TouchableOpacity
          onPress={handleConfirm}
          disabled={!canBook}
          activeOpacity={0.9}
          style={{ height: 54, borderRadius: 16, backgroundColor: canBook ? GREEN : '#D1D5DB', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
        >
          {booking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.4 }}>
                {canBook ? 'CONFIRM BOOKING' : 'SELECT LOCATIONS'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

export default UserDirectBooking
