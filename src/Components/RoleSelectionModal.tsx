import React from 'react'
import { Modal, View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { SocialRole } from '../Auth/socialAuth'

interface Props {
    visible: boolean
    onSelect: (role: SocialRole) => void
    onCancel: () => void
}

const RoleSelectionModal: React.FC<Props> = ({ visible, onSelect, onCancel }) => {
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
            <TouchableOpacity
                className="flex-1 bg-black/50 justify-end"
                activeOpacity={1}
                onPress={onCancel}
            >
                <TouchableOpacity activeOpacity={1}>
                    <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10">
                        <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-6" />

                        <Text className="text-2xl font-bold text-gray-dark text-center mb-1">
                            Continue as
                        </Text>
                        <Text className="text-gray-400 text-center mb-8">
                            Choose how you want to use Jobsitex
                        </Text>

                        <TouchableOpacity
                            onPress={() => onSelect('CUSTOMER')}
                            className="bg-primary rounded-2xl px-5 py-5 mb-4 flex-row items-center"
                            activeOpacity={0.85}
                        >
                            <View className="bg-white/20 rounded-xl p-2">
                                <Ionicons name="person-outline" size={26} color="white" />
                            </View>
                            <View className="ml-4 flex-1">
                                <Text className="text-white font-bold text-lg">Customer</Text>
                                <Text className="text-white/75 text-sm mt-0.5">Book truck jobs for your needs</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => onSelect('DRIVER')}
                            className="bg-secondary rounded-2xl px-5 py-5 mb-6 flex-row items-center"
                            activeOpacity={0.85}
                        >
                            <View className="bg-white/20 rounded-xl p-2">
                                <Ionicons name="car-outline" size={26} color="white" />
                            </View>
                            <View className="ml-4 flex-1">
                                <Text className="text-white font-bold text-lg">Driver</Text>
                                <Text className="text-white/75 text-sm mt-0.5">Accept jobs and earn money</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={onCancel} className="py-2">
                            <Text className="text-gray-400 text-center text-base">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    )
}

export default RoleSelectionModal
