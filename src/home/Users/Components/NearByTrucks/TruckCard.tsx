import React from 'react'
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native'
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'
import { Truck } from '../../../../Utils/hooks/useNearbyTrucks'

interface TruckCardProps {
  truck: Truck
  onBookPress: (truck: Truck) => void
}

export const TruckCard: React.FC<TruckCardProps> = ({ truck, onBookPress }) => (
  <View
    className='bg-white rounded-3xl p-5 min-w-96 mb-4'
    style={{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
      marginRight: 16,
      borderWidth: truck.isBooked ? 1.5 : 0,
      borderColor: truck.isBooked ? '#4CAF50' : 'transparent',
    }}
  >
    <View className='flex-row items-center justify-between mb-3'>
      <View
        className='w-14 h-14 rounded-full items-center justify-center'
        style={{ backgroundColor: truck.iconBg }}
      >
        <MaterialCommunityIcons
          name={truck.icon as any}
          size={26}
          color={truck.iconColor}
        />
      </View>
      <View className='bg-[#4CAF501A] px-4 py-1.5 rounded-full'>
        <Text className='text-base font-semibold text-primary'>
          {truck.distance}
        </Text>
      </View>
    </View>

    <View className='flex-row justify-between items-center mb-1'>
      <Text className='text-lg font-bold text-gray-dark'>
        {truck.name}
      </Text>
      <Text className='text-base text-gray-400'>
        {truck.capacity}
      </Text>
    </View>

    {truck.rating && (
      <View className='flex-row items-center mb-2'>
        <Ionicons name="star" size={16} color="#FFD700" />
        <Text className='text-sm text-gray-600 ml-1'>
          {truck.rating.toFixed(1)} ★
        </Text>
      </View>
    )}

    <Text className='text-base text-gray-medium mb-5'>
      {truck.description}
    </Text>

    <TouchableOpacity
      onPress={() => onBookPress(truck)}
      activeOpacity={0.85}
      style={styles.btn}
    >
      <Ionicons name="rocket-outline" size={16} color="#fff" />
      <Text style={styles.btnText}>Book Now</Text>
      <Ionicons name="arrow-forward" size={16} color="#fff" />
    </TouchableOpacity>
  </View>
)

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  btnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.2,
  },
})