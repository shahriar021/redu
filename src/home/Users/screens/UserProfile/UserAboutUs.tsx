import { Ionicons } from '@expo/vector-icons'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthStackParamList } from '../../../../Navigation/type'
import { IPA_BASE } from '@env'

interface AboutUsData {
    id: string
    slug: string
    title: string
    content: string
    createdAt: string
    updatedAt: string
}

const UserAboutUs = () => {
    const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
    const [aboutData, setAboutData] = useState<AboutUsData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const handleBack = () => navigation.goBack()

    const fetchAboutUs = async () => {
        try {
            setIsLoading(true)
            setError(null)

            const token = await AsyncStorage.getItem('vToken')

            const response = await axios.get<{ data: AboutUsData }>(
                `${IPA_BASE}/cms/about-us`,
                {
                    headers: { Authorization: token ? `Bearer ${token}` : '' },
                    timeout: 15000,
                }
            )
            console.log(response, 'about-us ')
            setAboutData(response.data.data)
        } catch (err) {
            setError('Failed to load About Us. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchAboutUs()
    }, [])

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    return (
        <SafeAreaView className='flex-1 bg-gray-50' edges={['top']}>
            {/* Header */}
            <View className='flex-row items-center px-6 py-4 bg-gray-50'>
                <TouchableOpacity onPress={handleBack} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={28} color="#1C1C1C" />
                </TouchableOpacity>
                <Text className='text-2xl font-bold text-gray-dark ml-4'>
                    About Us
                </Text>
            </View>

            {/* Loading */}
            {isLoading && (
                <View className='flex-1 items-center justify-center'>
                    <ActivityIndicator size="large" />
                    <Text className='text-gray-medium mt-3'>Loading...</Text>
                </View>
            )}

            {/* Error */}
            {!isLoading && error && (
                <View className='flex-1 items-center justify-center px-6'>
                    <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                    <Text className='text-base text-gray-medium text-center mt-4'>{error}</Text>
                    <TouchableOpacity
                        onPress={fetchAboutUs}
                        activeOpacity={0.7}
                        className='mt-6 bg-primary px-6 py-3 rounded-xl'
                    >
                        <Text className='text-white font-semibold'>Try Again</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Content */}
            {!isLoading && !error && aboutData && (
                <ScrollView
                    className='flex-1 px-6'
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    <View className='mt-6 mb-8'>
                        <Text className='text-base text-gray-medium leading-6'>
                            {aboutData.content}
                        </Text>
                    </View>

                    <View className='mb-4'>
                        <Text className='text-sm text-gray-400 text-center'>
                            Last updated: {formatDate(aboutData.updatedAt)}
                        </Text>
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    )
}

export default UserAboutUs