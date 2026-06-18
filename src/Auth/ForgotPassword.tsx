import { Ionicons } from '@expo/vector-icons'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import axios from 'axios'
import { IPA_BASE } from '@env'
import React, { useState } from 'react'
import {
    ActivityIndicator,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthStackParamList } from '../Navigation/type'

const ForgotPassword = () => {
    const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

    const handleSendOtp = async () => {
        setError('')

        if (!email.trim()) {
            setError('Please enter your email')
            return
        }
        if (!validateEmail(email.trim())) {
            setError('Please enter a valid email address')
            return
        }

        setLoading(true)
        try {
            await axios.post(
                `${IPA_BASE}/auth/forgot-password`,
                { email: email.trim().toLowerCase() },
                { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
            )
            navigation.navigate('OtpVerification', { email: email.trim().toLowerCase() })
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to send OTP. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <SafeAreaView className='flex-1 bg-white'>
            <View className='px-6 flex-1'>
                {/* Back Button */}
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className='mt-4 mb-8'
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={28} color="#1C1C1C" />
                </TouchableOpacity>

                {/* Title */}
                <Text className='text-4xl font-bold text-gray-dark mb-4'>
                    Forgot Password
                </Text>

                {/* Subtitle */}
                <Text className='text-base text-gray-medium mb-8'>
                    Recover your account password
                </Text>

                {/* Email Input */}
                <View
                    className={`bg-white rounded-2xl px-4 py-2 flex-row items-center mb-2 border ${error ? 'border-red-500' : 'border-gray-200'}`}
                >
                    <Ionicons name="mail-outline" size={24} color="#9CA3AF" />
                    <TextInput
                        className='flex-1 ml-3 text-base text-gray-dark'
                        placeholder='Enter your email'
                        placeholderTextColor='#9CA3AF'
                        value={email}
                        onChangeText={(text) => { setEmail(text); setError('') }}
                        keyboardType='email-address'
                        autoCapitalize='none'
                        editable={!loading}
                    />
                </View>

                {error ? (
                    <Text className='text-red-500 text-sm mb-6 ml-1'>{error}</Text>
                ) : (
                    <View className='mb-8' />
                )}

                {/* Send OTP Button */}
                <TouchableOpacity
                    onPress={handleSendOtp}
                    className={`bg-primary py-5 rounded-2xl ${loading ? 'opacity-70' : ''}`}
                    activeOpacity={0.8}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className='text-white text-center text-lg font-bold'>SEND OTP</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

export default ForgotPassword
