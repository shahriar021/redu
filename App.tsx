import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Linking, Platform } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_PUBLISHABLE_KEY } from '@env';
import "./global.css";

// Show notifications while app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
import CreateNewPassword from './src/Auth/CreateNewPassword';
import ForgotPassword from './src/Auth/ForgotPassword';
import OtpAuth from './src/Auth/OtpAuth';
import OtpVerification from './src/Auth/OtpVerification';
import SignIn from './src/Auth/SignIn';
import SignUp from './src/Auth/SignUp';
import ProfileSetup from './src/home/Drivers/ProfileSetup/ProfileSetup';
import RequiredDocuments from './src/home/Drivers/ProfileSetup/RequiredDocuments';
import DriverJobsComplete from './src/home/Drivers/screens/DriverJobs/DriverJobsComplete';
import DriverJobsDetails from './src/home/Drivers/screens/DriverJobs/DriverJobsDetails';
import HeadingToPickup from './src/home/Drivers/screens/DriverJobs/HeadingToPickup';
import JobAssigned from './src/home/Drivers/screens/DriverJobs/JobAssigned';
import DriverDocuments from './src/home/Drivers/screens/DriverProfile/DriverDocuments';
import DriverPendingVerification from './src/home/Drivers/screens/DriverProfile/DriverPendingVerification';
import DriverEarnings from './src/home/Drivers/screens/DriverProfile/DriverEarnings';
import DriverEditProfile from './src/home/Drivers/screens/DriverProfile/DriverEditProfile';
import DriverPayout from './src/home/Drivers/screens/DriverProfile/DriverPayout';
import VehicleDetails from './src/home/Drivers/screens/DriverProfile/VehicleDetails';
import DriverProfile from './src/home/Drivers/TabNavigation/DriverProfile';
import DriverMainTabs from './src/home/Drivers/TabNavigation/TabNavigation';
import UserDirectBooking from './src/home/Users/screens/UserHome/UserDirectBooking'
import UserFindingDrivers from './src/home/Users/screens/UserHome/UserFindingDrivers';
import UserMappingView from './src/home/Users/screens/UserHome/UserMappingView';
import UserNearByTrucks from './src/home/Users/screens/UserHome/UserNearByTrucks';
import UserOrderDetails from './src/home/Users/screens/UserHome/UserOrderDetails';
import UserScheduleShifting from './src/home/Users/screens/UserHome/UserScheduleShifting';
import UserSearchLocation from './src/home/Users/screens/UserHome/UserSearchLocation';
import UserSelectTruck from './src/home/Users/screens/UserHome/UserSelectTruck';
import UserSetDropOff from './src/home/Users/screens/UserHome/UserSetDropOff';
import UserActiveJobsDetails from './src/home/Users/screens/UserJobs/UserActiveJobsDetails';
import UserCompleteJobsDetails from './src/home/Users/screens/UserJobs/UserCompleteJobsDetails';
import UserRateDriver from './src/home/Users/screens/UserJobs/UserRateDriver';
import UserEditProfile from './src/home/Users/screens/UserProfile/UserEditProfile';
import UserHelpSupport from './src/home/Users/screens/UserProfile/UserHelpSupport';
import UserNotificationSettings from './src/home/Users/screens/UserProfile/UserNotificationSettings';
import UserPasswordChange from './src/home/Users/screens/UserProfile/UserPasswordChange';
import UserPrivacyPolicy from './src/home/Users/screens/UserProfile/UserPrivacyPolicy';
import UserMainTabs from './src/home/Users/TabNavigation/TabNavigation';
import UserProfile from './src/home/Users/TabNavigation/UserProfile';
import { AuthStackParamList } from './src/Navigation/type';
import OnBoardingFrist from './src/Onboarding/OnBoardingFrist';
import SplashScreen from './src/Onboarding/SplashScreen';
import LocationPermission from './src/Settings/LocationPermission';
import { AuthProvider, useAuth } from './src/Auth/AuthContext';
import { UserProvider } from './src/Auth/UserContext';
import { BookingProvider } from './src/Auth/BookingContext';
import { ActivityIndicator, View } from 'react-native';
import UserLiveTracking from './src/home/Users/screens/UserHome/UserLiveTracking';
import { navigationRef } from './src/Navigation/navigationRef';
import UserTermsNCondition from './src/home/Users/screens/UserProfile/UserTermsNCondition';
import UserAboutUs from './src/home/Users/screens/UserProfile/UserAboutUs';

// Android 8+ requires a notification channel to be created before push can appear
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4CAF50',
  });
}

const RootNav = createNativeStackNavigator<AuthStackParamList>();

const slideRight = { animation: 'slide_from_right' } as const;

function AppNavigation() {
  const { user, isLoading, isFirstLaunch } = useAuth();

  // Foreground push — fires when a push arrives while app is open.
  // The notification is already shown by setNotificationHandler above; this
  // listener handles any in-app side effects (e.g. badge refresh in the future).
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as Record<string, unknown>;
      console.log('[Push] Received in foreground:', data?.type ?? 'unknown');
    });
    return () => sub.remove();
  }, []);

  // Deep-link into the app when the user taps a push notification
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, any>;
      const type: string = data?.type ?? '';
      const jobId: string | undefined = data?.jobId;

      if (!navigationRef.isReady()) return;

      if ((type === 'JOB_ACCEPTED' || type === 'JOB_STATUS_UPDATE') && jobId) {
        navigationRef.navigate('UserActiveJobsDetails', { jobId });
      } else if (type === 'PAYMENT_RECEIVED' && jobId) {
        navigationRef.navigate('UserCompleteJobsDetails', { jobId });
      } else if (type === 'DRIVER_APPROVED' || type === 'JOB_BROADCAST') {
        navigationRef.navigate('DriverMainTabs');
      } else if (type === 'DOCUMENT_APPROVED' || type === 'DOCUMENT_REJECTED' || type === 'DRIVER_REJECTED') {
        navigationRef.navigate('DriverDocuments');
      }
    });
    return () => sub.remove();
  }, []);

  // Handle Stripe onboarding deep links (jobsitex://stripe/success | jobsitex://stripe/refresh)
  // Status is confirmed via Stripe webhook (account.updated) — no manual call needed here
  useEffect(() => {
    const handleUrl = (url: string) => {
      if (!navigationRef.isReady()) return;
      if (url.startsWith('jobsitex://stripe/')) {
        navigationRef.navigate('DriverPayout');
      }
    };

    const sub = Linking.addEventListener('url', (event) => handleUrl(event.url));

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    return () => sub.remove();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  const initialRoute: keyof AuthStackParamList = user
    ? (user.role === 'DRIVER' ? 'DriverMainTabs' : 'UserMainTabs')
    : (isFirstLaunch ? 'SplashScreen' : 'SignIn');

  return (
    <RootNav.Navigator
      screenOptions={{ headerShown: false, statusBarStyle: 'dark' }}
      initialRouteName={initialRoute}
    >
      {/* ── Onboarding / Auth ─────────────────────────────────────────────── */}
      <RootNav.Screen name="SplashScreen" component={SplashScreen} />
      <RootNav.Screen name="OnBoardingFrist" component={OnBoardingFrist} />
      <RootNav.Screen name="SignIn" options={{ animation: 'slide_from_left' }} component={SignIn} />
      <RootNav.Screen name="SignUp" options={slideRight} component={SignUp} />
      <RootNav.Screen name="OtpAuth" options={slideRight} component={OtpAuth} />
      <RootNav.Screen name="ForgotPassword" options={slideRight} component={ForgotPassword} />
      <RootNav.Screen name="OtpVerification" options={slideRight} component={OtpVerification} />
      <RootNav.Screen name="CreateNewPassword" options={slideRight} component={CreateNewPassword} />
      <RootNav.Screen name="LocationPermission" options={slideRight} component={LocationPermission} />
      <RootNav.Screen name="ProfileSetup" options={slideRight} component={ProfileSetup} />
      <RootNav.Screen name="RequiredDocuments" options={slideRight} component={RequiredDocuments} />

      {/* ── User Screens ──────────────────────────────────────────────────── */}
      <RootNav.Screen name="UserMainTabs" options={slideRight} component={UserMainTabs} />
      <RootNav.Screen name="UserEditProfile" options={slideRight} component={UserEditProfile} />
      <RootNav.Screen name="UserNotificationSettings" options={slideRight} component={UserNotificationSettings} />
      <RootNav.Screen name="UserPasswordChange" options={slideRight} component={UserPasswordChange} />
      <RootNav.Screen name="UserProfile" options={slideRight} component={UserProfile} />
      <RootNav.Screen name="UserPrivacyPolicy" options={slideRight} component={UserPrivacyPolicy} />
      <RootNav.Screen name="UserTermsNCondition" options={slideRight} component={UserTermsNCondition} />
      <RootNav.Screen name="UserAboutUs" options={slideRight} component={UserAboutUs} />
      <RootNav.Screen name="UserHelpSupport" options={slideRight} component={UserHelpSupport} />
      <RootNav.Screen name="UserActiveJobsDetails" options={slideRight} component={UserActiveJobsDetails} />
      <RootNav.Screen name="UserCompleteJobsDetails" options={slideRight} component={UserCompleteJobsDetails} />
      <RootNav.Screen name="UserRateDriver" options={slideRight} component={UserRateDriver} />
      <RootNav.Screen name="UserNearByTrucks" options={slideRight} component={UserNearByTrucks} />
      <RootNav.Screen name="UserDirectBooking" options={slideRight} component={UserDirectBooking} />
      <RootNav.Screen name="UserMappingView" options={slideRight} component={UserMappingView} />
      <RootNav.Screen name="UserSetDropOff" options={slideRight} component={UserSetDropOff} />
      <RootNav.Screen name="UserSearchLocation" options={slideRight} component={UserSearchLocation} />
      <RootNav.Screen name="UserScheduleShifting" options={slideRight} component={UserScheduleShifting} />
      <RootNav.Screen name="UserSelectTruck" options={slideRight} component={UserSelectTruck} />
      <RootNav.Screen name="UserOrderDetails" options={slideRight} component={UserOrderDetails} />
      <RootNav.Screen name="UserFindingDrivers" options={slideRight} component={UserFindingDrivers} />
      <RootNav.Screen name="UserLiveTracking" options={slideRight} component={UserLiveTracking} />

      {/* ── Driver Screens ────────────────────────────────────────────────── */}
      <RootNav.Screen name="DriverMainTabs" options={slideRight} component={DriverMainTabs} />
      <RootNav.Screen name="DriverEditProfile" options={slideRight} component={DriverEditProfile} />
      <RootNav.Screen name="VehicleDetails" options={slideRight} component={VehicleDetails} />
      <RootNav.Screen name="DriverDocuments" options={slideRight} component={DriverDocuments} />
      <RootNav.Screen name="DriverEarnings" options={slideRight} component={DriverEarnings} />
      <RootNav.Screen name="DriverPayout" options={slideRight} component={DriverPayout} />
      <RootNav.Screen name="DriverPendingVerification" options={slideRight} component={DriverPendingVerification} />
      <RootNav.Screen name="DriverJobsDetails" options={slideRight} component={DriverJobsDetails} />
      <RootNav.Screen name="DriverJobsComplete" options={slideRight} component={DriverJobsComplete} />
      <RootNav.Screen name="JobAssigned" options={slideRight} component={JobAssigned} />
      <RootNav.Screen name="HeadingToPickup" options={slideRight} component={HeadingToPickup} />
      <RootNav.Screen name="DriverProfile" options={slideRight} component={DriverProfile} />
    </RootNav.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <BookingProvider>
          <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY} urlScheme="jobsitex">
            <NavigationContainer ref={navigationRef}>
              <StatusBar style='dark' />
              <AppNavigation />
            </NavigationContainer>
          </StripeProvider>
        </BookingProvider>
      </UserProvider>
    </AuthProvider>
  );
}
