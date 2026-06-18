import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface EmptyStateProps {
  error: string | null
  radius: number
  onRadiusChange: (radius: number) => void
}

const RADIUS_OPTIONS = [
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
  { value: 20000, label: '20 km' },
]

export const EmptyState: React.FC<EmptyStateProps> = ({
  error,
  radius,
  onRadiusChange,
}) => (
  <View className='flex-1 items-center justify-center py-10 px-5'>
    <MaterialCommunityIcons name="truck" size={80} color="#9CA3AF" />
    <Text className='text-xl font-bold text-gray-400 mt-4 mb-2'>
      No Trucks Found
    </Text>
    <Text className='text-base text-gray-400 text-center'>
      {error || 'No nearby trucks available in your area. Try increasing the radius or check back later.'}
    </Text>
    
    <View className='flex-row mt-6 gap-3'>
      {RADIUS_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.value}
          onPress={() => onRadiusChange(option.value)}
          className={`px-4 py-2 rounded-full ${
            radius === option.value ? 'bg-primary' : 'bg-gray-200'
          }`}
        >
          <Text className={radius === option.value ? 'text-white' : 'text-gray-600'}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
)