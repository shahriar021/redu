import { IPA_BASE } from '@env'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native'
import axios from 'axios'
import * as ImagePicker from 'expo-image-picker'
import React, { useCallback, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthStackParamList } from '../../../../Navigation/type'

const DriverEditProfile = () => {
    const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [avatarUri, setAvatarUri] = useState<string | null>(null)
    const [newImageAsset, setNewImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null)
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)

    useFocusEffect(
        useCallback(() => {
            const load = async () => {
                try {
                    const token = await AsyncStorage.getItem('vToken')
                    const res = await axios.get(`${IPA_BASE}/driver/profile`, {
                        headers: { Authorization: `Bearer ${token}` },
                        timeout: 10000,
                    })
                    const data = res.data?.data
                    setFullName(data?.user?.fullName ?? '')
                    setEmail(data?.user?.email ?? '')
                    setPhone(data?.user?.mobileNumber ?? '')
                    setAvatarUri(data?.user?.avatar ?? null)
                } catch (err) {
                    console.error('DriverEditProfile load error:', err)
                } finally {
                    setFetching(false)
                }
            }
            load()
        }, [])
    )

    const handleImagePick = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (!permission.granted) {
            Alert.alert('Permission Required', 'Please allow access to your photos.')
            return
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        })
        if (!result.canceled) {
            setNewImageAsset(result.assets[0])
            setAvatarUri(result.assets[0].uri)
        }
    }

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert('Error', 'Please enter your full name')
            return
        }

        setLoading(true)
        try {
            const token = await AsyncStorage.getItem('vToken')
            const formData = new FormData()
            formData.append('fullName', fullName.trim())
            const cleanPhone = phone.trim().replace(/[\s\-\(\)\.]/g, '')
            if (cleanPhone) formData.append('mobileNumber', cleanPhone)
            if (newImageAsset) {
                const filename = newImageAsset.uri.split('/').pop() ?? 'avatar.jpg'
                const type = newImageAsset.mimeType ?? 'image/jpeg'
                formData.append('avatar', { uri: newImageAsset.uri, name: filename, type } as any)
            }

            await axios.patch(`${IPA_BASE}/user/profile`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 15000,
            })

            Alert.alert('Success', 'Profile updated successfully', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ])
        } catch (err: any) {
            const raw = err?.response?.data?.message
            const msg = Array.isArray(raw) ? raw.join('\n') : (raw ?? 'Failed to update profile')
            Alert.alert('Error', msg)
        } finally {
            setLoading(false)
        }
    }

    if (fetching) {
        return (
            <SafeAreaView className='flex-1 bg-gray-50 items-center justify-center' edges={['top']}>
                <ActivityIndicator color='#43B047' size='large' />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className='flex-1 bg-gray-50' edges={['top']}>
            <KeyboardAvoidingView
                className='flex-1'
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
            >
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps='handled'>
                {/* Header */}
                <View className='flex-row items-center px-6 py-4'>
                    <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
                        <Ionicons name='arrow-back' size={28} color='#1C1C1C' />
                    </TouchableOpacity>
                    <Text className='text-2xl font-bold text-gray-900 ml-4'>Edit Profile</Text>
                </View>

                {/* Avatar */}
                <View className='items-center my-8'>
                    <View
                        className='w-40 h-40 rounded-full bg-white items-center justify-center'
                        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 10 }}
                    >
                        {avatarUri ? (
                            <Image source={{ uri: avatarUri }} className='w-full h-full rounded-full' />
                        ) : (
                            <Ionicons name='person' size={80} color='#D1D5DB' />
                        )}
                    </View>
                    <TouchableOpacity
                        onPress={handleImagePick}
                        className='mt-3 flex-row items-center gap-1'
                        activeOpacity={0.7}
                    >
                        <Ionicons name='camera-outline' size={18} color='#43B047' />
                        <Text className='text-green-600 font-semibold text-sm ml-1'>Change Photo</Text>
                    </TouchableOpacity>
                </View>

                {/* Form */}
                <View className='px-6'>
                    {/* Full Name */}
                    <View className='mb-4'>
                        <Text className='text-sm font-semibold text-gray-700 mb-2'>Full Name</Text>
                        <View className='bg-white rounded-2xl px-5 py-4 flex-row items-center border border-gray-100' style={{ elevation: 2 }}>
                            <Ionicons name='person-outline' size={22} color='#9CA3AF' />
                            <TextInput
                                className='flex-1 ml-4 text-base text-gray-800'
                                placeholder='Enter your full name'
                                placeholderTextColor='#D1D5DB'
                                value={fullName}
                                onChangeText={setFullName}
                                autoCapitalize='words'
                                editable={!loading}
                            />
                        </View>
                    </View>

                    {/* Email (read-only) */}
                    <View className='mb-4'>
                        <Text className='text-sm font-semibold text-gray-700 mb-2'>Email Address</Text>
                        <View className='bg-gray-100 rounded-2xl px-5 py-4 flex-row items-center border border-gray-100' style={{ elevation: 1 }}>
                            <Ionicons name='mail-outline' size={22} color='#9CA3AF' />
                            <TextInput
                                className='flex-1 ml-4 text-base text-gray-400'
                                value={email}
                                editable={false}
                                keyboardType='email-address'
                                autoCapitalize='none'
                            />
                        </View>
                        <Text className='text-xs text-gray-400 mt-1 ml-1'>Email cannot be changed</Text>
                    </View>

                    {/* Phone */}
                    <View className='mb-8'>
                        <Text className='text-sm font-semibold text-gray-700 mb-2'>Phone Number</Text>
                        <View className='bg-white rounded-2xl px-5 py-4 flex-row items-center border border-gray-100' style={{ elevation: 2 }}>
                            <Ionicons name='call-outline' size={22} color='#9CA3AF' />
                            <TextInput
                                className='flex-1 ml-4 text-base text-gray-800'
                                placeholder='Enter your phone number'
                                placeholderTextColor='#D1D5DB'
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType='phone-pad'
                                editable={!loading}
                            />
                        </View>
                    </View>
                </View>

                <View className='h-32' />
            </ScrollView>

            {/* Save Button */}
            <View className='px-6 pb-8 pt-2 bg-gray-50'>
                <TouchableOpacity
                    onPress={handleSave}
                    className={`bg-green-500 py-5 rounded-2xl ${loading ? 'opacity-70' : ''}`}
                    activeOpacity={0.8}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color='white' />
                    ) : (
                        <Text className='text-white text-center text-lg font-bold'>SAVE CHANGES</Text>
                    )}
                </TouchableOpacity>
            </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

export default DriverEditProfile
