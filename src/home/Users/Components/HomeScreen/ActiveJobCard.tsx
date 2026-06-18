import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { MaterialCommunityIcons, Ionicons, MaterialIcons } from '@expo/vector-icons'
import { Job } from './types'

interface ActiveJobCardProps {
  job: Job | null
  onTrackPress: () => void
}

export const ActiveJobCard: React.FC<ActiveJobCardProps> = ({ job, onTrackPress }) => {
  if (!job) {
    return (
      <View className='bg-white rounded-3xl p-5 mb-6 items-center'>
        <Text className='text-gray-400 text-lg'>No active jobs</Text>
      </View>
    )
  }

  return (
    <View
      className='bg-white rounded-3xl p-5 mb-6'
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View className='flex-row items-center justify-between mb-4'>
        <View className='flex-row items-center gap-3 flex-1 mr-3'>
          <View className='w-16 h-16 rounded-full items-center justify-center bg-blue-50 shrink-0'>
            <MaterialCommunityIcons name="truck" size={24} color="#2196F3" />
          </View>
          <View className='flex-1'>
            <Text className='text-xl font-bold text-gray-dark' numberOfLines={1}>
              {job.name}
            </Text>
            <Text className='text-base text-gray-medium' numberOfLines={1}>
              ID: {job.jobId || job.id}
            </Text>
          </View>
        </View>
        <View className='bg-blue-50 px-3 py-2 rounded-full shrink-0'>
          <Text className='text-base font-semibold text-[#2196F3]' numberOfLines={1}>
            {job.statusText || 'On the way'}
          </Text>
        </View>
      </View>

      <View className='ml-2 mb-4' style={{ overflow: 'hidden' }}>
        <View className='flex-row items-start mb-1'>
          <View className='items-center mr-3 mt-1'>
            <View className='w-3 h-3 rounded-full bg-primary' />
            <View className='w-[2px] h-14 bg-gray-200 mt-1' />
          </View>
          <View className='flex-1 flex-row justify-between items-center'>
            <View className='flex-1'>
              <Text className='text-lg text-gray-medium mb-0.5'>PICKUP</Text>
              <Text className='text-lg font-semibold text-gray-dark'>
                {job.pickupAddress || 'Pickup address not available'}
              </Text>
            </View>
            <Ionicons name="location" size={20} color="#4CAF50" />
          </View>
        </View>
        <View className='flex-row items-start'>
          <View className='items-center mr-3 mt-1'>
            <View className='w-3 h-3 rounded-full bg-red-500' />
          </View>
          <View className='flex-1 flex-row justify-between items-center'>
            <View className='flex-1'>
              <Text className='text-lg text-gray-medium mb-0.5'>DROP-OFF</Text>
              <Text className='text-lg font-semibold text-gray-dark'>
                {job.dropoffAddress || 'Dropoff address not available'}
              </Text>
            </View>
            <Ionicons name="location" size={20} color="#4CAF50" />
          </View>
        </View>
      </View>

      <TouchableOpacity 
        onPress={onTrackPress} 
        className='bg-primary py-4 rounded-2xl flex-row items-center justify-center gap-2'
      >
        <MaterialIcons name="local-shipping" size={30} color="white" />
        <Text className='text-white font-bold text-xl'>
          TRACK JOB
        </Text>
      </TouchableOpacity>
    </View>
  )
}