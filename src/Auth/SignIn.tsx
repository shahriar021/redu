import { IPA_BASE, LOGIN } from '@env'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import axios from 'axios'
import React, { useState } from 'react'
import { useAuth } from '../Auth/AuthContext'
import {
    Image,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'
import {
    getGoogleIdToken,
    googleSignInWithIdToken,
    getAppleCredential,
    appleSignInWithCredential,
    type SocialRole,
    type PendingCredential,
} from './socialAuth'
import RoleSelectionModal from '../Components/RoleSelectionModal'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppleButtonSvg from '../Components/Apple'
import GoogleButtonSvg from '../Components/Google'
import { Toast, useToast } from '../Components/useToost'
import { AuthStackParamList } from '../Navigation/type'
import { Images } from '../constants'

const API_BASE_URL = IPA_BASE
const END_POINTS = LOGIN

export type SafeUser = {
    _id: string
    fullName: string
    email: string
    phoneNumber: string
    role: string
    status: string
    isVerified: boolean
    imageUrl: string | null
    subscriptionStatus: string | null
}

const SignIn = () => {
    const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
    const { signIn } = useAuth()
    const toast = useToast()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [socialLoading, setSocialLoading] = useState(false)
    const [pendingProvider, setPendingProvider] = useState<'google' | 'apple' | null>(null)
    const pendingCredential = React.useRef<PendingCredential | null>(null)

    const handleSignIn = async () => {
        if (!email.trim() || !password) {
            toast.show({
                message: 'Please enter email and password',
                type: 'warning',
                style: 'top',
            })
            return
        }

        try {
            setLoading(true)

            const res = await axios.post(
                `${API_BASE_URL}${END_POINTS}`,
                {
                    email: email.trim().toLowerCase(),
                    password: password,
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 15000,
                }
            )

            const data = res.data

            if (data?.success === true) {
                const user = data.data.user

                const authUser = {
                    id: user.id ?? user._id,
                    email: user.email,
                    fullName: user.fullName,
                    phoneNumber: user.mobileNumber ?? user.phoneNumber ?? '',
                    role: (user.role === 'DRIVER' ? 'DRIVER' : 'USER') as 'USER' | 'DRIVER',
                    isVerified: user.isEmailVerified ?? user.isVerified ?? false,
                    profile: user.avatar ?? user.image?.url ?? undefined,
                }

                await AsyncStorage.setItem('vRefreshToken', data.data.refreshToken)
                await signIn(authUser, data.data.accessToken)

                toast.show({
                    message: 'Login successful! Welcome back.',
                    type: 'success',
                    style: 'top',
                })

                let dest: string = user.role === 'DRIVER' ? 'DriverMainTabs' : 'UserMainTabs'

                if (user.role === 'DRIVER') {
                    try {
                        const profileRes = await axios.get(
                            `${API_BASE_URL}/driver/profile`,
                            { headers: { Authorization: `Bearer ${data.data.accessToken}` }, timeout: 10000 }
                        )
                        const profile = profileRes.data?.data
                        if (!profile?.isProfileComplete) {
                            dest = 'ProfileSetup'
                        } else if (profile?.driverStatus !== 'APPROVED') {
                            dest = 'DriverPendingVerification'
                        }
                    } catch {
                        // network error — let them into DriverMainTabs; home screen guards will re-check
                    }
                }

                setTimeout(() => {
                    navigation.reset({ index: 0, routes: [{ name: dest as any }] })
                }, 800)
            } else {
                // ✅ Error Toast
                toast.show({
                    message: data?.message || 'Invalid credentials',
                    type: 'error',
                    style: 'top',
                })
            }
        } catch (e: any) {
            const msg = e?.response?.data?.message || e?.message || 'Something went wrong'
            // Handle specific backend messages
            if (msg === 'Profile setup not completed. Please complete your profile first!') {
                // ✅ Info Toast with button action
                toast.show({
                    message: 'Complete your profile to continue',
                    type: 'info',
                    style: 'center',
                    buttons: [
                        {
                            text: 'Setup Now',
                            action: 'custom',
                            onPress: () => {
                                navigation.navigate('ProfileSetup', {
                                    email: email.trim().toLowerCase(),
                                } as any)
                            }
                        },
                        {
                            text: 'Cancel',
                            action: 'dismiss'
                        }
                    ]
                })
                return
            }

            if (msg === 'Account not activated. Please verify OTP first!') {
                // ✅ Info Toast with button action
                toast.show({
                    message: 'Verify your email to activate account',
                    type: 'warning',
                    style: 'center',
                    buttons: [
                        {
                            text: 'Verify Now',
                            action: 'custom',
                            onPress: () => {
                                navigation.navigate('OtpAuth', {
                                    email: email.trim().toLowerCase(),
                                } as any)
                            }
                        },
                        {
                            text: 'Cancel',
                            action: 'dismiss'
                        }
                    ]
                })
                return
            }

            // ✅ Error Toast
            toast.show({
                message: msg,
                type: 'error',
                style: 'top',
            })
        } finally {
            setLoading(false)
        }
    }

    const navigateAfterSignIn = async (role: string, accessToken: string) => {
        let dest: string = role === 'DRIVER' ? 'DriverMainTabs' : 'UserMainTabs'
        if (role === 'DRIVER') {
            try {
                const profileRes = await axios.get(`${IPA_BASE}/driver/profile`, {
                    headers: { Authorization: `Bearer ${accessToken}` }, timeout: 10000,
                })
                const profile = profileRes.data?.data
                if (!profile?.isProfileComplete) dest = 'ProfileSetup'
                else if (profile?.driverStatus !== 'APPROVED') dest = 'DriverPendingVerification'
            } catch {}
        }
        setTimeout(() => navigation.reset({ index: 0, routes: [{ name: dest as any }] }), 300)
    }

    const handleForgotPassword = () => {
        (navigation as any).navigate('ForgotPassword')
    }

    const handleSignUp = () => {
        (navigation as any).replace('SignUp')
    }

    const handleSocialSignIn = async (provider: 'google' | 'apple') => {
        setSocialLoading(true)
        try {
            let result
            if (provider === 'google') {
                const idToken = await getGoogleIdToken()
                try {
                    // Try without role — works for existing users
                    result = await googleSignInWithIdToken(idToken)
                } catch (e: any) {
                    if (e?.response?.data?.message === 'role_required') {
                        // New user — store credential and show role modal
                        pendingCredential.current = { type: 'google', idToken }
                        setPendingProvider('google')
                        return
                    }
                    throw e
                }
            } else {
                const { identityToken, fullName } = await getAppleCredential()
                try {
                    result = await appleSignInWithCredential(identityToken, fullName)
                } catch (e: any) {
                    if (e?.response?.data?.message === 'role_required') {
                        pendingCredential.current = { type: 'apple', identityToken, fullName }
                        setPendingProvider('apple')
                        return
                    }
                    throw e
                }
            }
            await signIn(result.user as any, result.accessToken)
            navigateAfterSignIn(result.user.role, result.accessToken)
        } catch (e: any) {
            const code = e?.code ?? ''
            if (code !== 'SIGN_IN_CANCELLED' && code !== 'IN_PROGRESS' && code !== 'ERR_REQUEST_CANCELED') {
                toast.show({ message: e?.response?.data?.message ?? e?.message ?? 'Sign-in failed', type: 'error', style: 'top' })
            }
        } finally {
            setSocialLoading(false)
        }
    }

    // Called after user picks a role in the modal (only for new users)
    const handleRoleSelect = async (role: SocialRole) => {
        const cred = pendingCredential.current
        const provider = pendingProvider
        pendingCredential.current = null
        setPendingProvider(null)
        if (!cred) return
        setSocialLoading(true)
        try {
            let result
            if (provider === 'google' && cred.type === 'google') {
                result = await googleSignInWithIdToken(cred.idToken, role)
            } else if (provider === 'apple' && cred.type === 'apple') {
                result = await appleSignInWithCredential(cred.identityToken, cred.fullName, role)
            } else {
                return
            }
            await signIn(result.user as any, result.accessToken)
            navigateAfterSignIn(result.user.role, result.accessToken)
        } catch (e: any) {
            toast.show({ message: e?.response?.data?.message ?? e?.message ?? 'Sign-in failed', type: 'error', style: 'top' })
        } finally {
            setSocialLoading(false)
        }
    }

    return (
        <SafeAreaView className='flex-1 bg-gray-50'>
            <View className='px-6 flex-1'>
                <Image
                    source={Images.Logo}
                    className='self-center mt-8 mb-4'
                    style={{ width: 160, height: 160 }}
                    resizeMode='contain'
                />

                <Text className='text-3xl font-bold text-gray-dark mb-2'>
                    Welcome Back!
                </Text>
                <Text className='text-lg text-gray-medium mb-6'>
                    Hey! Good to see you again da
                </Text>

                {/* Email */}
                <View className='bg-white rounded-2xl px-4 py-2 flex-row items-center mb-4 border border-gray-200'>
                    <Ionicons name='mail-outline' size={24} color='#9CA3AF' />
                    <TextInput
                        className='flex-1 ml-3 text-lg text-gray-dark'
                        placeholder='Enter your email'
                        placeholderTextColor='#9CA3AF'
                        value={email}
                        onChangeText={setEmail}
                        keyboardType='email-address'
                        autoCapitalize='none'
                    />
                </View>

                {/* Password */}
                <View className='bg-white rounded-2xl px-4 py-2 flex-row items-center mb-2 border border-gray-200'>
                    <Ionicons name='lock-closed-outline' size={24} color='#9CA3AF' />
                    <TextInput
                        className='flex-1 ml-3 text-lg text-gray-dark'
                        placeholder='Enter your password'
                        placeholderTextColor='#9CA3AF'
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize='none'
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons
                            name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                            size={24}
                            color='#9CA3AF'
                        />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={handleForgotPassword} className='self-end mb-6'>
                    <Text className='text-red-500 text-lg'>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Sign In Button */}
                <TouchableOpacity
                    onPress={handleSignIn}
                    disabled={loading}
                    className={`py-5 rounded-2xl mb-4 ${loading ? 'bg-gray-300' : 'bg-primary'}`}
                    activeOpacity={0.8}
                >
                    <Text className='text-white text-center text-lg font-bold'>
                        {loading ? 'Signing in...' : 'SIGN IN'}
                    </Text>
                </TouchableOpacity>

                {/* Sign Up */}
                <View className='flex-row justify-center mb-6'>
                    <Text className='text-gray-medium text-lg'>Don't have an account? </Text>
                    <TouchableOpacity onPress={handleSignUp}>
                        <Text className='text-secondary font-semibold text-lg'>Sign Up</Text>
                    </TouchableOpacity>
                </View>

                {/* Divider */}
                <View className='flex-row items-center mb-6'>
                    <View className='flex-1 h-px bg-gray-300' />
                    <Text className='mx-4 text-gray-medium text-lg font-bold'>Or</Text>
                    <View className='flex-1 h-px bg-gray-300' />
                </View>

                <Text className='text-center text-gray-medium text-lg font-bold mb-4'>
                    Log in with
                </Text>

                {/* Social Buttons */}
                <View className='flex-row justify-center gap-4'>
                    <TouchableOpacity
                        onPress={() => handleSocialSignIn('google')}
                        disabled={socialLoading || loading}
                        className='bg-white border border-gray-200 rounded-2xl px-6 py-4 flex-row items-center justify-center flex-1'
                        activeOpacity={0.8}
                    >
                        <GoogleButtonSvg />
                    </TouchableOpacity>
                    {Platform.OS === 'ios' && (
                        <TouchableOpacity
                            onPress={() => handleSocialSignIn('apple')}
                            disabled={socialLoading || loading}
                            className='bg-white border border-gray-200 rounded-2xl px-6 py-4 flex-row items-center justify-center flex-1'
                            activeOpacity={0.8}
                        >
                            <AppleButtonSvg />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <RoleSelectionModal
                visible={pendingProvider !== null}
                onSelect={handleRoleSelect}
                onCancel={() => setPendingProvider(null)}
            />

            {/* ✅ Toast Component - Must be at the end */}
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

export default SignIn