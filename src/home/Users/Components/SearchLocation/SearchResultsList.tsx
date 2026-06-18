import React from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SearchSuggestion } from './type'

interface SearchResultsListProps {
  results: SearchSuggestion[]
  isLoading: boolean
  onSelect: (result: SearchSuggestion) => void
}

export const SearchResultsList: React.FC<SearchResultsListProps> = ({
  results,
  isLoading,
  onSelect
}) => {
  if (isLoading) {
    return (
      <View className='py-10 items-center'>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text className='text-center text-gray-500 text-base mt-4'>
          Searching for locations...
        </Text>
      </View>
    )
  }

  if (results.length === 0) {
    return (
      <View className='py-10 items-center'>
        <MaterialCommunityIcons name='map-search' size={48} color='#ccc' />
        <Text className='text-center text-gray-500 text-base mt-4'>
          No locations found
        </Text>
        <Text className='text-center text-gray-400 text-sm mt-2'>
          Try searching with a different address
        </Text>
      </View>
    )
  }

  return (
    <View>
      {results.map((result, index) => (
        <TouchableOpacity
          key={`${result.address}-${index}`}
          onPress={() => onSelect(result)}
          className='mb-3 flex-row items-start rounded-2xl bg-gray-50 p-4 border border-gray-100'
          activeOpacity={0.7}
        >
          <View className='mr-4 h-10 w-10 items-center justify-center rounded-full bg-green-100'>
            <MaterialCommunityIcons name='map-marker' size={18} color='#4CAF50' />
          </View>
          <View className='flex-1'>
            <Text className='text-base font-semibold text-gray-800 mb-1'>
              {result.address.split(',')[0]}
            </Text>
            <Text className='text-sm text-gray-600' numberOfLines={2}>
              {result.address}
            </Text>
          </View>
          <MaterialCommunityIcons name='chevron-right' size={20} color='#999' />
        </TouchableOpacity>
      ))}
    </View>
  )
}