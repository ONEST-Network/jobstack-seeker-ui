import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useProfileForm } from './ProfileFormProvider';
import { getUnifiedSchemaStep, getUnifiedSchema } from '@/schemas';
import genericITISchema from '@/schemas/GenericITI.json';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { MapPin, Upload, QrCode, Shield, Lock, Loader2, Map } from 'lucide-react';
import WalletImportModal from './WalletImportModal';
import QRCodeScannerDialog from './QRCodeScannerDialog';
import { FileUploadField } from '@/components/ui/file-upload-field';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { getSchema, getSchemaDescription } from '@/schemas';
import { getCurrentLocation, parseLocationString, formatLocationForDisplay, type LocationData } from '@/lib/utils';
import { LocationInput } from '@/components/ui/location-input';
import { useITIAutoFill } from '@/hooks/useITIAutoFill';
import { ITIInstituteDropdown } from '@/components/ui/iti-institute-dropdown';
import CertificateDisplay from '@/components/ui/certificate-display';
import MapLocationSelector from './MapLocationSelector';

interface DynamicFormStepProps {
  stepName: string;
  role?: string;
}

const DynamicFormStep: React.FC<DynamicFormStepProps> = ({ stepName, role }) => {
  const { profile, setProfile, fieldValidations, setFieldValidation } = useProfileForm();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [showWallet, setShowWallet] = React.useState(false);
  const [showQRScanner, setShowQRScanner] = React.useState(false);
  const [qrFieldName, setQrFieldName] = React.useState<string>('');
  const [dropdownStates, setDropdownStates] = React.useState<Record<string, boolean>>({});
  const dropdownRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const [searchQueries, setSearchQueries] = React.useState<Record<string, string>>({});
  const [mapSelectorState, setMapSelectorState] = React.useState<{ isOpen: boolean; fieldName: string }>({ isOpen: false, fieldName: '' });

  // Use the ITI auto-fill hook
  useITIAutoFill({ profile, setProfile, role });

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
    // If we're just imported from wallet, avoid flashing a red error and show a neutral loading state
    if ((profile as any)?.importedFromWallet) {
      return (
        <div className="p-6 text-center">
          <div className="inline-flex items-center gap-2 text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Preparing form for your imported role…</span>
          </div>
        </div>
      );
    }
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
    console.log('setStepData called with:', { stepName, currentStepData: stepData, newData });
    setProfile(prev => {
      const currentStepData = (prev[stepName as keyof typeof prev] as Record<string, unknown>) || {};
      const updatedStepData = { ...currentStepData, ...newData };
      console.log('setStepData updating:', { currentStepData, updatedStepData });
      return {
        ...prev,
        [stepName]: updatedStepData
      };
    });
  };

  // For fields that should be accessed from global profile state (like age, name)
  const getFieldValue = (fieldName: string) => {
    // Special handling for phone field in whoIAm step
    if (fieldName === 'phone' && stepName === 'whoIAm') {
      return profile.whoIAm?.phone || stepData[fieldName] || '';
    }
    
    // Special handling for itiInstitute field - check whatIHave section first
    if (fieldName === 'itiInstitute') {
      return stepData[fieldName] || profile.whatIHave?.itiInstitute || '';
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
    console.log(`Field change: ${fieldName} =`, value);
    
    // Update step data - merge with existing data instead of overwriting
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

    // Special handling for itiInstitute field - update whatIHave section
    if (fieldName === 'itiInstitute') {
      setProfile(prev => ({
        ...prev,
        whatIHave: {
          ...prev.whatIHave,
          itiInstitute: value
        }
      }));
    }
  };


  const handleWalletSuccess = (data: Record<string, any>) => {
    // Handle the new wallet data structure with organized sections
    const mappedData: Record<string, unknown> = {};
    const verificationFlags: Record<string, unknown> = {};

    // Handle whoIAm section
    if (data.whoIAm) {
      Object.keys(data.whoIAm).forEach(key => {
        if (data.whoIAm[key]) {
          mappedData[key] = data.whoIAm[key];
          if (key.includes('Verified')) {
            verificationFlags[key] = data.whoIAm[key];
          }
        }
      });
    }

    // Handle whatIHave section
    if (data.whatIHave) {
      Object.keys(data.whatIHave).forEach(key => {
        if (data.whatIHave[key]) {
          mappedData[key] = data.whatIHave[key];
        }
      });
    }

    // Handle whatIWant section
    if (data.whatIWant) {
      Object.keys(data.whatIWant).forEach(key => {
        if (data.whatIWant[key]) {
          mappedData[key] = data.whatIWant[key];
        }
      });
    }

    // Add wallet import metadata
    if (data.vcMetadata) {
      mappedData.vcMetadata = data.vcMetadata;
    }

    // Mark as imported from wallet
    mappedData.importedFromWallet = true;

    // Update step data
    console.log('Setting step data with wallet mapped data:', mappedData);
    setStepData(mappedData);

    // Update global profile state with verification flags and wallet data
    setProfile(prevProfile => {
      // First, clear previous wallet-imported data by removing fields that have ImportSource = 'wallet'
      const clearedProfile = { ...prevProfile };
      
      // Clear wallet-imported fields from whoIAm section
      if (clearedProfile.whoIAm) {
        Object.keys(clearedProfile.whoIAm).forEach(key => {
          if (clearedProfile.whoIAm[key + 'ImportSource'] === 'wallet') {
            delete clearedProfile.whoIAm[key];
            delete clearedProfile.whoIAm[key + 'ImportSource'];
            delete clearedProfile.whoIAm['is' + key.charAt(0).toUpperCase() + key.slice(1) + 'Verified'];
          }
        });
      }
      
      // Clear wallet-imported fields from whatIHave section
      if (clearedProfile.whatIHave) {
        Object.keys(clearedProfile.whatIHave).forEach(key => {
          if (clearedProfile.whatIHave[key + 'ImportSource'] === 'wallet') {
            delete clearedProfile.whatIHave[key];
            delete clearedProfile.whatIHave[key + 'ImportSource'];
            delete clearedProfile.whatIHave['is' + key.charAt(0).toUpperCase() + key.slice(1) + 'Verified'];
          }
        });
      }
      
      // Clear wallet-imported fields from whatIWant section
      if (clearedProfile.whatIWant) {
        Object.keys(clearedProfile.whatIWant).forEach(key => {
          if (clearedProfile.whatIWant[key + 'ImportSource'] === 'wallet') {
            delete clearedProfile.whatIWant[key];
            delete clearedProfile.whatIWant[key + 'ImportSource'];
            delete clearedProfile.whatIWant['is' + key.charAt(0).toUpperCase() + key.slice(1) + 'Verified'];
          }
        });
      }
      
      // Clear direct wallet-imported fields from profile root
      Object.keys(clearedProfile).forEach(key => {
        if (clearedProfile[key + 'ImportSource'] === 'wallet') {
          delete clearedProfile[key];
          delete clearedProfile[key + 'ImportSource'];
          delete clearedProfile['is' + key.charAt(0).toUpperCase() + key.slice(1) + 'Verified'];
        }
      });

      // Now apply the new wallet data
      const updatedProfile = {
        ...clearedProfile,
        ...mappedData,
        ...verificationFlags,
        // Merge the organized sections
        whoIAm: { ...clearedProfile.whoIAm, ...data.whoIAm },
        whatIHave: { ...clearedProfile.whatIHave, ...data.whatIHave },
        whatIWant: { ...clearedProfile.whatIWant, ...data.whatIWant },
        // Also merge direct fields for backward compatibility
        ...data.whoIAm,
        ...data.whatIHave,
        ...data.whatIWant
      };

      console.log('Updated profile with wallet data:', updatedProfile);
      return updatedProfile;
    });

    setShowWallet(false);
  };

  const handleQRScanComplete = (data: unknown) => {
    console.log('data: ', data)
    if (qrFieldName) {
      console.log("qr: ", qrFieldName)
      // Get current value - could be string, array, or undefined
      const currentValue = getFieldValue(qrFieldName);
      
      // Convert to array format if it's not already
      let currentArray: string[] = [];
      if (currentValue) {
        if (Array.isArray(currentValue)) {
          currentArray = currentValue as string[];
        } else if (typeof currentValue === 'string') {
          currentArray = [currentValue];
        }
      }
      
      // Add new scan data to the array
      const newData = typeof data === 'string' ? data : String(data);
      const updatedArray = [...currentArray, newData];
      
      // Update the field with the new array
      handleFieldChange(qrFieldName, updatedArray);
    }
  };

  // Helper function to check if a field should be conditionally shown
  const shouldShowField = (fieldName: string, fieldConfig: any): boolean => {
    const conditional = fieldConfig['ui:conditional'];
    if (!conditional) return true;

    const { dependsOn, when } = conditional;
    if (!dependsOn || !when) return true;

    // Get the value of the field that controls this conditional field
    const controllingFieldValue = getFieldValue(dependsOn);
    
    // Check if the controlling field value matches any of the "when" values
    if (Array.isArray(when)) {
      return when.includes(controllingFieldValue);
    }
    
    return controllingFieldValue === when;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderField = (fieldName: string, fieldConfig: any) => {
    // Check if field should be conditionally shown
    if (!shouldShowField(fieldName, fieldConfig)) {
      return null;
    }

    const value = getFieldValue(fieldName);
    const isRequired = schema.required?.includes(fieldName);
    const widget = fieldConfig['ui:widget'];
    const placeholder = fieldConfig['ui:placeholder'];
    const disabled = fieldConfig['ui:disabled'];
    const verificationMessage = fieldConfig['ui:verificationMessage'];
    const hasLocationButton = fieldConfig['ui:hasLocationButton'];
    const currency = fieldConfig['ui:currency'];

    // Helper function to get dynamic verification message
    const getDynamicVerificationMessage = () => {
      // Check stepName-specific import source first
      const stepProfile = profile[stepName as keyof typeof profile] as any;
      const importSource = stepProfile?.[`${fieldName}ImportSource`] || 
                          profile.whoIAm?.[`${fieldName}ImportSource`] || 
                          'digilocker';
      
      if (importSource === 'wallet') {
        return '✓ Verified from Dhiway Wallet';
      } else if (importSource === 'digilocker') {
        return '✓ Verified from DigiLocker';
      }
      return verificationMessage || '✓ Verified';
    };

    // Check if field is verified from global profile state
    const isVerified = profile[`is${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}Verified` as keyof typeof profile];
    
    // Check if field is imported from wallet and should be non-editable
    // Only consider a field as wallet-imported if it has explicit import source metadata
    const stepProfile = profile[stepName as keyof typeof profile] as Record<string, unknown> | undefined;
    const isWalletImported = (
      // Check stepName-specific import source first
      stepProfile?.[`${fieldName}ImportSource`] === 'wallet' ||
      // Check whoIAm section import source
      profile.whoIAm?.[`${fieldName}ImportSource`] === 'wallet' ||
      // Check whatIHave section import source  
      profile.whatIHave?.[`${fieldName}ImportSource`] === 'wallet' ||
      // Check whatIWant section import source
      profile.whatIWant?.[`${fieldName}ImportSource`] === 'wallet' ||
      // Check direct profile field import source
      profile[`${fieldName}ImportSource` as keyof typeof profile] === 'wallet'
    );

    // Always access search state to ensure consistent hook calls
    const searchQuery = searchQueries[fieldName] || '';
    const setSearchQuery = (q: string) => {
      setSearchQueries(prev => ({ ...prev, [fieldName]: q }));
    };

    // Handle nested-dropdown widget (special case for highestQualificationOrSkill)
    if (widget === 'nested-dropdown' && fieldConfig.type === 'object') {
      const nestedData = value || {};
      const category = nestedData.category || '';
      const subCategory = nestedData.subCategory || '';
      const otherValue = nestedData.other || '';

      // Get trade list from GenericITI schema for ITI category
      const getITISpecializationList = () => {
        const itiSchema = genericITISchema as any;
        const itiSpecializationField = itiSchema?.properties?.whatIHave?.properties?.itiSpecialization;
        if (itiSpecializationField?.enum) {
          return itiSpecializationField.enum;
        }
        // Fallback list if schema not available
        return [
          "Electrician", "Fitter", "Mechanic", "Machine Operator", "Welder", 
          "CNC Operator", "Lathe Operator", "ITI (Other)"
        ];
      };

      const handleCategoryChange = (newCategory: string) => {
        handleFieldChange(fieldName, {
          category: newCategory,
          subCategory: '',
          other: ''
        });
      };

      const handleSubCategoryChange = (newSubCategory: string) => {
        handleFieldChange(fieldName, {
          ...nestedData,
          subCategory: newSubCategory,
          other: newSubCategory === 'Other' ? otherValue : ''
        });
      };

      const handleOtherChange = (newOther: string) => {
        handleFieldChange(fieldName, {
          ...nestedData,
          other: newOther
        });
      };

      // Define sub-options based on category
      const getSubOptions = () => {
        switch (category) {
          case 'School':
            return {
              enum: ['10th', '12th', 'Other'],
              enumNames: ['10th', '12th', 'Other']
            };
          case 'College':
            return {
              enum: ['B.Tech/B.E.', 'B.Com', 'B.A.', 'B.B.A', 'Other'],
              enumNames: ['B.Tech/B.E.', 'B.Com', 'B.A.', 'B.B.A', 'Other']
            };
          case 'ITI / Other Vocational Trainings':
            // Use comprehensive trade list
            const tradeList = getITISpecializationList();
            const tradeEnumNames = genericITISchema?.properties?.whatIHave?.properties?.itiSpecialization?.enumNames || tradeList;
            return {
              enum: [...tradeList, 'Other'],
              enumNames: [...tradeEnumNames, 'Other']
            };
          case 'Certification / Learned on the job':
            return null; // Free text field
          default:
            return null;
        }
      };

      const subOptions = getSubOptions();
      const showSubCategory = category && subOptions;
      const showFreeText = category === 'Certification / Learned on the job';
      const showOtherInput = subCategory === 'Other' && !showFreeText;

      return (
        <div key={fieldName} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${fieldName}_category`} className="text-sm font-medium">
              {fieldConfig.title}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {fieldConfig.description && (
              <p className="text-xs text-muted-foreground">{fieldConfig.description}</p>
            )}
            
            {/* Category Dropdown */}
            <Select
              value={category}
              onValueChange={handleCategoryChange}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {fieldConfig.properties?.category?.enum?.map((option: string, index: number) => (
                  <SelectItem key={option} value={option}>
                    {fieldConfig.properties?.category?.enumNames?.[index] || option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sub-category Dropdown */}
            {showSubCategory && (
              <div className="mt-2">
                <Select
                  value={subCategory}
                  onValueChange={handleSubCategoryChange}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub category" />
                  </SelectTrigger>
                  <SelectContent>
                    {subOptions.enum.map((option: string, index: number) => (
                      <SelectItem key={option} value={option}>
                        {subOptions.enumNames[index] || option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Free text for Certification */}
            {showFreeText && (
              <div className="mt-2">
                <Input
                  type="text"
                  value={subCategory || ''}
                  onChange={(e) => handleSubCategoryChange(e.target.value)}
                  placeholder="Enter certification or skill learned on the job"
                  disabled={disabled}
                />
              </div>
            )}

            {/* Other option input */}
            {showOtherInput && (
              <div className="mt-2 ml-6">
                <Input
                  type="text"
                  value={otherValue}
                  onChange={(e) => handleOtherChange(e.target.value)}
                  placeholder="Please specify..."
                  disabled={disabled}
                  className="text-sm"
                />
              </div>
            )}
          </div>
        </div>
      );
    }

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

                  case 'select':
                    return (
                      <div key={subsectionFieldName} className="space-y-2">
                        <Label htmlFor={`${fieldName}_${subsectionFieldName}`} className="text-sm font-medium">
                          {subsectionFieldConfig.title}
                          {subsectionTooltip && (
                            <span className="ml-1 text-xs text-gray-500" title={subsectionTooltip}>ⓘ</span>
                          )}
                        </Label>
                        <div className="relative">
                          <Select
                            value={subsectionValue || ''}
                            onValueChange={(val) => handleSubsectionFieldChange(subsectionFieldName, val)}
                            disabled={subsectionDisabled}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={subsectionPlaceholder} />
                            </SelectTrigger>
                            <SelectContent>
                              {subsectionFieldConfig.enum?.map((option: string, index: number) => (
                                <SelectItem key={option} value={option}>
                                  {subsectionFieldConfig.enumNames?.[index] || option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
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
        // Special handling for ITI Institute field - use searchable dropdown
        if (fieldName === 'itiInstitute') {
          const instituteSlug = profile.whatIHave?.itiInstituteSlug || '';
          
          return (
            <div key={fieldName} className="space-y-2">
              <ITIInstituteDropdown
                value={value || ''}
                slug={instituteSlug}
                onChange={(name, slug) => {
                  // Update both the displayed name and store the slug for API
                  handleFieldChange(fieldName, name);
                  setProfile(prevProfile => ({
                    ...prevProfile,
                    [stepName]: {
                      ...prevProfile[stepName],
                      itiInstituteSlug: slug
                    }
                  }));
                }}
                placeholder="Search and select your ITI Institute..."
                disabled={disabled || isVerified}
                label={fieldConfig.title + (isRequired ? ' *' : '')}
                description="Select your institute name from the list below"
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

        // Special handling for location fields
        if (hasLocationButton) {
          const fieldKey = `${stepName}.${fieldName}`;
          const currentValidation = fieldValidations[fieldKey];
          
          // Get initial location data for map selector
          const getInitialLocationData = (): LocationData | null => {
            const stepProfile = profile[stepName as keyof typeof profile] as Record<string, unknown> | undefined;
            const locationData = stepProfile?.[`${fieldName}Data`];
            if (locationData && typeof locationData === 'object' && 'lat' in locationData && 'lng' in locationData) {
              return locationData as LocationData;
            }
            return null;
          };

          const handleMapLocationSelect = (locationData: LocationData) => {
            const displayLocation = formatLocationForDisplay(locationData);
            handleFieldChange(fieldName, displayLocation);
            
            // Store the full location data for API use
            setProfile(prevProfile => ({
              ...prevProfile,
              [stepName]: {
                ...prevProfile[stepName],
                [`${fieldName}Data`]: locationData
              }
            }));

            // Update validation
            const fieldKey = `${stepName}.${fieldName}`;
            setFieldValidation(fieldKey, { isValid: true, errors: [] });

            toast({
              title: "Location selected",
              description: `Selected: ${displayLocation}`,
            });
          };
          
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
                externalValidation={currentValidation}
                onValidationChange={(validation) => setFieldValidation(fieldKey, validation)}
                onValidationSuccess={() => {
                  // Clear validation state when field becomes valid
                  if (currentValidation && !currentValidation.isValid) {
                    setFieldValidation(fieldKey, { isValid: true, errors: [] });
                  }
                }}
                enableMapSelection={!isVerified}
                onMapSelectClick={() => setMapSelectorState({ isOpen: true, fieldName })}
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

              {/* Map Location Selector Dialog */}
              {mapSelectorState.fieldName === fieldName && (
                <MapLocationSelector
                  isOpen={mapSelectorState.isOpen}
                  onClose={() => setMapSelectorState({ isOpen: false, fieldName: '' })}
                  onLocationSelect={handleMapLocationSelect}
                  initialLocation={getInitialLocationData()}
                  title={`Select ${fieldConfig.title}`}
                />
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
                disabled={disabled || isVerified || isWalletImported}
                className={isVerified || isWalletImported ? 'border-green-500' : ''}
              />
              {(isVerified || isWalletImported) && (
                <div className="absolute right-2 top-2 flex items-center gap-1">
                  <Shield className="h-4 w-4 text-green-600" />
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
            {isVerified && (
              <p className="text-xs text-green-600">
                {getDynamicVerificationMessage()}
              </p>
            )}
            {isWalletImported && !isVerified && (
              <p className="text-xs text-green-600">
                {getDynamicVerificationMessage()}
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
                disabled={disabled || isVerified || isWalletImported}
                min={fieldConfig.minimum}
                max={fieldConfig.maximum}
                className={`${isVerified || isWalletImported ? 'border-green-500' : ''} ${currency ? 'pl-8' : ''}`}
              />
              {currency && (
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
                  {currency}
                </span>
              )}
              {(isVerified || isWalletImported) && (
                <div className="absolute right-2 top-2 flex items-center gap-1">
                  <Shield className="h-4 w-4 text-green-600" />
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
            {isVerified && (
              <p className="text-xs text-green-600">
                {getDynamicVerificationMessage()}
              </p>
            )}
            {isWalletImported && !isVerified && (
              <p className="text-xs text-green-600">
                {getDynamicVerificationMessage()}
              </p>
            )}
            {fieldConfig.description && (
              <p className="text-xs text-muted-foreground">{fieldConfig.description}</p>
            )}
          </div>
        );

      case 'select':
        const hasOtherField = fieldConfig['ui:hasOther'];
        const otherFieldName = `${fieldName}_other`;
        const otherValue = (stepData[otherFieldName] as string) || '';
        // Handle case where value might be an array (from old multi-select data)
        const stringValue = Array.isArray(value) ? (value[0] || '') : (value || '');
        const isOtherSelected = typeof stringValue === 'string' && stringValue.toLowerCase() === 'other';

        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName} className="text-sm font-medium">
              {fieldConfig.title}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="relative">
              <Select
                value={stringValue}
                onValueChange={(val) => handleFieldChange(fieldName, val)}
                disabled={disabled || isVerified || isWalletImported}
              >
                <SelectTrigger className={isVerified || isWalletImported ? 'border-green-500' : ''}>
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
              {(isVerified || isWalletImported) && (
                <div className="absolute right-2 top-2 flex items-center gap-1">
                  <Shield className="h-4 w-4 text-green-600" />
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
            {/* Show text input when "Other" is selected */}
            {isOtherSelected && hasOtherField && (
              <div className="mt-2">
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
            {isVerified && (
              <p className="text-xs text-green-600">
                {getDynamicVerificationMessage()}
              </p>
            )}
            {isWalletImported && !isVerified && (
              <p className="text-xs text-green-600">
                {getDynamicVerificationMessage()}
              </p>
            )}
            {fieldConfig.description && (
              <p className="text-xs text-muted-foreground">{fieldConfig.description}</p>
            )}
          </div>
        );

      case 'radio':
        return (
          <div key={fieldName} className="space-y-2">
            <Label className="text-sm font-medium">
              {fieldConfig.title}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup
              value={value || ''}
              onValueChange={(val) => handleFieldChange(fieldName, val)}
              disabled={disabled || isVerified}
              className={isVerified ? 'border-green-500' : ''}
            >
              {fieldConfig.enum?.map((option: string, index: number) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${fieldName}_${option}`} />
                  <Label htmlFor={`${fieldName}_${option}`} className="text-sm">
                    {fieldConfig.enumNames?.[index] || option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {isVerified && (
              <p className="text-xs text-green-600">
                {getDynamicVerificationMessage()}
              </p>
            )}
            {fieldConfig.description && (
              <p className="text-xs text-muted-foreground">{fieldConfig.description}</p>
            )}
          </div>
        );

      case 'date':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName} className="text-sm font-medium">
              {fieldConfig.title}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="relative">
              <Input
                id={fieldName}
                type="date"
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
                {getDynamicVerificationMessage()}
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

        // Filter options based on search query, keeping original indices
        const filteredOptionsWithIndices = fieldConfig.enum?.map((option: string, originalIndex: number) => {
          if (!searchQuery) return { option, originalIndex };
          const optionValue = fieldConfig.enumNames?.[originalIndex] || option;
          const searchTerm = searchQuery.toLowerCase().trim();
          
          // Search in both the original option and the display name
          // Also split search terms to match any part
          const searchTerms = searchTerm.split(' ').filter(term => term.length > 0);
          
          if (searchTerms.length === 0) return { option, originalIndex };
          
          // First try exact match
          if (option.toLowerCase().includes(searchTerm) || optionValue.toLowerCase().includes(searchTerm)) {
            return { option, originalIndex };
          }
          
          // Then try partial matches for each search term
          const matches = searchTerms.every(term => 
            option.toLowerCase().includes(term) || 
            optionValue.toLowerCase().includes(term)
          );
          
          return matches ? { option, originalIndex } : null;
        }).filter(item => item !== null) || [];



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
                          {filteredOptionsWithIndices.length} of {fieldConfig.enum?.length || 0} options
                        </div>
                      )}
                    </div>
                  )}

                  {/* Options List */}
                  {filteredOptionsWithIndices.length > 0 ? (
                    filteredOptionsWithIndices.map((item: { option: string, originalIndex: number }, index: number) => {
                      const { option, originalIndex } = item;
                      const optionValue = fieldConfig.enumNames?.[originalIndex] || option;
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
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Scanned Credentials:</p>
                    {Array.isArray(value) && value.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFieldChange(fieldName, '')}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                  {Array.isArray(value) ? (
                    // Display multiple scanned certificates
                    <div className="space-y-2">
                      {value.length > 0 ? (
                        value.map((scanData: string, index: number) => (
                          <CertificateDisplay
                            key={index}
                            url={scanData}
                            onRemove={() => {
                              const updatedArray = (value as string[]).filter((_, i) => i !== index);
                              handleFieldChange(fieldName, updatedArray.length > 0 ? updatedArray : '');
                            }}
                            showRemoveButton={true}
                          />
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No QR codes scanned yet.</p>
                      )}
                    </div>
                  ) : (
                    // Display single scanned certificate (for backward compatibility)
                    <CertificateDisplay
                      url={value as string}
                      onRemove={() => handleFieldChange(fieldName, '')}
                      showRemoveButton={true}
                    />
                  )}
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
                {(() => {
                  if (!value) return 'Scan QR Credential';
                  if (Array.isArray(value)) {
                    return value.length > 0 ? 'Scan Another QR Credential' : 'Scan QR Credential';
                  }
                  return 'Scan Another QR Credential';
                })()}
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



      {/* Wallet Import Integration */}
      {schema.ui?.showWallet && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-purple-800">
                Import from Wallets
              </h4>
              <p className="text-sm text-purple-700 mt-1">
                Import verified credentials from supported digital wallets
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowWallet(true)}
              className="text-purple-700 border-purple-300 hover:bg-purple-100"
            >
              Import from Wallets
            </Button>
          </div>
          <p className="text-xs text-purple-600 mt-2">
            This will import your verified credentials, certificates, and personal details from Dhiway Wallet and DigiLocker
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

      {/* Wallet Import Modal */}
      <WalletImportModal
        isOpen={showWallet}
        onClose={() => setShowWallet(false)}
        onSuccess={handleWalletSuccess}
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
