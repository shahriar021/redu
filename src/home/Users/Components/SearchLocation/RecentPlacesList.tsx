import { MaterialCommunityIcons } from '@expo/vector-icons'
import React from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'
import { LocationData } from './type'

interface RecentPlacesListProps {
  places: LocationData[]
  onSelect: (place: LocationData) => void
  onClearAll: () => void
  onRemove: (place: LocationData) => void
  isLoading: boolean
}

export const RecentPlacesList: React.FC<RecentPlacesListProps> = ({
  places,
  onSelect,
  onClearAll,
  onRemove,
  isLoading
}) => {
  if (isLoading) {
    return (
      <View className='mt-20 items-center'>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text className='text-center text-gray-500 text-base mt-4'>
          Loading recent places...
        </Text>
      </View>
    )
  }

  if (places.length === 0) {
    return (
      <View className='mt-20 items-center'>
        <MaterialCommunityIcons name='history' size={48} color='#ccc' />
        <Text className='text-center text-gray-500 text-base mt-4'>
          No recent places yet
        </Text>
      </View>
    )
  }

  return (
    <View>
      <View className='mb-4 flex-row items-center justify-between'>
        <Text className='text-base font-bold text-gray-800'>
          RECENT PLACES
        </Text>
        <TouchableOpacity onPress={onClearAll}>
          <Text className='text-base font-semibold text-green-500'>
            Clear All
          </Text>
        </TouchableOpacity>
      </View>

      {places.map((place) => (
        <TouchableOpacity
          key={place.id || place.address}
          onPress={() => onSelect(place)}
          activeOpacity={0.7}
          className='mb-5 flex-row items-start rounded-2xl bg-gray-50 p-4'
        >
          <View className='mr-4 h-10 w-10 items-center justify-center rounded-full bg-gray-200'>
            <MaterialCommunityIcons name='clock-outline' size={18} color='#666' />
          </View>

          <View className='flex-1'>
            <Text className='text-base font-semibold text-gray-800 mb-1'>
              {place.title}
            </Text>
            <Text className='text-sm text-gray-600 mb-1'>
              {place.address}
            </Text>
            {place.distance && (
              <Text className='text-xs text-gray-500'>
                {place.distance}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={() => onRemove(place)}
            className='p-2'
          >
            <MaterialCommunityIcons name='close' size={20} color='#999' />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </View>
  )
}