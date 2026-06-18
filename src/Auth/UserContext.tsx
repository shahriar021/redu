// src/context/UserContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import axios from 'axios'
import { IPA_BASE } from '@env'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from './AuthContext'

export interface UserData {
  id?: string
  name: string
  email: string
  phone?: string
  address?: string
  profileImage?: string
  role?: string
  createdAt?: string
}

interface UserContextValue {
  user: UserData | null
  isLoading: boolean
  error: string | null
  fetchUserProfile: () => Promise<void>
  updateProfile: (data: FormData) => Promise<boolean>
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>
  deleteAccount: () => Promise<boolean>
  updateLocalUser: (userData: Partial<UserData>) => void
  clearUser: () => void
  saveProfileImageLocally: (imageUri: string) => Promise<string>
  getProfileImage: () => Promise<string | null>
}

const UserContext = createContext<UserContextValue | undefined>(undefined)

const PROFILE_IMAGE_KEY = '@user_profile_image'

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signOut, token } = useAuth()

  // Load user from storage on mount
  useEffect(() => {
    loadStoredUser()
  }, [])

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('@user_data')
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        // Get stored profile image
        const profileImage = await getProfileImage()
        if (profileImage) {
          userData.profileImage = profileImage
        }
        setUser(userData)
      }
    } catch (error) {
      console.error('Error loading stored user:', error)
    }
  }

  const saveUserToStorage = async (userData: UserData) => {
    try {
      await AsyncStorage.setItem('@user_data', JSON.stringify(userData))
    } catch (error) {
      console.error('Error saving user to storage:', error)
    }
  }

  const saveProfileImageLocally = async (imageUri: string): Promise<string> => {
    try {
      // For remote images, store the URL
      if (imageUri.startsWith('http')) {
        await AsyncStorage.setItem(PROFILE_IMAGE_KEY, imageUri)
        return imageUri
      }
      
      // For local images, we need to convert to base64 or save the URI
      // For now, we'll store the URI
      await AsyncStorage.setItem(PROFILE_IMAGE_KEY, imageUri)
      return imageUri
    } catch (error) {
      console.error('Error saving profile image:', error)
      return imageUri
    }
  }

  const getProfileImage = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(PROFILE_IMAGE_KEY)
    } catch (error) {
      console.error('Error getting profile image:', error)
      return null
    }
  }

  const fetchUserProfile = useCallback(async () => {
    if (!token) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.get(
        `${IPA_BASE}/user/profile`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.data?.success && response.data?.data) {
        const userData: UserData = {
          id: response.data.data.id,
          name: response.data.data.fullName,
          email: response.data.data.email,
          phone: response.data.data.mobileNumber,
          role: response.data.data.role,
          createdAt: response.data.data.createdAt,
          profileImage: response.data.data.avatar
        }
        
        setUser(userData)
        await saveUserToStorage(userData)
        
        // Save profile image locally if exists
        if (userData.profileImage) {
          await saveProfileImageLocally(userData.profileImage)
        }
      } else {
        setError(response.data?.message || 'Failed to load user profile')
      }
    } catch (err: any) {
      console.error('Error fetching user profile:', err)
      
      if (err.response?.status === 401) {
        await signOut()
      }
      
      setError(err.response?.data?.message || 'Failed to load user profile')
    } finally {
      setIsLoading(false)
    }
  }, [token, signOut])

  const updateProfile = useCallback(async (formData: FormData): Promise<boolean> => {
    if (!token) return false

    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.patch(
        `${IPA_BASE}/user/profile`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.data?.success && response.data?.data) {
        const updatedUser: UserData = {
          ...user,
          name: response.data.data.fullName,
          email: response.data.data.email,
          phone: response.data.data.mobileNumber,
          profileImage: response.data.data.avatar
        }
        
        setUser(updatedUser)
        await saveUserToStorage(updatedUser)
        
        if (updatedUser.profileImage) {
          await saveProfileImageLocally(updatedUser.profileImage)
        }
        
        return true
      } else {
        setError(response.data?.message || 'Failed to update profile')
        return false
      }
    } catch (err: any) {
      console.error('Error updating profile:', err.response?.data || err.message)
      
      if (err.response?.status === 401) {
        await signOut()
      }
      
      setError(err.response?.data?.message || 'Failed to update profile')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [token, signOut, user])

  const changePassword = useCallback(async (oldPassword: string, newPassword: string): Promise<boolean> => {
    if (!token) return false

    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.post(
        `${IPA_BASE}/user/change-password`,
        {
          currentPassword: oldPassword,
          newPassword
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.data?.success) {
        return true
      } else {
        setError(response.data?.message || 'Failed to change password')
        return false
      }
    } catch (err: any) {
      console.error('Error changing password:', err)
      
      if (err.response?.status === 401) {
        await signOut()
      }
      
      setError(err.response?.data?.message || 'Failed to change password')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [token, signOut])

  const deleteAccount = useCallback(async (): Promise<boolean> => {
    if (!token) return false

    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.delete(
        `${IPA_BASE}/user/account`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.data?.success) {
        await clearUser()
        await signOut()
        return true
      } else {
        setError(response.data?.message || 'Failed to delete account')
        return false
      }
    } catch (err: any) {
      console.error('Error deleting account:', err)
      setError(err.response?.data?.message || 'Failed to delete account')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [token, signOut])

  const updateLocalUser = useCallback((userData: Partial<UserData>) => {
    setUser(prev => {
      const updated = { ...prev, ...userData } as UserData
      saveUserToStorage(updated)
      return updated
    })
  }, [])

  const clearUser = useCallback(async () => {
    setUser(null)
    await AsyncStorage.removeItem('@user_data')
    await AsyncStorage.removeItem(PROFILE_IMAGE_KEY)
  }, [])

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        error,
        fetchUserProfile,
        updateProfile,
        changePassword,
        deleteAccount,
        updateLocalUser,
        clearUser,
        saveProfileImageLocally,
        getProfileImage
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}