import React from 'react'
import { View, Text } from 'react-native'

export const SmallTruckCardSkeleton = () => (
  <View className='bg-white m-2 overflow-hidden rounded-2xl p-4' style={{ width: 280 }}>
    <View className='flex-row items-center justify-between mb-2'>
      <View className='w-16 h-16 rounded-full bg-gray-200' />
      <View className='w-20 h-8 bg-gray-200 rounded-full' />
    </View>
    <View className='h-6 bg-gray-200 rounded w-3/4 mb-2' />
    <View className='h-4 bg-gray-200 rounded w-1/2 mb-6' />
    <View className='h-12 bg-gray-200 rounded-xl' />
  </View>
)

export const TruckCardSkeleton = () => (
  <View className='bg-white rounded-3xl p-5 mb-4'>
    <View className='flex-row items-start justify-between mb-3'>
      <View className='w-16 h-16 rounded-2xl bg-gray-200' />
      <View className='flex-row gap-3'>
        <View className='w-16 h-8 bg-gray-200 rounded-full' />
        <View className='w-16 h-8 bg-gray-200 rounded-full' />
      </View>
    </View>
    <View className='h-6 bg-gray-200 rounded w-3/4 mb-2' />
    <View className='h-4 bg-gray-200 rounded w-1/2 mb-8' />
    <View className='h-12 bg-gray-200 rounded-2xl' />
  </View>
)

export const ActiveJobSkeleton = () => (
  <View className='bg-white rounded-3xl p-5 mb-6'>
    <View className='flex-row items-center justify-between mb-4'>
      <View className='flex-row gap-3'>
        <View className='w-16 h-16 rounded-full bg-gray-200' />
        <View>
          <View className='h-6 bg-gray-200 rounded w-32 mb-2' />
          <View className='h-4 bg-gray-200 rounded w-24' />
        </View>
      </View>
      <View className='w-24 h-8 bg-gray-200 rounded-full' />
    </View>
    <View className='ml-2 mb-4'>
      <View className='h-20 bg-gray-200 rounded-lg' />
    </View>
    <View className='h-12 bg-gray-200 rounded-2xl' />
  </View>
)

export const RecentJobSkeleton = () => (
  <View className='bg-white rounded-3xl p-5 mb-4'>
    <View className='flex-row justify-between mb-10'>
      <View>
        <View className='h-6 bg-gray-200 rounded w-32 mb-2' />
        <View className='h-4 bg-gray-200 rounded w-24' />
      </View>
      <View className='h-6 bg-gray-200 rounded w-20' />
    </View>
    <View className='flex-row gap-3'>
      <View className='flex-1 h-12 bg-gray-200 rounded-xl' />
      <View className='flex-1 h-12 bg-gray-200 rounded-xl' />
    </View>
  </View>
)

export const EmptyState = ({ message }: { message: string }) => (
  <View className='items-center justify-center py-10'>
    <Text className='text-gray-400 text-lg'>{message}</Text>
  </View>
)