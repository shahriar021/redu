import { NavigationProp, useNavigation } from '@react-navigation/native'
import React from 'react'
import { FlatList, Text, TouchableOpacity, View } from 'react-native'
import { AuthStackParamList } from '../../../../Navigation/type'
import { Truck as NearbyTruck } from '../../../../Utils/hooks/useNearbyTrucks'
import { TruckCard } from '../NearByTrucks/TruckCard'
import { ActiveJobCard } from './ActiveJobCard'
import { RecentJobCard } from './RecentJobCard'
import {
    ActiveJobSkeleton,
    EmptyState,
    RecentJobSkeleton,
    SmallTruckCardSkeleton
} from './Skeletons'
import { Job, Truck } from './types'

interface AllVendorsContentProps {
    activeJobs: Truck[]
    nearByTrucks: NearbyTruck[]
    recentJobs: Truck[]
    activeJob: Job | null
    isLoading: boolean
    onSeeAllNearby: () => void
    onSeeAllRecent: () => void
    onTrackPress: () => void
    onViewPress: (jobId: string) => void
    onBookPress: (truck: NearbyTruck) => void
}

export const AllVendorsContent: React.FC<AllVendorsContentProps> = ({
    activeJobs,
    nearByTrucks,
    recentJobs,
    activeJob,
    isLoading,
    onSeeAllNearby,
    onTrackPress,
    onViewPress,
    onBookPress,
}) => {

    const navigation = useNavigation<NavigationProp<AuthStackParamList>>()

    if (isLoading) {
        return (
            <View className='mb-4'>
                <View className='flex-row justify-between items-center mb-4'>
                    <Text className='text-2xl font-bold text-gray-dark'>Nearby Trucks</Text>
                </View>
                <FlatList
                    data={[1, 2, 3]}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    renderItem={() => <SmallTruckCardSkeleton />}
                    keyExtractor={(item) => item.toString()}
                    className='mb-6'
                />

                <Text className='text-2xl font-bold text-gray-dark mb-4'>Active Job</Text>
                <ActiveJobSkeleton />

                <View className='flex-row justify-between items-center mb-4'>
                    <Text className='text-2xl font-bold text-gray-dark'>Recent Jobs</Text>
                </View>
                {[1, 2].map((item) => (
                    <RecentJobSkeleton key={item} />
                ))}
            </View>
        )
    }

    return (
        <View className='mb-4'>
            {/* Nearby Trucks Section */}
            <View className='flex-row justify-between items-center mb-4'>
                <Text className='text-2xl font-bold text-gray-dark'>Nearby Trucks</Text>
                <TouchableOpacity onPress={onSeeAllNearby}>
                    <Text className='text-primary font-semibold'>See All</Text>
                </TouchableOpacity>
            </View>

            {/* Fix: Use nearByTrucks instead of activeJobs for nearby trucks */}
            {nearByTrucks && nearByTrucks.length > 0 ? (
                <FlatList
                    data={nearByTrucks.slice(0, 5)}  // Show only first 5 on home screen
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TruckCard
                            key={item.id}
                            truck={item}
                            onBookPress={() => onBookPress(item)}
                        />
                    )}
                    className='mb-6'
                />
            ) : (
                <EmptyState message="No nearby trucks available" />
            )}

            {/* Active Job Section */}
            <Text className='text-2xl font-bold text-gray-dark mb-4'>Active Job</Text>
            {activeJobs && activeJobs.length > 0 ? (
                <ActiveJobCard
                    job={activeJob || activeJobs[0]}
                    onTrackPress={onTrackPress}
                />
            ) : (
                <View className='bg-white rounded-3xl p-8 mb-6 items-center'>
                    <Text className='text-gray-400 text-lg'>No active jobs</Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate("UserMappingView")}
                        className='mt-4 bg-primary px-6 py-3 rounded-xl'
                    >
                        <Text className='text-white font-bold'>Book a Truck</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Recent Jobs Section */}

            <Text className='text-2xl font-bold text-gray-dark mb-4'>Recent Jobs</Text>
            {recentJobs && recentJobs.length > 0 ? (
                recentJobs.slice(0, 3).map((job) => (  // Show only first 3 recent jobs
                    <RecentJobCard
                        key={job.id}
                        job={job}
                        onViewPress={() => onViewPress(job.id)}
                    />
                ))
            ) : (
                <EmptyState message="No recent jobs found" />
            )}
        </View>
    )
}