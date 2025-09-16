import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MapPin, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { parseLocationString, validateLocationForAPI, getCurrentLocation, formatLocationForDisplay, type LocationData } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { PlacesPrediction } from '@/services/mapService';

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  onLocationDataChange?: (locationData: LocationData) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  // New props for external validation state management
  externalValidation?: { isValid: boolean; errors: string[] };
  onValidationChange?: (validation: { isValid: boolean; errors: string[] }) => void;
  onValidationSuccess?: () => void; // Callback when validation becomes valid
}

export const LocationInput: React.FC<LocationInputProps> = ({
  value,
  onChange,
  onLocationDataChange,
  placeholder = "Enter your location (e.g., Bangalore, Karnataka)",
  label = "Location",
  required = false,
  disabled = false,
  className = "",
  externalValidation,
  onValidationChange,
  onValidationSuccess
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [internalValidation, setInternalValidation] = useState<{ isValid: boolean; errors: string[] }>({ isValid: true, errors: [] });
  const [suggestions, setSuggestions] = useState<PlacesPrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Use external validation if provided, otherwise use internal validation
  const validation = externalValidation !== undefined ? externalValidation : internalValidation;

  // Update internal validation when external validation changes
  useEffect(() => {
    if (externalValidation !== undefined) {
      setInternalValidation(externalValidation);
    }
  }, [externalValidation]);

  const validateLocation = useCallback((locationString: string) => {
    if (!locationString.trim()) {
      const newValidation = { isValid: !required, errors: required ? ['Location is required'] : [] };
      
      if (onValidationChange) {
        onValidationChange(newValidation);
      } else {
        setInternalValidation(newValidation);
      }
      return;
    }

    const locationData = parseLocationString(locationString);
    const validationResult = validateLocationForAPI(locationData);
    
    if (onValidationChange) {
      onValidationChange(validationResult);
    } else {
      setInternalValidation(validationResult);
    }

    // If valid, also update the location data for API use and call success callback
    if (validationResult.isValid) {
      if (onLocationDataChange) {
        onLocationDataChange(locationData);
      }
      if (onValidationSuccess) {
        onValidationSuccess();
      }
    }
  }, [required, onValidationChange, onLocationDataChange, onValidationSuccess]);

  // Validate initial value when component mounts
  useEffect(() => {
    if (value && value.trim()) {
      validateLocation(value);
    }
  }, [value, validateLocation]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        suggestionsRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 4) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      // Import map service dynamically
      const { mapService } = await import('@/services/mapService');
      const predictions = await mapService.getPlacePredictions(query);
      setSuggestions(predictions);
      setShowSuggestions(predictions.length > 0);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  const handleInputChange = useCallback((newValue: string) => {
    onChange(newValue);
    validateLocation(newValue);
    
    // Debounce suggestions fetching
    const timeoutId = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);

    // Store timeout ID for cleanup
    return () => clearTimeout(timeoutId);
  }, [onChange, validateLocation, fetchSuggestions]);

  const handleSuggestionClick = async (suggestion: PlacesPrediction) => {
    try {
      // Import map service dynamically
      const { mapService } = await import('@/services/mapService');
      const placeDetails = await mapService.getPlaceDetails(suggestion.place_id);
      
      if (placeDetails) {
        const displayLocation = formatLocationForDisplay({
          address: placeDetails.address || '',
          city: placeDetails.city || '',
          state: placeDetails.state || '',
          country: placeDetails.country || 'India'
        });
        
        onChange(displayLocation);
        validateLocation(displayLocation);
        
        if (onLocationDataChange) {
          onLocationDataChange({
            address: placeDetails.address || '',
            city: placeDetails.city || '',
            state: placeDetails.state || '',
            country: placeDetails.country || 'India',
            lat: placeDetails.lat,
            lng: placeDetails.lng
          });
        }
      } else {
        // Fallback to just the description
        onChange(suggestion.description);
        validateLocation(suggestion.description);
      }
    } catch (error) {
      console.error('Error getting place details:', error);
      // Fallback to just the description
      onChange(suggestion.description);
      validateLocation(suggestion.description);
    }
    
    setShowSuggestions(false);
  };

  const handleLocationDetection = async () => {
    setIsDetecting(true);
    try {
      const locationData = await getCurrentLocation();
      const displayLocation = formatLocationForDisplay(locationData);
      
      onChange(displayLocation);
      validateLocation(displayLocation);
      
      if (onLocationDataChange) {
        onLocationDataChange(locationData);
      }

      toast({
        title: "Location detected",
        description: `Current location: ${displayLocation}`,
      });
    } catch (error) {
      console.error('Location detection failed:', error);
      toast({
        title: "Location detection failed",
        description: "Please enter your location manually",
        variant: "destructive"
      });
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="location" className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          ref={inputRef}
          id="location"
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => value.length >= 4 && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={disabled || isDetecting}
          className={`pr-20 ${validation.isValid ? '' : 'border-red-500'}`}
        />
        
        {isLoadingSuggestions && (
          <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
            <Search className="h-4 w-4 animate-spin" />
          </div>
        )}
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleLocationDetection}
          disabled={disabled || isDetecting}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          title="Get current location"
        >
          {isDetecting ? (
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
        </Button>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div 
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.place_id || index}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="font-medium text-sm text-gray-900">
                  {suggestion.structured_formatting.main_text}
                </div>
                {suggestion.structured_formatting.secondary_text && (
                  <div className="text-xs text-gray-500 mt-1">
                    {suggestion.structured_formatting.secondary_text}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Validation feedback */}
      {!validation.isValid && validation.errors.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{validation.errors[0]}</span>
        </div>
      )}

      {validation.isValid && value.trim() && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>Location format is valid</span>
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        Type at least 4 characters to see location suggestions. Format: City, State (e.g., "Bangalore, Karnataka")
      </p>
    </div>
  );
};
