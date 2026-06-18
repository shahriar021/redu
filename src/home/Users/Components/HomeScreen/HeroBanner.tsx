import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Images } from '../../../../constants'

interface HeroBannerProps {
  onBookPress: () => void
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onBookPress }) => (
  <View className="mb-2 rounded-3xl overflow-hidden">
    <LinearGradient colors={["#C9CD07", "#4CAF50"]} style={{ flex: 1 }}>
      <View className="p-5 flex-row items-center">
        <View className="flex-1">
          <Text className="text-white text-3xl font-bold mb-2">
            Book a Truck{"\n"}Now
          </Text>
          <Text className="text-white text-xl mb-10 opacity-90">
            Reliable delivery in minutes.
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onBookPress}
            style={styles.btn}
          >
            <Ionicons name="rocket-outline" size={16} color="#4CAF50" />
            <Text style={styles.btnText}>Start Booking</Text>
            <Ionicons name="arrow-forward" size={16} color="#4CAF50" />
          </TouchableOpacity>
        </View>

        <Image
          source={Images.TruckIlastration}
          resizeMode="contain"
          style={{ position: "absolute", right: 0 }}
        />
      </View>
    </LinearGradient>
  </View>
)

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 11,
    alignSelf: 'flex-start',
  },
  btnText: {
    color: '#4CAF50',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.2,
  },
})