import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../Navigation/type';
import { useAuth } from '../Auth/AuthContext';
import { Images } from '../constants';

const { width } = Dimensions.get('window');

interface OnboardingItem {
  id: string;
  image: any;
  title: string;
  description: string;
}

const onboardingSlides: OnboardingItem[] = [
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

const OnBoardingFrist = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const { setHasCompletedOnboarding } = useAuth();

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingItem>>(null);

  const handleNext = async () => {
    if (currentIndex < onboardingSlides.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToOffset({
        offset: nextIndex * width,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    } else {
      await setHasCompletedOnboarding(true);
      (navigation as any).replace("SignIn");
    }
  };

  const handleSkip = async () => {
    await setHasCompletedOnboarding(true);
    (navigation as any).replace("SignIn");
  };

  const onScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    if (slideIndex !== currentIndex) {
      setCurrentIndex(slideIndex);
    }
  };

  const renderItem = ({ item }: { item: OnboardingItem }) => (
    <View style={{ width }} className='flex-1'>
      <View className='w-full flex-1 items-center justify-center'>
        <Image
          source={item.image}
          style={{ width: width, height: 550 }}
          resizeMode='contain'
        />
      </View>

      <View className='px-6 pb-4'>
        <Text className='text-3xl font-bold text-gray-dark text-center mb-4'>
          {item.title}
        </Text>

        <Text className='text-base text-gray-medium text-center leading-6'>
          {item.description}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className='flex-1 bg-white'>
      {currentIndex !== onboardingSlides.length - 1 && (
        <TouchableOpacity
          onPress={handleSkip}
          className='absolute top-16 right-6 z-10'
          activeOpacity={0.7}
        >
          <Text className='text-gray-medium text-base'>Skip</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={onboardingSlides}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      />

      <View className='px-6 pb-8'>
        <View className='flex-row justify-center mb-8'>
          {onboardingSlides.map((_: any, index: number) => (
            <View
              key={index}
              className={`h-2 rounded-full mx-1 ${index === currentIndex
                  ? 'bg-primary w-8'
                  : 'bg-gray-300 w-2'
                }`}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={handleNext}
          className='bg-primary py-5 rounded-2xl'
          activeOpacity={0.8}
        >
          <Text className='text-white text-center text-lg font-bold'>
            {currentIndex === onboardingSlides.length - 1 ? 'GET STARTED' : 'NEXT'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default OnBoardingFrist;
