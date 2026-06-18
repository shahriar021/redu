import io, { Socket } from 'socket.io-client'
import { SOCKET_URL } from '@env'
import AsyncStorage from '@react-native-async-storage/async-storage'

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

export interface LocationPayload {
  lat: number
  lng: number
  heading?: number
  speed?: number
}

export interface NotificationData {
  id: string
  type: string
  title: string
  message: string
  data: Record<string, unknown>
  createdAt: string
}

class DriverSocketService {
  private socket: Socket | null = null
  private isConnected = false
  private subscribedRadius: number | null = null

  async connect(): Promise<Socket> {
    if (this.socket && this.isConnected) return this.socket

    // Socket exists but reconnecting — wait for the connect event
    if (this.socket && !this.isConnected) {
      return new Promise((resolve) => {
        const onConnect = () => {
          cleanup()
          resolve(this.socket!)
        }
        const onTimeout = () => {
          cleanup()
          resolve(this.socket!) // resolve anyway; buffered emits will fire when ready
        }
        const cleanup = () => {
          this.socket?.off('connect', onConnect)
          clearTimeout(timer)
        }
        this.socket!.once('connect', onConnect)
        const timer = setTimeout(onTimeout, 5000)
      })
    }

    const token = await AsyncStorage.getItem('vToken')

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })

    this.socket.on('connect', () => {
      this.isConnected = true
      // Re-subscribe after reconnect if was subscribed
      if (this.subscribedRadius !== null) {
        this.socket?.emit('driver:subscribe-jobs', { radius: this.subscribedRadius })
      }
    })

    this.socket.on('disconnect', () => {
      this.isConnected = false
    })

    this.socket.on('connect_error', (err) => {
      console.error('Driver socket error:', err.message)
    })

    return new Promise((resolve) => {
      this.socket!.once('connect', () => resolve(this.socket!))
      // Fallback: resolve after 5 s so callers are never blocked
      setTimeout(() => resolve(this.socket!), 5000)
    })
  }

  subscribeJobs(radius = 20): void {
    this.subscribedRadius = radius
    this.socket?.emit('driver:subscribe-jobs', { radius })
  }

  unsubscribeJobs(): void {
    this.subscribedRadius = null
    this.socket?.emit('driver:unsubscribe-jobs')
  }

  sendLocation(payload: LocationPayload) {
    if (!this.isConnected) return
    this.socket?.emit('driver:location', payload)
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

  onNotification(callback: (data: NotificationData) => void) {
    this.socket?.on('notification', callback)
  }

  offNotification(callback: (data: NotificationData) => void) {
    this.socket?.off('notification', callback)
  }

  disconnect() {
    this.subscribedRadius = null
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

export const driverSocketService = new DriverSocketService()
