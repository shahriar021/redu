import { Ionicons } from '@expo/vector-icons'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import React from 'react'
import {
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthStackParamList } from '../../../../Navigation/type'

const UserPrivacyPolicy = () => {
    const navigation = useNavigation<NavigationProp<AuthStackParamList>>()
    const handleBack = () => {
        navigation.goBack()
    }

    return (
        <SafeAreaView className='flex-1 bg-gray-50' edges={['top']}>
            {/* Header */}
            <View className='flex-row items-center px-6 py-4 bg-gray-50'>
                <TouchableOpacity onPress={handleBack} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={28} color="#1C1C1C" />
                </TouchableOpacity>
                <Text className='text-2xl font-bold text-gray-dark ml-4'>
                    Privacy policy
                </Text>
            </View>

            {/* Content */}
            <ScrollView
                className='flex-1 px-6'
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* Terms of Service Section */}
                <View className='mt-6 mb-8'>
                    <Text className='text-2xl font-bold text-gray-dark mb-4'>
                        Terms of Service
                    </Text>

                    <Text className='text-base text-gray-medium leading-6 mb-4'>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Eget ornare quam vel facilisis feugiat amet sagittis arcu, tortor. Sapien, consequat ultrices morbi orci semper sit nulla. Leo auctor ut etiam est, amet aliquet ut vivamus. Odio vulputate est id tincidunt fames.
                    </Text>

                    <Text className='text-base text-gray-medium leading-6'>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Eget ornare quam vel facilisis feugiat amet sagittis arcu, tortor. Sapien, consequat ultrices morbi orci semper sit nulla. Leo auctor ut etiam est, amet aliquet ut vivamus. Odio vulputate est id tincidunt fames.
                    </Text>
                </View>

                {/* Privacy Policy Section */}
                <View className='mb-8'>
                    <Text className='text-2xl font-bold text-gray-dark mb-4'>
                        Privacy Policy
                    </Text>

                    <Text className='text-base text-gray-medium leading-6 mb-4'>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Eget ornare quam vel facilisis feugiat amet sagittis arcu, tortor. Sapien, consequat ultrices morbi orci semper sit nulla. Leo auctor ut etiam est, amet aliquet ut vivamus. Odio vulputate est id tincidunt fames.
                    </Text>

                    <Text className='text-base text-gray-medium leading-6 mb-4'>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Eget ornare quam vel facilisis feugiat amet sagittis arcu, tortor. Sapien, consequat ultrices morbi orci semper sit nulla. Leo auctor ut etiam est, amet aliquet ut vivamus. Odio vulputate est id tincidunt fames.
                    </Text>

                    <Text className='text-base text-gray-medium leading-6'>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Eget ornare quam vel facilisis feugiat amet sagittis arcu, tortor. Sapien, consequat ultrices morbi orci semper sit nulla. Leo auctor ut etiam est, amet aliquet ut vivamus. Odio vulputate est id tincidunt fames.
                    </Text>
                </View>

                {/* Data Collection Section */}
                <View className='mb-8'>
                    <Text className='text-xl font-bold text-gray-dark mb-4'>
                        Data Collection
                    </Text>

                    <Text className='text-base text-gray-medium leading-6'>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Eget ornare quam vel facilisis feugiat amet sagittis arcu, tortor. Sapien, consequat ultrices morbi orci semper sit nulla. Leo auctor ut etiam est, amet aliquet ut vivamus.
                    </Text>
                </View>

                {/* User Rights Section */}
                <View className='mb-8'>
                    <Text className='text-xl font-bold text-gray-dark mb-4'>
                        User Rights
                    </Text>

                    <Text className='text-base text-gray-medium leading-6'>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Eget ornare quam vel facilisis feugiat amet sagittis arcu, tortor. Sapien, consequat ultrices morbi orci semper sit nulla. Leo auctor ut etiam est, amet aliquet ut vivamus.
                    </Text>
                </View>

                {/* Contact Section */}
                <View className='mb-8'>
                    <Text className='text-xl font-bold text-gray-dark mb-4'>
                        Contact Us
                    </Text>

                    <Text className='text-base text-gray-medium leading-6'>
                        If you have any questions about this Privacy Policy, please contact us at:
                    </Text>

                    <Text className='text-base text-primary font-semibold mt-2'>
                        support@jobsitex.com
                    </Text>
                </View>

                {/* Last Updated */}
                <View className='mb-4'>
                    <Text className='text-sm text-gray-400 text-center'>
                        Last updated: December 22, 2024
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default UserPrivacyPolicy