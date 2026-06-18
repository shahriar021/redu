// components/SuccessModal.tsx
import React, { useEffect, useRef } from 'react'
import {
    Animated,
    Image,
    Modal,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { Images } from '../constants'

interface SuccessModalProps {
    visible: boolean
    onClose?: () => void
    title?: string
    subtitle?: string
}

const SuccessModal = ({
    visible,
    onClose,
    title = 'Account verified',
    subtitle = 'Successfully'
}: SuccessModalProps) => {
    const scaleAnim = useRef(new Animated.Value(0)).current
    const fadeAnim = useRef(new Animated.Value(0)).current

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start()
        } else {
            scaleAnim.setValue(0)
            fadeAnim.setValue(0)
        }
    }, [visible])

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType='fade'
        >
            <View className='flex-1 bg-black/50 items-center justify-center px-6'>
                <Animated.View
                    style={{
                        transform: [{ scale: scaleAnim }],
                        opacity: fadeAnim,
                    }}
                    className='bg-white rounded-3xl p-8 items-center w-full max-w-sm'
                >
                    <View className='relative items-center justify-center mb-6'>
                        {/* Decorative dots */}
                        {/* <View className='absolute w-3 h-3 rounded-full bg-primary/30' style={{ top: 0, left: 20 }} />
                        <View className='absolute w-2 h-2 rounded-full bg-primary/40' style={{ top: 10, right: 10 }} />
                        <View className='absolute w-2 h-2 rounded-full bg-primary/30' style={{ bottom: 20, left: 0 }} />
                        <View className='absolute w-3 h-3 rounded-full bg-primary/40' style={{ bottom: 0, right: 20 }} />
                        <View className='absolute w-2 h-2 rounded-full bg-primary/20' style={{ top: 40, right: 0 }} />
                        <View className='absolute w-2 h-2 rounded-full bg-primary/20' style={{ bottom: 40, left: 10 }} />

                        <View className='w-32 h-32 rounded-full bg-primary items-center justify-center'>
                            <View className='w-16 h-16 rounded-2xl bg-white items-center justify-center'>
                                <MaterialIcons name="verified-user" size={40} color="#4CAF50" />
                            </View>
                        </View> */}
                        <Image source={Images.VerifyIcon}/>
                    </View>

                    <Text className='text-2xl font-bold text-gray-dark text-center mb-2'>
                        {title}
                    </Text>
                    <Text className='text-2xl font-bold text-gray-dark text-center mb-8'>
                        {subtitle}
                    </Text>

                    <TouchableOpacity
                        onPress={onClose}
                        className='bg-primary py-5 rounded-2xl w-full'
                        activeOpacity={0.8}
                    >
                        <Text className='text-white text-center text-lg font-bold'>
                            DONE
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    )
}

export default SuccessModal