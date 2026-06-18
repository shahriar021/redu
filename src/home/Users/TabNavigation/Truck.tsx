import { Entypo, MaterialCommunityIcons } from '@expo/vector-icons'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Image,
  PanResponder,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import MapView, { Marker, Polyline } from 'react-native-maps'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Images } from '../../../constants'
import { AuthStackParamList } from '../../../Navigation/type'

interface Driver {
  id: string
  name: string
  rating: number
  vehicle: string
  plate: string
  image: any
}

const Truck = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
  const mapRef = useRef<MapView>(null)
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current
  const [eta] = useState(15)

  // Set offset for smooth dragging
  useEffect(() => {
    pan.setOffset({ x: 0, y: 0 })
  }, [])

  const driver: Driver = {
    id: '1',
    name: 'Bessie Lora',
    rating: 4.9, 
    vehicle: 'Volvo FH16',
    plate: 'KX-942-L',
    image: Images.MyProfile,
  }

  const mapInitialRegion = {
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }

  // Route coordinates
  const routeCoordinates = [
    { latitude: 48.8566, longitude: 2.3522 }, // Current location
    { latitude: 48.8550, longitude: 2.3510 },
    { latitude: 48.8540, longitude: 2.3500 },
    { latitude: 48.8530, longitude: 2.3490 }, // Destination
  ]

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, { dy }) => Math.abs(dy) > 10,
      onPanResponderGrant: () => {
        pan.flattenOffset()
      },
      onPanResponderMove: Animated.event([null, { dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (evt, { dy, vy }) => {
        if (dy > 100 || vy > 0.5) {
          Animated.spring(pan, {
            toValue: { x: 0, y: 500 },
            useNativeDriver: false,
            speed: 16,
          }).start(() => navigation.goBack())
        } else if (dy < -50 || vy < -0.5) {
          Animated.spring(pan, {
            toValue: { x: 0, y: -100 },
            useNativeDriver: false,
          }).start()
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start()
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start()
      },
    })
  ).current

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <StatusBar barStyle='dark-content' />

      {/* Map */}
      <View className='flex-1 bg-gray-100'>
        <MapView
          ref={mapRef}
          initialRegion={mapInitialRegion}
          style={{ flex: 1, width: '100%', height: '100%' }}
        >
          {/* Pickup Marker */}
          <Marker coordinate={routeCoordinates[0]} title='Pickup'>
            <View className='h-12 w-12 rounded-full bg-green-500 items-center justify-center shadow-lg border-4 border-white'>
              <MaterialCommunityIcons name='map-marker' size={24} color='white' />
            </View>
          </Marker>

          {/* Destination Marker */}
          <Marker coordinate={routeCoordinates[routeCoordinates.length - 1]} title='Destination'>
            <View className='h-8 w-8 rounded-full bg-gray-400 items-center justify-center'>
              <MaterialCommunityIcons name='flag' size={14} color='white' />
            </View>
          </Marker>

          {/* Route Line */}
          <Polyline
            coordinates={routeCoordinates}
            strokeColor='#FFA500'
            strokeWidth={4}
          />

          {/* Nearby Driver Markers */}
          <Marker coordinate={{ latitude: 48.8555, longitude: 2.3515 }}>
            <View className='h-8 w-8 rounded-full bg-orange-400 items-center justify-center'>
              <MaterialCommunityIcons name='truck' size={14} color='white' />
            </View>
          </Marker>
        </MapView>

        {/* Header */}
        <View className='absolute top-0 left-0 right-0 flex-row items-center justify-between px-5 pt-4'>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Entypo name='chevron-left' size={28} color='#000' />
          </TouchableOpacity>
          <Text className='text-2xl font-bold text-gray-800'>Live Tracking</Text>
          <View className='w-7' />
        </View>
      </View>

      {/* Fixed Bottom Modal */}
      <Animated.View
        style={[
          {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 60,
            minHeight: "35%",
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: -4 },
            elevation: 8,
          },
          { transform: [{ translateY: pan.y }] },
        ]}
        className="bg-white rounded-t-3xl"
      >
        {/* Drag Handle */}
        <View className='items-center py-3'>
          <View className='h-1 w-12 rounded-full bg-gray-300' />
        </View>

        {/* Content */}
        <View className='px-5 pb-6'>
          {/* Status and ETA Row */}
          <View className='flex-row items-center justify-between mb-4'>
            <View className='flex-row items-center gap-2'>
              <View className='h-3 w-3 rounded-full bg-green-500' />
              <Text className='text-sm font-bold text-green-600'>ON THE WAY</Text>
            </View>
            <Text className='text-xl font-bold text-orange-500'>
              ETA {eta} min
            </Text>
          </View>

          {/* Main Message */}
          <Text className='text-xl font-bold text-gray-800 mb-6'>
            Driver is on the way to your pickup location
          </Text>

          {/* Progress Bar */}
          <View className='mb-6'>
            <View className='flex-row items-center justify-between mb-2'>
              <Text className='text-xs font-semibold text-gray-600'>Driver</Text>
              <Text className='text-xs font-semibold text-gray-600'>Pickup</Text>
            </View>
            <View className='h-2 bg-gray-200 rounded-full overflow-hidden'>
              <View className='h-full bg-gradient-to-r from-green-500 to-orange-500 w-1/3' />
            </View>
          </View>

          {/* Driver Card */}
          <View className='flex-row items-center gap-4 rounded-2xl bg-gray-50 p-4'>
            {/* Driver Photo */}
            <Image
              source={driver.image}
              className='h-16 w-16 rounded-full'
            />

            {/* Driver Info */}
            <View className='flex-1'>
              <View className='flex-row items-center gap-1 mb-1'>
                <Text className='text-base font-bold text-gray-800'>
                  {driver.name}
                </Text>
                <MaterialCommunityIcons name='star' size={14} color='#FFD700' />
                <Text className='text-xs font-semibold text-gray-700'>
                  {driver.rating}
                </Text>
              </View>
              <Text className='text-xs text-gray-600 mb-1'>
                {driver.vehicle}
              </Text>
              <Text className='text-xs font-semibold text-gray-800'>
                {driver.plate}
              </Text>
            </View>

            {/* Call Button */}
            <TouchableOpacity className='h-10 w-10 rounded-full bg-green-500 items-center justify-center'>
              <MaterialCommunityIcons name='phone' size={18} color='white' />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  )
}

export default Truck
