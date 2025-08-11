import React from 'react';
import { useProfileForm } from '../ProfileFormProvider';
import { getSchemaDescription, getSchemaSections } from '@/schemas';
import EducationQualificationCard from '../EducationQualificationCard';
import SkillCertificationCard from '../SkillCertificationCard';
import WorkExperienceCard from '../WorkExperienceCard';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Lock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { getFieldConfig } from '@/schemas';
import { useITIAutoFill } from '@/hooks/useITIAutoFill';

const WhatIHaveStep: React.FC = () => {
  const { profile, setProfile } = useProfileForm();
  const stepName = 'whatIHave';
  const description = getSchemaDescription(stepName, profile.interestedRole);
  const sections = getSchemaSections(stepName, profile.interestedRole);

  // Use the ITI auto-fill hook
  useITIAutoFill({ profile, setProfile });

  const handleMachineToggle = (machine: string, checked: boolean) => {
    setProfile(prevProfile => {
      const currentMachines = prevProfile.whatIHave?.machinesOperated || prevProfile.machinesOperated || [];
      const updatedMachines = checked 
        ? [...currentMachines, machine]
        : currentMachines.filter(m => m !== machine);
      
      return {
        ...prevProfile,
        whatIHave: {
          ...prevProfile.whatIHave,
          machinesOperated: updatedMachines
        }
      };
    });
  };

  const renderCardComponent = (componentName: string) => {
    switch (componentName) {
      case 'EducationQualificationCard':
        return <EducationQualificationCard education={profile.education || []} onChange={(edu) => setProfile(p => ({...p, education: edu}))} />;
      case 'SkillCertificationCard':
        return <SkillCertificationCard certifications={profile.skillCertifications || []} onChange={(cert) => setProfile(p => ({...p, skillCertifications: cert}))} />;
      case 'WorkExperienceCard':
        return <WorkExperienceCard experiences={profile.workExperience || []} onChange={(exp) => setProfile(p => ({...p, workExperience: exp}))} />;
      default:
        return null;
    }
  }

  if (!sections || sections.length === 0) {
    return <div>Schema not found for WhatIHave step</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>



      {sections.map((section, index) => (
        <div key={index} className="bg-card p-6 rounded-lg shadow-sm border">
          {/* <h4 className="text-lg font-semibold mb-4">{section.title}</h4> */}
          {section.component ? (
            renderCardComponent(section.component)
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.fields?.map(fieldName => {
                const fieldConfig = getFieldConfig(stepName, fieldName, profile.interestedRole);
                if (!fieldConfig) return null;

                // Default rendering for simple text/number widgets (e.g., age)
                const widget = fieldConfig['ui:widget'];
                const placeholder = fieldConfig['ui:placeholder'];
                const disabled = fieldConfig['ui:disabled'];
                const verificationMessage = fieldConfig['ui:verificationMessage'];

                // Get value from the correct location in the profile
                // For WhatIHave step, fields should be in profile.whatIHave
                const value = profile.whatIHave?.[fieldName] || profile[fieldName as keyof typeof profile];
                const isVerified = profile.whatIHave?.[`is${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}Verified`] || 
                                  profile[`is${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}Verified` as keyof typeof profile];

                const getStringValue = () => {
                  if (typeof value === 'string') return value;
                  if (typeof value === 'number') return value.toString();
                  return '';
                };

                if (fieldConfig['ui:widget'] === 'experience-duration') {
                    const experienceValue = typeof value === 'number' ? value : 0;
                    return (
                        <div className="md:col-span-2" key={fieldName}>
                        <Label htmlFor={fieldName}>{fieldConfig.title}</Label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                            <Input
                                type="number"
                                value={Math.floor(experienceValue / 12)}
                                onChange={e => {
                                const years = parseInt(e.target.value) || 0;
                                const months = experienceValue % 12;
                                setProfile(prevProfile => ({
                                  ...prevProfile,
                                  whatIHave: {
                                    ...prevProfile.whatIHave,
                                    [fieldName]: years * 12 + months
                                  }
                                }));
                                }}
                                placeholder="Years"
                                min="0"
                            />
                            <Label className="text-xs text-muted-foreground">{fieldConfig['ui:yearsLabel']}</Label>
                            </div>
                            <div className="flex-1">
                            <Input
                                type="number"
                                value={experienceValue % 12}
                                onChange={e => {
                                const months = parseInt(e.target.value) || 0;
                                const years = Math.floor(experienceValue / 12);
                                setProfile(prevProfile => ({
                                  ...prevProfile,
                                  whatIHave: {
                                    ...prevProfile.whatIHave,
                                    [fieldName]: years * 12 + months
                                  }
                                }));
                                }}
                                placeholder="Months"
                                min="0"
                                max={fieldConfig['ui:monthsMax']}
                            />
                            <Label className="text-xs text-muted-foreground">{fieldConfig['ui:monthsLabel']}</Label>
                            </div>
                        </div>
                        </div>
                    );
                }

                if (fieldConfig['ui:widget'] === 'checkbox-group' && fieldConfig['ui:options']?.choices) {
                  return (
                    <div className="md:col-span-2" key={fieldName}>
                      <h4 className="text-base font-medium mb-3">{fieldConfig['ui:options'].title}</h4>
                      <Label>{fieldConfig.title}</Label>
                      <div className={`grid grid-cols-${fieldConfig['ui:options'].gridCols || 2} gap-2 mt-2`}>
                        {fieldConfig['ui:options'].choices.map((choice: string) => (
                          <div key={choice} className="flex items-center space-x-2">
                            <Checkbox
                              id={choice}
                              checked={(profile.whatIHave?.machinesOperated || profile.machinesOperated || []).includes(choice)}
                              onCheckedChange={checked => handleMachineToggle(choice, !!checked)}
                            />
                            <Label htmlFor={choice} className="text-sm">{choice}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={fieldName}>
                    <Label htmlFor={fieldName}>
                      {fieldConfig.title}
                      {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <div className="relative">
                      <Input
                        id={fieldName}
                        type={widget === 'number' ? 'number' : 'text'}
                        value={getStringValue()}
                        onChange={e => setProfile(prevProfile => ({
                          ...prevProfile,
                          whatIHave: {
                            ...prevProfile.whatIHave,
                            [fieldName]: widget === 'number' ? parseInt(e.target.value) || 0 : e.target.value
                          }
                        }))}
                        placeholder={placeholder}
                        disabled={disabled || isVerified}
                      />
                      {isVerified && (
                        <div className="absolute right-2 top-2 flex items-center gap-1">
                          <Shield className="h-4 w-4 text-green-600" />
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {isVerified && (
                      <p className="text-xs text-green-600 mt-1">
                        {verificationMessage || `Verified via DigiLocker`}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default WhatIHaveStep;