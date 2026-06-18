export interface Truck {
  id: string;
  name: string;
  description: string;
  capacity: string;
  rating: number;
  distance: string;
  icon: string;
  date: string;
  statusText: string;
  pickupAddress: string;
  dropoffAddress: string;
  iconBg: string;
  status: "active" | "completed";
  iconColor: string;
  price?: string;
  isPaid?: boolean;
}

export interface Job {
  id: string
  name: string

  date: string
  status: 'active' | 'completed'
  price?: string
  pickupAddress?: string
  dropoffAddress?: string
  jobId?: string
  statusText?: string
}

export interface LocationCoords {
  latitude: number
  longitude: number
}