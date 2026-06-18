import React from 'react'
import { View } from 'react-native'

export const LoadingSkeleton = () => (
  <View className='px-5'>
    {[1, 2, 3].map((item) => (
      <View key={item} className='bg-white rounded-3xl p-5 mb-4'>
        <View className='flex-row items-center justify-between mb-3'>
          <View className='w-14 h-14 rounded-full bg-gray-200' />
          <View className='w-16 h-8 bg-gray-200 rounded-full' />
        </View>
        <View className='h-6 bg-gray-200 rounded w-3/4 mb-2' />
        <View className='h-4 bg-gray-200 rounded w-1/2 mb-4' />
        <View className='h-12 bg-gray-200 rounded-2xl' />
      </View>
    ))}
  </View>
)