import { GOOGLE_MAPS_API_KEY } from '@env'
import axios from 'axios'

export interface GeocodedAddress {
  city: string
  state: string
  country: string
  formattedAddress: string
}

// ~100 m in degrees (1° lat ≈ 111 km)
const OFFSET = 0.0009

const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json'

function parseComponents(components: any[]): GeocodedAddress | null {
  const get = (type: string) => components.find((c: any) => c.types.includes(type))

  const sublocality1 = get('sublocality_level_1')?.long_name
  const sublocality2 = get('sublocality_level_2')?.long_name
  const neighborhood  = get('neighborhood')?.long_name
  const locality      = get('locality')?.long_name
  const adminLevel2   = get('administrative_area_level_2')?.long_name
  const adminLevel1   = get('administrative_area_level_1')?.long_name
  const country       = get('country')?.long_name || ''

  // Use the most granular name available as the primary label
  // sublocality (thana/area) → neighborhood → city → district
  const area = sublocality1 || neighborhood || sublocality2 || locality || adminLevel2 || ''
  if (!area) return null

  // Append the city only when it adds context (i.e. area is a sub-area of the city)
  const cityContext = (area !== locality && locality) ? locality : ''
  const formattedAddress = cityContext ? `${area}, ${cityContext}` : area

  return {
    city: area,
    state: adminLevel1 || '',
    country,
    formattedAddress,
  }
}

async function tryGeocode(lat: number, lng: number): Promise<GeocodedAddress | null> {
  try {
    const res = await axios.get(GEOCODE_URL, {
      params: { latlng: `${lat},${lng}`, key: GOOGLE_MAPS_API_KEY },
      timeout: 6000,
    })
    const results: any[] = res.data?.results ?? []
    for (const result of results) {
      const parsed = parseComponents(result.address_components ?? [])
      if (parsed) return parsed
    }
  } catch {
    // network error or timeout — caller tries next candidate
  }
  return null
}

/**
 * Reverse geocode with Google Maps. Tries the exact point first, then
 * 4 cardinal offsets at ~100 m before giving up.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodedAddress | null> {
  const candidates = [
    { lat: latitude, lng: longitude },
    { lat: latitude + OFFSET, lng: longitude },
    { lat: latitude - OFFSET, lng: longitude },
    { lat: latitude, lng: longitude + OFFSET },
    { lat: latitude, lng: longitude - OFFSET },
  ]

  for (const { lat, lng } of candidates) {
    const result = await tryGeocode(lat, lng)
    if (result) return result
  }
  return null
}

/** Convenience wrapper that returns just the display string. */
export async function reverseGeocodeString(
  latitude: number,
  longitude: number
): Promise<string> {
  const result = await reverseGeocode(latitude, longitude)
  return result?.formattedAddress ?? 'Unknown Location'
}
