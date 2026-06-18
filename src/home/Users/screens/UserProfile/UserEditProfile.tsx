// UserEditProfile.tsx
import { Ionicons } from '@expo/vector-icons'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import React, { useState } from 'react'
import {
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useUser } from '../../../../Auth/UserContext'
import { AuthStackParamList } from '../../../../Navigation/type'


const UserEditProfile = () => {
    const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
    const { user, updateProfile, isLoading } = useUser()
    
    const [name, setName] = useState(user?.name || '')
    const [email, setEmail] = useState(user?.email || '')
    const [phone, setPhone] = useState(user?.phone || '')
    const [address, setAddress] = useState(user?.address || '')

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter your name')
            return
        }
        
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email')
            return
        }

        const formData = new FormData()
        formData.append('fullName', name)
        if (phone) formData.append('mobileNumber', phone)

        const success = await updateProfile(formData)
        
        if (success) {
            Alert.alert('Success', 'Profile updated successfully!')
            navigation.goBack()
        } else {
            Alert.alert('Error', 'Failed to update profile')
        }
    }

    return (
        <SafeAreaView className='flex-1 bg-gray-50'>
            {/* Header */}
            <View className='flex-row items-center justify-between bg-white px-5 py-4 border-b border-gray-200'>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color="#000" />
                </TouchableOpacity>
                <Text className='text-xl font-bold text-gray-800'>Edit Profile</Text>
                <TouchableOpacity onPress={handleSave} disabled={isLoading}>
                    <Text className={`text-base font-semibold ${isLoading ? 'text-gray-400' : 'text-green-500'}`}>
                        {isLoading ? 'Saving...' : 'Save'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView className='flex-1 px-5 pt-6'>
                {/* Name Field */}
                <View className='mb-5'>
                    <Text className='text-sm font-semibold text-gray-700 mb-2'>Full Name</Text>
                    <View className='flex-row items-center rounded-xl border border-gray-200 bg-white px-4'>
                        <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                        <TextInput
                            className='flex-1 py-4 ml-3 text-base text-gray-800'
                            placeholder='Enter your full name'
                            value={name}
                            onChangeText={setName}
                            editable={!isLoading}
                        />
                    </View>
                </View>

                {/* Email Field */}
                <View className='mb-5'>
                    <Text className='text-sm font-semibold text-gray-700 mb-2'>Email Address</Text>
                    <View className='flex-row items-center rounded-xl border border-gray-200 bg-white px-4'>
                        <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                        <TextInput
                            readOnly
                            className='flex-1 py-4 ml-3 text-base text-gray-800'
                            placeholder='Enter your email'
                            value={email}
                            onChangeText={setEmail}
                            keyboardType='email-address'
                            autoCapitalize='none'
                            editable={!isLoading}
                        />
                    </View>
                </View>

                {/* Phone Field */}
                <View className='mb-5'>
                    <Text className='text-sm font-semibold text-gray-700 mb-2'>Phone Number</Text>
                    <View className='flex-row items-center rounded-xl border border-gray-200 bg-white px-4'>
                        <Ionicons name="call-outline" size={20} color="#9CA3AF" />
                        <TextInput
                            className='flex-1 py-4 ml-3 text-base text-gray-800'
                            placeholder='Enter your phone number'
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType='phone-pad'
                            editable={!isLoading}
                        />
                    </View>
                </View>

                {/* Address Field */}
                <View className='mb-5'>
                    <Text className='text-sm font-semibold text-gray-700 mb-2'>Address</Text>
                    <View className='flex-row items-center rounded-xl border border-gray-200 bg-white px-4'>
                        <Ionicons name="location-outline" size={20} color="#9CA3AF" />
                        <TextInput
                            className='flex-1 py-4 ml-3 text-base text-gray-800'
                            placeholder='Enter your address'
                            value={address}
                            onChangeText={setAddress}
                            multiline
                            numberOfLines={2}
                            textAlignVertical='top'
                            editable={!isLoading}
                        />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default UserEditProfile