import React from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'

interface RadiusFilterProps {
  radius: number
  onRadiusChange: (radius: number) => void
}

const RADIUS_OPTIONS = [
  { value: 5000, label: 'Within 5 km' },
  { value: 10000, label: 'Within 10 km' },
  { value: 20000, label: 'Within 20 km' },
  { value: 50000, label: 'Within 50 km' },
]

export const RadiusFilter: React.FC<RadiusFilterProps> = ({
  radius,
  onRadiusChange,
}) => (
  <View className='px-5 mb-4'>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className='flex-row gap-2'>
        {RADIUS_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => onRadiusChange(option.value)}
            className={`px-4 py-2 rounded-full ${
              radius === option.value 
                ? 'bg-primary' 
                : 'bg-white border border-gray-200'
            }`}
          >
            <Text className={radius === option.value ? 'text-white' : 'text-gray-600'}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  </View>
)