import React from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity
} from 'react-native'
import { Ionicons, FontAwesome6 } from '@expo/vector-icons'
import { LocationCoords } from './types'

interface LocationModalProps {
  visible: boolean
  currentLocation: string
  locationCoords: LocationCoords | null
  onClose: () => void
  onRefresh: () => void
}

export const LocationModal: React.FC<LocationModalProps> = ({
  visible,
  currentLocation,
  locationCoords,
  onClose,
  onRefresh
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <View className='flex-1 bg-black/50 items-center justify-center p-6'>
      <View className='bg-white rounded-3xl p-6 w-full max-w-sm'>
        <View className='flex-row items-center justify-between mb-6'>
          <Text className='text-2xl font-bold text-gray-dark'>Current Location</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-circle" size={28} color="#999" />
          </TouchableOpacity>
        </View>

        <View className='w-20 h-20 rounded-full items-center justify-center bg-green-100 mb-4 self-center'>
          <FontAwesome6 name="location-dot" size={32} color="#4CAF50" />
        </View>

        <Text className='text-2xl font-bold text-gray-dark text-center mb-4'>
          {currentLocation}
        </Text>

        {locationCoords && (
          <View className='bg-gray-50 rounded-2xl p-4 mb-6'>
            <View className='flex-row justify-between mb-3'>
              <Text className='text-gray-medium font-semibold'>Latitude:</Text>
              <Text className='text-gray-dark font-bold'>
                {locationCoords.latitude.toFixed(6)}
              </Text>
            </View>
            <View className='flex-row justify-between'>
              <Text className='text-gray-medium font-semibold'>Longitude:</Text>
              <Text className='text-gray-dark font-bold'>
                {locationCoords.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={() => {
            onRefresh()
            setTimeout(onClose, 500)
          }}
          className='bg-primary py-4 rounded-2xl mb-3'
        >
          <Text className='text-white text-center font-bold text-lg'>
            Refresh Location
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose} className='bg-gray-200 py-3 rounded-2xl'>
          <Text className='text-gray-dark text-center font-semibold text-lg'>
            Close
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
)