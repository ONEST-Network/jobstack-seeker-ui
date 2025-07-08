import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Mic, MapPin, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProfileForm } from '../ProfileFormProvider';
import DigiLockerModal from '../DigiLockerModal';
import { getSchema, getFieldConfig, getFieldUI, getSchemaDescription } from '@/schemas';

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

  // Get schema data
  const schema = getSchema('whoIAm');
  const description = getSchemaDescription('whoIAm');

  const handleDateOfBirthChange = (dob: string) => {
    const age = dob ? new Date().getFullYear() - new Date(dob).getFullYear() : undefined;
    setProfile({
      ...profile,
      dateOfBirth: dob,
      age: age
    });
  };

  const handleLocationDetection = () => {
    setProfile({
      ...profile,
      currentLocation: 'Mumbai, Maharashtra'
    });
    toast({
      title: "Location detected",
      description: "Current location updated"
    });
  };

  const handleDigiLockerImport = () => {
    setShowDigiLockerModal(true);
  };

  const handleDigiLockerSuccess = (data: any) => {
    setProfile({
      ...profile,
      ...data
    });
    setShowDigiLockerModal(false);
  };

  const handleDigiLockerClose = () => {
    setShowDigiLockerModal(false);
  };

  const maskAadharNumber = (aadhar: string) => {
    if (!aadhar || aadhar.length !== 12) return aadhar;
    return `XXXX-XXXX-${aadhar.slice(-4)}`;
  };

  const renderField = (fieldName: string) => {
    // Direct access to schema properties
    const fieldConfig = schema?.properties?.[fieldName];
    
    if (!fieldConfig) {
      console.log(`Field config not found: ${fieldName}`);
      return null;
    }

    const value = profile[fieldName as keyof typeof profile];
    const isVerified = profile[`is${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}Verified` as keyof typeof profile];

    // Type-safe value handling
    const getStringValue = () => {
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return value.toString();
      return '';
    };

    const handleChange = (newValue: any) => {
      setProfile({
        ...profile,
        [fieldName]: newValue
      });
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

    return (
      <div className={fieldName === 'name' ? 'md:col-span-2' : ''}>
        <Label htmlFor={fieldName}>
          {fieldConfig.title}
          {schema?.required?.includes(fieldName) && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <div className="relative">
          {widget === 'text' && (
            <Input 
              id={fieldName}
              type="text"
              value={getStringValue()}
              onChange={e => handleChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled || isVerified}
            />
          )}
          
          {widget === 'number' && (
            <Input 
              id={fieldName}
              type={fieldName === 'aadharNumber' && isVerified ? "text" : "number"}
              value={getAadharValue()}
              onChange={e => handleChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled || isVerified}
              min={fieldConfig.minimum}
              max={fieldConfig.maximum}
              maxLength={fieldConfig.maxLength}
            />
          )}
          
          {widget === 'date' && (
            <Input 
              id={fieldName}
              type="date"
              value={getStringValue()}
              onChange={e => fieldName === 'dateOfBirth' ? handleDateOfBirthChange(e.target.value) : handleChange(e.target.value)}
              disabled={disabled || isVerified}
            />
          )}
          
          {widget === 'tel' && (
            <Input 
              id={fieldName}
              type="tel"
              value={getStringValue()}
              onChange={e => handleChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
            />
          )}
          
          {widget === 'select' && (
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
          )}

          {/* Location button for current location */}
          {hasLocationButton && (
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="absolute right-1 top-1" 
              onClick={handleLocationDetection}
            >
              <MapPin className="h-4 w-4" />
            </Button>
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
          <p className="text-xs text-green-600 mt-1">{verificationMessage}</p>
        )}
      </div>
    );
  };

  if (!schema) {
    return <div>Schema not found for WhoIAm step</div>;
  }

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
          </CardContent>
        </Card>
      )}
      
      {/* Debug: Show schema info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-muted-foreground p-2 bg-gray-50 rounded">
          Debug: Schema loaded - Fields: {fieldOrder.length}, Available: {availableFields.length}, 
          ShowDigiLocker: {schema.ui?.showDigiLocker ? 'Yes' : 'No'}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fieldOrder.length > 0 ? (
          fieldOrder.map(fieldName => (
            <React.Fragment key={fieldName}>
              {renderField(fieldName)}
            </React.Fragment>
          ))
        ) : (
          availableFields.map(fieldName => (
            <React.Fragment key={fieldName}>
              {renderField(fieldName)}
            </React.Fragment>
          ))
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
    </div>
  );
};

export default WhoIAmStep;