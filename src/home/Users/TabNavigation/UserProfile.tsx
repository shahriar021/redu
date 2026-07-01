import { Ionicons } from '@expo/vector-icons'
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native'
import * as ImagePicker from 'expo-image-picker'
import React, { useCallback, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../../Auth/AuthContext'
import { useUser } from '../../../Auth/UserContext'
import { AuthStackParamList } from '../../../Navigation/type'


const UserProfile = () => {
    const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
    const { user, isLoading, fetchUserProfile, updateProfile, deleteAccount, saveProfileImageLocally, getProfileImage } = useUser()
    const { signOut } = useAuth()
    const [profileImage, setProfileImage] = useState<string | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    // Load profile image from local storage on mount and when user changes
    useFocusEffect(
        useCallback(() => {
            loadProfileImage()
            fetchUserProfile()
        }, [])
    )

    const loadProfileImage = async () => {
        const storedImage = await getProfileImage()
        if (storedImage) {
            setProfileImage(storedImage)
        } else if (user?.profileImage) {
            setProfileImage(user.profileImage)
        }
    }

    const handleImagePick = async () => {
        try {
            // Request permissions
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to change your profile picture.')
                return
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
                base64: true
            })

            if (!result.canceled && result.assets[0]) {
                setIsUploading(true)

                const asset = result.assets[0]

                // Create form data for upload
                const formData = new FormData()

                // Get file extension
                const fileExtension = asset.uri.split('.').pop() || 'jpg'
                const fileName = `profile_${Date.now()}.${fileExtension}`

                // @ts-ignore - React Native FormData blob handling
                formData.append('avatar', {
                    uri: asset.uri,
                    type: `image/${fileExtension}`,
                    name: fileName
                })

                if (user?.name) formData.append('fullName', user.name)
                if (user?.phone) formData.append('mobileNumber', user.phone)

                const success = await updateProfile(formData)

                if (success) {
                    // Save image locally for offline access
                    await saveProfileImageLocally(asset.uri)
                    setProfileImage(asset.uri)
                    Alert.alert('Success', 'Profile picture updated successfully!')
                } else {
                    Alert.alert('Error', 'Failed to update profile picture')
                }
            }
        } catch (error) {
            console.error('Error picking image:', error)
            Alert.alert('Error', 'An error occurred while selecting the image')
        } finally {
            setIsUploading(false)
        }
    }

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await fetchUserProfile()
        await loadProfileImage()
        setIsRefreshing(false)
    }

    const handleEditProfile = () => {
        navigation.navigate("UserEditProfile")
    }

    const handleNotifications = () => {
        navigation.navigate("UserNotificationSettings")
    }

    const handleChangePassword = () => {
        navigation.navigate("UserPasswordChange")
    }

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteAccount()
                    }
                }
            ]
        )
    }

    const handlePrivacyPolicy = () => {
        navigation.navigate("UserPrivacyPolicy")
    }

    const handleTermsNCondition = () => {
        navigation.navigate("UserTermsNCondition")
    }

    const handleAboutUs = () => {
        navigation.navigate("UserAboutUs")
    }

    const handleHelpSupport = () => {
        navigation.navigate("UserHelpSupport")
    }

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut()
                        navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] })
                    }
                }
            ]
        )
    }

    if (isLoading && !user) {
        return (
            <SafeAreaView className='flex-1 bg-gray-50 justify-center items-center'>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text className='text-gray-600 mt-4'>Loading profile...</Text>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className='flex-1 bg-gray-50' edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        colors={['#4CAF50']}
                        tintColor="#4CAF50"
                    />
                }
            >
                {/* Header */}
                <View className='items-center p-4'>
                    <Text className='text-2xl font-bold text-gray-800'>My Profile</Text>
                </View>

                {/* Profile Image Section */}
                <View className='items-center mb-4'>
                    <TouchableOpacity
                        onPress={handleImagePick}
                        activeOpacity={0.9}
                        className='relative'
                        disabled={isUploading}
                    >
                        <View
                            className='w-32 h-32 rounded-full bg-white items-center justify-center mt-6'
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.1,
                                shadowRadius: 8,
                                elevation: 8,
                            }}
                        >
                            {isUploading ? (
                                <ActivityIndicator size="large" color="#4CAF50" />
                            ) : profileImage ? (
                                <Image
                                    source={{ uri: profileImage }}
                                    className='w-full h-full rounded-full'
                                />
                            ) : (
                                <Ionicons name="person" size={64} color="#D1D5DB" />
                            )}
                        </View>

                        {/* Edit Image Button */}
                        <View className='absolute bottom-4 right-0 p-2 rounded-full bg-green-500 items-center justify-center border-2 border-white'>
                            <Ionicons name="camera" size={16} color="white" />
                        </View>
                    </TouchableOpacity>

                    {/* User Name */}
                    <Text className='text-2xl font-bold text-gray-800 mt-4'>
                        {user?.name || 'N/A'}
                    </Text>

                    {/* User Email */}
                    <Text className='text-base text-gray-500 mt-1'>
                        {user?.email || 'N/A'}
                    </Text>

                    {/* User Phone */}
                    {user?.phone && (
                        <Text className='text-sm text-gray-400 mt-1'>
                            {user.phone}
                        </Text>
                    )}
                </View>

                {/* Personal Information Card */}
                <View className='mx-5 mb-4'>
                    <View className='bg-white rounded-3xl p-5 border border-gray-100'>
                        {/* Header with Edit Button */}
                        <View className='flex-row items-center justify-between mb-4'>
                            <Text className='text-lg font-bold text-gray-800'>
                                Personal Information
                            </Text>
                            <TouchableOpacity onPress={handleEditProfile} activeOpacity={0.7}>
                                <Ionicons name="create-outline" size={22} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        {/* Name */}
                        <View className='flex-row items-center mb-4'>
                            <Ionicons name="person-outline" size={22} color="#9CA3AF" />
                            <Text className='text-base text-gray-700 ml-4 flex-1'>
                                {user?.name || 'Not set'}
                            </Text>
                        </View>

                        {/* Email */}
                        <View className='flex-row items-center mb-4'>
                            <Ionicons name="mail-outline" size={22} color="#9CA3AF" />
                            <Text className='text-base text-gray-700 ml-4 flex-1'>
                                {user?.email || 'Not set'}
                            </Text>
                        </View>

                        {/* Phone */}
                        <View className='flex-row items-center mb-4'>
                            <Ionicons name="call-outline" size={22} color="#9CA3AF" />
                            <Text className='text-base text-gray-700 ml-4 flex-1'>
                                {user?.phone || 'Not set'}
                            </Text>
                        </View>

                        {/* Address */}
                        <View className='flex-row items-center'>
                            <Ionicons name="location-outline" size={22} color="#9CA3AF" />
                            <Text className='text-base text-gray-700 ml-4 flex-1'>
                                {user?.address || 'Not set'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Settings Card */}
                <View className='mx-5 mb-4'>
                    <View className='bg-white rounded-3xl p-5 border border-gray-100'>
                        <Text className='text-lg font-bold text-gray-800 mb-4'>
                            Settings
                        </Text>

                        {/* Notifications */}
                        <TouchableOpacity
                            onPress={handleNotifications}
                            className='flex-row items-center justify-between py-3'
                            activeOpacity={0.7}
                        >
                            <View className='flex-row items-center flex-1'>
                                <Ionicons name="notifications-outline" size={22} color="#9CA3AF" />
                                <Text className='text-base text-gray-700 ml-4'>
                                    Notifications
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>

                        <View className='h-px bg-gray-100 my-1' />

                        {/* Change Password */}
                        <TouchableOpacity
                            onPress={handleChangePassword}
                            className='flex-row items-center justify-between py-3'
                            activeOpacity={0.7}
                        >
                            <View className='flex-row items-center flex-1'>
                                <Ionicons name="lock-closed-outline" size={22} color="#9CA3AF" />
                                <Text className='text-base text-gray-700 ml-4'>
                                    Change Password
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>

                        <View className='h-px bg-gray-100 my-1' />

                        {/* Delete Account */}
                        <TouchableOpacity
                            onPress={handleDeleteAccount}
                            className='flex-row items-center justify-between py-3'
                            activeOpacity={0.7}
                        >
                            <View className='flex-row items-center flex-1'>
                                <Ionicons name="trash-outline" size={22} color="#EF4444" />
                                <Text className='text-base text-red-500 ml-4'>
                                    Delete Account
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>

                        <View className='h-px bg-gray-100 my-1' />

                        {/* Privacy Policy */}
                        <TouchableOpacity
                            onPress={handlePrivacyPolicy}
                            className='flex-row items-center justify-between py-3'
                            activeOpacity={0.7}
                        >
                            <View className='flex-row items-center flex-1'>
                                <Ionicons name="shield-checkmark-outline" size={22} color="#9CA3AF" />
                                <Text className='text-base text-gray-700 ml-4'>
                                    Privacy Policy
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>

                        <View className='h-px bg-gray-100 my-1' />

                        {/* Terms */}
                        <TouchableOpacity
                            onPress={handleTermsNCondition}
                            className='flex-row items-center justify-between py-3'
                            activeOpacity={0.7}
                        >
                            <View className='flex-row items-center flex-1'>
                                <Ionicons name="newspaper-outline" size={22} color="#9CA3AF" />
                                <Text className='text-base text-gray-700 ml-4'>
                                    Terms and Conditions
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>

                        <View className='h-px bg-gray-100 my-1' />

                        {/* about */}
                        <TouchableOpacity
                            onPress={handleAboutUs}
                            className='flex-row items-center justify-between py-3'
                            activeOpacity={0.7}
                        >
                            <View className='flex-row items-center flex-1'>
                                <Ionicons name="information-circle-outline" size={22} color="#9CA3AF" />
                                <Text className='text-base text-gray-700 ml-4'>
                                    About Us
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>

                        <View className='h-px bg-gray-100 my-1' />

                        {/* faq */}
                        <TouchableOpacity
                            onPress={handlePrivacyPolicy}
                            className='flex-row items-center justify-between py-3'
                            activeOpacity={0.7}
                        >
                            <View className='flex-row items-center flex-1'>
                                <Ionicons name="chatbubble-ellipses-outline" size={22} color="#9CA3AF" />
                                <Text className='text-base text-gray-700 ml-4'>
                                    FaQ
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>

                        <View className='h-px bg-gray-100 my-1' />

                        {/* Help & Support */}
                        <TouchableOpacity
                            onPress={handleHelpSupport}
                            className='flex-row items-center justify-between py-3'
                            activeOpacity={0.7}
                        >
                            <View className='flex-row items-center flex-1'>
                                <Ionicons name="help-circle-outline" size={22} color="#9CA3AF" />
                                <Text className='text-base text-gray-700 ml-4'>
                                    Help & Support
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Logout Button */}
                <View className='mx-5 mb-4'>
                    <TouchableOpacity
                        onPress={handleLogout}
                        className='bg-white rounded-2xl py-4 flex-row items-center justify-center border border-gray-100'
                        activeOpacity={0.7}
                    >
                        <Ionicons name="log-out-outline" size={24} color="#EF4444" />
                        <Text className='text-lg font-bold text-red-500 ml-2'>
                            Logout
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default UserProfile