import { IPA_BASE, RESEND_OTP } from '@env'
import { Ionicons } from '@expo/vector-icons'
import { NavigationProp, useNavigation, useRoute } from '@react-navigation/native'
import axios from 'axios'
import React, { useRef, useState } from 'react'
import {
    ActivityIndicator,
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import SuccessModal from '../Components/SuccessModal'
import { Toast, useToast } from '../Components/useToost'
import { AuthStackParamList } from '../Navigation/type'
import { Images } from '../constants'

const OtpAuth = () => {
    const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const inputRefs = useRef<Array<TextInput | null>>([])
    const [loading, setLoading] = useState(false)
    const [resending, setResending] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [verifiedRole, setVerifiedRole] = useState<string | null>(null)
    const [verifiedAccessToken, setVerifiedAccessToken] = useState<string | null>(null)
    const route = useRoute<any>()
    const toast = useToast()

    const email: string = route.params?.email ?? ''

    const handleDone = () => {
        setShowSuccessModal(false)
        if (verifiedRole === 'DRIVER') {
            ;(navigation as any).replace('ProfileSetup', { accessToken: verifiedAccessToken })
        } else {
            ;(navigation as any).replace('SignIn')
        }
    }

    const handleOtpChange = (value: string, index: number) => {
        if (value && !/^\d+$/.test(value)) return

        const newOtp = [...otp]
        newOtp[index] = value
        setOtp(newOtp)

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handleResend = async () => {
        if (resending) return
        setResending(true)
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        try {
            await axios.post(
                `${IPA_BASE}${RESEND_OTP}`,
                { email },
                { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
            )
            toast.show({ message: 'A new OTP has been sent to your email.', type: 'success', style: 'top' })
        } catch (e: any) {
            const msg = e?.response?.data?.message || 'Failed to resend OTP'
            toast.show({ message: msg, type: 'error', style: 'top' })
        } finally {
            setResending(false)
        }
    }

    const handleVerify = async () => {
        const otpCode = otp.join('')

        if (otpCode.length < 6) {
            toast.show({ message: 'Please enter the complete 6-digit OTP.', type: 'error', style: 'top' })
            return
        }

        try {
            setLoading(true)
            const res = await axios.post(
                `${IPA_BASE}/auth/verify-otp`,
                { email, code: otpCode },
                { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
            )

            const data = res?.data
            if (data?.success === true) {
                const role = data.data?.user?.role ?? 'CUSTOMER'
                setVerifiedRole(role)
                setVerifiedAccessToken(data.data?.accessToken ?? null)
                setShowSuccessModal(true)
            } else {
                toast.show({
                    message: data?.message || 'Verification failed',
                    type: 'error',
                    style: 'top',
                })
            }
        } catch (e: any) {
            const msg = e?.response?.data?.message || e?.message || 'Something went wrong'
            toast.show({ message: msg, type: 'error', style: 'top' })
        } finally {
            setLoading(false)
        }
    }

    const isComplete = otp.join('').length === 6

    return (
        <SafeAreaView className='flex-1 bg-gray-50'>
            <View className='px-6 flex-1'>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className={`absolute top-4 left-6 z-10 ${showSuccessModal ? 'opacity-0' : 'opacity-100'}`}
                >
                    <Ionicons name="arrow-back" size={28} color="black" />
                </TouchableOpacity>

                <Image
                    source={Images.Logo}
                    className='self-center mt-8 mb-8'
                    style={{ width: 180, height: 180 }}
                    resizeMode='contain'
                />

                <Text className='text-3xl font-bold text-gray-dark text-center mb-4'>
                    OTP Verification
                </Text>

                <Text className='text-lg text-gray-medium text-center mb-8'>
                    We have sent verification code on{'\n'}
                    <Text className='text-gray-dark'>{email}</Text>
                </Text>

                <View className='flex-row justify-center gap-2 mb-6'>
                    {otp.map((digit, index) => (
                        <View
                            key={index}
                            className={`w-12 h-14 rounded-2xl border-2 items-center justify-center ${
                                digit ? 'border-primary bg-white' : 'bg-white border-gray-200'
                            }`}
                        >
                            <TextInput
                                ref={(ref) => { inputRefs.current[index] = ref }}
                                className='text-2xl font-bold text-gray-dark text-center'
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
                    <Text className='text-gray-medium text-lg'>Don't receive the OTP?{' '}</Text>
                    <TouchableOpacity onPress={handleResend} disabled={resending}>
                        {resending ? (
                            <ActivityIndicator size='small' color='#EF4444' />
                        ) : (
                            <Text className='text-red-500 font-semibold text-lg'>Resend</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View className='flex-1' />

                <TouchableOpacity
                    onPress={handleVerify}
                    disabled={loading || !isComplete}
                    className={`py-5 rounded-2xl mb-8 ${loading || !isComplete ? 'bg-gray-300' : 'bg-primary'}`}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color='white' />
                    ) : (
                        <Text className='text-white text-center text-lg font-bold'>VERIFY</Text>
                    )}
                </TouchableOpacity>
            </View>

            <SuccessModal
                visible={showSuccessModal}
                title="Account Verified"
                subtitle="Successfully"
                onClose={handleDone}
            />

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

export default OtpAuth
