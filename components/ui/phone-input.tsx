"use client"

import * as React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// Removed unused imports for Popover and Command components

// Country data with flags, codes, and formats
const countries = [
  { code: "US", name: "United States", flag: "🇺🇸", dialCode: "+1", format: "(###) ###-####" },
  { code: "CA", name: "Canada", flag: "🇨🇦", dialCode: "+1", format: "(###) ###-####" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dialCode: "+44", format: "#### ### ####" },
  { code: "AU", name: "Australia", flag: "🇦🇺", dialCode: "+61", format: "#### ### ###" },
  { code: "DE", name: "Germany", flag: "🇩🇪", dialCode: "+49", format: "#### ########" },
  { code: "FR", name: "France", flag: "🇫🇷", dialCode: "+33", format: "# ## ## ## ##" },
  { code: "IT", name: "Italy", flag: "🇮🇹", dialCode: "+39", format: "### ### ####" },
  { code: "ES", name: "Spain", flag: "🇪🇸", dialCode: "+34", format: "### ### ###" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", dialCode: "+31", format: "# ########" },
  { code: "BE", name: "Belgium", flag: "🇧🇪", dialCode: "+32", format: "### ## ## ##" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭", dialCode: "+41", format: "## ### ## ##" },
  { code: "AT", name: "Austria", flag: "🇦🇹", dialCode: "+43", format: "### ######" },
  { code: "SE", name: "Sweden", flag: "🇸🇪", dialCode: "+46", format: "##-### ## ##" },
  { code: "NO", name: "Norway", flag: "🇳🇴", dialCode: "+47", format: "### ## ###" },
  { code: "DK", name: "Denmark", flag: "🇩🇰", dialCode: "+45", format: "## ## ## ##" },
  { code: "FI", name: "Finland", flag: "🇫🇮", dialCode: "+358", format: "## ### ####" },
  { code: "JP", name: "Japan", flag: "🇯🇵", dialCode: "+81", format: "##-####-####" },
  { code: "KR", name: "South Korea", flag: "🇰🇷", dialCode: "+82", format: "##-####-####" },
  { code: "CN", name: "China", flag: "🇨🇳", dialCode: "+86", format: "### #### ####" },
  { code: "IN", name: "India", flag: "🇮🇳", dialCode: "+91", format: "##### #####" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", dialCode: "+65", format: "#### ####" },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰", dialCode: "+852", format: "#### ####" },
  { code: "TW", name: "Taiwan", flag: "🇹🇼", dialCode: "+886", format: "#### ######" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", dialCode: "+55", format: "(##) #####-####" },
  { code: "MX", name: "Mexico", flag: "🇲🇽", dialCode: "+52", format: "### ### ####" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", dialCode: "+54", format: "## ####-####" },
  { code: "CL", name: "Chile", flag: "🇨🇱", dialCode: "+56", format: "# #### ####" },
  { code: "CO", name: "Colombia", flag: "🇨🇴", dialCode: "+57", format: "### ### ####" },
  { code: "PE", name: "Peru", flag: "🇵🇪", dialCode: "+51", format: "### ### ###" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", dialCode: "+27", format: "## ### ####" },
  { code: "EG", name: "Egypt", flag: "🇪🇬", dialCode: "+20", format: "### ### ####" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", dialCode: "+234", format: "### ### ####" },
  { code: "KE", name: "Kenya", flag: "🇰🇪", dialCode: "+254", format: "### ######" },
  { code: "MA", name: "Morocco", flag: "🇲🇦", dialCode: "+212", format: "###-######" },
  { code: "IL", name: "Israel", flag: "🇮🇱", dialCode: "+972", format: "##-###-####" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", dialCode: "+971", format: "## ### ####" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", dialCode: "+966", format: "## ### ####" },
  { code: "TR", name: "Turkey", flag: "🇹🇷", dialCode: "+90", format: "### ### ## ##" },
  { code: "RU", name: "Russia", flag: "🇷🇺", dialCode: "+7", format: "### ###-##-##" },
  { code: "UA", name: "Ukraine", flag: "🇺🇦", dialCode: "+380", format: "## ### ## ##" },
  { code: "PL", name: "Poland", flag: "🇵🇱", dialCode: "+48", format: "### ### ###" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿", dialCode: "+420", format: "### ### ###" },
  { code: "HU", name: "Hungary", flag: "🇭🇺", dialCode: "+36", format: "## ### ####" },
  { code: "RO", name: "Romania", flag: "🇷🇴", dialCode: "+40", format: "### ### ###" },
  { code: "BG", name: "Bulgaria", flag: "🇧🇬", dialCode: "+359", format: "## ### ####" },
  { code: "HR", name: "Croatia", flag: "🇭🇷", dialCode: "+385", format: "## ### ####" },
  { code: "SI", name: "Slovenia", flag: "🇸🇮", dialCode: "+386", format: "## ### ###" },
  { code: "SK", name: "Slovakia", flag: "🇸🇰", dialCode: "+421", format: "### ### ###" },
  { code: "LT", name: "Lithuania", flag: "🇱🇹", dialCode: "+370", format: "### #####" },
  { code: "LV", name: "Latvia", flag: "🇱🇻", dialCode: "+371", format: "## ### ###" },
  { code: "EE", name: "Estonia", flag: "🇪🇪", dialCode: "+372", format: "### ####" },
  { code: "GR", name: "Greece", flag: "🇬🇷", dialCode: "+30", format: "### ### ####" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", dialCode: "+351", format: "### ### ###" },
  { code: "IE", name: "Ireland", flag: "🇮🇪", dialCode: "+353", format: "## ### ####" },
  { code: "IS", name: "Iceland", flag: "🇮🇸", dialCode: "+354", format: "### ####" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺", dialCode: "+352", format: "### ###" },
  { code: "MT", name: "Malta", flag: "🇲🇹", dialCode: "+356", format: "#### ####" },
  { code: "CY", name: "Cyprus", flag: "🇨🇾", dialCode: "+357", format: "## ######" },
  { code: "TH", name: "Thailand", flag: "🇹🇭", dialCode: "+66", format: "##-###-####" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳", dialCode: "+84", format: "### ### ####" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾", dialCode: "+60", format: "##-### ####" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩", dialCode: "+62", format: "###-###-####" },
  { code: "PH", name: "Philippines", flag: "🇵🇭", dialCode: "+63", format: "### ### ####" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", dialCode: "+64", format: "##-### ####" },
]

interface PhoneInputProps {
  value?: string
  onChange?: (value: string) => void
  onCountryChange?: (country: typeof countries[0]) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  className?: string
  label?: string
  required?: boolean
}

// Format phone number according to country format
function formatPhoneNumber(value: string, format: string): string {
  const digits = value.replace(/\D/g, '')
  let formatted = ''
  let digitIndex = 0

  for (let i = 0; i < format.length && digitIndex < digits.length; i++) {
    if (format[i] === '#') {
      formatted += digits[digitIndex]
      digitIndex++
    } else {
      formatted += format[i]
    }
  }

  return formatted
}

// Validate phone number based on country format
function validatePhoneNumber(value: string, format: string): boolean {
  const digits = value.replace(/\D/g, '')
  const expectedDigits = format.replace(/[^#]/g, '').length
  return digits.length === expectedDigits
}

// Get user's country from geolocation (simplified)
function getUserCountry(): Promise<string> {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          // In a real implementation, you'd use a geolocation service
          // For now, we'll default to US
          resolve('US')
        },
        () => resolve('US'),
        { timeout: 5000 }
      )
    } else {
      resolve('US')
    }
  })
}

export function PhoneInput({
  value = '',
  onChange,
  onCountryChange,
  placeholder = "Enter phone number",
  disabled = false,
  error,
  className,
  label = "Phone Number",
  required = false,
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState(countries[0])
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [phoneValue, setPhoneValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize with user's geolocation
  useEffect(() => {
    getUserCountry().then((countryCode) => {
      const country = countries.find(c => c.code === countryCode) || countries[0]
      setSelectedCountry(country)
      onCountryChange?.(country)
    })
  }, [onCountryChange])

  // Filter countries based on search query
  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries
    
    const query = searchQuery.toLowerCase()
    return countries.filter(country => 
      country.name.toLowerCase().includes(query) ||
      country.code.toLowerCase().includes(query) ||
      country.dialCode.includes(query)
    )
  }, [searchQuery])

  // Handle country selection
  const handleCountrySelect = (country: typeof countries[0]) => {
    setSelectedCountry(country)
    setOpen(false)
    setSearchQuery('')
    onCountryChange?.(country)
    
    // Focus back to phone input
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  // Handle phone number input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const digits = inputValue.replace(/\D/g, '')
    
    // Limit digits based on format
    const maxDigits = selectedCountry.format.replace(/[^#]/g, '').length
    const limitedDigits = digits.slice(0, maxDigits)
    
    // Format the number
    const formatted = formatPhoneNumber(limitedDigits, selectedCountry.format)
    
    setPhoneValue(formatted)
    onChange?.(selectedCountry.dialCode + ' ' + formatted)
  }

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    const digits = pastedText.replace(/\D/g, '')
    
    // Check if pasted text includes country code
    let phoneDigits = digits
    if (digits.startsWith(selectedCountry.dialCode.replace('+', ''))) {
      phoneDigits = digits.slice(selectedCountry.dialCode.length - 1)
    }
    
    const maxDigits = selectedCountry.format.replace(/[^#]/g, '').length
    const limitedDigits = phoneDigits.slice(0, maxDigits)
    const formatted = formatPhoneNumber(limitedDigits, selectedCountry.format)
    
    setPhoneValue(formatted)
    onChange?.(selectedCountry.dialCode + ' ' + formatted)
  }

  // Validation
  const isValid = phoneValue ? validatePhoneNumber(phoneValue, selectedCountry.format) : true
  const showError = error || (!isValid && phoneValue.length > 0)

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor="phone-input" className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <div className="flex">
        {/* Country Selector */}
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setOpen(!open)}
            disabled={disabled}
            className={cn(
              "w-[140px] justify-between rounded-r-none border-r-0 focus:z-10",
              showError && "border-destructive focus:border-destructive"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedCountry.flag}</span>
              <span className="text-sm font-mono">{selectedCountry.dialCode}</span>
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
          
          {open && (
            <div className="absolute top-full left-0 z-50 w-[300px] mt-1 bg-white border rounded-md shadow-lg max-h-[300px] overflow-hidden">
              <div className="p-2 border-b">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search countries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 outline-none text-sm"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="max-h-[200px] overflow-y-auto">
                {filteredCountries.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No countries found
                  </div>
                ) : (
                  filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => handleCountrySelect(country)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 text-left"
                    >
                      <span className="text-lg">{country.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{country.name}</div>
                        <div className="text-xs text-gray-500 font-mono">
                          {country.dialCode}
                        </div>
                      </div>
                      {selectedCountry.code === country.code && (
                        <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
          
          {/* Backdrop to close dropdown */}
          {open && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
          )}
        </div>

        {/* Phone Number Input */}
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            id="phone-input"
            type="tel"
            value={phoneValue}
            onChange={handlePhoneChange}
            onPaste={handlePaste}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "rounded-l-none focus:z-10",
              showError && "border-destructive focus:border-destructive"
            )}
            aria-invalid={showError ? "true" : "false"}
            aria-describedby={showError ? "phone-error" : undefined}
          />
          
          {/* Format hint */}
          {!phoneValue && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono pointer-events-none">
              {selectedCountry.format.replace(/#/g, '0')}
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {showError && (
        <p id="phone-error" className="text-sm text-destructive">
          {error || `Please enter a valid ${selectedCountry.name} phone number`}
        </p>
      )}

      {/* Format Example */}
      {!showError && phoneValue.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Format: {selectedCountry.dialCode} {selectedCountry.format.replace(/#/g, '0')}
        </p>
      )}
    </div>
  )
}