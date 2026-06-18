import { IPA_BASE } from '@env'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../../../Auth/AuthContext'
import { driverSocketService } from '../../services/driverSocket.service'

type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

interface Doc {
    type: string
    status: DocumentStatus
    rejectionReason?: string | null
}

interface DriverStatusData {
    driverStatus: 'PENDING' | 'REJECTED'
    isProfileComplete: boolean
    documents: Doc[]
}

const DOC_LABELS: Record<string, string> = {
    CDL_LICENSE: 'CDL License',
    INSURANCE: 'Insurance',
    DOT_NUMBER: 'DOT Number',
    TRUCK_PHOTO: 'Truck Photo',
}

const DriverPendingVerification = () => {
    const navigation = useNavigation<any>()
    const { signOut } = useAuth()
    const [data, setData] = useState<DriverStatusData | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        fetchStatus()
    }, [])

    const fetchStatus = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true)
        try {
            const token = await AsyncStorage.getItem('vToken')
            if (!token) return
            const res = await axios.get(`${IPA_BASE}/driver/profile`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 10000,
            })
            const d = res.data?.data
            if (d.driverStatus === 'APPROVED') {
                navigation.reset({ index: 0, routes: [{ name: 'DriverMainTabs' }] })
                return
            }
            setData({
                driverStatus: d.driverStatus,
                isProfileComplete: d.isProfileComplete,
                documents: d.documents ?? [],
            })
        } catch {
            // keep loading state false so UI still shows
        } finally {
            setLoading(false)
            if (isRefresh) setRefreshing(false)
        }
    }

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    driverSocketService.disconnect()
                    await signOut()
                    navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] })
                },
            },
        ])
    }

    const handleUpdateDocuments = () => {
        navigation.navigate('ProfileSetup')
    }

    if (loading) {
        return (
            <SafeAreaView className='flex-1 bg-gray-50 justify-center items-center'>
                <ActivityIndicator size='large' color='#4CAF50' />
            </SafeAreaView>
        )
    }

    const isRejected = data?.driverStatus === 'REJECTED'
    const rejectedDocs = data?.documents.filter(d => d.status === 'REJECTED') ?? []

    return (
        <SafeAreaView className='flex-1 bg-gray-50' edges={['top']}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className='flex-row items-center justify-between px-6 py-4'>
                    <Text className='text-2xl font-bold text-gray-900'>Account Status</Text>
                    <TouchableOpacity onPress={handleLogout}>
                        <Ionicons name='log-out-outline' size={26} color='#EF4444' />
                    </TouchableOpacity>
                </View>

                {/* Status banner */}
                <View className={`mx-4 rounded-2xl p-6 mb-6 ${isRejected ? 'bg-red-50' : 'bg-amber-50'}`}>
                    <View className='items-center mb-4'>
                        <View className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${isRejected ? 'bg-red-100' : 'bg-amber-100'}`}>
                            <Ionicons
                                name={isRejected ? 'close-circle' : 'time'}
                                size={48}
                                color={isRejected ? '#EF4444' : '#F59E0B'}
                            />
                        </View>
                        <Text className={`text-2xl font-bold mb-2 ${isRejected ? 'text-red-700' : 'text-amber-700'}`}>
                            {isRejected ? 'Documents Rejected' : 'Under Review'}
                        </Text>
                        <Text className={`text-center text-base ${isRejected ? 'text-red-600' : 'text-amber-600'}`}>
                            {isRejected
                                ? 'One or more of your documents were rejected. Please review the feedback below and resubmit.'
                                : 'Your documents have been submitted and are being reviewed by our team. This usually takes 1–2 business days.'}
                        </Text>
                    </View>
                </View>

                {/* Rejected document details */}
                {isRejected && rejectedDocs.length > 0 && (
                    <View className='mx-4 mb-6'>
                        <Text className='text-lg font-bold text-gray-900 mb-3'>Rejection Feedback</Text>
                        {rejectedDocs.map((doc, i) => (
                            <View key={i} className='bg-white rounded-2xl p-4 mb-3 border border-red-100'>
                                <View className='flex-row items-center mb-2'>
                                    <MaterialIcons name='description' size={20} color='#EF4444' />
                                    <Text className='text-base font-bold text-gray-900 ml-2'>
                                        {DOC_LABELS[doc.type] ?? doc.type}
                                    </Text>
                                </View>
                                {doc.rejectionReason ? (
                                    <Text className='text-sm text-red-600'>{doc.rejectionReason}</Text>
                                ) : (
                                    <Text className='text-sm text-gray-500'>Please resubmit this document.</Text>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {/* Document summary for PENDING */}
                {!isRejected && data?.documents && data.documents.length > 0 && (
                    <View className='mx-4 mb-6'>
                        <Text className='text-lg font-bold text-gray-900 mb-3'>Submitted Documents</Text>
                        {data.documents.map((doc, i) => (
                            <View key={i} className='bg-white rounded-2xl p-4 mb-3 flex-row items-center justify-between'>
                                <View className='flex-row items-center'>
                                    <MaterialIcons name='description' size={20} color='#6B7280' />
                                    <Text className='text-base text-gray-800 ml-2'>
                                        {DOC_LABELS[doc.type] ?? doc.type}
                                    </Text>
                                </View>
                                <View className={`px-3 py-1 rounded-full ${
                                    doc.status === 'APPROVED' ? 'bg-green-100' :
                                    doc.status === 'REJECTED' ? 'bg-red-100' : 'bg-amber-100'
                                }`}>
                                    <Text className={`text-xs font-semibold ${
                                        doc.status === 'APPROVED' ? 'text-green-700' :
                                        doc.status === 'REJECTED' ? 'text-red-700' : 'text-amber-700'
                                    }`}>
                                        {doc.status}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* What happens next */}
                <View className='mx-4 mb-6 bg-white rounded-2xl p-5'>
                    <Text className='text-base font-bold text-gray-900 mb-3'>What happens next?</Text>
                    {[
                        { icon: 'shield-checkmark-outline', text: 'Admin reviews your submitted documents' },
                        { icon: 'notifications-outline', text: 'You\'ll receive a notification once approved' },
                        { icon: 'car-outline', text: 'After approval, you can start accepting jobs' },
                    ].map((item, i) => (
                        <View key={i} className='flex-row items-start mb-3'>
                            <Ionicons name={item.icon as any} size={20} color='#4CAF50' />
                            <Text className='text-sm text-gray-600 ml-3 flex-1'>{item.text}</Text>
                        </View>
                    ))}
                </View>

                {/* Update documents button */}
                <View className='mx-4 mb-8'>
                    <TouchableOpacity
                        onPress={handleUpdateDocuments}
                        className='bg-primary py-4 rounded-2xl items-center mb-3'
                        activeOpacity={0.8}
                    >
                        <Text className='text-white text-base font-bold'>
                            {isRejected ? 'Resubmit Documents' : 'Update Documents'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => fetchStatus(true)}
                        className='border border-gray-300 py-4 rounded-2xl items-center'
                        activeOpacity={0.8}
                        disabled={refreshing}
                    >
                        {refreshing
                            ? <ActivityIndicator size='small' color='#6B7280' />
                            : <Text className='text-gray-600 text-base font-semibold'>Refresh Status</Text>
                        }
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default DriverPendingVerification
