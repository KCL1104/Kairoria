"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { Input } from './input'
import { Button } from './button'
import { MapPin, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

interface LocationAutocompleteProps {
  value?: string
  onChange?: (value: string) => void
  onLocationSelect?: (location: { address: string; lat: number; lng: number }) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  error?: string
}

interface PlaceSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}



export function LocationAutocomplete({
  value = '',
  onChange,
  onLocationSelect,
  placeholder = 'Enter location...',
  className,
  disabled = false,
  error,
}: LocationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false)
  const [sessionToken, setSessionToken] = useState<google.maps.places.AutocompleteSessionToken | null>(null)
  const latestRequestId = useRef<string>('')
  
  const inputRef = useRef<HTMLInputElement>(null)
  const geocoder = useRef<google.maps.Geocoder | null>(null)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Initialize Google Maps services and session token
  useEffect(() => {
    const initializeServices = async () => {
      if (typeof window !== 'undefined' && window.google?.maps) {
        geocoder.current = new window.google.maps.Geocoder()
        
        // Create a new session token for this autocomplete session
        if (window.google.maps.places?.AutocompleteSessionToken) {
          setSessionToken(new window.google.maps.places.AutocompleteSessionToken())
        }
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

  // Create a new session token when component mounts or after place selection
  const createNewSessionToken = useCallback(() => {
    if (window.google?.maps?.places?.AutocompleteSessionToken) {
      setSessionToken(new window.google.maps.places.AutocompleteSessionToken())
    }
  }, [])

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value)
  }, [value])

  const searchPlaces = useCallback(async (query: string) => {
    if (!window.google?.maps?.places || query.length < 2) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    const currentRequestId = Date.now().toString()
    latestRequestId.current = currentRequestId
    
    try {
      const request = {
        input: query,
        includedPrimaryTypes: ['geocode' as const],
        languageCode: 'en',
        sessionToken: sessionToken ?? undefined,
      };

      // Use the new AutocompleteSuggestion API
      const { suggestions: autocompleteSuggestions } = await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request)
      
      // Check if this is still the latest request
      if (currentRequestId !== latestRequestId.current) {
        return
      }
      
      setIsLoading(false)
      
      if (autocompleteSuggestions && autocompleteSuggestions.length > 0) {
        // Filter out null predictions and transform the new API response to match our interface
        const transformedSuggestions: PlaceSuggestion[] = autocompleteSuggestions
          .filter(suggestion => suggestion.placePrediction)
          .map(suggestion => {
            const prediction = suggestion.placePrediction!;
            const predictionWithFormat = prediction as any;
            return {
              place_id: prediction.placeId,
              description: prediction.text.text,
              structured_formatting: {
                main_text: predictionWithFormat.structuredFormat?.mainText?.text ?? '',
                secondary_text: predictionWithFormat.structuredFormat?.secondaryText?.text ?? '',
              },
            };
          });

        setSuggestions(transformedSuggestions)
        setIsOpen(true)
      } else {
        setSuggestions([])
        setIsOpen(false)
      }
    } catch (error) {
      console.error('Error fetching place suggestions:', error)
      setIsLoading(false)
      setSuggestions([])
      setIsOpen(false)
      
      // Fallback to legacy API if new API fails
      if (window.google?.maps?.places?.AutocompleteService) {
        try {
          const autocompleteService = new window.google.maps.places.AutocompleteService()
          const legacyRequest = {
            input: query,
            types: ['geocode'],
            language: 'en'
          }
          
          autocompleteService.getPlacePredictions(legacyRequest, (predictions, status) => {
            if (currentRequestId !== latestRequestId.current) {
              return
            }
            
            setIsLoading(false)
            
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              const transformedPredictions: PlaceSuggestion[] = predictions.map(prediction => ({
                place_id: prediction.place_id,
                description: prediction.description,
                structured_formatting: {
                  main_text: prediction.structured_formatting.main_text,
                  secondary_text: prediction.structured_formatting.secondary_text
                }
              }))
              setSuggestions(transformedPredictions)
              setIsOpen(true)
            } else {
              setSuggestions([])
              setIsOpen(false)
            }
          })
        } catch (legacyError) {
          console.error('Fallback to legacy API also failed:', legacyError)
        }
      }
    }
  }, [sessionToken])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange?.(newValue)

    // Clear previous debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    
    // Debounce search to avoid excessive API calls
    debounceTimer.current = setTimeout(() => {
      searchPlaces(newValue)
    }, 300)
  }

  const handlePlaceSelect = async (suggestion: PlaceSuggestion) => {
    setInputValue(suggestion.description)
    onChange?.(suggestion.description)
    setIsOpen(false)
    setSuggestions([])

    // Get coordinates for the selected place
    if (geocoder.current && onLocationSelect) {
      try {
        const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
          geocoder.current!.geocode(
            { placeId: suggestion.place_id },
            (results, status) => {
              if (status === 'OK' && results && results[0]) {
                resolve(results)
              } else {
                reject(new Error(`Geocoding failed: ${status}`))
              }
            }
          )
        })

        const location = result[0].geometry.location
        onLocationSelect({
          address: suggestion.description,
          lat: location.lat(),
          lng: location.lng()
        })
      } catch (error) {
        console.error('Error getting coordinates:', error)
      }
    }
    
    // Create a new session token for the next search session
    createNewSessionToken()
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

        geocoder.current!.geocode({ 
          location: latLng,
          language: 'en' // Force English language for geocoding
        }, (results, status) => {
          setIsGettingCurrentLocation(false)
          
          if (status === 'OK' && results && results[0]) {
            const address = results[0].formatted_address
            setInputValue(address)
            onChange?.(address)
            if (onLocationSelect) {
              onLocationSelect({
                address,
                lat: latitude,
                lng: longitude
              })
            }
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
    if (suggestions.length > 0) {
      setIsOpen(true)
    }
  }

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

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

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none border-b border-border last:border-b-0"
              onClick={() => handlePlaceSelect(suggestion)}
            >
              <div className="font-medium text-sm">
                {suggestion.structured_formatting.main_text}
              </div>
              <div className="text-xs text-muted-foreground">
                {suggestion.structured_formatting.secondary_text}
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