import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons } from '@expo/vector-icons'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import React, { useEffect, useState } from 'react'
import {
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthStackParamList } from '../../../../Navigation/type'

const STORAGE_KEY = '@notification_preferences'

type Prefs = {
    jobUpdates: boolean
    systemAlerts: boolean
    pushNotifications: boolean
    emailNotifications: boolean
}

const DEFAULTS: Prefs = {
    jobUpdates: true,
    systemAlerts: true,
    pushNotifications: true,
    emailNotifications: true,
}

const UserNotificationSettings = () => {
    const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
    const [prefs, setPrefs] = useState<Prefs>(DEFAULTS)
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
            if (raw) {
                try { setPrefs({ ...DEFAULTS, ...JSON.parse(raw) }) } catch { /* use defaults */ }
            }
            setLoaded(true)
        })
    }, [])

    const update = (key: keyof Prefs, value: boolean) => {
        const updated = { ...prefs, [key]: value }
        setPrefs(updated)
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    }

    if (!loaded) return null

    return (
        <SafeAreaView className='flex-1 bg-gray-50' edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className='flex-row items-center px-6 py-4'>
                    <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
                        <Ionicons name="arrow-back" size={28} color="#1C1C1C" />
                    </TouchableOpacity>
                    <Text className='text-2xl font-bold text-gray-dark ml-4'>
                        Notifications
                    </Text>
                </View>

                {/* Alerts Card */}
                <View className='mx-6 mt-4 mb-4'>
                    <View
                        className='bg-white rounded-3xl p-6'
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.05,
                            shadowRadius: 8,
                            elevation: 3,
                        }}
                    >
                        <Text className='text-xl font-bold text-gray-dark mb-6'>
                            Alerts
                        </Text>

                        <View className='mb-6'>
                            <View className='flex-row items-start justify-between mb-2'>
                                <View className='flex-1 mr-4'>
                                    <Text className='text-base font-semibold text-gray-dark mb-2'>
                                        Job Updates
                                    </Text>
                                    <Text className='text-sm text-gray-medium leading-5'>
                                        Receive updates on new job postings and other important job-related information.
                                    </Text>
                                </View>
                                <Switch
                                    value={prefs.jobUpdates}
                                    onValueChange={(v) => update('jobUpdates', v)}
                                    trackColor={{ false: '#D1D5DB', true: '#4CAF50' }}
                                    thumbColor='#FFFFFF'
                                    ios_backgroundColor="#D1D5DB"
                                />
                            </View>
                        </View>

                        <View>
                            <View className='flex-row items-start justify-between'>
                                <View className='flex-1 mr-4'>
                                    <Text className='text-base font-semibold text-gray-dark mb-2'>
                                        System Alerts
                                    </Text>
                                    <Text className='text-sm text-gray-medium leading-5'>
                                        Stay informed about system maintenance, updates, and other critical alerts.
                                    </Text>
                                </View>
                                <Switch
                                    value={prefs.systemAlerts}
                                    onValueChange={(v) => update('systemAlerts', v)}
                                    trackColor={{ false: '#D1D5DB', true: '#4CAF50' }}
                                    thumbColor='#FFFFFF'
                                    ios_backgroundColor="#D1D5DB"
                                />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Notification Methods Card */}
                <View className='mx-6 mb-6'>
                    <View
                        className='bg-white rounded-3xl p-6'
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.05,
                            shadowRadius: 8,
                            elevation: 3,
                        }}
                    >
                        <View className='flex-row items-center justify-between mb-6'>
                            <Text className='text-base font-semibold text-gray-dark'>
                                Push Notifications
                            </Text>
                            <Switch
                                value={prefs.pushNotifications}
                                onValueChange={(v) => update('pushNotifications', v)}
                                trackColor={{ false: '#D1D5DB', true: '#4CAF50' }}
                                thumbColor='#FFFFFF'
                                ios_backgroundColor="#D1D5DB"
                            />
                        </View>

                        <View className='h-px bg-gray-200 mb-6' />

                        <View className='flex-row items-center justify-between'>
                            <Text className='text-base font-semibold text-gray-dark'>
                                Email
                            </Text>
                            <Switch
                                value={prefs.emailNotifications}
                                onValueChange={(v) => update('emailNotifications', v)}
                                trackColor={{ false: '#D1D5DB', true: '#4CAF50' }}
                                thumbColor='#FFFFFF'
                                ios_backgroundColor="#D1D5DB"
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default UserNotificationSettings
