import { IPA_BASE } from '@env'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import React, { useCallback, useEffect, useState } from 'react'
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { socketService, NotificationData } from '../../Users/services/socket.service'

type ApiNotification = {
    id: string
    type: string
    title: string
    message: string
    isRead: boolean
    createdAt: string
    data?: Record<string, unknown>
}

const TYPE_ICON: Record<string, { icon: string; color: string }> = {
    JOB_BROADCAST:        { icon: 'megaphone',              color: '#F59E0B' },
    JOB_ACCEPTED:         { icon: 'checkmark-circle',       color: '#22C55E' },
    JOB_STATUS_UPDATE:    { icon: 'refresh-circle',         color: '#3B82F6' },
    DRIVER_APPROVED:      { icon: 'shield-checkmark',       color: '#10B981' },
    DRIVER_REJECTED:      { icon: 'shield-outline',         color: '#EF4444' },
    PAYMENT_RECEIVED:     { icon: 'cash',                   color: '#3B82F6' },
    DOCUMENT_APPROVED:    { icon: 'document-text',          color: '#10B981' },
    DOCUMENT_REJECTED:    { icon: 'document-text-outline',  color: '#EF4444' },
    WITHDRAWAL_PROCESSED: { icon: 'wallet',                 color: '#8B5CF6' },
    DEFAULT:              { icon: 'notifications',          color: '#9CA3AF' },
}

const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr}h ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const DriverAlert = () => {
    const [notifications, setNotifications] = useState<ApiNotification[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const load = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true)
            const token = await AsyncStorage.getItem('vToken')
            const res = await axios.get(`${IPA_BASE}/user/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { limit: 50 },
                timeout: 10000,
            })
            setNotifications(res.data?.data?.notifications ?? [])
        } catch (err) {
            console.error('DriverAlert load error:', err)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        load()

        // listen for live notification events
        const handleNotification = (data: NotificationData) => {
            setNotifications((prev) => [{ ...data, isRead: false }, ...prev])
        }
        socketService.connect().then(() => {
            socketService.onNotification(handleNotification)
        })
        return () => {
            socketService.offNotification(handleNotification)
        }
    }, [])

    const markRead = async (id: string) => {
        try {
            const token = await AsyncStorage.getItem('vToken')
            await axios.patch(`${IPA_BASE}/user/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000,
            })
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            )
        } catch {
            // non-critical
        }
    }

    const markAllRead = async () => {
        try {
            const token = await AsyncStorage.getItem('vToken')
            await axios.post(`${IPA_BASE}/user/notifications/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000,
            })
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
        } catch {
            // non-critical
        }
    }

    const renderItem = ({ item }: { item: ApiNotification }) => {
        const iconCfg = TYPE_ICON[item.type] ?? TYPE_ICON.DEFAULT
        return (
            <TouchableOpacity
                onPress={() => !item.isRead && markRead(item.id)}
                className={`rounded-2xl p-4 mb-3 flex-row items-start ${item.isRead ? 'bg-white' : 'bg-green-50'}`}
                activeOpacity={0.7}
                style={{ elevation: 2 }}
            >
                <View
                    className='w-12 h-12 rounded-full items-center justify-center mr-4'
                    style={{ backgroundColor: iconCfg.color + '20' }}
                >
                    <Ionicons name={iconCfg.icon as any} size={22} color={iconCfg.color} />
                </View>

                <View className='flex-1'>
                    <View className='flex-row items-start justify-between mb-1'>
                        <Text className='text-base font-bold text-gray-900 flex-1 mr-2'>{item.title}</Text>
                        <Text className='text-xs text-gray-400'>{formatTime(item.createdAt)}</Text>
                    </View>
                    <Text className='text-sm text-gray-600 leading-5' numberOfLines={2}>{item.message}</Text>
                </View>

                {!item.isRead && (
                    <View className='w-2.5 h-2.5 rounded-full bg-green-500 ml-2 mt-1' />
                )}
            </TouchableOpacity>
        )
    }

    if (loading) {
        return (
            <SafeAreaView className='flex-1 bg-gray-50 items-center justify-center' edges={['top']}>
                <ActivityIndicator color='#43B047' size='large' />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className='flex-1 bg-gray-50' edges={['top']}>
            <View className='px-5 py-4 flex-row items-center justify-between'>
                <Text className='text-2xl font-bold text-gray-900'>Alerts</Text>
                {notifications.some((n) => !n.isRead) && (
                    <TouchableOpacity onPress={markAllRead}>
                        <Text className='text-sm font-semibold text-green-600'>Mark all read</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor='#43B047' />
                }
                ListEmptyComponent={
                    <View className='items-center py-16'>
                        <Ionicons name='notifications-off-outline' size={48} color='#D1D5DB' />
                        <Text className='text-gray-400 mt-3 text-base'>No notifications yet</Text>
                    </View>
                }
            />
        </SafeAreaView>
    )
}

export default DriverAlert
