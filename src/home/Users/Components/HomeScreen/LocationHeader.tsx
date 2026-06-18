import React from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { FontAwesome6, Entypo } from '@expo/vector-icons'
import AnimatedLocationRing from './AnimatedLocationRing'

interface LocationHeaderProps {
  currentLocation: string
  isLoadingLocation: boolean
  onLocationPress: () => void
  onProfilePress: () => void
}

export const LocationHeader: React.FC<LocationHeaderProps> = ({
  currentLocation,
  isLoadingLocation,
  onLocationPress,
  onProfilePress
}) => (
  <View className='flex-row justify-between px-5 p-6'>
    <View className='flex-row items-center justify-center gap-4'>
      <View className='w-16 h-16 items-center justify-center rounded-full bg-white'>
        <FontAwesome6 name="location-dot" size={24} color="#4CAF50" />
      </View>
      <View>
        <Text className='text-[#FFFFFF] font-thin text-lg'>Current Location</Text>
        <TouchableOpacity onPress={onLocationPress}>
          <View className='flex-row items-center gap-2'>
            {isLoadingLocation ? (
              <ActivityIndicator size="small" color="white" />
            ) : null}
            <Text className='text-xl font-bold text-white'>{currentLocation}</Text>
            <Entypo name="chevron-down" size={24} color="white" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
    <AnimatedLocationRing onPress={onProfilePress} />
  </View>
)