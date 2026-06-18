import { Ionicons } from '@expo/vector-icons'
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native'
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
import SuccessModal from '../Components/SuccessModal'

const CreateNewPassword = () => {
    const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
    const route = useRoute<RouteProp<AuthStackParamList, 'CreateNewPassword'>>()

    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)

    const email = route.params?.email ?? ''
    const otp = route.params?.otp ?? ''

    const handleSubmit = async () => {
        setError('')

        if (!newPassword || !confirmPassword) {
            setError('Please fill in all fields')
            return
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)
        try {
            await axios.post(
                `${IPA_BASE}/auth/reset-password`,
                { email, code: otp, newPassword },
                { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
            )
            setShowSuccessModal(true)
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to reset password. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleDone = () => {
        setShowSuccessModal(false)
        navigation.navigate('SignIn')
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
                <Text className='text-3xl font-bold text-gray-dark mb-4'>
                    Create New Password
                </Text>

                {/* Subtitle */}
                <Text className='text-base text-gray-medium mb-8'>
                    Enter your new password
                </Text>

                {/* New Password Input */}
                <View className='bg-white rounded-2xl px-4 py-2 flex-row items-center mb-4 border border-gray-200'>
                    <Ionicons name="lock-closed-outline" size={24} color="#9CA3AF" />
                    <TextInput
                        className='flex-1 ml-3 text-base text-gray-dark'
                        placeholder='Enter new password'
                        placeholderTextColor='#9CA3AF'
                        value={newPassword}
                        onChangeText={(text) => { setNewPassword(text); setError('') }}
                        secureTextEntry={!showNewPassword}
                        autoCapitalize='none'
                        editable={!loading}
                    />
                    <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                        <Ionicons
                            name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                            size={24}
                            color="#9CA3AF"
                        />
                    </TouchableOpacity>
                </View>

                {/* Confirm Password Input */}
                <View className='bg-white rounded-2xl px-4 py-2 flex-row items-center mb-2 border border-gray-200'>
                    <Ionicons name="lock-closed-outline" size={24} color="#9CA3AF" />
                    <TextInput
                        className='flex-1 ml-3 text-base text-gray-dark'
                        placeholder='Confirm new password'
                        placeholderTextColor='#9CA3AF'
                        value={confirmPassword}
                        onChangeText={(text) => { setConfirmPassword(text); setError('') }}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize='none'
                        editable={!loading}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                        <Ionicons
                            name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                            size={24}
                            color="#9CA3AF"
                        />
                    </TouchableOpacity>
                </View>

                {error ? (
                    <Text className='text-red-500 text-sm mb-6 ml-1'>{error}</Text>
                ) : (
                    <View className='mb-8' />
                )}

                {/* Submit Button */}
                <TouchableOpacity
                    onPress={handleSubmit}
                    className={`bg-primary py-5 rounded-2xl ${loading ? 'opacity-70' : ''}`}
                    activeOpacity={0.8}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className='text-white text-center text-lg font-bold'>SUBMIT</Text>
                    )}
                </TouchableOpacity>
            </View>

            <SuccessModal
                visible={showSuccessModal}
                onClose={handleDone}
                title="Success!"
                subtitle="Your password has been reset successfully"
            />
        </SafeAreaView>
    )
}

export default CreateNewPassword
