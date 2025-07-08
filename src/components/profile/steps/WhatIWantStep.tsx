import React from 'react';
import { useProfileForm } from '../ProfileFormProvider';
import { getSchemaDescription, getSchemaSections, getFieldConfig } from '@/schemas';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Calculator,
  Home,
  Utensils,
  Briefcase,
  TrendingUp,
  Clock,
  PlusCircle,
  Sparkles
} from 'lucide-react';

const WhatIWantStep: React.FC = () => {
  const { profile, setProfile } = useProfileForm();
  const stepName = 'whatIWant';
  const description = getSchemaDescription(stepName, profile.interestedRole);
  const sections = getSchemaSections(stepName, profile.interestedRole);

  if (!sections || sections.length === 0) {
    return <div>Schema not found for WhatIWant step</div>;
  }

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Calculator': return <Calculator className="h-5 w-5" />;
      case 'Home': return <Home className="h-5 w-5" />;
      case 'Utensils': return <Utensils className="h-5 w-5" />;
      case 'Briefcase': return <Briefcase className="h-5 w-5" />;
      case 'TrendingUp': return <TrendingUp className="h-5 w-5" />;
      case 'Clock': return <Clock className="h-5 w-5" />;
      case 'PlusCircle': return <PlusCircle className="h-5 w-5" />;
      case 'Sparkles': return <Sparkles className="h-5 w-5" />;
      default: return null;
    }
  };

  const renderField = (fieldName: string) => {
    const fieldConfig = getFieldConfig(stepName, fieldName, profile.interestedRole);
    if (!fieldConfig) return null;

    const value = profile[fieldName as keyof typeof profile];

    const handleChange = (newValue: any) => {
      setProfile(p => ({ ...p, [fieldName]: newValue }));
    };

    const widget = fieldConfig['ui:widget'];

    switch (widget) {
      case 'number':
        return (
          <div>
            <Label htmlFor={fieldName}>{fieldConfig.title}</Label>
            <Input
              id={fieldName}
              type="number"
              value={typeof value === 'number' ? value : ''}
              onChange={e => handleChange(parseInt(e.target.value) || 0)}
              placeholder={fieldConfig['ui:placeholder']}
              min={fieldConfig.minimum}
              max={fieldConfig.maximum}
              disabled={fieldConfig['ui:disabled']}
            />
          </div>
        );
      case 'select':
        return (
          <div>
            <Label htmlFor={fieldName}>{fieldConfig.title}</Label>
            <Select onValueChange={handleChange} value={value as string}>
              <SelectTrigger id={fieldName}>
                <SelectValue placeholder={fieldConfig['ui:placeholder']} />
              </SelectTrigger>
              <SelectContent>
                {fieldConfig.enum.map((option: string, i: number) => (
                  <SelectItem key={option} value={option}>
                    {fieldConfig.enumNames[i]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={fieldName}
              checked={!!value}
              onCheckedChange={handleChange}
            />
            <Label htmlFor={fieldName}>{fieldConfig.title}</Label>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {sections.map((section, index) => (
        <div key={index} className="bg-card p-6 rounded-lg shadow-sm border">
          <div className="flex items-center mb-4">
            {section.icon && getIconComponent(section.icon)}
            <h4 className="text-lg font-semibold ml-2">{section.title}</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.fields?.map(renderField)}
            {section.subsections?.map((subsection, subIndex) => (
              <div key={subIndex} className="md:col-span-2 space-y-4 p-4 border-t mt-4">
                <h5 className="font-semibold">{subsection.title}</h5>
                {subsection.fields?.map(renderField)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WhatIWantStep;