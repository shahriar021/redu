import React, { useRef, useEffect } from 'react'
import { View, Text, TouchableOpacity, Animated, PanResponder, Dimensions } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LocationData } from './type'

const { height } = Dimensions.get('window')
const SHEET_HEIGHT = height * 0.4

interface LocationBottomSheetProps {
  visible: boolean
  location: LocationData | null
  routeData?: any
  onConfirm: () => void
  onClose: () => void
  onDrag?: (location: LocationData) => void
}

export const LocationBottomSheet: React.FC<LocationBottomSheetProps> = ({
  visible,
  location,
  routeData,
  onConfirm,
  onClose,
  onDrag
}) => {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dy }) => Math.abs(dy) > 10,
      onPanResponderMove: (_, { dy }) => {
        if (dy > 0) {
          translateY.setValue(dy)
        }
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (dy > SHEET_HEIGHT * 0.3 || vy > 0.5) {
          onClose()
        }
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: false,
          tension: 50,
          friction: 12,
        }).start()
      },
    })
  ).current

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: false,
        tension: 50,
        friction: 12,
      }).start()
    } else {
      translateY.setValue(SHEET_HEIGHT)
    }
  }, [visible])

  if (!visible || !location) return null

  return (
    <Animated.View 
      style={[
        {
          transform: [{ translateY }],
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: SHEET_HEIGHT,
        }
      ]}
      {...panResponder.panHandlers}
      className='bg-white rounded-t-3xl shadow-lg'
    >
      {/* Drag Handle */}
      <View className='items-center py-3'>
        <View className='h-1 w-12 rounded-full bg-gray-300' />
      </View>

      {/* Location Info */}
      <View className='flex-row items-start px-5 mb-4'>
        <View className='mr-4 h-12 w-12 items-center justify-center rounded-full bg-green-500'>
          <MaterialCommunityIcons name='map-marker' size={24} color='white' />
        </View>
        <View className='flex-1'>
          <Text className='text-xl font-bold text-gray-800 mb-1'>
            {location.title}
          </Text>
          <Text className='text-sm text-gray-600'>
            {location.address}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} className='p-2'>
          <MaterialCommunityIcons name='close' size={24} color='#999' />
        </TouchableOpacity>
      </View>

      {/* Route Info if available */}
      {routeData && (
        <View className='mx-5 mb-4 bg-gray-50 rounded-2xl p-4'>
          <View className='flex-row justify-between mb-3'>
            <View className='flex-row items-center'>
              <MaterialCommunityIcons name='map-marker-distance' size={20} color='#4CAF50' />
              <Text className='ml-2 text-gray-600'>Distance</Text>
            </View>
            <Text className='text-lg font-bold text-gray-800'>
              {routeData.distance?.toFixed(1)} km
            </Text>
          </View>
          <View className='flex-row justify-between'>
            <View className='flex-row items-center'>
              <MaterialCommunityIcons name='clock-outline' size={20} color='#4CAF50' />
              <Text className='ml-2 text-gray-600'>Duration</Text>
            </View>
            <Text className='text-lg font-bold text-gray-800'>
              {Math.round(routeData.duration)} min
            </Text>
          </View>
        </View>
      )}

      {/* Drag to adjust hint */}
      <View className='px-5 mb-4'>
        <Text className='text-xs text-gray-400 text-center'>
          Drag the marker on map to adjust location
        </Text>
      </View>

      {/* Confirm Button */}
      <TouchableOpacity
        onPress={onConfirm}
        activeOpacity={0.8}
        className='mx-5 rounded-2xl bg-green-500 py-4'
      >
        <Text className='text-center text-lg font-bold text-white'>
          CONFIRM LOCATION
        </Text>
      </TouchableOpacity>
    </Animated.View>
  )
}