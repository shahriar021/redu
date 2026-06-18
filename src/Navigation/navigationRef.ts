import { createNavigationContainerRef } from '@react-navigation/native'
import { AuthStackParamList } from './type'

export const navigationRef = createNavigationContainerRef<AuthStackParamList>()
