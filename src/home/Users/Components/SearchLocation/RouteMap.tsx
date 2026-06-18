import React, { useRef, useEffect, useState } from 'react'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import { Platform, StyleSheet, View, Text } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LocationData, RouteData } from './type'

interface RouteMapProps {
  pickup: LocationData | null
  dropoff: LocationData | null
  routeData: RouteData | null
  onPickupChange?: (location: LocationData) => void
  onDropoffChange?: (location: LocationData) => void
  onMapPress?: (event: any) => void
  isLoading?: boolean
}

export const RouteMap: React.FC<RouteMapProps> = ({
  pickup,
  dropoff,
  routeData,
  onPickupChange,
  onDropoffChange,
  onMapPress,
  isLoading = false
}) => {
  const mapRef = useRef<MapView>(null)
  const [isMapReady, setIsMapReady] = useState(false)

  // Fit map to show both markers when both are present
  useEffect(() => {
    if (pickup && dropoff && isMapReady) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          [
            { latitude: pickup.latitude, longitude: pickup.longitude },
            { latitude: dropoff.latitude, longitude: dropoff.longitude }
          ],
          {
            edgePadding: { top: 80, right: 50, bottom: 300, left: 50 },
            animated: true
          }
        )
      }, 100)
    } else if (pickup && isMapReady) {
      mapRef.current?.animateToRegion(
        {
          latitude: pickup.latitude,
          longitude: pickup.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      )
    }
  }, [pickup, dropoff, isMapReady])

  const handleMapReady = () => {
    setIsMapReady(true)
  }

  return (
    <MapView
      ref={mapRef}
      provider={Platform.OS === 'ios' ? PROVIDER_GOOGLE : undefined}
      style={styles.map}
      onMapReady={handleMapReady}
      onPress={onMapPress}
      showsUserLocation={true}
      showsMyLocationButton={false}
      showsCompass={false}
      showsTraffic={false}
    >
      {/* Pickup Marker */}
      {pickup && (
        <Marker
          coordinate={{ latitude: pickup.latitude, longitude: pickup.longitude }}
          title="Pickup Location"
          description={pickup.address}
          pinColor="#22C55E"
          draggable={Platform.OS === 'ios'}
          onDragEnd={(e) => {
            if (Platform.OS !== 'ios') return
            const { latitude, longitude } = e.nativeEvent.coordinate
            onPickupChange?.({ ...pickup, latitude, longitude, address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` })
          }}
        />
      )}

      {/* Dropoff Marker */}
      {dropoff && (
        <Marker
          coordinate={{ latitude: dropoff.latitude, longitude: dropoff.longitude }}
          title="Drop-off Location"
          description={dropoff.address}
          pinColor="#EF4444"
          draggable={Platform.OS === 'ios'}
          onDragEnd={(e) => {
            if (Platform.OS !== 'ios') return
            const { latitude, longitude } = e.nativeEvent.coordinate
            onDropoffChange?.({ ...dropoff, latitude, longitude, address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` })
          }}
        />
      )}

      {/* Route Polyline */}
      {routeData && routeData.points && routeData.points.length > 0 && (
        <Polyline
          coordinates={routeData.points}
          strokeColor="#4CAF50"
          strokeWidth={4}
          lineCap="round"
          lineJoin="round"
          zIndex={1}
        />
      )}

      {/* Direction Arrow — iOS only; custom View children crash on Android New Architecture */}
      {Platform.OS === 'ios' && routeData && routeData.points.length > 0 && (
        <Marker
          coordinate={routeData.points[Math.floor(routeData.points.length / 2)]}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={{ transform: [{ rotate: '45deg' }] }}>
            <MaterialCommunityIcons name='arrow-right' size={24} color='#4CAF50' />
          </View>
        </Marker>
      )}
    </MapView>
  )
}

const styles = StyleSheet.create({
  map: { flex: 1, width: '100%', height: '100%' },
})