import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Mic, MapPin, FileText, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProfileForm } from '../ProfileFormProvider';
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
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Get schema data with fallback logic
  let schema = getSchema('whoIAm', profile.interestedRole);
  let description = getSchemaDescription('whoIAm', profile.interestedRole);

  if (!schema) {
    console.warn('Schema not found for WhoIAm step with role:', profile.interestedRole);
    // Try fallback to generic ITI schema if no specific schema found
    schema = getSchema('whoIAm', 'ITI (Other)') || getSchema('whoIAm', 'Fitter');
    description = getSchemaDescription('whoIAm', 'ITI (Other)') || getSchemaDescription('whoIAm', 'Fitter');
    
    if (!schema) {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Schema not found for role: {profile.interestedRole || 'No role selected'}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Please select a valid role to continue with profile creation.
            </p>
          </div>
        </div>
      );
    }
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


  const handleWalletImport = () => {
    setShowWalletModal(true);
  };

  const handleWalletSuccess = (data: Record<string, any>) => {
    // Extract and map wallet data to the profile format
    const updatedProfile = { ...profile };

    // Handle structured data from wallet import
    if (data.whoIAm) {
      updatedProfile.whoIAm = {
        ...updatedProfile.whoIAm,
        ...data.whoIAm
      };
    }

    if (data.whatIHave) {
      updatedProfile.whatIHave = {
        ...updatedProfile.whatIHave,
        ...data.whatIHave
      };
    }

    if (data.whatIWant) {
      updatedProfile.whatIWant = {
        ...updatedProfile.whatIWant,
        ...data.whatIWant
      };
    }

    // Set verification metadata from wallet
    if (data.vcMetadata) {
      updatedProfile.vcMetadata = data.vcMetadata;
    }

    // Set imported from wallet flag
    if (data.importedFromWallet) {
      updatedProfile.importedFromWallet = data.importedFromWallet;
    }

    // Only auto-detect and set role if no role is currently selected
    // This prevents overriding when user is already filling a specific role's profile
    if (!updatedProfile.interestedRole && data.whatIHave?.itiSpecialization && Array.isArray(data.whatIHave.itiSpecialization) && data.whatIHave.itiSpecialization.length > 0) {
      const detectedTrade = data.whatIHave.itiSpecialization[0].toLowerCase();
      
      // Map ITI trade to role name if needed - only if no role is currently set
      if (detectedTrade.includes('fitter')) {
        updatedProfile.interestedRole = 'Fitter';
      } else if (detectedTrade.includes('mechanic')) {
        updatedProfile.interestedRole = 'Mechanic';
      } else if (detectedTrade.includes('electrician')) {
        updatedProfile.interestedRole = 'Electrician';
      } else if (detectedTrade.includes('welder')) {
        updatedProfile.interestedRole = 'Welder';
      } else if (detectedTrade.includes('machine operator')) {
        updatedProfile.interestedRole = 'Machine Operator';
      } else if (detectedTrade.includes('cnc operator')) {
        updatedProfile.interestedRole = 'CNC Operator';
      } else if (detectedTrade.includes('lathe operator')) {
        updatedProfile.interestedRole = 'Lathe Operator';
      } else {
        // Use generic ITI for unknown trades - only if no current role
        updatedProfile.interestedRole = 'ITI (Other)';
      }
    }

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
    
    // Get import source to determine correct verification message
    const importSource = profile.whoIAm?.[`${fieldName}ImportSource`] || 'digilocker';
    
    // Create dynamic verification message
    const getDynamicVerificationMessage = () => {
      if (importSource === 'wallet') {
        return '✓ Verified from Dhiway Wallet';
      } else if (importSource === 'digilocker') {
        return '✓ Verified from DigiLocker';
      }
      return fieldConfig['ui:verificationMessage'] || '✓ Verified';
    };

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
              <span>{getDynamicVerificationMessage()}</span>
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
          {widget === 'radio' ? (
            <RadioGroup 
              value={getStringValue()}
              onValueChange={handleChange}
              disabled={disabled || isVerified}
              className="flex flex-row gap-4"
            >
              {fieldConfig.enum?.map((option: string, index: number) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={option} 
                    id={`${fieldName}-${option}`}
                    disabled={disabled || isVerified}
                  />
                  <Label 
                    htmlFor={`${fieldName}-${option}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {fieldConfig.enumNames?.[index] || option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : widget === 'select' ? (
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
          {isVerified && widget !== 'radio' && (
            <div className="absolute right-2 top-2 flex items-center gap-1">
              <Shield className="h-4 w-4 text-green-600" />
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Verification message */}
        {isVerified && (
          <div className="flex items-center gap-2 text-xs text-green-600 mt-1">
            <Shield className="h-3 w-3" />
            <span>{getDynamicVerificationMessage()}</span>
          </div>
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

      
      {/* Wallet Import */}
      {schema.ui?.showWallet && (
        <Card className="border-dashed border-2 border-purple-200 bg-purple-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-purple-700">
              <Wallet className="h-4 w-4" />
              Import from Wallets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Import verified credentials from supported digital wallets
            </p>
            <Button onClick={handleWalletImport} className="w-full">
              Import from Wallets
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              This will import your verified credentials, certificates, and personal details from Dhiway Wallet and DigiLocker
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