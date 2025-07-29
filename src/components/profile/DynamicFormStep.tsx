import React, { useState, useEffect, useRef } from 'react';
import { useProfileForm } from './ProfileFormProvider';
import { getUnifiedSchemaStep, getUnifiedSchema } from '@/schemas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { MapPin, Upload, QrCode, Shield, Lock, Loader2 } from 'lucide-react';
import DigiLockerModal from './DigiLockerModal';
import QRCodeScannerDialog from './QRCodeScannerDialog';
import { FileUploadField } from '@/components/ui/file-upload-field';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { getSchema, getSchemaDescription } from '@/schemas';
import { getCurrentLocation, parseLocationString, formatLocationForDisplay } from '@/lib/utils';
import { LocationInput } from '@/components/ui/location-input';

interface DynamicFormStepProps {
  stepName: string;
  role?: string;
}

const DynamicFormStep: React.FC<DynamicFormStepProps> = ({ stepName, role }) => {
  const { profile, setProfile } = useProfileForm();
  

  const [showDigiLocker, setShowDigiLocker] = React.useState(false);
  const [showQRScanner, setShowQRScanner] = React.useState(false);
  const [qrFieldName, setQrFieldName] = React.useState<string>('');
  const [dropdownStates, setDropdownStates] = React.useState<Record<string, boolean>>({});
  const dropdownRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const [searchQueries, setSearchQueries] = React.useState<Record<string, string>>({});
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Handle clicking outside dropdowns to close them
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Check if click is outside any open dropdown
      Object.entries(dropdownStates).forEach(([fieldName, isOpen]) => {
        if (isOpen && dropdownRefs.current[fieldName]) {
          const dropdownElement = dropdownRefs.current[fieldName];
          if (dropdownElement && !dropdownElement.contains(target)) {
            setDropdownStates(prev => ({
              ...prev,
              [fieldName]: false
            }));
          }
        }
      });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Close all open dropdowns
        setDropdownStates(prev => {
          const newState = { ...prev };
          Object.keys(newState).forEach(key => {
            newState[key] = false;
          });
          return newState;
        });
      }
    };

    // Add event listeners if any dropdown is open
    const hasOpenDropdown = Object.values(dropdownStates).some(isOpen => isOpen);
    if (hasOpenDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownStates]);

  const schema = getUnifiedSchemaStep(role, stepName);

  if (!schema) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-600 mb-2">Schema not found for step: {stepName}</div>
        <div className="text-sm text-gray-600 mb-4">
          Role: {role}<br />
          Step: {stepName}<br />
          Available schemas: {Object.keys(getUnifiedSchema(role) || {}).join(', ')}
        </div>
        <div className="text-sm text-gray-500">
          This might be due to a missing schema configuration for the selected role.
        </div>
      </div>
    );
  }

  const stepData = (profile[stepName as keyof typeof profile] as Record<string, unknown>) || {};

  const setStepData = (newData: Record<string, unknown>) => {
    setProfile(prev => ({
      ...prev,
      [stepName]: { ...stepData, ...newData }
    }));
  };

  // For fields that should be accessed from global profile state (like age, name)
  const getFieldValue = (fieldName: string) => {
    // Special handling for phone field in whoIAm step
    if (fieldName === 'phone' && stepName === 'whoIAm') {
      return profile.whoIAm?.phone || stepData[fieldName] || '';
    }
    
    // For file upload fields and other step-specific fields, check step data first
    if (stepData[fieldName] !== undefined) {
      return stepData[fieldName];
    }
    
    // Check if the field exists in global profile state
    if (profile[fieldName as keyof typeof profile] !== undefined) {
      return profile[fieldName as keyof typeof profile];
    }
    
    // Return undefined if not found anywhere
    return undefined;
  };



  const handleFieldChange = (fieldName: string, value: unknown) => {

    // Update step data
    setStepData({ [fieldName]: value });

    // Also update global profile state for fields that should be accessible globally
    if (['name', 'age', 'gender', 'hometown', 'aadharNumber', 'qrCodeScan'].includes(fieldName)) {
      setProfile(prev => {
        return ({
          ...prev,
          [fieldName]: value
        })
      });
    }

    // Special handling for phone field in whoIAm step
    if (fieldName === 'phone' && stepName === 'whoIAm') {
      setProfile(prev => ({
        ...prev,
        whoIAm: {
          ...prev.whoIAm,
          phone: value
        }
      }));
    }
  };

  const handleDigiLockerSuccess = (data: Record<string, unknown>) => {
    // Extract only the properties we care about from the DigiLocker response
    // Prefer common naming variations if they exist
    const fullName: string | undefined =
      (data?.name as string) || (data?.fullName as string) || [data?.firstName, data?.lastName].filter(Boolean).join(' ').trim();

    // Calculate age more accurately from date of birth
    let derivedAge: number | undefined;
    const dob: string | undefined = (data?.dateOfBirth as string) || (data?.dob as string) || (data?.birthDate as string);

    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      derivedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        derivedAge--;
      }
    } else if (typeof data?.age === 'number') {
      derivedAge = data.age;
    }



    // Update both the step data and the global profile state
    const mappedData: Record<string, unknown> = {};
    const verificationFlags: Record<string, unknown> = {};

    if (fullName) {
      mappedData.name = fullName;
      verificationFlags.isNameVerified = true;
    }

    if (derivedAge !== undefined) {
      mappedData.age = derivedAge;
      verificationFlags.isAgeVerified = true;
    }

    if (data?.gender) {
      mappedData.gender = data.gender as string;
      verificationFlags.isGenderVerified = true;
    }

    if (data?.hometown) {
      mappedData.hometown = data.hometown as string;
      verificationFlags.isHometownVerified = true;
    }

    if (data?.aadharNumber) {
      mappedData.aadharNumber = data.aadharNumber as string;
      verificationFlags.isAadharVerified = true;
    }

    // Update step data
    setStepData(mappedData);

    // Update global profile state with verification flags
    setProfile(prevProfile => {
      const updatedProfile = {
        ...prevProfile,
        ...mappedData,
        ...verificationFlags
      };



      return updatedProfile;
    });

    setShowDigiLocker(false);
  };

  const handleQRScanComplete = (data: unknown) => {
    console.log('data: ', data)
    if (qrFieldName) {
      console.log("qr: ", qrFieldName)
      handleFieldChange(qrFieldName, data);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderField = (fieldName: string, fieldConfig: any) => {
    const value = getFieldValue(fieldName);
    const isRequired = schema.required?.includes(fieldName);
    const widget = fieldConfig['ui:widget'];
    const placeholder = fieldConfig['ui:placeholder'];
    const disabled = fieldConfig['ui:disabled'];
    const verificationMessage = fieldConfig['ui:verificationMessage'];
    const hasLocationButton = fieldConfig['ui:hasLocationButton'];
    const currency = fieldConfig['ui:currency'];



    // Check if field is verified from global profile state
    const isVerified = profile[`is${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}Verified` as keyof typeof profile];

    // Always access search state to ensure consistent hook calls
    const searchQuery = searchQueries[fieldName] || '';
    const setSearchQuery = (q: string) => {
      setSearchQueries(prev => ({ ...prev, [fieldName]: q }));
    };

    // Handle object type fields (subsections)
    if (fieldConfig.type === 'object') {
      const subsectionData = value || {};
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handleSubsectionFieldChange = (subsectionFieldName: string, subsectionValue: any) => {
        const updatedSubsectionData = {
          ...subsectionData,
          [subsectionFieldName]: subsectionValue
        };
        handleFieldChange(fieldName, updatedSubsectionData);
      };

      const getSubsectionFieldValue = (subsectionFieldName: string) => {
        return subsectionData[subsectionFieldName];
      };

      return (
        <div key={fieldName} className="space-y-4">
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-4">{fieldConfig.title}</h4>
            {fieldConfig.description && (
              <p className="text-sm text-gray-600 mb-4">{fieldConfig.description}</p>
            )}
            
            <div className="space-y-4">
              {fieldConfig.ui?.order?.map((subsectionFieldName: string) => {
                const subsectionFieldConfig = fieldConfig.properties?.[subsectionFieldName];
                if (!subsectionFieldConfig) return null;
                
                const subsectionValue = getSubsectionFieldValue(subsectionFieldName);
                const subsectionWidget = subsectionFieldConfig['ui:widget'];
                const subsectionPlaceholder = subsectionFieldConfig['ui:placeholder'];
                const subsectionDisabled = subsectionFieldConfig['ui:disabled'];
                const subsectionTooltip = subsectionFieldConfig['ui:tooltip'];

                switch (subsectionWidget) {
                  case 'text':
                    return (
                      <div key={subsectionFieldName} className="space-y-2">
                        <Label htmlFor={`${fieldName}_${subsectionFieldName}`} className="text-sm font-medium">
                          {subsectionFieldConfig.title}
                          {subsectionTooltip && (
                            <span className="ml-1 text-xs text-gray-500" title={subsectionTooltip}>ⓘ</span>
                          )}
                        </Label>
                        <Input
                          id={`${fieldName}_${subsectionFieldName}`}
                          type="text"
                          value={subsectionValue || ''}
                          onChange={(e) => handleSubsectionFieldChange(subsectionFieldName, e.target.value)}
                          placeholder={subsectionPlaceholder}
                          disabled={subsectionDisabled}
                        />
                        {subsectionFieldConfig.description && (
                          <p className="text-xs text-muted-foreground">{subsectionFieldConfig.description}</p>
                        )}
                      </div>
                    );

                  case 'number':
                    return (
                      <div key={subsectionFieldName} className="space-y-2">
                        <Label htmlFor={`${fieldName}_${subsectionFieldName}`} className="text-sm font-medium">
                          {subsectionFieldConfig.title}
                          {subsectionTooltip && (
                            <span className="ml-1 text-xs text-gray-500" title={subsectionTooltip}>ⓘ</span>
                          )}
                        </Label>
                        <Input
                          id={`${fieldName}_${subsectionFieldName}`}
                          type="number"
                          value={subsectionValue || ''}
                          onChange={(e) => handleSubsectionFieldChange(subsectionFieldName, parseInt(e.target.value) || 0)}
                          placeholder={subsectionPlaceholder}
                          disabled={subsectionDisabled}
                          min={subsectionFieldConfig.minimum}
                          max={subsectionFieldConfig.maximum}
                        />
                        {subsectionFieldConfig.description && (
                          <p className="text-xs text-muted-foreground">{subsectionFieldConfig.description}</p>
                        )}
                      </div>
                    );

                  case 'textarea':
                    return (
                      <div key={subsectionFieldName} className="space-y-2">
                        <Label htmlFor={`${fieldName}_${subsectionFieldName}`} className="text-sm font-medium">
                          {subsectionFieldConfig.title}
                          {subsectionTooltip && (
                            <span className="ml-1 text-xs text-gray-500" title={subsectionTooltip}>ⓘ</span>
                          )}
                        </Label>
                        <Textarea
                          id={`${fieldName}_${subsectionFieldName}`}
                          value={subsectionValue || ''}
                          onChange={(e) => handleSubsectionFieldChange(subsectionFieldName, e.target.value)}
                          placeholder={subsectionPlaceholder}
                          disabled={subsectionDisabled}
                          rows={4}
                        />
                        {subsectionFieldConfig.description && (
                          <p className="text-xs text-muted-foreground">{subsectionFieldConfig.description}</p>
                        )}
                      </div>
                    );

                  case 'file-upload':
                    return (
                      <div key={subsectionFieldName} className="space-y-2">
                        <FileUploadField
                          label={subsectionFieldConfig.title}
                          description={subsectionFieldConfig.description}
                          accept={subsectionFieldConfig['ui:accept'] || "*/*"}
                          fileType="document"
                          value={subsectionValue}
                          onChange={(file) => handleSubsectionFieldChange(subsectionFieldName, file)}
                          usePresignedUrl={true}
                          objectKeyPrefix="profile"
                        />
                      </div>
                    );

                  default:
                    return (
                      <div key={subsectionFieldName} className="space-y-2">
                        <Label htmlFor={`${fieldName}_${subsectionFieldName}`} className="text-sm font-medium">
                          {subsectionFieldConfig.title}
                          {subsectionTooltip && (
                            <span className="ml-1 text-xs text-gray-500" title={subsectionTooltip}>ⓘ</span>
                          )}
                        </Label>
                        <Input
                          id={`${fieldName}_${subsectionFieldName}`}
                          type="text"
                          value={subsectionValue || ''}
                          onChange={(e) => handleSubsectionFieldChange(subsectionFieldName, e.target.value)}
                          placeholder={subsectionPlaceholder}
                          disabled={subsectionDisabled}
                        />
                        {subsectionFieldConfig.description && (
                          <p className="text-xs text-muted-foreground">{subsectionFieldConfig.description}</p>
                        )}
                      </div>
                    );
                }
              })}
            </div>
          </div>
        </div>
      );
    }

    const handleLocationDetection = async () => {
      try {
        // Show loading state
        const inputElement = document.getElementById(fieldName) as HTMLInputElement;
        if (inputElement) {
          inputElement.value = 'Detecting location...';
          inputElement.disabled = true;
        }

        const locationData = await getCurrentLocation();
        const displayLocation = formatLocationForDisplay(locationData);
        
        // Update the field with the formatted location
        handleFieldChange(fieldName, displayLocation);
        
        // Also store the full location data in the profile for API use
        setProfile(prevProfile => ({
          ...prevProfile,
          [stepName]: {
            ...prevProfile[stepName],
            [`${fieldName}Data`]: locationData // Store full location data
          }
        }));

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
        // Re-enable the input
        const inputElement = document.getElementById(fieldName) as HTMLInputElement;
        if (inputElement) {
          inputElement.disabled = false;
        }
      }
    };

    const handleVideoUpload = () => {
      // This function is now handled by FileUploadField component
    };

    const handleQRScan = () => {
      setQrFieldName(fieldName);
      setShowQRScanner(true);
    };

    switch (widget) {
      case 'text':
        // Special handling for location fields
        if (hasLocationButton) {
          return (
            <div key={fieldName} className="space-y-2">
              <LocationInput
                value={value || ''}
                onChange={(newValue) => handleFieldChange(fieldName, newValue)}
                onLocationDataChange={(locationData) => {
                  // Store the full location data for API use
                  setProfile(prevProfile => ({
                    ...prevProfile,
                    [stepName]: {
                      ...prevProfile[stepName],
                      [`${fieldName}Data`]: locationData
                    }
                  }));
                }}
                placeholder={placeholder}
                label={fieldConfig.title}
                required={isRequired}
                disabled={disabled || isVerified}
                className={isVerified ? 'border-green-500' : ''}
              />
              
              {/* Verification indicators */}
              {isVerified && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Shield className="h-4 w-4" />
                  <span>{verificationMessage || `Verified via DigiLocker`}</span>
                </div>
              )}
              
              {fieldConfig.description && (
                <p className="text-xs text-muted-foreground">{fieldConfig.description}</p>
              )}
            </div>
          );
        }

        // Regular text input for non-location fields
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName} className="text-sm font-medium">
              {fieldConfig.title}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="relative">
              <Input
                id={fieldName}
                type="text"
                value={value || ''}
                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                placeholder={placeholder}
                disabled={disabled || isVerified}
                className={isVerified ? 'border-green-500' : ''}
              />
              {isVerified && (
                <div className="absolute right-2 top-2 flex items-center gap-1">
                  <Shield className="h-4 w-4 text-green-600" />
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
            {isVerified && (
              <p className="text-xs text-green-600">
                {verificationMessage || `Verified via DigiLocker`}
              </p>
            )}
            {fieldConfig.description && (
              <p className="text-xs text-muted-foreground">{fieldConfig.description}</p>
            )}
          </div>
        );

      case 'tel':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName} className="text-sm font-medium">
              {fieldConfig.title}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="tel"
              value={value || ''}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              pattern={fieldConfig.pattern}
              maxLength={fieldConfig.maxLength || 15}
            />
            {fieldConfig.description && (
              <p className="text-xs text-muted-foreground">{fieldConfig.description}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName} className="text-sm font-medium">
              {fieldConfig.title}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="relative">
              <Input
                id={fieldName}
                type="number"
                value={value || ''}
                onChange={(e) => handleFieldChange(fieldName, parseInt(e.target.value) || 0)}
                placeholder={placeholder}
                disabled={disabled || isVerified}
                min={fieldConfig.minimum}
                max={fieldConfig.maximum}
                className={`${isVerified ? 'border-green-500' : ''} ${currency ? 'pl-8' : ''}`}
              />
              {currency && (
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
                  {currency}
                </span>
              )}
              {isVerified && (
                <div className="absolute right-2 top-2 flex items-center gap-1">
                  <Shield className="h-4 w-4 text-green-600" />
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
            {isVerified && (
              <p className="text-xs text-green-600">
                {verificationMessage || `Verified via DigiLocker`}
              </p>
            )}
            {fieldConfig.description && (
              <p className="text-xs text-muted-foreground">{fieldConfig.description}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName} className="text-sm font-medium">
              {fieldConfig.title}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="relative">
              <Select
                value={value || ''}
                onValueChange={(val) => handleFieldChange(fieldName, val)}
                disabled={disabled || isVerified}
              >
                <SelectTrigger className={isVerified ? 'border-green-500' : ''}>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {fieldConfig.enum?.map((option: string, index: number) => (
                    <SelectItem key={option} value={option}>
                      {fieldConfig.enumNames?.[index] || option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isVerified && (
                <div className="absolute right-2 top-2 flex items-center gap-1">
                  <Shield className="h-4 w-4 text-green-600" />
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
            {isVerified && (
              <p className="text-xs text-green-600">
                {verificationMessage || `Verified via DigiLocker`}
              </p>
            )}
            {fieldConfig.description && (
              <p className="text-xs text-muted-foreground">{fieldConfig.description}</p>
            )}
          </div>
        );

      case 'multiselect-dropdown': {
        const currentDropdownValues = Array.isArray(value) ? value : [];
        const hasOtherDropdownField = fieldConfig['ui:hasOther'];
        const otherDropdownFieldName = `${fieldName}_other`;
        const otherDropdownValue = (stepData[otherDropdownFieldName] as string) || '';
        const isDropdownOpen = dropdownStates[fieldName] || false;
        const isSearchable = fieldConfig['ui:searchable'];

        const toggleDropdown = () => {
          setDropdownStates(prev => ({
            ...prev,
            [fieldName]: !prev[fieldName]
          }));
          // Clear search when opening dropdown
          if (!isDropdownOpen) {
            setSearchQuery('');
          }
        };

        // Filter options based on search query
        const filteredOptions = fieldConfig.enum?.filter((option: string, index: number) => {
          if (!searchQuery) return true;
          const optionValue = fieldConfig.enumNames?.[index] || option;
          const searchTerm = searchQuery.toLowerCase().trim();
          
          // Search in both the original option and the display name
          // Also split search terms to match any part
          const searchTerms = searchTerm.split(' ').filter(term => term.length > 0);
          
          if (searchTerms.length === 0) return true;
          
          // First try exact match
          if (option.toLowerCase().includes(searchTerm) || optionValue.toLowerCase().includes(searchTerm)) {
            return true;
          }
          
          // Then try partial matches for each search term
          return searchTerms.every(term => 
            option.toLowerCase().includes(term) || 
            optionValue.toLowerCase().includes(term)
          );
        }) || [];



        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName} className="text-sm font-medium">
              {fieldConfig.title}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>

            {/* Custom Dropdown */}
            <div className="relative" ref={(el) => dropdownRefs.current[fieldName] = el}>
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDropdown();
                }}
                disabled={disabled}
                className="w-full justify-between text-left font-normal"
              >
                <span className="truncate">
                  {currentDropdownValues.length > 0
                    ? `${currentDropdownValues.length} selected`
                    : placeholder || "Select options"}
                </span>
                <div className="ml-2 flex-shrink-0">
                  {isDropdownOpen ? '▲' : '▼'}
                </div>
              </Button>

              {isDropdownOpen && (
                <div 
                  className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Search Input */}
                  {isSearchable && (
                    <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
                      <Input
                        type="text"
                        placeholder="Search options..."
                        value={searchQuery}
                        onChange={(e) => {
                          e.stopPropagation();
                          setSearchQuery(e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm"
                        autoFocus
                      />
                      {searchQuery && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {filteredOptions.length} of {fieldConfig.enum?.length || 0} options
                        </div>
                      )}
                    </div>
                  )}

                  {/* Options List */}
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option: string, index: number) => {
                      const optionValue = fieldConfig.enumNames?.[index] || option;
                      const isSelected = currentDropdownValues.includes(optionValue);
                      const isOtherOption = option.toLowerCase() === 'other';

                      return (
                        <div key={option} className="p-2 hover:bg-gray-50">
                          <div
                            className="flex items-center space-x-2 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newValues = isSelected
                                ? currentDropdownValues.filter(v => v !== optionValue)
                                : [...currentDropdownValues, optionValue];
                              handleFieldChange(fieldName, newValues);
                            }}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => { }} // Handled by parent div onClick
                              disabled={disabled}
                            />
                            <span className="text-sm flex-1">{optionValue}</span>
                          </div>

                          {/* Show text input when "Other" is selected */}
                          {isOtherOption && isSelected && hasOtherDropdownField && (
                            <div className="mt-2 ml-6">
                              <Input
                                type="text"
                                value={otherDropdownValue}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleFieldChange(otherDropdownFieldName, e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="Please specify..."
                                disabled={disabled}
                                className="text-sm"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      <div>No options found matching "{searchQuery}"</div>
                      <div className="text-xs mt-1">Try different keywords or check spelling</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected items display */}
            {currentDropdownValues.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {currentDropdownValues.map((selectedValue, index) => (
                  <div key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    <span>{selectedValue}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newValues = currentDropdownValues.filter(v => v !== selectedValue);
                        handleFieldChange(fieldName, newValues);
                      }}
                      disabled={disabled}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {fieldConfig.description && (
              <p className="text-xs text-muted-foreground">{fieldConfig.description}</p>
            )}
          </div>
        );
      }

      case 'multiselect': {
        const currentValues = Array.isArray(value) ? value : [];
        const hasOtherField = fieldConfig['ui:hasOther'];
        const otherFieldName = `${fieldName}_other`;
        const otherValue = (stepData[otherFieldName] as string) || '';

        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName} className="text-sm font-medium">
              {fieldConfig.title}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              {fieldConfig.enum?.map((option: string, index: number) => {
                const optionValue = fieldConfig.enumNames?.[index] || option;
                const isChecked = currentValues.includes(optionValue);
                const isOtherOption = option.toLowerCase() === 'other';

                return (
                  <div key={option} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${fieldName}_${option}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          const newValues = checked
                            ? [...currentValues, optionValue]
                            : currentValues.filter(v => v !== optionValue);
                          handleFieldChange(fieldName, newValues);
                        }}
                        disabled={disabled}
                      />
                      <Label htmlFor={`${fieldName}_${option}`} className="text-sm">
                        {optionValue}
                      </Label>
                    </div>

                    {/* Show text input when "Other" is selected */}
                    {isOtherOption && isChecked && hasOtherField && (
                      <div className="ml-6">
                        <Input
                          type="text"
                          value={otherValue}
                          onChange={(e) => handleFieldChange(otherFieldName, e.target.value)}
                          placeholder="Please specify..."
                          disabled={disabled}
                          className="text-sm"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {fieldConfig.description && (
              <p className="text-xs text-muted-foreground">{fieldConfig.description}</p>
            )}
          </div>
        );
      }

      case 'textarea':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName} className="text-sm font-medium">
              {fieldConfig.title}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={fieldName}
              value={value || ''}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              rows={4}
            />
            {fieldConfig.description && (
              <p className="text-xs text-muted-foreground">{fieldConfig.description}</p>
            )}
          </div>
        );

      case 'video-upload':
        return (
          <div key={fieldName} className="space-y-2">
            <FileUploadField
              label={fieldConfig.title}
              description={fieldConfig.description}
              accept="video/*"
              fileType="video"
              value={value}
              onChange={(file) => handleFieldChange(fieldName, file)}
              usePresignedUrl={true}
              objectKeyPrefix="profile"
            />
          </div>
        );

      case 'file-upload':
        return (
          <div key={fieldName} className="space-y-2">
            <FileUploadField
              label={fieldConfig.title}
              description={fieldConfig.description}
              accept={fieldConfig['ui:accept'] || "*/*"}
              fileType="document"
              value={value}
              onChange={(file) => handleFieldChange(fieldName, file)}
              usePresignedUrl={true}
              objectKeyPrefix="profile"
            />
          </div>
        );

      case 'qr-scanner':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName} className="text-sm font-medium">
              {fieldConfig.title}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              {value && (
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm font-medium">Scanned Data:</p>
                  <p className="text-xs text-muted-foreground break-all">{value}</p>
                </div>
              )}
              {/* here make changes  */}
              <Button
                type="button"
                variant="outline"
                onClick={handleQRScan}
                disabled={disabled}
                className="w-full"
              >
                <QrCode className="h-4 w-4 mr-2" />
                {value ? 'Scan Again' : 'Scan QR Code'}
              </Button>
            </div>
            {fieldConfig.description && (
              <p className="text-xs text-muted-foreground">{fieldConfig.description}</p>
            )}
          </div>
        );

      default:
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName} className="text-sm font-medium">
              {fieldConfig.title}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="text"
              value={value || ''}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
            />
            {fieldConfig.description && (
              <p className="text-xs text-muted-foreground">{fieldConfig.description}</p>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">{schema.title}</h3>
        <p className="text-sm text-muted-foreground">{schema.description}</p>
      </div>



      {/* DigiLocker Integration */}
      {schema.ui?.showDigiLocker && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-800">
                {schema.ui.digiLockerConfig?.title}
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                {schema.ui.digiLockerConfig?.description}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowDigiLocker(true)}
              className="text-blue-700 border-blue-300 hover:bg-blue-100"
            >
              {schema.ui.digiLockerConfig?.buttonText}
            </Button>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            {schema.ui.digiLockerConfig?.footerText}
          </p>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-4">
        {schema.ui?.order?.map((fieldName: string) => {
          const fieldConfig = schema.properties?.[fieldName];
          if (!fieldConfig) return null;
          return renderField(fieldName, fieldConfig);
        })}
      </div>

      {/* DigiLocker Modal */}
      <DigiLockerModal
        isOpen={showDigiLocker}
        onClose={() => setShowDigiLocker(false)}
        onSuccess={handleDigiLockerSuccess}
      />

      {/* QR Scanner Dialog */}
      <QRCodeScannerDialog
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScanComplete={handleQRScanComplete}
        type="skill"
      />
    </div>
  );
};

export default DynamicFormStep; 
