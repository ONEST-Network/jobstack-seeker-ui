import React from 'react';
import { useProfileForm } from './ProfileFormProvider';
import { getUnifiedSchemaStep, getUnifiedSchema } from '@/schemas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { MapPin, Upload, QrCode } from 'lucide-react';
import DigiLockerModal from './DigiLockerModal';
import QRCodeScannerDialog from './QRCodeScannerDialog';

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

  const schema = getUnifiedSchemaStep(role, stepName);
  
  if (!schema) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-600 mb-2">Schema not found</div>
        <div className="text-sm text-gray-600">
          Step: {stepName}<br/>
          Role: {role}<br/>
          Available schemas: {Object.keys(getUnifiedSchema(role) || {}).join(', ')}
        </div>
      </div>
    );
  }

  const stepData = (profile[stepName as keyof typeof profile] as Record<string, any>) || {};
  const setStepData = (newData: Record<string, any>) => {
    setProfile(prev => ({
      ...prev,
      [stepName]: { ...stepData, ...newData }
    }));
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setStepData({ [fieldName]: value });
  };

  const handleDigiLockerSuccess = (data: any) => {
    // Map DigiLocker data to step fields
    const mappedData: Record<string, any> = {};
    if (data.name) mappedData.name = data.name;
    if (data.location) mappedData.location = data.location;
    if (data.phone) mappedData.phone = data.phone;
    if (data.age) mappedData.age = data.age;
    
    setStepData(mappedData);
  };

  const handleQRScanComplete = (data: any) => {
    if (qrFieldName) {
      handleFieldChange(qrFieldName, data);
    }
  };

  const renderField = (fieldName: string, fieldConfig: any) => {
    const value = stepData[fieldName];
    const isRequired = schema.required?.includes(fieldName);
    const widget = fieldConfig['ui:widget'];
    const placeholder = fieldConfig['ui:placeholder'];
    const disabled = fieldConfig['ui:disabled'];
    const verified = fieldConfig['ui:verified'];
    const verificationMessage = fieldConfig['ui:verificationMessage'];
    const hasLocationButton = fieldConfig['ui:hasLocationButton'];
    const currency = fieldConfig['ui:currency'];

    const handleLocationDetection = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            // You can reverse geocode here to get address
            handleFieldChange(fieldName, `Lat: ${latitude}, Lng: ${longitude}`);
          },
          (error) => {
            console.error('Error getting location:', error);
          }
        );
      }
    };

    const handleVideoUpload = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          handleFieldChange(fieldName, URL.createObjectURL(file));
        }
      };
      input.click();
    };

    const handleQRScan = () => {
      setQrFieldName(fieldName);
      setShowQRScanner(true);
    };

    switch (widget) {
      case 'text':
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
                disabled={disabled}
                className={verified ? 'border-green-500' : ''}
              />
              {hasLocationButton && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLocationDetection}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              )}
            </div>
            {verified && verificationMessage && (
              <p className="text-xs text-green-600">{verificationMessage}</p>
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
                disabled={disabled}
                min={fieldConfig.minimum}
                max={fieldConfig.maximum}
              />
              {currency && (
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  {currency}
                </span>
              )}
            </div>
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
            <Select
              value={value || ''}
              onValueChange={(val) => handleFieldChange(fieldName, val)}
              disabled={disabled}
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
            {fieldConfig.description && (
              <p className="text-xs text-muted-foreground">{fieldConfig.description}</p>
            )}
          </div>
        );

      case 'multiselect-dropdown':
        const currentDropdownValues = Array.isArray(value) ? value : [];
        const hasOtherDropdownField = fieldConfig['ui:hasOther'];
        const otherDropdownFieldName = `${fieldName}_other`;
        const otherDropdownValue = stepData[otherDropdownFieldName] || '';
        const isDropdownOpen = dropdownStates[fieldName] || false;
        
        const toggleDropdown = () => {
          setDropdownStates(prev => ({
            ...prev,
            [fieldName]: !prev[fieldName]
          }));
        };
        
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName} className="text-sm font-medium">
              {fieldConfig.title}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            
            {/* Custom Dropdown */}
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                onClick={toggleDropdown}
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
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                  {fieldConfig.enum?.map((option: string, index: number) => {
                    const optionValue = fieldConfig.enumNames?.[index] || option;
                    const isSelected = currentDropdownValues.includes(optionValue);
                    const isOtherOption = option.toLowerCase() === 'other';
                    
                    return (
                      <div key={option} className="p-2 hover:bg-gray-50">
                        <div 
                          className="flex items-center space-x-2 cursor-pointer"
                          onClick={() => {
                            const newValues = isSelected
                              ? currentDropdownValues.filter(v => v !== optionValue)
                              : [...currentDropdownValues, optionValue];
                            handleFieldChange(fieldName, newValues);
                          }}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => {}} // Handled by parent div onClick
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
                  })}
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

      case 'multiselect':
        const currentValues = Array.isArray(value) ? value : [];
        const hasOtherField = fieldConfig['ui:hasOther'];
        const otherFieldName = `${fieldName}_other`;
        const otherValue = stepData[otherFieldName] || '';
        
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
            <Label htmlFor={fieldName} className="text-sm font-medium">
              {fieldConfig.title}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              {value && (
                <video
                  src={value}
                  controls
                  className="w-full max-w-md rounded-lg border"
                />
              )}
              <Button
                type="button"
                variant="outline"
                onClick={handleVideoUpload}
                disabled={disabled}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {value ? 'Change Video' : 'Upload Video'}
              </Button>
            </div>
            {fieldConfig.description && (
              <p className="text-xs text-muted-foreground">{fieldConfig.description}</p>
            )}
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