import { Ionicons } from '@expo/vector-icons'
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import axios from 'axios'
import { IPA_BASE } from '@env'
import React, { useRef, useState } from 'react'
import {
    ActivityIndicator,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Toast, useToast } from '../Components/useToost'
import { AuthStackParamList } from '../Navigation/type'

const OtpVerification = () => {
    const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
    const route = useRoute<RouteProp<AuthStackParamList, 'OtpVerification'>>()
    const toast = useToast()

    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [resending, setResending] = useState(false)
    const inputRefs = useRef<(TextInput | null)[]>([])

    const email = route.params?.email ?? ''

    const handleOtpChange = (value: string, index: number) => {
        if (value && !/^\d+$/.test(value)) return

        const newOtp = [...otp]
        newOtp[index] = value
        setOtp(newOtp)

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }

        if (index === 5 && value) {
            const fullOtp = [...newOtp.slice(0, 5), value].join('')
            if (fullOtp.length === 6) {
                setTimeout(() => handleVerify(fullOtp), 300)
            }
        }
    }

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handleResend = async () => {
        if (!email) return
        setResending(true)
        try {
            await axios.post(
                `${IPA_BASE}/auth/forgot-password`,
                { email },
                { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
            )
            setOtp(['', '', '', '', '', ''])
            inputRefs.current[0]?.focus()
            toast.show({ message: 'A new OTP has been sent to your email.', type: 'success', style: 'top' })
        } catch (err: any) {
            toast.show({
                message: err?.response?.data?.message || 'Failed to resend OTP.',
                type: 'error',
                style: 'top',
            })
        } finally {
            setResending(false)
        }
    }

    const handleVerify = (otpOverride?: string) => {
        const otpCode = otpOverride ?? otp.join('')
        if (otpCode.length === 6) {
            navigation.navigate('CreateNewPassword', { email, otp: otpCode })
        } else {
            toast.show({ message: 'Please enter the complete 6-digit OTP.', type: 'warning', style: 'top' })
        }
    }

    return (
        <SafeAreaView className='flex-1 bg-white'>
            <View className='px-6 flex-1'>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className='mt-4 mb-8'
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={28} color="#1C1C1C" />
                </TouchableOpacity>

                <Text className='text-3xl font-bold text-gray-dark text-center mb-4'>
                    OTP Verification
                </Text>

                <Text className='text-base text-gray-medium text-center mb-8'>
                    We have sent a verification code to{'\n'}
                    <Text className='text-gray-dark font-semibold'>{email}</Text>
                </Text>

                <View className='flex-row justify-center gap-2 mb-6'>
                    {otp.map((digit, index) => (
                        <View
                            key={index}
                            className={`w-12 h-14 rounded-2xl border-2 items-center justify-center ${digit ? 'border-primary bg-white' : 'bg-white border-gray-200'}`}
                        >
                            <TextInput
                                ref={(ref) => { inputRefs.current[index] = ref }}
                                className='text-2xl font-bold text-primary text-center'
                                value={digit}
                                onChangeText={(value) => handleOtpChange(value, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                keyboardType='number-pad'
                                maxLength={1}
                                selectTextOnFocus
                                style={{ width: '100%', height: '100%', textAlign: 'center' }}
                            />
                        </View>
                    ))}
                </View>

                <View className='flex-row justify-center mb-8'>
                    <Text className='text-gray-medium text-sm'>Don't receive the OTP? </Text>
                    <TouchableOpacity onPress={handleResend} disabled={resending}>
                        {resending ? (
                            <ActivityIndicator size="small" color="#4CAF50" />
                        ) : (
                            <Text className='text-primary font-semibold text-sm'>Resend</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View className='flex-1' />

                <TouchableOpacity
                    onPress={() => handleVerify()}
                    className='bg-primary py-5 rounded-2xl mb-8'
                    activeOpacity={0.8}
                >
                    <Text className='text-white text-center text-lg font-bold'>VERIFY</Text>
                </TouchableOpacity>
            </View>

            <Toast
                style={toast.style}
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                fadeAnim={toast.fadeAnim}
                buttons={toast.buttons}
                onHide={toast.hide}
            />
        </SafeAreaView>
    )
}

export default OtpVerification
