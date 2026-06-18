import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Images } from '../constants';
import { AuthStackParamList } from '../Navigation/type';
import { useAuth } from '../Auth/AuthContext';

const RoleSelect = () => {
    const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
    const { setHasCompletedOnboarding } = useAuth();
    const [selectedRole, setSelectedRole] = useState('USER');

    const onboardingDataUser: any = [
        {
            id: '1',
            image: Images.UserOnBoardOne,
            title: 'Fast & Reliable Transport',
            description: 'Book the right truck for your load in\nseconds.',
        },
        {
            id: '2',
            image: Images.UserOnBoardSecond,
            title: 'Real-Time Tracking',
            description: 'Monitor your shipment from pickup to\ndelivery with live updates.',
        },
        {
            id: '3',
            image: Images.UserOnBoardThird,
            title: 'Safe, Reliable, Trusted Drivers',
            description: 'Work with professional drivers and ensure\non-time delivery',
        },
    ];

    const onboardingDataDriver: any = [
        {
            id: '1',
            image: Images.DriverOnBoardOne,
            title: 'Get Assigned Jobs Automatically',
            description: 'No bidding or searching. Jobs are\nassigned to you based on your truck type\nand availability.',
        },
        {
            id: '2',
            image: Images.DriverOnBoardSecond,
            title: 'Track Distance & Working Hours',
            description: 'Your distance and active job time are\ntracked automatically for accurate\npayment calculation.',
        },
        {
            id: '3',
            image: Images.DriverOnBoardThird,
            title: 'Get Paid After Job Completion',
            description: 'After completing a job, the customer pays\nthrough the app, and your earnings are\nprocessed securely via Stripe.',
        },
    ];

    const handleNext = async () => {
        // Mark onboarding as completed for new user
        await setHasCompletedOnboarding(true);

        if (selectedRole === 'USER') {
            (navigation as any).navigate("OnBoardingFrist", {
                onBoardData: onboardingDataUser,
                onBoardType: "USER",
            });
        } else if (selectedRole === 'DRIVER') {
            (navigation as any).navigate("OnBoardingFrist", {
                onBoardData: onboardingDataDriver,
                onBoardType: "DRIVER",
            });
        }
    };

    return (
        <SafeAreaView className='flex-1 bg-gray-50'>
            <View className='px-6 flex-1'>
                <Image
                    source={Images.Logo}
                    className='self-center my-8'
                    style={{ width: 200, height: 200 }}
                    resizeMode='contain'
                />
                <Text className='text-3xl font-bold text-gray-900 mb-2'>
                    Welcome to JOBSITEX
                </Text>
                <Text className='text-lg text-gray-500 mb-8'>
                    Choose Your Role to Begin.
                </Text>

                {/* User Role Button */}
                <TouchableOpacity
                    onPress={() => setSelectedRole('USER')}
                    className='mb-4'
                    activeOpacity={0.8}
                >
                    <View
                        className={`flex-row items-center justify-between px-5 py-7 rounded-2xl ${selectedRole === 'USER'
                                ? 'bg-primary'
                                : 'bg-white border-2 border-gray-300'
                            }`}
                    >
                        <View className='flex-row items-center'>
                            <Ionicons
                                name="person"
                                size={24}
                                color={selectedRole === 'USER' ? 'white' : '#9CA3AF'}
                            />
                            <Text
                                className={`ml-3 text-lg font-semibold ${selectedRole === 'USER' ? 'text-white' : 'text-gray-400'
                                    }`}
                            >
                                Join as user
                            </Text>
                        </View>

                        <View
                            className={`w-6 h-6 rounded-full border-2 items-center justify-center ${selectedRole === 'USER'
                                    ? 'border-white bg-white'
                                    : 'border-gray-300'
                                }`}
                        >
                            {selectedRole === 'USER' && (
                                <View className='w-4 h-4 rounded-full bg-primary' />
                            )}
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Driver Role Button */}
                <TouchableOpacity
                    onPress={() => setSelectedRole('DRIVER')}
                    activeOpacity={0.8}
                >
                    <View
                        className={`flex-row items-center justify-between px-5 py-7 rounded-2xl ${selectedRole === 'DRIVER'
                                ? 'bg-primary'
                                : 'bg-white border-2 border-gray-300'
                            }`}
                    >
                        <View className='flex-row items-center'>
                            <Ionicons
                                name="car"
                                size={24}
                                color={selectedRole === 'DRIVER' ? 'white' : '#9CA3AF'}
                            />
                            <Text
                                className={`ml-3 text-lg font-semibold ${selectedRole === 'DRIVER' ? 'text-white' : 'text-gray-400'
                                    }`}
                            >
                                Join as driver
                            </Text>
                        </View>

                        <View
                            className={`w-6 h-6 rounded-full border-2 items-center justify-center ${selectedRole === 'DRIVER'
                                    ? 'border-white bg-white'
                                    : 'border-gray-300'
                                }`}
                        >
                            {selectedRole === 'DRIVER' && (
                                <View className='w-4 h-4 rounded-full bg-primary' />
                            )}
                        </View>
                    </View>
                </TouchableOpacity>

                <View className='flex-1' />

                {/* Next Button */}
                <TouchableOpacity
                    className='bg-primary py-5 rounded-2xl mb-8'
                    activeOpacity={0.8}
                    onPress={handleNext}
                >
                    <Text className='text-white text-center text-lg font-bold'>
                        NEXT
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default RoleSelect;