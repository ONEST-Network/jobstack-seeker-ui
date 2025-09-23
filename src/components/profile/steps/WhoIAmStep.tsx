import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Mic, MapPin, FileText, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProfileForm } from '../ProfileFormProvider';
import DigiLockerModal from '../DigiLockerModal';
import WalletImportModal from '../WalletImportModal';
import { getSchema, getFieldConfig, getFieldUI, getSchemaDescription } from '@/schemas';
import { getCurrentLocation, formatLocationForDisplay } from '@/lib/utils';
import { LocationInput } from '@/components/ui/location-input';

interface WhoIAmStepProps {
  onVoiceStart?: () => void;
}

const WhoIAmStep: React.FC<WhoIAmStepProps> = ({
  onVoiceStart
}) => {
  const {
    profile,
    setProfile
  } = useProfileForm();
  const {
    toast
  } = useToast();
  const [showDigiLockerModal, setShowDigiLockerModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Get schema data
  const schema = getSchema('whoIAm', profile.interestedRole);
  const description = getSchemaDescription('whoIAm', profile.interestedRole);

  if (!schema) {
    console.error('Schema not found for WhoIAm step with role:', profile.interestedRole);
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Schema not found for role: {profile.interestedRole || 'No role selected'}
          </p>
        </div>
      </div>
    );
  }


  const handleDateOfBirthChange = (dob: string) => {
    const age = dob ? new Date().getFullYear() - new Date(dob).getFullYear() : undefined;
    setProfile({
      ...profile,
      dateOfBirth: dob,
      age: age
    });
  };

  const handleLocationDetection = async () => {
    try {
      const locationData = await getCurrentLocation();
      const displayLocation = formatLocationForDisplay(locationData);
      
      setProfile(prevProfile => ({
        ...prevProfile,
        whoIAm: {
          ...prevProfile.whoIAm,
          location: displayLocation,
          locationData: locationData // Store full location data for API
        }
      }));
      
      toast({
        title: "Location detected",
        description: `Current location: ${displayLocation}`
      });
    } catch (error) {
      console.error('Location detection failed:', error);
      toast({
        title: "Location detection failed",
        description: "Please enter your location manually",
        variant: "destructive"
      });
    }
  };

  const handleDigiLockerImport = () => {
    setShowDigiLockerModal(true);
  };

  const handleDigiLockerSuccess = (data: any) => {
    // Extract only the properties we care about from the DigiLocker response
    // Prefer common naming variations if they exist
    const fullName: string | undefined =
      data?.name || data?.fullName || [data?.firstName, data?.lastName].filter(Boolean).join(' ').trim();

    // Calculate age more accurately from date of birth
    let derivedAge: number | undefined;
    const dob: string | undefined = data?.dateOfBirth || data?.dob || data?.birthDate;

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



    // Update both name (in WhoIAm) and age (in WhatIHave) and mark them verified
    setProfile(prevProfile => ({
      ...prevProfile,
      whoIAm: {
        ...prevProfile.whoIAm,
        ...(fullName ? { name: fullName, isNameVerified: true } : {}),
        ...(derivedAge !== undefined ? { age: derivedAge, isAgeVerified: true } : {})
      }
    }));

    setShowDigiLockerModal(false);
  };

  const handleDigiLockerClose = () => {
    setShowDigiLockerModal(false);
  };

  const handleWalletImport = () => {
    setShowWalletModal(true);
  };

  const handleWalletSuccess = (data: Record<string, string | number | boolean | undefined>) => {
    // Extract and map wallet data to the profile format
    const updatedProfile = { ...profile };

    // Map common fields
    if (data.name) {
      updatedProfile.whoIAm = { ...updatedProfile.whoIAm, name: data.name as string };
      updatedProfile.isNameVerified = true;
    }

    if (data.email) {
      updatedProfile.whoIAm = { ...updatedProfile.whoIAm, email: data.email as string };
      updatedProfile.isEmailVerified = true;
    }

    if (data.phone) {
      updatedProfile.whoIAm = { ...updatedProfile.whoIAm, phone: data.phone as string };
      updatedProfile.isPhoneVerified = true;
    }

    if (data.age) {
      updatedProfile.whoIAm = { ...updatedProfile.whoIAm, age: data.age as number };
      updatedProfile.isAgeVerified = true;
    }

    // Set additional verification flags
    Object.keys(data).forEach(key => {
      if (key.includes('Verified') && data[key]) {
        (updatedProfile as any)[key] = data[key];
      }
    });

    setProfile(updatedProfile);
    setShowWalletModal(false);

    toast({
      title: "Wallet Import Successful",
      description: "Your verified credentials have been imported from your wallet."
    });
  };

  const handleWalletClose = () => {
    setShowWalletModal(false);
  };

  const maskAadharNumber = (aadhar: string) => {
    if (!aadhar || aadhar.length !== 12) return aadhar;
    return `XXXX-XXXX-${aadhar.slice(-4)}`;
  };

  const renderField = (fieldName: string) => {
    // Direct access to schema properties
    const fieldConfig = schema?.properties?.[fieldName];
    
    if (!fieldConfig) {
      return null;
    }

    // Get value from the correct location in the profile
    // For WhoIAm step, fields should be in profile.whoIAm
    const value = profile.whoIAm?.[fieldName] || profile[fieldName as keyof typeof profile];
    const isVerified = profile.whoIAm?.[`is${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}Verified`] || 
                      profile[`is${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}Verified` as keyof typeof profile];

    // Type-safe value handling
    const getStringValue = () => {
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return value.toString();
      if (value === null || value === undefined) return '';
      return String(value);
    };

    const handleChange = (newValue: any) => {
      // Update the field in the correct location
      // For WhoIAm step, update in profile.whoIAm
      setProfile(prevProfile => ({
        ...prevProfile,
        whoIAm: {
          ...prevProfile.whoIAm,
          [fieldName]: newValue
        }
      }));
    };

    // Special handling for Aadhar number masking
    const getAadharValue = () => {
      if (fieldName === 'aadharNumber' && isVerified) {
        return maskAadharNumber(getStringValue());
      }
      return getStringValue();
    };

    // Get UI properties directly from field config
    const widget = fieldConfig['ui:widget'];
    const placeholder = fieldConfig['ui:placeholder'];
    const disabled = fieldConfig['ui:disabled'];
    const hasLocationButton = fieldConfig['ui:hasLocationButton'];
    const verificationMessage = fieldConfig['ui:verificationMessage'];
    const isRequired = schema?.required?.includes(fieldName) || false;

    // Special handling for location field
    if (fieldName === 'location' && hasLocationButton) {
      return (
        <div key={fieldName} className="space-y-2">
          <LocationInput
            value={getStringValue()}
            onChange={handleChange}
            onLocationDataChange={(locationData) => {
              // Store the full location data for API use
              setProfile(prevProfile => ({
                ...prevProfile,
                whoIAm: {
                  ...prevProfile.whoIAm,
                  locationData: locationData
                }
              }));
            }}
            placeholder={placeholder}
            label={fieldConfig.title}
            required={isRequired}
            disabled={disabled || isVerified}
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

    // Regular field rendering for non-location fields
    return (
      <div key={fieldName} className="space-y-2">
        <Label htmlFor={fieldName} className="text-sm font-medium">
          {fieldConfig.title}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <div className="relative">
          {widget === 'select' ? (
            <Select 
              value={getStringValue()} 
              onValueChange={handleChange}
              disabled={disabled || isVerified}
            >
              <SelectTrigger>
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
          ) : (
            <Input
              id={fieldName}
              type={widget === 'tel' ? 'tel' : 'text'}
              value={fieldName === 'aadharNumber' ? getAadharValue() : getStringValue()}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled || isVerified}
              className={isVerified ? 'border-green-500' : ''}
              pattern={fieldConfig.pattern}
              maxLength={fieldConfig.maxLength || (widget === 'tel' ? 15 : undefined)}
            />
          )}

          {/* Verification indicators */}
          {isVerified && (
            <div className="absolute right-2 top-2 flex items-center gap-1">
              <Shield className="h-4 w-4 text-green-600" />
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Verification message */}
        {isVerified && (
          <p className="text-xs text-green-600 mt-1">
            {verificationMessage || `Verified via DigiLocker`}
          </p>
        )}
        
        {fieldConfig.description && (
          <p className="text-xs text-muted-foreground">{fieldConfig.description}</p>
        )}
      </div>
    );
  };

  // Debug: Check what fields are available
  const fieldOrder = schema.ui?.order || [];
  const availableFields = Object.keys(schema.properties || {});

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {schema.ui?.description || description}
        </p>
      </div>

      {/* DigiLocker Import */}
      {schema.ui?.showDigiLocker && (
        <Card className="border-dashed border-2 border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-blue-700">
              <FileText className="h-4 w-4" />
              {schema.ui?.digiLockerConfig?.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {schema.ui?.digiLockerConfig?.description}
            </p>
            <Button onClick={handleDigiLockerImport} className="w-full">
              {schema.ui?.digiLockerConfig?.buttonText}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              {schema.ui?.digiLockerConfig?.footerText}
            </p>
            
            {/* Test button for development */}
            {process.env.NODE_ENV === 'development' && (
              <Button 
                onClick={() => handleDigiLockerSuccess({
                  name: 'John Doe',
                  dateOfBirth: '1990-05-15',
                  age: 33,
                  gender: 'male',
                  hometown: 'Mumbai, Maharashtra'
                })} 
                variant="outline" 
                className="w-full mt-2"
              >
                Test DigiLocker Import
              </Button>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Wallet Import */}
      {schema.ui?.showWallet && (
        <Card className="border-dashed border-2 border-purple-200 bg-purple-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-purple-700">
              <Wallet className="h-4 w-4" />
              {schema.ui?.walletConfig?.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {schema.ui?.walletConfig?.description}
            </p>
            <Button onClick={handleWalletImport} className="w-full">
              {schema.ui?.walletConfig?.buttonText}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              {schema.ui?.walletConfig?.footerText}
            </p>
            
            {/* Test button for development */}
            {process.env.NODE_ENV === 'development' && (
              <Button 
                onClick={() => handleWalletSuccess({
                  name: 'Jane Smith',
                  email: 'jane.smith@example.com',
                  phone: '9876543210',
                  age: 25,
                  certificationName: 'Digital Marketing Certificate',
                  isNameVerified: true,
                  isEmailVerified: true,
                  isPhoneVerified: true
                })} 
                variant="outline" 
                className="w-full mt-2"
              >
                Test Wallet Import
              </Button>
            )}
          </CardContent>
        </Card>
      )}


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fieldOrder.length > 0 ? (
          fieldOrder.map(fieldName => {
            const renderedField = renderField(fieldName);
                         // If phone field is not rendered, render it manually
             if (fieldName === 'phone' && !renderedField) {
               return (
                 <div key={fieldName} className="">
                  <Label htmlFor={fieldName}>
                    Phone Number
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="relative">
                    <Input 
                      id={fieldName}
                      type="tel"
                      value={profile.whoIAm?.phone || ''}
                      onChange={e => setProfile(prevProfile => ({
                        ...prevProfile,
                        whoIAm: {
                          ...prevProfile.whoIAm,
                          phone: e.target.value
                        }
                      }))}
                      placeholder="Enter phone number"
                      disabled={false}
                      maxLength={15}
                      pattern="^[0-9]{10}$"
                    />
                  </div>
                </div>
              );
            }
            return (
              <React.Fragment key={fieldName}>
                {renderedField}
              </React.Fragment>
            );
          })
        ) : (
          availableFields.map(fieldName => {
            const renderedField = renderField(fieldName);
                         // If phone field is not rendered, render it manually
             if (fieldName === 'phone' && !renderedField) {
               return (
                 <div key={fieldName} className="">
                  <Label htmlFor={fieldName}>
                    Phone Number
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="relative">
                    <Input 
                      id={fieldName}
                      type="tel"
                      value={profile.whoIAm?.phone || ''}
                      onChange={e => setProfile(prevProfile => ({
                        ...prevProfile,
                        whoIAm: {
                          ...prevProfile.whoIAm,
                          phone: e.target.value
                        }
                      }))}
                      placeholder="Enter phone number"
                      disabled={false}
                      maxLength={15}
                      pattern="^[0-9]{10}$"
                    />
                  </div>
                </div>
              );
            }
            return (
              <React.Fragment key={fieldName}>
                {renderedField}
              </React.Fragment>
            );
          })
        )}
        
        {/* Fallback: If no fields are rendered, show a message */}
        {fieldOrder.length === 0 && availableFields.length === 0 && (
          <div className="md:col-span-2 text-center text-muted-foreground">
            No fields configured in schema
          </div>
        )}
      </div>

      {/* DigiLocker Modal */}
      <DigiLockerModal
        isOpen={showDigiLockerModal}
        onClose={handleDigiLockerClose}
        onSuccess={handleDigiLockerSuccess}
      />

      {/* Wallet Import Modal */}
      <WalletImportModal
        isOpen={showWalletModal}
        onClose={handleWalletClose}
        onSuccess={handleWalletSuccess}
      />
    </div>
  );
};

export default WhoIAmStep;