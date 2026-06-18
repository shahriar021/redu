import { NavigationProp, useNavigation, useRoute } from '@react-navigation/native'
import * as Location from 'expo-location'
import React from 'react'
import {
    Alert,
    Image,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { AuthStackParamList } from '../Navigation/type'
import { Images } from '../constants'

const LocationPermission = () => {
    const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
    const route = useRoute<any>()
    const type = route.params?.type

    const handleAllowLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync()

            if (status === 'granted') {
                // Request background permission
                await Location.requestBackgroundPermissionsAsync()

                const isLocationAvailable = await Location.hasServicesEnabledAsync()

                if (!isLocationAvailable) {
                    Alert.alert(
                        'Location Services Disabled',
                        'Please enable location services in your device settings to use this feature.',
                        [{ text: 'OK' }]
                    )
                    return
                }

                await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })

                if (type === "CUSTOMER" || type === "USER") {
                    navigation.navigate('UserMainTabs')
                }
                else {
                    navigation.navigate('DriverMainTabs')
                }
                // or your main screen
            } else {
                Alert.alert(
                    'Permission Denied',
                    'Location permission is required to find professionals near you.',
                    [{ text: 'OK' }]
                )
            }
        } catch (error) {
            console.error('Error requesting location permission:', error)
            Alert.alert('Error', 'Failed to get location. Make sure location services are enabled.')
        }
    }

    const handleSkip = () => {
        if (type === "CUSTOMER" || type === "USER") {
            navigation.navigate('UserMainTabs')
        }
        else {
            navigation.navigate('DriverMainTabs')
        }

    }

    return (
        <SafeAreaView className='flex-1 bg-gray-50'>
            <View className='px-6 flex-1 items-center justify-center'>
                {/* Location Icon/Image */}
                <View className='mb-12'>
                    <Image
                        source={Images.LocationPermission} // Add your location icon
                        style={{ width: 200, height: 200 }}
                        resizeMode='cover'
                    />
                </View>

                {/* Title */}
                <Text className='text-2xl font-bold text-gray-dark text-center mb-4'>
                    Allow location access?
                </Text>

                {/* Description */}
                <Text className='text-base text-gray-medium text-center mb-12 px-4'>
                    We need your location access to easily find Skillr professionals around you.
                </Text>

                {/* Allow Location Button */}
                <TouchableOpacity
                    onPress={handleAllowLocation}
                    className='bg-primary py-5 rounded-2xl w-full mb-4'
                    activeOpacity={0.8}
                >
                    <Text className='text-white text-center text-lg font-bold'>
                        ALLOW LOCATION
                    </Text>
                </TouchableOpacity>

                {/* Skip Button */}
                <TouchableOpacity
                    onPress={handleSkip}
                    className='py-3'
                    activeOpacity={0.7}
                >
                    <Text className='text-gray-medium text-center text-base'>
                        Skip
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

export default LocationPermission