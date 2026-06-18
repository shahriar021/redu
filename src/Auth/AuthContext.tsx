import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { IPA_BASE } from '@env';
import { navigationRef } from '../Navigation/navigationRef';

const EXPO_PROJECT_ID =
  (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ??
  'd9e06a04-deaf-4074-acb5-47a3f065ca3f';

async function registerPushToken(authToken: string) {
  try {
    // Push tokens only available on physical devices; simulators/emulators silently skip
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      let perms = await Notifications.getPermissionsAsync();
      if (!perms.granted) {
        perms = await Notifications.requestPermissionsAsync();
      }
      if (!perms.granted) {
        console.warn('[Push] Permission not granted — push notifications disabled');
        return;
      }
      const tokenResult = await Notifications.getExpoPushTokenAsync({
        projectId: EXPO_PROJECT_ID,
      });
      const expoPushToken = tokenResult.data;
      await axios.post(`${IPA_BASE}/user/fcm-token`, { fcmToken: expoPushToken }, {
        headers: { Authorization: `Bearer ${authToken}` },
        timeout: 5000,
      });
    }
  } catch (err: unknown) {
    // Surface the specific error — common failures: FCM not configured, no project ID, emulator
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[Push] Token registration failed:', msg);
  }
}

interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: 'USER' | 'DRIVER';
  isVerified: boolean;
  profile?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isFirstLaunch: boolean;
  signIn: (userData: User, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  token: string | null;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (value: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboardingState] = useState(false);
  const tokenRef = useRef<string | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // Keep tokenRef in sync so AppState handler always has the latest token
  useEffect(() => { tokenRef.current = token; }, [token]);

  // Re-register push token when app returns to foreground from background.
  // Skips the initial active state on mount (handled by loadStoredData).
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      // Only fire when coming back from background/inactive, not on initial mount
      if (nextState === 'active' && (prev === 'background' || prev === 'inactive') && tokenRef.current) {
        registerPushToken(tokenRef.current);
      }
    };
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, []);

  // Check if first launch
  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const [[, firstLaunch], [, onboardingDone]] = await AsyncStorage.multiGet(['isFirstLaunch', 'onboardingCompleted']);
      setIsFirstLaunch(firstLaunch === null || onboardingDone !== 'true');
    } catch (error) {
      console.error('Error checking first launch:', error);
      setIsFirstLaunch(false);
    }
  };

  // Load user data on mount
  useEffect(() => {
    loadStoredData();
  }, []);

  // Global 401 interceptor — kick to SignIn on expired/invalid token
  useEffect(() => {
    const id = axios.interceptors.response.use(
      res => res,
      async err => {
        const url: string = err.config?.url ?? ''
        if (err.response?.status === 401 && !url.includes('/auth/')) {
          try {
            await AsyncStorage.multiRemove(['vToken', 'vRefreshToken', 'vUser', 'vDriver', '@user_data', '@user_profile_image'])
          } catch {}
          setToken(null)
          setUser(null)
          if (navigationRef.isReady()) {
            navigationRef.reset({ index: 0, routes: [{ name: 'SignIn' }] })
          }
        }
        return Promise.reject(err)
      }
    )
    return () => axios.interceptors.response.eject(id)
  }, [])

  const loadStoredData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('vToken');
      const storedUser = await AsyncStorage.getItem('vUser');
      const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setHasCompletedOnboardingState(onboardingCompleted === 'true');
        registerPushToken(storedToken);
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (userData: User, authToken: string) => {
    try {
      await AsyncStorage.setItem('vToken', authToken);
      await AsyncStorage.setItem('vUser', JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);
      registerPushToken(authToken);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.multiRemove(['vToken', 'vRefreshToken', 'vUser', 'vDriver', '@user_data', '@user_profile_image']);
    } catch (error) {
      console.error('Error clearing storage on sign out:', error);
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      await AsyncStorage.setItem('vUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  const setHasCompletedOnboarding = async (value: boolean) => {
    await AsyncStorage.setItem('onboardingCompleted', value.toString());
    if (value) {
      await AsyncStorage.setItem('isFirstLaunch', 'false');
      setIsFirstLaunch(false);
    }
    setHasCompletedOnboardingState(value);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isFirstLaunch: isFirstLaunch ?? true,
        signIn,
        signOut,
        updateUser,
        token,
        hasCompletedOnboarding,
        setHasCompletedOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};