import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { parseLocationString, validateLocationForAPI, getCurrentLocation, formatLocationForDisplay } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  onLocationDataChange?: (locationData: any) => void;
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
  const { toast } = useToast();

  // Use external validation if provided, otherwise use internal validation
  const validation = externalValidation !== undefined ? externalValidation : internalValidation;

  // Update internal validation when external validation changes
  useEffect(() => {
    if (externalValidation !== undefined) {
      setInternalValidation(externalValidation);
    }
  }, [externalValidation]);

  // Validate initial value when component mounts
  useEffect(() => {
    if (value && value.trim()) {
      validateLocation(value);
    }
  }, []); // Only run once on mount

  const validateLocation = (locationString: string) => {
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
  };

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    validateLocation(newValue);
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
          id="location"
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || isDetecting}
          className={`pr-20 ${validation.isValid ? '' : 'border-red-500'}`}
        />
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleLocationDetection}
          disabled={disabled || isDetecting}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
        >
          {isDetecting ? (
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
        </Button>
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
        Format: City, State (e.g., "Bangalore, Karnataka" or "Mumbai, Maharashtra")
      </p>
    </div>
  );
}; 