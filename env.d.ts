declare module '@env' {
  export const IPA_BASE: string
  export const SOCKET_URL: string
  export const GOOGLE_MAPS_API_KEY: string

  // Auth (SignIn, SignUp, OtpAuth)
  export const LOGIN: string
  export const REGISTER: string
  export const RESEND_OTP: string
  export const IP_FIND: string

  // Driver home
  export const AVAILABLE_JOBS: string
  export const STATUS_DRIVER: string
  export const LOCATION_UPDATE: string
  export const DRIVER_DETAILS: string

  // Google OAuth
  export const GOOGLE_WEB_CLIENT_ID: string
  export const GOOGLE_IOS_CLIENT_ID: string

  //Stripe
  export const STRIPE_PUBLISHABLE_KEY: string
}
