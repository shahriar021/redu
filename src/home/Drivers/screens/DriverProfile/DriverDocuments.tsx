import { IPA_BASE } from '@env'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native'
import axios from 'axios'
import { StatusBar } from 'expo-status-bar'
import React, { useCallback, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthStackParamList } from '../../../../Navigation/type'

type DocStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'MISSING'

type DocItem = {
    type: string
    label: string
    status: DocStatus
    rejectionReason?: string | null
}

const DOC_LABELS: Record<string, string> = {
    CDL_LICENSE: 'CDL License',
    INSURANCE: 'Insurance Certificate',
    DOT_NUMBER: 'DOT Number Document',
    TRUCK_PHOTO: 'Truck Photo',
}

const REQUIRED_DOCS = ['CDL_LICENSE', 'INSURANCE', 'DOT_NUMBER', 'TRUCK_PHOTO']

const DriverDocuments = () => {
    const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
    const [docs, setDocs] = useState<DocItem[]>([])
    const [loading, setLoading] = useState(true)
    const [overallStatus, setOverallStatus] = useState<string>('PENDING')

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
                    const apiDocs: Array<{ type: string; status: string; rejectionReason?: string | null }> =
                        data?.documents ?? []

                    setOverallStatus(data?.driverStatus ?? 'PENDING')

                    const docMap = new Map(apiDocs.map((d) => [d.type, d]))

                    const items: DocItem[] = REQUIRED_DOCS.map((type) => {
                        const doc = docMap.get(type)
                        const rawStatus = doc ? (doc.status as DocStatus) : 'MISSING'
                        // When account is approved, all submitted docs are effectively verified
                        const status: DocStatus =
                            data?.driverStatus === 'APPROVED' && rawStatus !== 'MISSING' ? 'APPROVED' : rawStatus
                        return {
                            type,
                            label: DOC_LABELS[type] ?? type,
                            status,
                            rejectionReason: doc?.rejectionReason,
                        }
                    })
                    setDocs(items)
                } catch (err) {
                    console.error('DriverDocuments load error:', err)
                } finally {
                    setLoading(false)
                }
            }
            load()
        }, [])
    )

    const getStatusConfig = (status: DocStatus) => {
        switch (status) {
            case 'APPROVED':
                return { label: 'Verified', color: '#22C55E', bg: 'bg-green-50', icon: 'checkmark-circle' as const }
            case 'PENDING':
                return { label: 'Pending Review', color: '#F59E0B', bg: 'bg-amber-50', icon: 'time-outline' as const }
            case 'REJECTED':
                return { label: 'Rejected', color: '#EF4444', bg: 'bg-red-50', icon: 'close-circle' as const }
            case 'MISSING':
                return { label: 'Not Uploaded', color: '#9CA3AF', bg: 'bg-gray-50', icon: 'cloud-upload-outline' as const }
        }
    }

    if (loading) {
        return (
            <SafeAreaView className='flex-1 bg-white items-center justify-center' edges={['top']}>
                <ActivityIndicator color='#43B047' size='large' />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className='flex-1 bg-gray-50' edges={['top']}>
            <StatusBar style='dark' />

            {/* Header */}
            <View className='flex-row items-center px-5 py-4 bg-white border-b border-gray-100'>
                <TouchableOpacity onPress={() => navigation.goBack()} className='p-1'>
                    <Ionicons name='arrow-back' size={26} color='#1C1C1C' />
                </TouchableOpacity>
                <Text className='text-2xl font-bold text-gray-900 ml-3'>Documents & Verification</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className='flex-1 px-5 pt-5'>
                {/* Overall status banner */}
                <View className={`mb-5 rounded-2xl p-4 flex-row items-center ${overallStatus === 'APPROVED' ? 'bg-green-50' : overallStatus === 'REJECTED' ? 'bg-red-50' : 'bg-amber-50'}`}>
                    <Ionicons
                        name={overallStatus === 'APPROVED' ? 'shield-checkmark' : overallStatus === 'REJECTED' ? 'shield-outline' : 'shield-outline'}
                        size={28}
                        color={overallStatus === 'APPROVED' ? '#22C55E' : overallStatus === 'REJECTED' ? '#EF4444' : '#F59E0B'}
                    />
                    <View className='ml-3 flex-1'>
                        <Text className={`font-bold text-base ${overallStatus === 'APPROVED' ? 'text-green-700' : overallStatus === 'REJECTED' ? 'text-red-700' : 'text-amber-700'}`}>
                            Account Status: {overallStatus}
                        </Text>
                        <Text className={`text-sm mt-0.5 ${overallStatus === 'APPROVED' ? 'text-green-600' : overallStatus === 'REJECTED' ? 'text-red-600' : 'text-amber-600'}`}>
                            {overallStatus === 'APPROVED'
                                ? 'Your account is verified and active.'
                                : overallStatus === 'REJECTED'
                                ? 'Your account was rejected. Please re-upload documents.'
                                : 'Your documents are under review by our team.'}
                        </Text>
                    </View>
                </View>

                <Text className='text-xl font-bold text-gray-900 mb-4'>Required Documents</Text>

                {docs.map((doc) => {
                    const cfg = getStatusConfig(doc.status)
                    return (
                        <View key={doc.type} className={`mb-3 rounded-2xl p-5 border border-gray-100 ${cfg.bg}`} style={{ elevation: 2 }}>
                            <View className='flex-row items-center justify-between'>
                                <View className='flex-1'>
                                    <Text className='text-base font-bold text-gray-900'>{doc.label}</Text>
                                    {doc.status === 'REJECTED' && doc.rejectionReason ? (
                                        <Text className='text-sm text-red-500 mt-1'>{doc.rejectionReason}</Text>
                                    ) : null}
                                </View>
                                <View className='flex-row items-center ml-3'>
                                    <Ionicons name={cfg.icon} size={18} color={cfg.color} />
                                    <Text className='font-bold text-sm ml-1' style={{ color: cfg.color }}>{cfg.label}</Text>
                                </View>
                            </View>
                        </View>
                    )
                })}

                <View className='mt-4 mb-6 p-4 rounded-xl bg-blue-50 flex-row items-start'>
                    <Ionicons name='information-circle-outline' size={20} color='#3B82F6' />
                    <Text className='flex-1 text-blue-700 text-sm leading-5 ml-2'>
                        To update documents, go back and use "Complete Profile" or contact support.
                    </Text>
                </View>

                <View className='h-10' />
            </ScrollView>
        </SafeAreaView>
    )
}

export default DriverDocuments
