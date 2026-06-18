import { IPA_BASE } from '@env'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NavigationProp, useNavigation, useRoute } from '@react-navigation/native'
import axios from 'axios'
import React, { useState } from 'react'
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Toast, useToast } from '../../../../Components/useToost'
import { AuthStackParamList } from '../../../../Navigation/type'

const STARS = [1, 2, 3, 4, 5]

const UserRateDriver = () => {
    const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
    const route = useRoute<any>()
    const toast = useToast()
    const jobId: string = route.params?.jobId ?? ''

    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.show({ message: 'Please select a star rating', type: 'warning', style: 'top' })
            return
        }
        try {
            setIsSubmitting(true)
            const token = await AsyncStorage.getItem('vToken')
            await axios.post(
                `${IPA_BASE}/jobs/${jobId}/review`,
                { rating, comment: comment.trim() || undefined },
                { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
            )
            toast.show({ message: 'Thank you for your review!', type: 'success', style: 'top' })
            setTimeout(() => navigation.navigate('UserMainTabs'), 1200)
        } catch (err: any) {
            toast.show({
                message: err?.response?.data?.message || 'Failed to submit review',
                type: 'error',
                style: 'top',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSkip = () => {
        navigation.navigate('UserMainTabs')
    }

    return (
        <SafeAreaView className='flex-1 bg-white'>
            <View className='flex-1 px-6 pt-4'>
                <View className='items-center mb-8'>
                    <View className='w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-4'>
                        <MaterialCommunityIcons name='truck-check' size={40} color='#10B981' />
                    </View>
                    <Text className='text-2xl font-bold text-gray-900 text-center'>Job Delivered!</Text>
                    <Text className='text-base text-gray-500 text-center mt-2'>
                        How was your experience?
                    </Text>
                </View>

                <View className='items-center mb-6'>
                    <Text className='text-lg font-semibold text-gray-700 mb-4'>Rate your driver</Text>
                    <View className='flex-row gap-3'>
                        {STARS.map((star) => (
                            <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
                                <Ionicons
                                    name={star <= rating ? 'star' : 'star-outline'}
                                    size={40}
                                    color={star <= rating ? '#F59E0B' : '#D1D5DB'}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                    {rating > 0 && (
                        <Text className='text-sm text-gray-500 mt-2'>
                            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                        </Text>
                    )}
                </View>

                <View className='bg-gray-50 rounded-2xl p-4 mb-6'>
                    <Text className='text-sm font-semibold text-gray-600 mb-2'>Leave a comment (optional)</Text>
                    <TextInput
                        className='text-base text-gray-900 min-h-[80px]'
                        placeholder='Tell us about your experience...'
                        placeholderTextColor='#9CA3AF'
                        value={comment}
                        onChangeText={setComment}
                        multiline
                        textAlignVertical='top'
                        maxLength={300}
                    />
                </View>

                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isSubmitting || rating === 0}
                    className={`py-5 rounded-2xl mb-3 ${rating === 0 || isSubmitting ? 'bg-gray-300' : 'bg-green-500'}`}
                    activeOpacity={0.8}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color='white' />
                    ) : (
                        <Text className='text-white text-center font-bold text-lg'>SUBMIT REVIEW</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSkip} className='py-3' activeOpacity={0.7}>
                    <Text className='text-gray-500 text-center text-base'>Skip</Text>
                </TouchableOpacity>
            </View>

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                fadeAnim={toast.fadeAnim}
                buttons={toast.buttons}
                style={toast.style}
                onHide={toast.hide}
            />
        </SafeAreaView>
    )
}

export default UserRateDriver
