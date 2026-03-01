import { useCallback, useEffect, useRef, useState } from 'react'
import { Input } from '~/components/ui/input'
import { cn } from '~/lib/utils'

interface AddressDetails {
  street: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
  lat: string | null
  lng: string | null
  placeId: string | null
}

interface Suggestion {
  placeId: string
  description: string
  mainText: string
  secondaryText: string
}

interface AddressAutocompleteProps {
  defaultValue?: string
  defaultDetails?: AddressDetails
  placesEnabled: boolean
  error?: boolean
}

export function AddressAutocomplete({
  defaultValue,
  defaultDetails,
  placesEnabled,
  error,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(defaultValue ?? '')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [details, setDetails] = useState<AddressDetails | null>(
    defaultDetails ?? null,
  )
  const [activeIndex, setActiveIndex] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchSuggestions = useCallback(
    (input: string) => {
      if (!placesEnabled || input.length < 3) {
        setSuggestions([])
        setIsOpen(false)
        return
      }
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `/api/places?input=${encodeURIComponent(input)}`,
          )
          const data = (await res.json()) as {
            suggestions?: Suggestion[]
          }
          const items = data.suggestions ?? []
          setSuggestions(items)
          setIsOpen(items.length > 0)
          setActiveIndex(-1)
        } catch {
          setSuggestions([])
          setIsOpen(false)
        }
      }, 300)
    },
    [placesEnabled],
  )

  async function selectSuggestion(suggestion: Suggestion) {
    setInputValue(suggestion.description)
    setIsOpen(false)
    setSuggestions([])

    try {
      const res = await fetch(
        `/api/places?placeId=${encodeURIComponent(suggestion.placeId)}`,
      )
      const data = (await res.json()) as {
        details?: {
          placeId: string
          formattedAddress: string
          street: string | null
          city: string | null
          state: string | null
          zip: string | null
          country: string | null
          lat: number | null
          lng: number | null
        }
      }
      if (data.details) {
        setDetails({
          street: data.details.street,
          city: data.details.city,
          state: data.details.state,
          zip: data.details.zip,
          country: data.details.country,
          lat: data.details.lat != null ? String(data.details.lat) : null,
          lng: data.details.lng != null ? String(data.details.lng) : null,
          placeId: data.details.placeId,
        })
        setInputValue(data.details.formattedAddress)
      }
    } catch {
      // Keep the suggestion text even if details fetch fails
    }
  }

  function handleInputChange(value: string) {
    setInputValue(value)
    setDetails(null)
    fetchSuggestions(value)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      selectSuggestion(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <Input
        id="address"
        name="address"
        value={inputValue}
        onChange={e => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        placeholder="e.g. 123 Main St, Denver, CO"
        autoComplete="off"
        error={error}
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls="address-suggestions"
      />

      <input type="hidden" name="addressStreet" value={details?.street ?? ''} />
      <input type="hidden" name="addressCity" value={details?.city ?? ''} />
      <input type="hidden" name="addressState" value={details?.state ?? ''} />
      <input type="hidden" name="addressZip" value={details?.zip ?? ''} />
      <input
        type="hidden"
        name="addressCountry"
        value={details?.country ?? ''}
      />
      <input type="hidden" name="addressLat" value={details?.lat ?? ''} />
      <input type="hidden" name="addressLng" value={details?.lng ?? ''} />
      <input
        type="hidden"
        name="addressPlaceId"
        value={details?.placeId ?? ''}
      />

      {isOpen && suggestions.length > 0 && (
        <div
          id="address-suggestions"
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md max-h-60 overflow-auto"
        >
          {suggestions.map((s, index) => (
            <div
              key={s.placeId}
              role="option"
              tabIndex={-1}
              aria-selected={index === activeIndex}
              className={cn(
                'px-3 py-2 text-sm cursor-pointer',
                index === activeIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground',
              )}
              onMouseDown={() => selectSuggestion(s)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <span className="font-medium">{s.mainText}</span>
              {s.secondaryText && (
                <span className="text-muted-foreground ml-1">
                  {s.secondaryText}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
