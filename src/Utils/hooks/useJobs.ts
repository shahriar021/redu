import { IPA_BASE } from '@env'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { useAuth } from '../../Auth/AuthContext'
import { Truck } from '../../home/Users/Components/HomeScreen/types'

const ACTIVE_STATUSES = new Set(['PENDING', 'BROADCAST', 'BOOKED', 'ON_WAY', 'ARRIVED', 'LOADED', 'IN_TRANSIT'])

const STATUS_TEXT: Record<string, string> = {
  PENDING: 'Pending',
  BROADCAST: 'Finding Driver',
  BOOKED: 'Driver Booked',
  ON_WAY: 'Driver On Way',
  ARRIVED: 'Driver Arrived',
  LOADED: 'Loaded',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

type ApiJob = {
  id: string
  status: string
  pickupAddress: string
  dropoffAddress: string
  estimatedFare: number | null
  finalFare: number | null
  distanceKm: number | null
  truckType: { name: string } | null
  createdAt: string
  deliveredAt: string | null
  payment: { status: string } | null
}

export type UnpaidJob = { id: string; fareLabel: string }

const mapToTruck = (job: ApiJob): Truck => {
  const fare = job.finalFare ?? job.estimatedFare
  return {
    id: job.id,
    name: job.truckType?.name ?? 'Truck Job',
    description: `${job.pickupAddress} → ${job.dropoffAddress}`,
    capacity: '',
    rating: 0,
    distance: job.distanceKm != null ? `${job.distanceKm.toFixed(1)} km` : '—',
    icon: 'truck-outline',
    date: new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    statusText: STATUS_TEXT[job.status] ?? job.status,
    pickupAddress: job.pickupAddress,
    dropoffAddress: job.dropoffAddress,
    iconBg: ACTIVE_STATUSES.has(job.status) ? '#E9F7EA' : '#F3F4F6',
    status: ACTIVE_STATUSES.has(job.status) ? 'active' : 'completed',
    iconColor: ACTIVE_STATUSES.has(job.status) ? '#43B047' : '#9CA3AF',
    price: fare != null ? `$${fare.toFixed(2)}` : undefined,
    isPaid: job.payment?.status === 'COMPLETED',
  }
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export const useJobs = () => {
  const [activeJobs, setActiveJobs] = useState<Truck[]>([])
  const [recentJobs, setRecentJobs] = useState<Truck[]>([])
  const [unpaidDeliveredJob, setUnpaidDeliveredJob] = useState<UnpaidJob | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { signOut: logout } = useAuth()

  const fetchJobs = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const token = await AsyncStorage.getItem('vToken')
      const response = await axios.get(`${IPA_BASE}/jobs/my-jobs`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      })

      const jobs: ApiJob[] = response.data?.data ?? []
      setActiveJobs(jobs.filter((j) => ACTIVE_STATUSES.has(j.status)).map(mapToTruck))
      const delivered = jobs.filter((j) => j.status === 'DELIVERED')
      setRecentJobs(delivered.map(mapToTruck))

      // Only flag as unpaid if:
      //  - payment record exists and is explicitly not COMPLETED (real pending payment), OR
      //  - no payment record but job was delivered within the last 30 days (new delivery)
      // Old historical jobs with no payment record are ignored to avoid false alerts.
      const unpaid = delivered.find((j) => {
        if (j.payment?.status === 'COMPLETED') return false
        if (j.payment != null) return true   // explicit non-COMPLETED payment record
        const ts = j.deliveredAt
          ? new Date(j.deliveredAt).getTime()
          : new Date(j.createdAt).getTime()
        return Date.now() - ts < THIRTY_DAYS_MS
      })

      if (unpaid) {
        const fare = unpaid.finalFare ?? unpaid.estimatedFare
        setUnpaidDeliveredJob({
          id: unpaid.id,
          fareLabel: fare != null ? `$${fare.toFixed(2)}` : '',
        })
      } else {
        setUnpaidDeliveredJob(null)
      }
    } catch (err) {
      console.error('Error fetching jobs:', err)
      setError('Failed to load jobs. Please try again.')
      if ((err as any)?.response?.status === 401) {
        await logout()
      }
      setActiveJobs([])
      setRecentJobs([])
      setUnpaidDeliveredJob(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  return { activeJobs, recentJobs, unpaidDeliveredJob, isLoading, error, refetch: fetchJobs }
}
