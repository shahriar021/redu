import io, { Socket } from 'socket.io-client'
import { SOCKET_URL } from '@env'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type JobStatus =
  | 'PENDING'
  | 'BROADCAST'
  | 'BOOKED'
  | 'ON_WAY'
  | 'ARRIVED'
  | 'LOADED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED'

export interface JobStatusUpdateData {
  jobId: string
  status: JobStatus
}

export interface DriverLocationData {
  jobId: string
  lat: number
  lng: number
  heading?: number
  speed?: number
  ts: number
}

export interface JobNewData {
  jobId: string
  truckType: string
  pickupAddress: string
  dropoffAddress: string
  distanceKm: number
  estimatedFare: number
}

export interface JobDirectOfferData {
  jobId: string
  pickupAddress: string
  dropoffAddress: string
  estimatedFare: number
  timeoutSeconds: number
}

export interface NotificationData {
  id: string
  type: string
  title: string
  message: string
  data: Record<string, unknown>
  createdAt: string
}

class SocketService {
  private socket: Socket | null = null
  private isConnected = false
  private maxReconnectAttempts = 5

  async connect(): Promise<Socket> {
    if (this.socket && this.isConnected) return this.socket

    const token = await AsyncStorage.getItem('vToken')

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    this.socket.onAny((eventName, ...args) => {
  console.log('📡 ANY EVENT RECEIVED:', eventName, JSON.stringify(args))
})

    this.socket.on('connect', () => {
      this.isConnected = true
    })
    this.socket.on('disconnect', () => {
      this.isConnected = false
    })
    this.socket.on('connect_error', () => {
      // socket.io handles retries internally
    })

    return this.socket
  }

  onJobStatusUpdate(callback: (data: JobStatusUpdateData) => void) {
  console.log('👂 Registering listener for job:status-update')
  this.socket?.on('job:status-update', (data: JobStatusUpdateData) => {
    console.log('🎯 job:status-update EVENT FIRED:', JSON.stringify(data))
    callback(data)
  })
}

offJobStatusUpdate(callback: (data: JobStatusUpdateData) => void) {
  console.log('🔇 Removing listener for job:status-update')
  this.socket?.off('job:status-update', callback)
}

  onDriverLocation(callback: (data: DriverLocationData) => void) {
    this.socket?.on('driver:location', callback)
  }

  offDriverLocation(callback: (data: DriverLocationData) => void) {
    this.socket?.off('driver:location', callback)
  }

  onNotification(callback: (data: NotificationData) => void) {
  console.log('👂 Registering listener for notification')
  this.socket?.on('notification', (data: NotificationData) => {
    console.log('🔔 notification EVENT FIRED:', JSON.stringify(data))
    callback(data)
  })
}

offNotification(callback: (data: NotificationData) => void) {
  console.log('🔇 Removing listener for notification')
  this.socket?.off('notification', callback)
}

  onJobNew(callback: (data: JobNewData) => void) {
    this.socket?.on('job:new', callback)
  }

  offJobNew(callback: (data: JobNewData) => void) {
    this.socket?.off('job:new', callback)
  }

  onJobDirectOffer(callback: (data: JobDirectOfferData) => void) {
    this.socket?.on('job:direct-offer', callback)
  }

  offJobDirectOffer(callback: (data: JobDirectOfferData) => void) {
    this.socket?.off('job:direct-offer', callback)
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected
  }
}

export const socketService = new SocketService()
