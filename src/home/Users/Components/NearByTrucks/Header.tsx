import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface HeaderProps {
  currentLocation: string
  onBackPress: () => void
  onLocationPress: () => void
}

export const Header: React.FC<HeaderProps> = ({
  currentLocation,
  onBackPress,
  onLocationPress,
}) => (
  <View className='flex-row items-center justify-between px-5 py-4'>
    <View className='flex-row items-center'>
      <TouchableOpacity onPress={onBackPress} className='mr-4'>
        <Ionicons name="arrow-back" size={24} color="#1C1C1C" />
      </TouchableOpacity>
      <Text className='text-2xl font-bold text-gray-dark'>Nearby Trucks</Text>
    </View>
    
    <TouchableOpacity 
      onPress={onLocationPress}
      className='flex-row items-center bg-white px-3 py-2 rounded-full'
    >
      <Ionicons name="location" size={16} color="#4CAF50" />
      <Text className='text-xs text-gray-600 ml-1'>
        {currentLocation.split(',')[0]}
      </Text>
    </TouchableOpacity>
  </View>
)