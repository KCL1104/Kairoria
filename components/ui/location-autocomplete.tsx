"use client"

import { useState, useRef, useEffect } from 'react'
import { Input } from './input'
import { Button } from './button'
import { MapPin, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

interface LocationAutocompleteProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  error?: string
}

interface PlacePrediction {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

export function LocationAutocomplete({
  value = '',
  onChange,
  placeholder = 'Enter location...',
  className,
  disabled = false,
  error
}: LocationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesService = useRef<google.maps.places.PlacesService | null>(null)
  const geocoder = useRef<google.maps.Geocoder | null>(null)

  // Initialize Google Maps services
  useEffect(() => {
    const initializeServices = async () => {
      if (typeof window !== 'undefined' && window.google?.maps) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService()
        
        // Create a dummy div for PlacesService
        const dummyDiv = document.createElement('div')
        placesService.current = new window.google.maps.places.PlacesService(dummyDiv)
        
        geocoder.current = new window.google.maps.Geocoder()
      }
    }

    // Check if Google Maps is already loaded
    if (window.google?.maps) {
      initializeServices()
    } else {
      // Wait for Google Maps to load
      const checkGoogleMaps = setInterval(() => {
        if (window.google?.maps) {
          initializeServices()
          clearInterval(checkGoogleMaps)
        }
      }, 100)

      return () => clearInterval(checkGoogleMaps)
    }
  }, [])

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value)
  }, [value])

  const searchPlaces = async (query: string) => {
    if (!autocompleteService.current || query.length < 2) {
      setPredictions([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    
    try {
      const request = {
        input: query,
        types: ['geocode'], // Focus on addresses and places
      }

      autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
        setIsLoading(false)
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setPredictions(predictions)
          setIsOpen(true)
        } else {
          setPredictions([])
          setIsOpen(false)
        }
      })
    } catch (error) {
      console.error('Error fetching place predictions:', error)
      setIsLoading(false)
      setPredictions([])
      setIsOpen(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
    searchPlaces(newValue)
  }

  const handlePlaceSelect = (prediction: PlacePrediction) => {
    setInputValue(prediction.description)
    onChange(prediction.description)
    setIsOpen(false)
    setPredictions([])
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation || !geocoder.current) {
      alert('Geolocation is not supported by this browser or Google Maps is not loaded.')
      return
    }

    setIsGettingCurrentLocation(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const latLng = new window.google.maps.LatLng(latitude, longitude)

        geocoder.current!.geocode({ location: latLng }, (results, status) => {
          setIsGettingCurrentLocation(false)
          
          if (status === 'OK' && results && results[0]) {
            const address = results[0].formatted_address
            setInputValue(address)
            onChange(address)
          } else {
            alert('Unable to retrieve your location address.')
          }
        })
      },
      (error) => {
        setIsGettingCurrentLocation(false)
        console.error('Error getting current location:', error)
        alert('Unable to retrieve your current location.')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  const handleInputBlur = () => {
    // Delay hiding to allow for click on predictions
    setTimeout(() => {
      setIsOpen(false)
    }, 200)
  }

  const handleInputFocus = () => {
    if (predictions.length > 0) {
      setIsOpen(true)
    }
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className={cn(className, error && "border-destructive")}
            disabled={disabled}
          />
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        
        {/* Current location button */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={getCurrentLocation}
          disabled={disabled || isGettingCurrentLocation}
          title="Use current location"
        >
          {isGettingCurrentLocation ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Predictions dropdown */}
      {isOpen && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none border-b border-border last:border-b-0"
              onClick={() => handlePlaceSelect(prediction)}
            >
              <div className="font-medium text-sm">
                {prediction.structured_formatting.main_text}
              </div>
              <div className="text-xs text-muted-foreground">
                {prediction.structured_formatting.secondary_text}
              </div>
            </button>
          ))}
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
    </div>
  )
}

export default LocationAutocomplete