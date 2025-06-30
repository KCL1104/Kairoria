'use client'

import { useEffect, useState, useCallback } from 'react'
import { Wrapper, Status } from '@googlemaps/react-wrapper'
import { Loader } from '@googlemaps/js-api-loader'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { convertFromStorageAmount } from '@/lib/data'

// Google Maps types
type GoogleMap = google.maps.Map
type GoogleMarker = google.maps.Marker
type GoogleLatLng = {
  lat: number
  lng: number
}
type GoogleInfoWindow = google.maps.InfoWindow

interface Product {
  id: string
  title: string
  description: string
  price_per_day: number
  location: string
  category_id: number
  owner_id: string
  status: string
  latitude?: number
  longitude?: number
}

interface MapComponentProps {
  center: GoogleLatLng
  zoom: number
  products: Product[]
  userLocation?: GoogleLatLng
}

function MapComponent({ center, zoom, products, userLocation }: MapComponentProps) {
  const [map, setMap] = useState<GoogleMap>()
  const [markers, setMarkers] = useState<GoogleMarker[]>([])
  const [userMarker, setUserMarker] = useState<GoogleMarker>()

  const ref = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      const newMap = new window.google.maps.Map(node, {
        center,
        zoom,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' as const }]
          }
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      })
      setMap(newMap)
    }
  }, [center, zoom])

  // Add user location marker
  useEffect(() => {
    if (map && userLocation) {
      // Clear existing user marker
      if (userMarker) {
        userMarker.setMap(null)
      }

      const marker = new window.google.maps.Marker({
        position: userLocation,
        map,
        title: 'Your Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      })

      setUserMarker(marker)
    }
  }, [map, userLocation, userMarker])

  // Add product markers
  useEffect(() => {
    if (map) {
      // Clear existing markers
      markers.forEach(marker => marker.setMap(null))
      
      const newMarkers = products
        .filter(product => product.latitude && product.longitude)
        .map(product => {
          const marker = new window.google.maps.Marker({
            position: { lat: product.latitude!, lng: product.longitude! },
            map,
            title: product.title,
            icon: {
              path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: '#10B981',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 1,
            },
          })

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div class="p-2 max-w-xs">
                <h3 class="font-semibold text-sm">${product.title}</h3>
                <p class="text-xs text-gray-600 mt-1">${product.description.substring(0, 100)}...</p>
                <p class="text-xs font-medium mt-2">$${convertFromStorageAmount(product.price_per_day)}/day</p>
                <p class="text-xs text-gray-500">${product.location}</p>
              </div>
            `
          })

          marker.addListener('click', () => {
            infoWindow.open(map, marker)
          })

          return marker
        })
      
      setMarkers(newMarkers)
    }
  }, [map, products, markers])

  return <div ref={ref} className="w-full h-full" />
}

function LoadingComponent() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading map...</span>
      </div>
    </div>
  )
}

function ErrorComponent({ error }: { error: Error }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Failed to load map</p>
        <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
      </div>
    </div>
  )
}

export function MapView() {
  const [products, setProducts] = useState<Product[]>([])
  const [userLocation, setUserLocation] = useState<GoogleLatLng>()
  const [center, setCenter] = useState<GoogleLatLng>({ lat: 40.7128, lng: -74.0060 }) // Default to NYC
  const [loading, setLoading] = useState(true)
  const [locationLoading, setLocationLoading] = useState(false)
  const { toast } = useToast()

  // Fetch products from Supabase
  useEffect(() => {
    async function fetchProducts() {
      try {
        if (!supabase) {
          console.error('Supabase client not available')
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Database connection not available'
          })
          return
        }

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('status', 'listed')

        if (error) {
          console.error('Error fetching products:', error)
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load products'
          })
          return
        }

        // For demo purposes, add random coordinates to products
        // In a real app, you'd geocode the location strings
        const productsWithCoords = data?.map(product => ({
          ...product,
          latitude: 40.7128 + (Math.random() - 0.5) * 0.1, // Random coords around NYC
          longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
        })) || []

        setProducts(productsWithCoords)
      } catch (error) {
        console.error('Error:', error)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load products'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [toast])

  // Get user's current location
  const getUserLocation = useCallback(() => {
    setLocationLoading(true)
    
    if (!navigator.geolocation) {
      toast({
        variant: 'destructive',
        title: 'Location not supported',
        description: 'Geolocation is not supported by this browser'
      })
      setLocationLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setUserLocation(location)
        setCenter(location)
        setLocationLoading(false)
        toast({
          title: 'Location found',
          description: 'Map centered on your location'
        })
      },
      (error) => {
        console.error('Error getting location:', error)
        toast({
          variant: 'destructive',
          title: 'Location error',
          description: 'Could not get your location. Please enable location services.'
        })
        setLocationLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    )
  }, [toast])

  const render = (status: Status) => {
    switch (status) {
      case Status.LOADING:
        return <LoadingComponent />
      case Status.FAILURE:
        return <ErrorComponent error={new Error('Failed to load Google Maps')} />
      case Status.SUCCESS:
        return (
          <div className="relative w-full h-full">
            <MapComponent 
              center={center} 
              zoom={12} 
              products={products}
              userLocation={userLocation}
            />
            <div className="absolute top-4 right-4 z-10">
              <Button
                onClick={getUserLocation}
                disabled={locationLoading}
                size="sm"
                variant="secondary"
                className="shadow-lg"
              >
                {locationLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
                <span className="ml-2">My Location</span>
              </Button>
            </div>
            <div className="absolute bottom-4 left-4 z-10">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Your Location</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-500 transform rotate-45"></div>
                    <span>Available Items ({products.length})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="relative w-full h-[calc(80vh-140px)] rounded-md overflow-hidden border">
        <LoadingComponent />
      </div>
    )
  }

  return (
    <div className="relative w-full h-[calc(80vh-140px)] rounded-md overflow-hidden border">
      <Wrapper
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAP_API_KEY || ''}
        render={render}
        libraries={['places']}
      />
    </div>
  )
}