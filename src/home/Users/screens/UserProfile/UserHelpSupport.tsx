import { Ionicons } from '@expo/vector-icons'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Linking,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthStackParamList } from '../../../../Navigation/type'
import { IPA_BASE } from '@env'

interface FAQ {
    id: string
    question: string
    answer: string
}

const UserHelpSupport = () => {
    const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
    const [faqs, setFaqs] = useState<FAQ[]>([])
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const handleBack = () => navigation.goBack()

    const fetchFAQs = async () => {
        try {
            setIsLoading(true)
            setError(null)

            const token = await AsyncStorage.getItem('vToken')

            const response = await axios.get<{ data: FAQ[] }>(
                `${IPA_BASE}/faq`,
                {
                    headers: { Authorization: token ? `Bearer ${token}` : '' },
                    timeout: 15000,
                }
            )
            console.log(response, 'faqs')
            setFaqs(response.data.data)
        } catch (err) {
            setError('Failed to load FAQs. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchFAQs()
    }, [])

    const toggleFAQ = (index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index)
    }

    const handleEmailSupport = () => {
        Linking.openURL('mailto:support@jobsitex.com?subject=Support Request')
    }

    return (
        <SafeAreaView className='flex-1 bg-gray-50' edges={['top']}>
            {/* Header */}
            <View className='flex-row items-center px-6 py-4 bg-gray-50'>
                <TouchableOpacity onPress={handleBack} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={28} color="#1C1C1C" />
                </TouchableOpacity>
                <Text className='text-2xl font-bold text-gray-dark ml-4'>
                    Help & Support
                </Text>
            </View>

            <ScrollView
                className='flex-1'
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* FAQ Section */}
                <View className='px-6 mt-6'>
                    <Text className='text-2xl font-bold text-gray-dark mb-6'>
                        Frequently Asked Questions
                    </Text>

                    {/* Loading */}
                    {isLoading && (
                        <View className='items-center justify-center py-10'>
                            <ActivityIndicator size="large" />
                            <Text className='text-gray-medium mt-3'>Loading...</Text>
                        </View>
                    )}

                    {/* Error */}
                    {!isLoading && error && (
                        <View className='items-center justify-center py-10'>
                            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                            <Text className='text-base text-gray-medium text-center mt-4'>{error}</Text>
                            <TouchableOpacity
                                onPress={fetchFAQs}
                                activeOpacity={0.7}
                                className='mt-6 bg-primary px-6 py-3 rounded-xl'
                            >
                                <Text className='text-white font-semibold'>Try Again</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Empty */}
                    {!isLoading && !error && faqs.length === 0 && (
                        <View className='items-center justify-center py-10'>
                            <Ionicons name="help-circle-outline" size={48} color="#9CA3AF" />
                            <Text className='text-base text-gray-medium text-center mt-4'>
                                No FAQs available at the moment.
                            </Text>
                        </View>
                    )}

                    {/* FAQ Items */}
                    {!isLoading && !error && faqs.map((faq, index) => (
                        <View key={faq.id} className='mb-3'>
                            <TouchableOpacity
                                onPress={() => toggleFAQ(index)}
                                className='bg-white rounded-2xl py-5 px-5 flex-row items-center justify-between'
                                activeOpacity={0.7}
                                style={{
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 4,
                                    elevation: 2,
                                }}
                            >
                                <Text className='text-base font-medium text-gray-dark flex-1 mr-4'>
                                    {faq.question}
                                </Text>
                                <Ionicons
                                    name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                                    size={24}
                                    color="#9CA3AF"
                                />
                            </TouchableOpacity>

                            {/* Answer - Expanded */}
                            {expandedIndex === index && (
                                <View className='bg-white rounded-b-2xl px-5 pb-5 -mt-2'>
                                    <View className='h-px bg-gray-200 mb-4' />
                                    <Text className='text-sm text-gray-medium leading-6'>
                                        {faq.answer}
                                    </Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                {/* Contact Support Section */}
                <View className='px-6 mt-8'>
                    <Text className='text-2xl font-bold text-gray-dark mb-6'>
                        Contact Support
                    </Text>

                    {/* Email Support Button */}
                    <TouchableOpacity
                        onPress={handleEmailSupport}
                        className='bg-primary/10 py-5 rounded-2xl'
                        activeOpacity={0.8}
                    >
                        <Text className='text-primary text-center text-lg font-bold'>
                            EMAIL SUPPORT
                        </Text>
                    </TouchableOpacity>

                    {/* Support Info */}
                    <View
                        className='mt-6 bg-white rounded-2xl p-5'
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 4,
                            elevation: 2,
                        }}
                    >
                        <View className='flex-row items-center mb-4'>
                            <Ionicons name="mail-outline" size={24} color="#4CAF50" />
                            <View className='ml-4 flex-1'>
                                <Text className='text-sm text-gray-medium mb-1'>Email</Text>
                                <Text className='text-base text-gray-dark font-medium'>
                                    support@jobsitex.com
                                </Text>
                            </View>
                        </View>

                        <View className='h-px bg-gray-200 my-4' />

                        <View className='flex-row items-center mb-4'>
                            <Ionicons name="call-outline" size={24} color="#4CAF50" />
                            <View className='ml-4 flex-1'>
                                <Text className='text-sm text-gray-medium mb-1'>Phone</Text>
                                <Text className='text-base text-gray-dark font-medium'>
                                    +1 (555) 123-4567
                                </Text>
                            </View>
                        </View>

                        <View className='h-px bg-gray-200 my-4' />

                        <View className='flex-row items-center'>
                            <Ionicons name="time-outline" size={24} color="#4CAF50" />
                            <View className='ml-4 flex-1'>
                                <Text className='text-sm text-gray-medium mb-1'>
                                    Support Hours
                                </Text>
                                <Text className='text-base text-gray-dark font-medium'>
                                    Mon-Fri: 9:00 AM - 6:00 PM EST
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default UserHelpSupport