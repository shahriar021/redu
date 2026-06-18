import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { Job } from './types'

interface RecentJobCardProps {
  job: Job
  onViewPress: () => void
}

export const RecentJobCard: React.FC<RecentJobCardProps> = ({ job, onViewPress }) => (
  <View
    className='bg-white rounded-3xl p-5 mb-4'
    style={{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    }}
  >
    <View className='flex-row justify-between mb-10'>
      <View>
        <Text className='text-xl font-bold text-gray-dark'>{job.name}</Text>
        <Text className='text-lg text-gray-medium'>{job.date || 'Date not available'}</Text>
      </View>
      <Text className='text-lg font-bold text-primary'>{job.price || 'Price not available'}</Text>
    </View>

    <TouchableOpacity onPress={onViewPress} className='bg-[#4CAF501A] py-4 rounded-xl'>
      <Text className='text-primary text-center font-bold text-xl'>View</Text>
    </TouchableOpacity>
  </View>
)
