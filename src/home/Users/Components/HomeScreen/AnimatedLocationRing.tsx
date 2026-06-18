import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Image, TouchableOpacity, View } from 'react-native'
import { useUser } from '../../../../Auth/UserContext'

interface AnimatedLocationRingProps {
  onPress: () => void
}

const AnimatedLocationRing: React.FC<AnimatedLocationRingProps> = ({ onPress }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current
  const { user, getProfileImage } = useUser()
  const [cachedImage, setCachedImage] = useState<string | null>(null)

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 7000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start()
  }, [])

  useEffect(() => {
    getProfileImage().then((uri) => {
      if (uri) setCachedImage(uri)
    })
  }, [])

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const avatarUri = user?.profileImage || cachedImage

  return (
    <View className='relative w-[72px] h-[72px]'>
      <Animated.View
        style={{ transform: [{ rotate }] }}
        className='absolute inset-0 border-2 border-dashed border-white rounded-full'
      />
      <TouchableOpacity onPress={onPress} className='absolute inset-0 items-center justify-center'>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} className='w-16 h-16 rounded-full' />
        ) : (
          <View className='w-16 h-16 rounded-full bg-white items-center justify-center'>
            <Ionicons name='person' size={32} color='#4CAF50' />
          </View>
        )}
      </TouchableOpacity>
    </View>
  )
}

export default AnimatedLocationRing
