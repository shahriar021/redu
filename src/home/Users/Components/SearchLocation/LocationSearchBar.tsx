import React from 'react'
import { View, TextInput, TouchableOpacity } from 'react-native'
import { MaterialCommunityIcons, Entypo } from '@expo/vector-icons'

interface LocationSearchBarProps {
  value: string
  onChangeText: (text: string) => void
  placeholder: string
  onClear?: () => void
  onFocus?: () => void
  showBackButton?: boolean
  onBackPress?: () => void
}

export const LocationSearchBar: React.FC<LocationSearchBarProps> = ({
  value,
  onChangeText,
  placeholder,
  onClear,
  onFocus,
  showBackButton = false,
  onBackPress
}) => (
  <View className='flex-row items-center rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3'>
    {showBackButton && (
      <TouchableOpacity onPress={onBackPress} className='mr-2'>
        <Entypo name='chevron-left' size={24} color='#666' />
      </TouchableOpacity>
    )}
    <MaterialCommunityIcons name='magnify' size={20} color='#999' />
    <TextInput
      value={value}
      onChangeText={onChangeText}
      onFocus={onFocus}
      className='ml-3 flex-1 text-base text-gray-800'
      placeholder={placeholder}
      placeholderTextColor='#999'
    />
    {value.length > 0 && onClear && (
      <TouchableOpacity onPress={onClear}>
        <MaterialCommunityIcons name='close-circle' size={20} color='#999' />
      </TouchableOpacity>
    )}
  </View>
)