import { IP_FIND, IPA_BASE, REGISTER } from '@env';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { googleSignIn, appleSignIn, type SocialRole } from './socialAuth';
import RoleSelectionModal from '../Components/RoleSelectionModal';
import { useAuth } from './AuthContext';
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    PanResponder,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import countryData from '../../assets/country.json';
import AppleButtonSvg from '../Components/Apple';
import GoogleButtonSvg from '../Components/Google';
import { Toast, useToast } from '../Components/useToost';
import { AuthStackParamList } from '../Navigation/type';
import { Images } from '../constants';

const API_BASE_URL = IPA_BASE;
const API_ENDPOINTS = {
    REGISTER,
};
const IP_API = IP_FIND;

const { height } = Dimensions.get('window');
const SHEET_MAX_HEIGHT = Math.min(700, height * 0.9);

interface Country {
    name: string;
    code: string;
    iso: string;
    flag: string;
}

const phoneRegex = /^[0-9]{6,15}$/; // Only digits, 6-15 length

/* ---------------- Country Picker ---------------- */
interface CountryPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (country: Country) => void;
    selectedCountry?: Country;
}

const CountryPickerComponent: React.FC<CountryPickerProps> = ({
    visible,
    onClose,
    onSelect,
    selectedCountry,
}) => {
    const [search, setSearch] = useState('');
    const [filteredCountries, setFilteredCountries] = useState<Country[]>(countryData as any);

    const translateY = useRef(new Animated.Value(height)).current;
    const searchInputRef = useRef<TextInput>(null);

    const backdropOpacity = translateY.interpolate({
        inputRange: [0, height],
        outputRange: [0.5, 0],
        extrapolate: 'clamp',
    });

    useEffect(() => {
        if (visible) {
            setSearch('');
            setFilteredCountries(countryData as any);

            translateY.setValue(height);
            Animated.timing(translateY, {
                toValue: 0,
                duration: 220,
                useNativeDriver: true,
            }).start();

            if (Platform.OS === 'ios') {
                const t = setTimeout(() => {
                    searchInputRef.current?.focus();
                }, 300);
                return () => clearTimeout(t);
            }
        } else {
            Animated.timing(translateY, {
                toValue: height,
                duration: 220,
                useNativeDriver: true,
            }).start();
        }
    }, [visible, translateY]);

    const closeSheet = () => {
        Keyboard.dismiss();
        Animated.timing(translateY, {
            toValue: height,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            onClose();
        });
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > Math.abs(g.dx),
            onPanResponderMove: (_, g) => {
                if (g.dy > 0) translateY.setValue(g.dy);
            },
            onPanResponderRelease: (_, g) => {
                const dragDistance = g.dy;
                if (dragDistance > SHEET_MAX_HEIGHT * 0.25 || g.vy > 0.5) {
                    closeSheet();
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        tension: 50,
                        friction: 12,
                    }).start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (search.trim() === '') {
            setFilteredCountries(countryData as any);
        } else {
            const q = search.toLowerCase();
            const filtered = (countryData as any).filter((country: Country) => {
                return (
                    country.name.toLowerCase().includes(q) ||
                    country.code.includes(search) ||
                    country.iso.toLowerCase().includes(q)
                );
            });
            setFilteredCountries(filtered);
        }
    }, [search]);

    const handleSelect = (country: Country) => {
        onSelect(country);
        closeSheet();
    };

    const renderItem = ({ item }: { item: Country }) => (
        <TouchableOpacity
            style={[
                styles.countryItem,
                selectedCountry?.code === item.code && styles.selectedCountryItem,
            ]}
            onPress={() => handleSelect(item)}
        >
            <Text style={styles.flagText}>{item.flag}</Text>
            <View style={styles.countryInfo}>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.countryCode}>{item.code}</Text>
            </View>
            {selectedCountry?.code === item.code && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={closeSheet}>
            <View style={styles.container}>
                <TouchableWithoutFeedback onPress={closeSheet}>
                    <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
                </TouchableWithoutFeedback>

                <Animated.View
                    style={[
                        styles.modal as any,
                        {
                            transform: [{ translateY }],
                            height: SHEET_MAX_HEIGHT,
                        },
                    ]}
                >
                    <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
                    >
                        <View style={{ flex: 1 }}>
                            <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
                                <View style={styles.dragHandle} />
                            </View>

                            <View style={styles.header}>
                                <Text style={styles.title}>Select Country</Text>
                                <TouchableOpacity onPress={closeSheet} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <Text style={styles.closeButton}>✕</Text>
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                ref={searchInputRef}
                                style={styles.searchInput}
                                placeholder="Search country..."
                                placeholderTextColor="#999"
                                value={search}
                                onChangeText={setSearch}
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoComplete="off"
                                spellCheck={false}
                                returnKeyType="search"
                                onSubmitEditing={() => Keyboard.dismiss()}
                            />

                            <FlatList
                                data={filteredCountries}
                                renderItem={renderItem}
                                keyExtractor={(item: any) => item.iso}
                                style={styles.list}
                                showsVerticalScrollIndicator
                                keyboardShouldPersistTaps="always"
                                onScrollBeginDrag={() => Keyboard.dismiss()}
                                scrollEventThrottle={16}
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyText}>No countries found</Text>
                                    </View>
                                }
                                contentContainerStyle={{ paddingBottom: 20 }}
                            />
                        </View>
                    </KeyboardAvoidingView>
                </Animated.View>
            </View>
        </Modal>
    );
};

/* ------------------ Screen ------------------ */
const SignUp = () => {
    const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
    const toast = useToast();
    const { signIn } = useAuth();
    const [type, setType] = useState<'CUSTOMER' | 'DRIVER'>('CUSTOMER');
    const [socialLoading, setSocialLoading] = useState(false);
    const [pendingProvider, setPendingProvider] = useState<'google' | 'apple' | null>(null);
    const swipeAnim = useRef(new Animated.Value(0)).current;

    const [number, setNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [selectedCountry, setSelectedCountry] = useState<Country>(() => {
        const bangladesh = (countryData as any).find((c: Country) => c.iso === 'BD') || (countryData as any)[0];
        return bangladesh;
    });

    // Swipe gesture handler
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 10,
            onPanResponderMove: (_, g) => {
                swipeAnim.setValue(g.dx);
            },
            onPanResponderRelease: (_, g) => {
                const swipeThreshold = 50;
                if (g.dx > swipeThreshold && type === 'DRIVER') {
                    // Swipe right: switch to CUSTOMER
                    setType('CUSTOMER');
                    Animated.spring(swipeAnim, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                } else if (g.dx < -swipeThreshold && type === 'CUSTOMER') {
                    // Swipe left: switch to DRIVER
                    setType('DRIVER');
                    Animated.spring(swipeAnim, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                } else {
                    Animated.spring(swipeAnim, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    useEffect(() => {
        const detectCountryFromIP = async () => {
            try {
                const response = await fetch(`https://api.ipfind.com/me?auth=${IP_API}`);
                if (!response.ok) return;

                const data = await response.json();
                if (data.country_code) {
                    const country = (countryData as any).find((c: Country) => c.iso === data.country_code);
                    if (country) setSelectedCountry(country);
                }
            } catch {
                // use default country
            }
        };

        detectCountryFromIP();
    }, []);

    const handleRememberMeChange = async (value: boolean) => {
        setRememberMe(value);

        try {
            await AsyncStorage.setItem('rememberMe', JSON.stringify(value));

            if (value && number.trim()) {
                await AsyncStorage.setItem('rememberedPhone', number);
                await AsyncStorage.setItem('rememberedCountry', JSON.stringify(selectedCountry));
            } else if (!value) {
                await AsyncStorage.removeItem('rememberedPhone');
                await AsyncStorage.removeItem('rememberedCountry');
            }
        } catch (error) {
            console.error('Error saving remember me data:', error);
        }
    };

    // ✅ Full number: +<countryDigits><cleanDigits>
    const getFullPhoneNumber = () => {
        const countryDigits = selectedCountry.code.replace(/\D/g, ''); // "+880" -> "880"
        const normalizedCountryCode = `+${countryDigits}`;

        const cleanPhoneNumber = number
            .replace(/\D/g, '')
            .replace(/^0+/, ''); // leading 0 remove

        return normalizedCountryCode + cleanPhoneNumber;
    };

    // ✅ Validate using full number (digits only)
    const validatePhoneOrToast = () => {
        const fullPhoneNumber = getFullPhoneNumber();
        const digitsOnly = fullPhoneNumber.replace(/\D/g, '');

        // NOTE: regex expects 6-15 digits total (including country code digits)
        // If you want 6-15 without country code, change logic accordingly.
        if (!phoneRegex.test(digitsOnly)) {
            toast.show({
                message: 'Please enter a valid phone number (6-15 digits).',
                type: 'warning',
                style: 'top',
            });
            return { ok: false, phone: '' };
        }

        return { ok: true, phone: fullPhoneNumber };
    };

    useFocusEffect(
        useCallback(() => {
            const loadRememberedNumber = async () => {
                try {
                    if (rememberMe) {
                        const savedNumber = await AsyncStorage.getItem('rememberedPhone');
                        if (savedNumber) setNumber(savedNumber);
                    }
                } catch (error) {
                    console.error('Error loading remembered number:', error);
                }
            };

            loadRememberedNumber();
        }, [rememberMe])
    );

    const handleCountrySelect = (country: Country) => {
        setSelectedCountry(country);
        if (rememberMe) {
            AsyncStorage.setItem('rememberedCountry', JSON.stringify(country));
        }
    };

    const validate = () => {
        if (!fullName.trim()) return 'Name required';
        if (!email.trim()) return 'Email required';
        if (!number.trim()) return 'Number is required';
        if (!password) return 'Password required';
        if (password.length < 6) return 'Password must be at least 6 characters';

        const v = validatePhoneOrToast();
        if (!v.ok) return 'Invalid phone number';

        return null;
    };

    const handleSignUp = async () => {
        const err = validate();
        if (err) {
            toast.show({ message: err, type: 'warning', style: 'top' });
            return;
        }

        const v = validatePhoneOrToast();
        if (!v.ok) return;

        try {
            setIsLoading(true);

            const res = await axios.post(
                `${API_BASE_URL}/auth/signup`,
                {
                    email: email.trim().toLowerCase(),
                    password,
                    fullName: fullName.trim(),
                    mobileNumber: v.phone,
                    role: type,
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 15000,
                }
            );
            const data = res.data;
            if (data?.success === true) {
                toast.show({ message: 'Account created! Check your email for the OTP.', type: 'success', style: 'top' });
                setTimeout(() => {
                    (navigation as any).replace("OtpAuth", {
                        type: type,
                        email: email.trim().toLowerCase(),
                    });
                }, 1500);
            } else {
                toast.show({ message: data?.message || 'Sign up failed', type: 'error', style: 'top' });
            }
        } catch (e: any) {
            const msg = e?.response?.data?.message || e?.message || 'Something went wrong';
            toast.show({ message: msg, type: 'error', style: 'top' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignIn = () => {
        (navigation as any).replace('SignIn', { type });
    };

    const handleRoleSelect = async (role: SocialRole) => {
        const provider = pendingProvider;
        setPendingProvider(null);
        setType(role === 'DRIVER' ? 'DRIVER' : 'CUSTOMER');
        setSocialLoading(true);
        try {
            const result = provider === 'google'
                ? await googleSignIn(role)
                : await appleSignIn(role);
            if (!result) return;
            await signIn(result.user as any, result.accessToken);

            if (result.user.role === 'DRIVER') {
                let dest = 'ProfileSetup';
                try {
                    const profileRes = await axios.get(`${API_BASE_URL}/driver/profile`, {
                        headers: { Authorization: `Bearer ${result.accessToken}` },
                        timeout: 10000,
                    });
                    const profile = profileRes.data?.data;
                    if (profile?.isProfileComplete && profile?.driverStatus === 'APPROVED') dest = 'DriverMainTabs';
                    else if (profile?.isProfileComplete) dest = 'DriverPendingVerification';
                } catch { /* fall through to ProfileSetup */ }
                navigation.reset({ index: 0, routes: [{ name: dest as any }] });
            } else {
                navigation.reset({ index: 0, routes: [{ name: 'UserMainTabs' as any }] });
            }
        } catch (e: any) {
            const code = e?.code ?? '';
            if (code !== 'SIGN_IN_CANCELLED' && code !== 'IN_PROGRESS' && code !== 'ERR_REQUEST_CANCELED') {
                toast.show({ message: e?.response?.data?.message ?? e?.message ?? 'Sign-up failed', type: 'error', style: 'top' });
            }
        } finally {
            setSocialLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView showsHorizontalScrollIndicator={false} className="px-6 flex-1">
                <Image
                    source={Images.Logo}
                    className="self-center mt-8 mb-4"
                    style={{ width: 160, height: 160 }}
                    resizeMode="contain"
                />

                <Text className="text-3xl font-bold text-gray-dark mb-2">Sign Up</Text>
                <Text className="text-base text-gray-medium mb-6">Hello! Let's join with us</Text>



                <View className="flex-row items-center mb-4">
                    <TouchableOpacity
                        className={`flex-1 py-3 rounded-2xl border ${type === 'CUSTOMER' ? 'bg-primary border-primary' : 'bg-white border-gray-300'}`}
                        onPress={() => setType('CUSTOMER')}
                    >
                        <Text className={`text-center text-lg font-medium ${type === 'CUSTOMER' ? 'text-white' : 'text-gray-dark'}`}>Customer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`flex-1 py-3 rounded-2xl border ${type === 'DRIVER' ? 'bg-primary border-primary' : 'bg-white border-gray-300'}`}
                        onPress={() => setType('DRIVER')}
                    >
                        <Text className={`text-center text-lg font-medium ${type === 'DRIVER' ? 'text-white' : 'text-gray-dark'}`}>Driver</Text>
                    </TouchableOpacity>
                </View>

                {/* Full Name */}
                <View
                    className="bg-white rounded-2xl px-4 py-2 flex-row items-center mb-4 border"
                    style={{ borderColor: focusedInput === 'name' ? '#22C55E' : '#E5E7EB' }}
                >
                    <Ionicons name="person-outline" size={24} color="#9CA3AF" />
                    <TextInput
                        className="flex-1 ml-3 text-lg text-gray-dark"
                        placeholder="Full name"
                        placeholderTextColor="#9CA3AF"
                        value={fullName}
                        onChangeText={setFullName}
                        onFocus={() => setFocusedInput('name')}
                        onBlur={() => setFocusedInput(null)}
                        autoCorrect={false}
                        autoComplete="off"
                        spellCheck={false}
                    />
                </View>

                {/* Email */}
                <View
                    className="bg-white rounded-2xl px-4 py-2 flex-row items-center mb-4 border"
                    style={{ borderColor: focusedInput === 'email' ? '#22C55E' : '#E5E7EB' }}
                >
                    <Ionicons name="mail-outline" size={24} color="#9CA3AF" />
                    <TextInput
                        className="flex-1 ml-3 text-lg text-gray-dark"
                        placeholder="Enter your email"
                        placeholderTextColor="#9CA3AF"
                        value={email}
                        onChangeText={setEmail}
                        onFocus={() => setFocusedInput('email')}
                        onBlur={() => setFocusedInput(null)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="off"
                        spellCheck={false}
                        importantForAutofill="no"
                    />
                </View>

                {/* Number */}
                <View
                    className="bg-white rounded-2xl px-4 py-2 flex-row items-center mb-4 border"
                    style={{ borderColor: focusedInput === 'number' ? '#22C55E' : '#E5E7EB' }}
                >
                    <Ionicons name="call-outline" size={24} color="#9CA3AF" />

                    <TouchableOpacity
                        className="flex-row items-center px-4 py-4 min-w-[100]"
                        onPress={() => {
                            Keyboard.dismiss();
                            setShowCountryPicker(true);
                        }}
                        disabled={isLoading}
                    >
                        <Text className="text-gray-dark text-lg mr-2">{selectedCountry.flag}</Text>
                        <Text className="text-gray-dark text-lg">{selectedCountry.code}</Text>
                        <Ionicons name="chevron-down" size={20} color="#1C1C1C" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>

                    <TextInput
                        className="flex-1 ml-3 text-lg text-gray-dark"
                        placeholder="Enter your number"
                        placeholderTextColor="#9CA3AF"
                        value={number}
                        onChangeText={setNumber}
                        keyboardType="number-pad"
                        autoCapitalize="none"
                        onFocus={() => setFocusedInput('number')}
                        onBlur={() => setFocusedInput(null)}
                        autoCorrect={false}
                        autoComplete="off"
                        spellCheck={false}
                        importantForAutofill="no"
                    />
                </View>

                {/* Password */}
                <View
                    className="bg-white rounded-2xl px-4 py-2 flex-row items-center mb-4 border"
                    style={{ borderColor: focusedInput === 'password' ? '#22C55E' : '#E5E7EB' }}
                >
                    <Ionicons name="lock-closed-outline" size={24} color="#9CA3AF" />
                    <TextInput
                        className="flex-1 ml-3 lg text-gray-dark"
                        placeholder="Enter your password"
                        placeholderTextColor="#9CA3AF"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        onFocus={() => setFocusedInput('password')}
                        onBlur={() => setFocusedInput(null)}
                        autoCorrect={false}
                        autoComplete="off"
                        spellCheck={false}
                        importantForAutofill="no"
                        textContentType="none"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={24} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={handleSignUp} className="bg-primary py-5 rounded-2xl mb-4" activeOpacity={0.8}>
                    <Text className="text-white text-center text-lg font-bold">{isLoading ? 'LOADING...' : 'SIGN UP'}</Text>
                </TouchableOpacity>

                <View className="flex-row justify-center mb-6">
                    <Text className="text-gray-medium text-lg">Already have an account? </Text>
                    <TouchableOpacity onPress={handleSignIn}>
                        <Text className="text-secondary font-semibold text-lg">Sign In</Text>
                    </TouchableOpacity>
                </View>

                <View className="flex-row items-center mb-4">
                    <View className="flex-1 h-px bg-gray-300" />
                    <Text className="mx-4 text-gray-medium text-lg font-bold">Or</Text>
                    <View className="flex-1 h-px bg-gray-300" />
                </View>

                <Text className="text-center font-semibold text-gray-medium text-lg mb-4">Sign Up With</Text>

                <View className="flex-row justify-center gap-4">
                    <TouchableOpacity
                        onPress={() => setPendingProvider('google')}
                        disabled={socialLoading || isLoading}
                        className="bg-white border border-gray-200 rounded-2xl px-6 py-4 flex-row items-center justify-center flex-1"
                        activeOpacity={0.8}
                    >
                        <GoogleButtonSvg />
                    </TouchableOpacity>

                    {Platform.OS === 'ios' && (
                        <TouchableOpacity
                            onPress={() => setPendingProvider('apple')}
                            disabled={socialLoading || isLoading}
                            className="bg-white border border-gray-200 rounded-2xl px-6 py-4 flex-row items-center justify-center flex-1"
                            activeOpacity={0.8}
                        >
                            <AppleButtonSvg />
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            <CountryPickerComponent
                visible={showCountryPicker}
                onClose={() => setShowCountryPicker(false)}
                onSelect={handleCountrySelect}
                selectedCountry={selectedCountry}
            />

            <RoleSelectionModal
                visible={pendingProvider !== null}
                onSelect={handleRoleSelect}
                onCancel={() => setPendingProvider(null)}
            />

            <Toast
                style={toast.style}
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                fadeAnim={toast.fadeAnim}
                buttons={toast.buttons}
                onHide={toast.hide}
            />
        </SafeAreaView>
    );
};

/* ------------------ Styles ------------------ */
const styles = {
    container: {
        flex: 1,
        justifyContent: 'flex-end' as const,
    },
    backdrop: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modal: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        width: '100%',
        position: 'absolute' as const,
        bottom: 0,
        left: 0,
        right: 0,
    },
    dragHandleContainer: {
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        paddingVertical: 8,
        marginBottom: 8,
    },
    dragHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#ddd',
        borderRadius: 3,
    },
    header: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold' as const,
        color: '#000',
    },
    closeButton: {
        fontSize: 24,
        color: '#666',
        padding: 4,
    },
    searchInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 18,
        marginBottom: 16,
        color: '#000',
    },
    list: {
        flex: 1,
    },
    countryItem: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    selectedCountryItem: {
        backgroundColor: '#e3f2fd',
    },
    flagText: {
        fontSize: 24,
        marginRight: 12,
    },
    countryInfo: {
        flex: 1,
    },
    countryName: {
        fontSize: 16,
        color: '#000',
        marginBottom: 2,
    },
    countryCode: {
        fontSize: 14,
        color: '#666',
    },
    checkmark: {
        fontSize: 18,
        color: '#007AFF',
        fontWeight: 'bold' as const,
    },
    emptyContainer: {
        padding: 32,
        alignItems: 'center' as const,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center' as const,
    },
};

export default SignUp;