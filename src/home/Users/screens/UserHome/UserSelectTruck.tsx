import { Entypo, MaterialCommunityIcons } from '@expo/vector-icons'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { IPA_BASE } from '@env'
import { useBooking } from '../../../../Auth/BookingContext'
import { AuthStackParamList } from '../../../../Navigation/type'

interface ApiTruckType {
  id: string
  name: string
  description: string | null
  payloadCapacity: number | null
  axleCount: number | null
  baseFare: number
  distanceRatePerKm: number
  timeRatePerHour: number
  capacityMultiplier: number
  isActive: boolean
}

type IconConfig = {
  iconName: string
  iconBg: string
  iconColor: string
}

const CARD_WIDTH = 280

function getIconConfig(name: string): IconConfig {
  const lower = name.toLowerCase()
  if (lower.includes('pickup')) return { iconName: 'truck-pickup', iconBg: '#E3F2FD', iconColor: '#2196F3' }
  if (lower.includes('cargo') || lower.includes('van')) return { iconName: 'truck-delivery', iconBg: '#FFF3E0', iconColor: '#FF9800' }
  if (lower.includes('box')) return { iconName: 'truck', iconBg: '#F3E5F5', iconColor: '#9C27B0' }
  if (lower.includes('dump')) return { iconName: 'dump-truck', iconBg: '#FFEBEE', iconColor: '#FF5252' }
  if (lower.includes('flatbed')) return { iconName: 'truck-flatbed', iconBg: '#E0F7FA', iconColor: '#00BCD4' }
  if (lower.includes('refriger') || lower.includes('reefer')) return { iconName: 'truck-snowflake', iconBg: '#E8EAF6', iconColor: '#3F51B5' }
  if (lower.includes('container')) return { iconName: 'truck-cargo-container', iconBg: '#F3E5F5', iconColor: '#9C27B0' }
  return { iconName: 'truck', iconBg: '#E8F5E9', iconColor: '#4CAF50' }
}

function formatCapacity(payloadCapacity: number | null): string {
  if (!payloadCapacity) return 'Variable capacity'
  if (payloadCapacity >= 1000) return `~ ${(payloadCapacity / 1000).toFixed(1)} Ton`
  return `~ ${payloadCapacity} kg`
}

const UserSelectTruck = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
  const {
    pickupLocation,
    dropoffLocation,
    routeData,
    selectedTruck,
    setSelectedTruck,
    setEstimatedPrice,
    setDistance,
    setDuration
  } = useBooking()

  const [truckTypes, setTruckTypes] = useState<ApiTruckType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(selectedTruck?.id || null)

  useEffect(() => {
    loadTruckTypes()
  }, [])

  const loadTruckTypes = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const token = await AsyncStorage.getItem('vToken')
      const res = await axios.get(`${IPA_BASE}/fare/truck-types`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 10000
      })
      const data: ApiTruckType[] = res.data?.data ?? []
      setTruckTypes(data.filter(t => t.isActive))
    } catch {
      setError('Failed to load truck types. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateEstimatedPrice = (truck: ApiTruckType): number => {
    const distanceKm = routeData?.distance ?? 0
    const estimatedHours = routeData?.duration ? routeData.duration / 3600 : 1
    const total =
      truck.baseFare * truck.capacityMultiplier +
      distanceKm * truck.distanceRatePerKm +
      estimatedHours * truck.timeRatePerHour
    return Math.round(total * 100) / 100
  }

  const handleTruckSelect = (truck: ApiTruckType) => {
    setSelectedTruckId(truck.id)
    const { iconBg, iconColor } = getIconConfig(truck.name)

    setSelectedTruck({
      id: truck.id,
      name: truck.name,
      capacity: formatCapacity(truck.payloadCapacity),
      description: truck.description ?? '',
      iconBg,
      iconColor,
      hourlyRate: truck.timeRatePerHour,
      basePrice: truck.baseFare
    })

    const estimatedPrice = calculateEstimatedPrice(truck)
    setEstimatedPrice(estimatedPrice)
    if (routeData?.distance) setDistance(routeData.distance)
    if (routeData?.duration) setDuration(routeData.duration)
  }

  const handleConfirm = () => {
    if (!selectedTruckId) {
      Alert.alert('Select Truck', 'Please select a truck type to continue')
      return
    }
    if (!pickupLocation || !dropoffLocation) {
      Alert.alert('Missing Info', 'Please select pickup and dropoff locations')
      navigation.goBack()
      return
    }
    navigation.navigate('UserOrderDetails')
  }

  const renderTruck = ({ item: truck }: { item: ApiTruckType }) => {
    const isSelected = selectedTruckId === truck.id
    const { iconName, iconBg, iconColor } = getIconConfig(truck.name)

    return (
      <TouchableOpacity
        onPress={() => handleTruckSelect(truck)}
        activeOpacity={0.85}
        style={{ width: CARD_WIDTH }}
        className={`rounded-2xl p-4 ${isSelected
          ? 'border-2 border-green-500 bg-green-50'
          : 'border border-gray-200 bg-white'
        }`}
      >
        <View className='flex-row gap-3'>
          <View
            className="h-16 w-16 rounded-xl items-center justify-center mb-3"
            style={{ backgroundColor: iconBg }}
          >
            <MaterialCommunityIcons
              name={iconName as any}
              size={36}
              color={iconColor}
            />
          </View>

          <View className='flex-1'>
            <Text className="text-lg font-bold text-gray-800">{truck.name}</Text>
            <Text className="text-sm text-gray-500 mt-0.5">
              {formatCapacity(truck.payloadCapacity)}
            </Text>
            <Text className="text-xs text-gray-400 mt-1" numberOfLines={2}>
              {truck.description ?? ''}
            </Text>
            <Text className="text-sm font-semibold text-green-600 mt-1">
              From ${truck.baseFare}
            </Text>
          </View>
        </View>

        {isSelected && (
          <View className="absolute top-3 right-3 h-6 w-6 rounded-full bg-green-500 items-center justify-center">
            <MaterialCommunityIcons name="check" size={14} color="white" />
          </View>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Entypo name="chevron-left" size={28} color="#000" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800">SELECT TRUCK</Text>
          <View className="w-7" />
        </View>

        {/* Location Summary */}
        <View className="mx-5 my-6 rounded-2xl bg-white border border-gray-200 p-4">
          <Text className="text-sm font-bold text-gray-800">
            {pickupLocation?.address || 'Pickup not selected'}
          </Text>
          <Text className="text-sm text-gray-500 mt-2">
            {dropoffLocation?.address || 'Dropoff not selected'}
          </Text>
        </View>

        {/* Truck List */}
        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text className="text-gray-500 mt-3">Loading truck types...</Text>
          </View>
        ) : error ? (
          <View className="items-center py-16 px-6">
            <MaterialCommunityIcons name="truck-alert" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-3 text-center">{error}</Text>
            <TouchableOpacity
              onPress={loadTruckTypes}
              className="mt-4 bg-green-500 px-6 py-2 rounded-full"
            >
              <Text className="text-white font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : truckTypes.length === 0 ? (
          <View className="items-center py-16 px-6">
            <MaterialCommunityIcons name="truck-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-3 text-center">No truck types available at the moment.</Text>
          </View>
        ) : (
          <FlatList
            data={truckTypes}
            horizontal
            keyExtractor={(item) => item.id}
            renderItem={renderTruck}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 20, paddingRight: 20 }}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            snapToInterval={CARD_WIDTH + 12}
            decelerationRate="fast"
            scrollEnabled={true}
          />
        )}

        {/* Confirm */}
        <View className="px-5 py-6 mb-8">
          <TouchableOpacity
            onPress={handleConfirm}
            className={`rounded-2xl py-4 ${selectedTruckId ? 'bg-green-500' : 'bg-gray-300'}`}
            disabled={!selectedTruckId}
          >
            <Text className="text-center text-lg font-bold text-white">
              CONFIRM
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default UserSelectTruck
