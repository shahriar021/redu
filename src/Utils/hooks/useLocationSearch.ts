import { GOOGLE_MAPS_API_KEY } from '@env'
import axios from 'axios'
import { useCallback, useRef, useState } from 'react'
import { SearchSuggestion } from '../../home/Users/Components/SearchLocation/type'

const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json'
const AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json'
const DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json'

export { SearchSuggestion }

export const useLocationSearch = () => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const searchLocations = useCallback(async (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim() || query.length < 2) {
      setSuggestions([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Phase 1: Autocomplete — get address descriptions + place IDs
        const autoRes = await axios.get(AUTOCOMPLETE_URL, {
          params: {
            input: query,
            key: GOOGLE_MAPS_API_KEY,
            types: 'geocode',
            language: 'en',
          },
          timeout: 10000,
        })

        const predictions: any[] = autoRes.data?.predictions ?? []

        if (predictions.length === 0) {
          setSuggestions([])
          return
        }

        // Phase 2: Resolve lat/lng for each prediction via Place Details
        const resolved = await Promise.all(
          predictions.slice(0, 5).map(async (p: any) => {
            try {
              const detailRes = await axios.get(DETAILS_URL, {
                params: {
                  place_id: p.place_id,
                  fields: 'geometry,formatted_address',
                  key: GOOGLE_MAPS_API_KEY,
                },
                timeout: 8000,
              })
              const loc = detailRes.data?.result?.geometry?.location
              const addr =
                detailRes.data?.result?.formatted_address || p.description
              if (!loc) return null
              return { address: addr, lat: loc.lat, lng: loc.lng } as SearchSuggestion
            } catch {
              return null
            }
          }),
        )

        setSuggestions(resolved.filter(Boolean) as SearchSuggestion[])
      } catch (err: any) {
        console.error('Location search error:', err?.message)
        // Fallback: try Geocoding API
        try {
          const geoRes = await axios.get(GEOCODE_URL, {
            params: { address: query, key: GOOGLE_MAPS_API_KEY },
            timeout: 10000,
          })
          const results: SearchSuggestion[] = (geoRes.data?.results ?? [])
            .slice(0, 5)
            .map((r: any) => ({
              address: r.formatted_address,
              lat: r.geometry.location.lat,
              lng: r.geometry.location.lng,
            }))
          setSuggestions(results)
          if (results.length === 0) setError('No locations found')
        } catch {
          setError('Unable to search locations. Check your internet connection.')
          setSuggestions([])
        }
      } finally {
        setIsLoading(false)
      }
    }, 400)
  }, [])

  const clearSuggestions = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSuggestions([])
    setError(null)
  }, [])

  return { suggestions, isLoading, error, searchLocations, clearSuggestions }
}
