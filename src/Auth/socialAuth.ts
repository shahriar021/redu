import AsyncStorage from '@react-native-async-storage/async-storage'
import * as AppleAuthentication from 'expo-apple-authentication'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import axios from 'axios'
import { Platform } from 'react-native'
import { IPA_BASE, GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '@env'

// Configure once at module load — safe to call before signIn()
GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  iosClientId: GOOGLE_IOS_CLIENT_ID,
  offlineAccess: false,
})

export type SocialRole = 'CUSTOMER' | 'DRIVER'

export interface SocialAuthUser {
  id: string
  email: string
  fullName: string
  phoneNumber: string
  role: 'USER' | 'DRIVER'
  isVerified: boolean
  profile?: string
}

export interface SocialAuthResult {
  user: SocialAuthUser
  accessToken: string
  refreshToken: string
}

// Stored pending credentials so we can retry with a role after the modal
export interface PendingGoogleCredential { type: 'google'; idToken: string }
export interface PendingAppleCredential { type: 'apple'; identityToken: string; fullName?: string }
export type PendingCredential = PendingGoogleCredential | PendingAppleCredential

function mapUser(u: any): SocialAuthUser {
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    phoneNumber: u.mobileNumber ?? '',
    role: (u.role === 'DRIVER' ? 'DRIVER' : 'USER') as 'USER' | 'DRIVER',
    isVerified: true,
    profile: u.avatar ?? undefined,
  }
}

async function postToBackend(endpoint: string, body: Record<string, string>): Promise<SocialAuthResult> {
  const res = await axios.post(`${IPA_BASE}${endpoint}`, body, { timeout: 15000 })
  const d = res.data?.data
  if (!res.data?.success || !d) throw new Error(res.data?.message ?? 'Authentication failed')
  await AsyncStorage.setItem('vRefreshToken', d.refreshToken)
  return { user: mapUser(d.user), accessToken: d.accessToken, refreshToken: d.refreshToken }
}

// ─── Google ───────────────────────────────────────────────────────────────────

// Step 1: show the Google account picker and return the idToken
export async function getGoogleIdToken(): Promise<string> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
  const response = await GoogleSignin.signIn()

  if (response.type === 'cancelled') {
    const err = new Error('Sign-in cancelled') as any
    err.code = 'SIGN_IN_CANCELLED'
    throw err
  }

  const idToken = response.data?.idToken
  if (!idToken) throw new Error('Google sign-in returned no ID token')
  return idToken
}

// Step 2: exchange the idToken for a backend session (role only needed for new users)
export async function googleSignInWithIdToken(idToken: string, role?: SocialRole): Promise<SocialAuthResult> {
  const body: Record<string, string> = { idToken }
  if (role) body.role = role
  return postToBackend('/auth/google/mobile', body)
}

// ─── Apple ────────────────────────────────────────────────────────────────────

// Step 1: show the Apple sheet and return the credential
export async function getAppleCredential(): Promise<{ identityToken: string; fullName?: string }> {
  if (Platform.OS !== 'ios') throw new Error('Apple Sign-In is only available on iOS')

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  })

  if (!credential.identityToken) throw new Error('No identity token from Apple')

  const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
    .filter(Boolean)
    .join(' ') || undefined

  return { identityToken: credential.identityToken, fullName }
}

// Step 2: exchange the Apple credential for a backend session
export async function appleSignInWithCredential(
  identityToken: string,
  fullName?: string,
  role?: SocialRole,
): Promise<SocialAuthResult> {
  const body: Record<string, string> = { identityToken }
  if (fullName) body.fullName = fullName
  if (role) body.role = role
  return postToBackend('/auth/apple/mobile', body)
}
