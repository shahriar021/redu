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

// Change interface:
interface PrivacyPolicyData {
    id: string
    slug: string
    title: string
    content: string  // 👈 was "body"
    createdAt: string
    updatedAt: string
}

const UserPrivacyPolicy = () => {
    const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
    const [policyData, setPolicyData] = useState<PrivacyPolicyData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const handleBack = () => navigation.goBack()

    const fetchPrivacyPolicy = async () => {
        try {
            setIsLoading(true)
            setError(null)

            const token = await AsyncStorage.getItem('vToken')

            const response = await axios.get<{ data: PrivacyPolicyData }>(
                `${IPA_BASE}/cms/privacy-policy`,
                {
                    headers: { Authorization: token ? `Bearer ${token}` : '' },
                    timeout: 15000,
                }
            )
            console.log(response,'privacy ')
            setPolicyData(response.data.data)
        } catch (err) {
            setError('Failed to load privacy policy. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchPrivacyPolicy()
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
                    Privacy Policy
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
                        onPress={fetchPrivacyPolicy}
                        activeOpacity={0.7}
                        className='mt-6 bg-primary px-6 py-3 rounded-xl'
                    >
                        <Text className='text-white font-semibold'>Try Again</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Content */}
            {!isLoading && !error && policyData && (
                <ScrollView
                    className='flex-1 px-6'
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    <View className='mt-6 mb-8'>
                        <Text className='text-base text-gray-medium leading-6'>
                            {policyData.content}
                        </Text>
                    </View>

                    <View className='mb-4'>
                        <Text className='text-sm text-gray-400 text-center'>
                            Last updated: {formatDate(policyData.updatedAt)}
                        </Text>
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    )
}

export default UserPrivacyPolicy