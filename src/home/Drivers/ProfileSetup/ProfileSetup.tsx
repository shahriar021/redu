import { IPA_BASE } from '@env'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NavigationProp, useNavigation, useRoute } from '@react-navigation/native'
import axios from 'axios'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Toast, useToast } from '../../../Components/useToost'
import { AuthStackParamList } from '../../../Navigation/type'

type TruckType = { id: string; name: string; description: string | null }

const SelectModal = ({
  visible, title, options, selected, onSelect, onClose,
}: {
  visible: boolean; title: string; options: { label: string; value: string }[]
  selected?: string; onSelect: (v: string) => void; onClose: () => void
}) => (
  <Modal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
    <Pressable className='flex-1 bg-black/40 justify-end' onPress={onClose}>
      <Pressable className='bg-white rounded-t-3xl px-5 pt-4 pb-8' onPress={() => {}}>
        <View className='flex-row items-center justify-between mb-4'>
          <Text className='text-lg font-black text-gray-900'>{title}</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name='close' size={24} color='#111827' /></TouchableOpacity>
        </View>
        <ScrollView style={{ maxHeight: 380 }}>
          {options.map((opt) => {
            const active = selected === opt.value
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => { onSelect(opt.value); onClose() }}
                activeOpacity={0.85}
                className={`py-4 px-4 rounded-2xl mb-2 border ${active ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}
              >
                <Text className={`${active ? 'text-green-700 font-bold' : 'text-gray-900'}`}>{opt.label}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </Pressable>
    </Pressable>
  </Modal>
)

const ProfileSetup = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
  const toast = useToast()
  const route = useRoute<any>()
  const accessToken: string = route.params?.accessToken ?? ''

  const [truckTypes, setTruckTypes] = useState<TruckType[]>([])
  const [loadingTruckTypes, setLoadingTruckTypes] = useState(true)

  const [truckTypeId, setTruckTypeId] = useState('')
  const [numberPlate, setNumberPlate] = useState('')
  const [truckModel, setTruckModel] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [truckModal, setTruckModal] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchTruckTypes = async () => {
      try {
        const token = accessToken || await AsyncStorage.getItem('vToken')
        const res = await axios.get(`${IPA_BASE}/fare/truck-types`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        })
        setTruckTypes(res.data?.data ?? [])
      } catch (err) {
        console.error('Failed to fetch truck types:', err)
        toast.show({ message: 'Failed to load truck types', type: 'error', style: 'top' })
      } finally {
        setLoadingTruckTypes(false)
      }
    }
    fetchTruckTypes()
  }, [])

  const selectedTruck = truckTypes.find((t) => t.id === truckTypeId)

  const validate = () => {
    const next: Record<string, string> = {}
    if (!truckTypeId) next.truckType = 'Select a truck type.'
    if (!numberPlate.trim()) next.numberPlate = 'Enter number plate.'
    if (!truckModel.trim()) next.truckModel = 'Enter truck model.'
    const rate = Number(hourlyRate)
    if (!hourlyRate) next.hourlyRate = 'Enter hourly rate.'
    else if (!Number.isFinite(rate) || rate <= 0) next.hourlyRate = 'Enter a valid rate (e.g. 25.00).'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const canSubmit = useMemo(() => {
    if (!truckTypeId || !numberPlate.trim() || !truckModel.trim()) return false
    const rate = Number(hourlyRate)
    return Number.isFinite(rate) && rate > 0
  }, [truckTypeId, numberPlate, truckModel, hourlyRate])

  const handleNext = async () => {
    if (!validate()) return
    setIsSubmitting(true)
    try {
      const token = accessToken || await AsyncStorage.getItem('vToken')
      if (!token) {
        toast.show({ message: 'Authentication failed. Please log in again.', type: 'error', style: 'top' })
        return
      }

      const res = await axios.post(
        `${IPA_BASE}/driver/profile/complete`,
        { truckTypeId, numberPlate: numberPlate.trim().toUpperCase(), truckModel: truckModel.trim(), hourlyRate: Number(hourlyRate) },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
      )

      if (res.data?.success === true) {
        toast.show({ message: 'Profile saved! Now upload your documents.', type: 'success', style: 'top' })
        navigation.navigate('RequiredDocuments', { accessToken: token })
      } else {
        toast.show({ message: res.data?.message || 'Update failed', type: 'error', style: 'top' })
      }
    } catch (err: any) {
      toast.show({
        message: err?.response?.data?.message || err?.message || 'Something went wrong',
        type: 'error', style: 'top',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView className='flex-1 bg-gray-50'>
      <View className='flex-row items-center px-5 py-2 bg-gray-50'>
        <TouchableOpacity onPress={() => navigation.goBack()} className='mr-4'>
          <Ionicons name='arrow-back' size={28} color='#000' />
        </TouchableOpacity>
        <Text className='text-2xl font-black text-gray-900'>Profile Setup</Text>
      </View>

      <SelectModal
        visible={truckModal}
        title='Select Truck Type'
        options={truckTypes.map((t) => ({ label: t.name, value: t.id }))}
        selected={truckTypeId}
        onSelect={setTruckTypeId}
        onClose={() => setTruckModal(false)}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className='px-5 pt-5'>
          <Text className='text-2xl font-black text-gray-900 mb-2'>Truck Details</Text>
          <Text className='text-gray-500 text-base mb-6 leading-5'>
            Tell us about the vehicle you will be driving.
          </Text>

          {/* Truck Type */}
          {loadingTruckTypes ? (
            <View className='border border-gray-300 rounded-2xl px-4 py-4 mb-4 bg-white items-center'>
              <ActivityIndicator color='#4CAF50' />
            </View>
          ) : (
            <TouchableOpacity
              className='border border-gray-300 rounded-2xl px-4 py-4 mb-2 flex-row items-center justify-between bg-white'
              activeOpacity={0.7}
              onPress={() => setTruckModal(true)}
            >
              <View className='flex-row items-center'>
                <Ionicons name='car-outline' size={24} color='#9CA3AF' />
                <Text className={`${truckTypeId ? 'text-gray-900' : 'text-gray-400'} text-base ml-3`}>
                  {selectedTruck?.name ?? 'Select truck type..'}
                </Text>
              </View>
              <Ionicons name='chevron-down' size={20} color='#9CA3AF' />
            </TouchableOpacity>
          )}
          {!!errors.truckType && <Text className='text-red-500 mb-3'>{errors.truckType}</Text>}

          {/* Number Plate */}
          <View className='flex-row items-center border border-gray-300 rounded-2xl px-4 py-4 mb-2 bg-white'>
            <Ionicons name='card-outline' size={24} color='#9CA3AF' />
            <TextInput
              className='flex-1 ml-3 text-base text-gray-900'
              placeholder='Number plate (e.g. ABC-1234)'
              value={numberPlate}
              onChangeText={setNumberPlate}
              autoCapitalize='characters'
              placeholderTextColor='#9CA3AF'
            />
          </View>
          {!!errors.numberPlate && <Text className='text-red-500 mb-3'>{errors.numberPlate}</Text>}

          {/* Truck Model */}
          <View className='flex-row items-center border border-gray-300 rounded-2xl px-4 py-4 mb-2 bg-white'>
            <Ionicons name='construct-outline' size={24} color='#9CA3AF' />
            <TextInput
              className='flex-1 ml-3 text-base text-gray-900'
              placeholder='Truck model (e.g. Freightliner Cascadia)'
              value={truckModel}
              onChangeText={setTruckModel}
              placeholderTextColor='#9CA3AF'
            />
          </View>
          {!!errors.truckModel && <Text className='text-red-500 mb-3'>{errors.truckModel}</Text>}

          {/* Hourly Rate */}
          <Text className='text-lg font-bold text-gray-900 mb-3 mt-2'>Hourly Rate</Text>
          <View className='flex-row items-center border border-gray-300 rounded-2xl px-4 py-4 mb-2 bg-white'>
            <Text className='text-2xl text-gray-600 mr-3'>$</Text>
            <TextInput
              placeholder='0.00'
              value={hourlyRate}
              onChangeText={(t) => {
                const cleaned = t.replace(/[^0-9.]/g, '')
                const parts = cleaned.split('.')
                setHourlyRate(parts.length <= 2 ? cleaned : `${parts[0]}.${parts.slice(1).join('')}`)
              }}
              keyboardType='decimal-pad'
              className='flex-1 text-base text-gray-900'
              placeholderTextColor='#9CA3AF'
            />
            <Text className='text-gray-500 text-base'>/ hour</Text>
          </View>
          {!!errors.hourlyRate && <Text className='text-red-500 mb-3'>{errors.hourlyRate}</Text>}

          <TouchableOpacity
            className={`rounded-2xl py-5 items-center flex-row justify-center mt-4 ${canSubmit && !isSubmitting ? 'bg-green-500' : 'bg-gray-300'}`}
            activeOpacity={0.85}
            onPress={handleNext}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color='white' size='small' />
            ) : (
              <>
                <Text className='text-white font-bold text-lg mr-2'>NEXT STEP</Text>
                <Ionicons name='arrow-forward' size={20} color='white' />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Toast style={toast.style} visible={toast.visible} message={toast.message} type={toast.type} fadeAnim={toast.fadeAnim} buttons={toast.buttons} onHide={toast.hide} />
    </SafeAreaView>
  )
}

export default ProfileSetup
