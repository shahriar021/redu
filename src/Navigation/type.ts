export type AuthStackParamList = {
  SignUp: undefined;
  SignIn: undefined;
  SplashScreen: undefined;
  ForgotPassword: undefined;
  OtpAuth: { email: string; type?: string };
  Profile: undefined;
  UserProfile: undefined;
  ProfileSetup: { accessToken?: string; email?: string };
  RequiredDocuments: { accessToken?: string };
  ResetPassword: undefined;
  OtpVerification: {
    email: string;
  };
  CreateNewPassword: {
    email: string;
    otp: string;
  };
  UserMainTabs: undefined;
  UserNearByTrucks: undefined;
  UserDirectBooking: {
    driverUserId: string;
    truckTypeId: string;
    truckName: string;
    driverName?: string;
    driverAvatar?: string | null;
  };
  UserMappingView: undefined;
  UserSetDropOff: undefined;
  UserSearchLocation: { type?: 'pickup' | 'dropoff' } | undefined;
  UserScheduleShifting: undefined;
  UserSelectTruck: undefined;
  UserOrderDetails: undefined;
  UserFindingDrivers: {
    pickup?: any;
    dropoff?: any;
    routeData?: any;
    selectedTruck?: any;
    scheduleDate?: string;
    scheduleTime?: string;
    workNotes?: string;
    costBreakdown?: any;
    jobId?: string;
    bookingId?: string;
  };
  UserLiveTracking: {
    pickup?: any;
    dropoff?: any;
    routeData?: any;
    selectedTruck?: any;
    scheduleDate?: string;
    scheduleTime?: string;
    workNotes?: string;
    costBreakdown?: any;
    jobId?: string;
    bookingId?: string;
    driver?: any;
  };
  UserRateDriver: {
    jobId: string;
  };
  UserEditProfile: undefined;
  DriverMainTabs: undefined;
  UserNotificationSettings: undefined;
  UserPasswordChange: undefined;
  UserPrivacyPolicy: undefined;
  UserHelpSupport: undefined;
  UserActiveJobsDetails: {
    jobId: string;
  };
  UserCompleteJobsDetails: {
    jobId: string;
  };
  LocationPermission: {
    type: string;
  };
  DriverEditProfile: undefined;
  DriverDocuments: undefined;
  DriverEarnings: undefined;
  DriverProfile: undefined;
  DriverJobsDetails: {
    jobId: string;
  };
  DriverJobsComplete: {
    jobId: string;
  };
  JobAssigned: {
    jobId: string;
  };
  HeadingToPickup: {
    jobId: string;
  };
  DriverPayout: undefined;
  DriverPendingVerification: undefined;
  VehicleDetails: undefined;
  Notification: undefined;
  PrivacyPolicy: undefined;
  OnBoardingFrist: undefined;
};
