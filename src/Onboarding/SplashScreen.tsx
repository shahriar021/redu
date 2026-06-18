import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Images } from '../constants';
import { AuthStackParamList } from '../Navigation/type';
import { useAuth } from '../Auth/AuthContext';

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

const SplashScreen = () => {
    const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
    const { user, isFirstLaunch, hasCompletedOnboarding } = useAuth();
    const progressAnim = useRef(new Animated.Value(0)).current;

    useFocusEffect(() => {
        Animated.timing(progressAnim, {
            toValue: 100,
            duration: 5000,
            useNativeDriver: false,
        }).start();
    });

    useEffect(() => {
        const t = setTimeout(() => {
            if (user) {
                if (user.role === 'DRIVER') {
                    (navigation as any).replace("DriverMainTabs");
                } else {
                    (navigation as any).replace("UserMainTabs");
                }
            } else if (isFirstLaunch && !hasCompletedOnboarding) {
                (navigation as any).replace("OnBoardingFrist");
            } else {
                (navigation as any).replace("SignIn");
            }
        }, 5000);

        return () => clearTimeout(t);
    }, [navigation, user, isFirstLaunch, hasCompletedOnboarding]);

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    return (
        <SafeAreaView style={styles.safe}>
            <View className='flex-1'>
                <LinearGradient
                    colors={['#F8DC59', '#7ACB74']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.container}>
                    <Image source={Images.Logo} style={styles.logo} />
                    <View style={styles.loadingWrap}>
                        <Text style={styles.loadingText}>Loading...</Text>
                        <View style={styles.barOuter}>
                            <View style={styles.barTrack}>
                                <AnimatedGradient
                                    colors={['#F6DC03', '#26A201']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.barFill, { width: progressWidth }]}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default SplashScreen;

const styles = StyleSheet.create({
    safe: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    logo: {
        width: 260,
        height: 260,
        resizeMode: 'contain',
    },
    loadingWrap: {
        position: 'absolute',
        bottom: 95,
        width: '100%',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 20,
        color: '#1F1F1F',
        marginBottom: 18,
        fontWeight: '400',
    },
    barOuter: {
        width: '70%',
        height: 22,
        borderWidth: 3,
        borderColor: '#4AAE2A',
        backgroundColor: 'transparent',
    },
    barTrack: {
        flex: 1,
        margin: 2,
        backgroundColor: 'rgba(255,255,255,0.15)',
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
    },
});