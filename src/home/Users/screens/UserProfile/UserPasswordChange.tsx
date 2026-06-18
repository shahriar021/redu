import { Ionicons } from '@expo/vector-icons'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import React, { useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useUser } from '../../../../Auth/UserContext'
import { AuthStackParamList } from '../../../../Navigation/type'

const UserPasswordChange = () => {
    const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
    const { changePassword } = useUser()
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showOldPassword, setShowOldPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSaveChanges = async () => {
        if (!oldPassword.trim()) {
            Alert.alert('Error', 'Please enter your current password')
            return
        }
        if (!newPassword.trim()) {
            Alert.alert('Error', 'Please enter your new password')
            return
        }
        if (newPassword.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters')
            return
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match')
            return
        }
        if (oldPassword === newPassword) {
            Alert.alert('Error', 'New password must be different from current password')
            return
        }

        setLoading(true)
        try {
            const success = await changePassword(oldPassword, newPassword)
            if (success) {
                Alert.alert('Success', 'Password changed successfully', [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ])
            } else {
                Alert.alert('Error', 'Failed to change password. Please check your current password.')
            }
        } catch {
            Alert.alert('Error', 'Failed to change password. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <SafeAreaView className='flex-1 bg-gray-50' edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className='flex-row items-center px-6 py-4'>
                    <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
                        <Ionicons name="arrow-back" size={28} color="#1C1C1C" />
                    </TouchableOpacity>
                    <Text className='text-2xl font-bold text-gray-dark ml-4'>
                        Change Password
                    </Text>
                </View>

                {/* Form */}
                <View className='px-6 mt-6'>
                    {/* Old Password */}
                    <View
                        className='bg-white rounded-2xl px-5 py-2 flex-row items-center mb-4'
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 4,
                            elevation: 2,
                        }}
                    >
                        <Ionicons name="lock-closed-outline" size={24} color="#9CA3AF" />
                        <TextInput
                            className='flex-1 ml-4 text-base text-gray-dark'
                            placeholder='Enter old password'
                            placeholderTextColor='#D1D5DB'
                            value={oldPassword}
                            onChangeText={setOldPassword}
                            secureTextEntry={!showOldPassword}
                            autoCapitalize='none'
                        />
                        <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)}>
                            <Ionicons
                                name={showOldPassword ? 'eye-outline' : 'eye-off-outline'}
                                size={24}
                                color="#9CA3AF"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* New Password */}
                    <View
                        className='bg-white rounded-2xl px-5 py-2 flex-row items-center mb-4'
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 4,
                            elevation: 2,
                        }}
                    >
                        <Ionicons name="lock-closed-outline" size={24} color="#9CA3AF" />
                        <TextInput
                            className='flex-1 ml-4 text-base text-gray-dark'
                            placeholder='Enter new password'
                            placeholderTextColor='#D1D5DB'
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry={!showNewPassword}
                            autoCapitalize='none'
                        />
                        <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                            <Ionicons
                                name={showNewPassword ? 'eye-outline' : 'eye-off-outline'}
                                size={24}
                                color="#9CA3AF"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Confirm Password */}
                    <View
                        className='bg-white rounded-2xl px-5 py-2 flex-row items-center mb-6'
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 4,
                            elevation: 2,
                        }}
                    >
                        <Ionicons name="lock-closed-outline" size={24} color="#9CA3AF" />
                        <TextInput
                            className='flex-1 ml-4 text-base text-gray-dark'
                            placeholder='Enter confirm password'
                            placeholderTextColor='#D1D5DB'
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                            autoCapitalize='none'
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                            <Ionicons
                                name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                                size={24}
                                color="#9CA3AF"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Password Requirements */}
                    <View className='bg-blue-50 rounded-2xl p-4 mb-6'>
                        <Text className='text-sm text-blue-800 font-semibold mb-2'>
                            Password Requirements:
                        </Text>
                        <Text className='text-sm text-blue-700'>
                            • At least 8 characters long
                        </Text>
                        <Text className='text-sm text-blue-700'>
                            • Must contain uppercase, lowercase, and a number
                        </Text>
                        <Text className='text-sm text-blue-700'>
                            • Different from old password
                        </Text>
                    </View>
                </View>

                {/* Spacer */}
                <View className='h-32' />
            </ScrollView>

            {/* Save Changes Button - Fixed at bottom */}
            <View className='absolute bottom-0 left-0 right-0 px-6 pb-8 bg-gray-50'>
                <TouchableOpacity
                    onPress={handleSaveChanges}
                    className={`bg-primary py-5 rounded-2xl ${loading ? 'opacity-70' : ''}`}
                    activeOpacity={0.8}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className='text-white text-center text-lg font-bold'>
                            SAVE CHANGES
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

export default UserPasswordChange