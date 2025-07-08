import whoIAmSchema from './whoIAmSchema.json';
import whatIHaveTailorSchema from './whatIHave-industrial-tailor.json';
import whatIWantTailorSchema from './whatIWant-industrial-tailor.json';
import whatIHaveLoaderPickerSchema from './whatIHave-warehouse-loader-picker.json';
import whatIWantLoaderPickerSchema from './whatIWant-warehouse-loader-picker.json';
import jobRolesConfig from './job-roles-config.json';

export interface ProfileStepSchema {
  $schema: string;
  title: string;
  description: string;
  type: string;
  properties: Record<string, any>;
  required?: string[];
  ui: {
    order?: string[];
    description?: string;
    sections?: Array<{
      title: string;
      component?: string;
      fields?: string[];
      icon?: string;
      subsections?: Array<{
        title: string;
        fields: string[];
      }>;
    }>;
    showDigiLocker?: boolean;
    digiLockerConfig?: {
      title: string;
      description: string;
      buttonText: string;
      footerText: string;
    };
    autoCalculations?: Record<string, {
      formula: string;
      dependencies: string[];
    }>;
  };
}

const schemas: Record<string, any> = {
  whoIAm: whoIAmSchema,
  'whatIHave-industrial-tailor': whatIHaveTailorSchema,
  'whatIWant-industrial-tailor': whatIWantTailorSchema,
  'whatIHave-warehouse-loader-picker': whatIHaveLoaderPickerSchema,
  'whatIWant-warehouse-loader-picker': whatIWantLoaderPickerSchema,
};

export const getSchema = (stepName: string, role?: string): ProfileStepSchema | null => {
  if (stepName === 'whoIAm') {
    return whoIAmSchema as ProfileStepSchema;
  }

  if (role && (stepName === 'whatIHave' || stepName === 'whatIWant')) {
    const roleConfig = (jobRolesConfig.jobRoles as any)[role];
    if (roleConfig) {
      const schemaFile = stepName === 'whatIHave' ? roleConfig.whatIHaveSchemaFile : roleConfig.whatIWantSchemaFile;
      const schemaKey = schemaFile.replace('.json', '');
      return schemas[schemaKey] as ProfileStepSchema || null;
    }
  }

  // Fallback for older logic or if role not found, default to industrial tailor
  if (stepName === 'whatIHave') {
    return whatIHaveTailorSchema as ProfileStepSchema;
  }
  if (stepName === 'whatIWant') {
    return whatIWantTailorSchema as ProfileStepSchema;
  }

  return null;
};

export const getAllSchemas = (): Record<string, ProfileStepSchema> => {
  return {
    whoIAm: whoIAmSchema as ProfileStepSchema,
    whatIHaveTailor: whatIHaveTailorSchema as ProfileStepSchema,
    whatIWantTailor: whatIWantTailorSchema as ProfileStepSchema,
    whatIHaveLoaderPicker: whatIHaveLoaderPickerSchema as ProfileStepSchema,
    whatIWantLoaderPicker: whatIWantLoaderPickerSchema as ProfileStepSchema,
  };
};

export const getSchemaFields = (stepName: string, role?: string): string[] => {
  const schema = getSchema(stepName, role);
  return schema?.ui?.order || Object.keys(schema?.properties || {});
};

export const getSchemaDescription = (stepName: string, role?: string): string => {
  const schema = getSchema(stepName, role);
  return schema?.ui?.description || schema?.description || '';
};

export const getSchemaSections = (stepName: string, role?: string) => {
  const schema = getSchema(stepName, role);
  return schema?.ui?.sections || [];
};

export const getFieldConfig = (stepName: string, fieldName: string, role?: string) => {
  const schema = getSchema(stepName, role);
  return schema?.properties?.[fieldName] || null;
};

export const getRequiredFields = (stepName: string, role?: string): string[] => {
  const schema = getSchema(stepName, role);
  return schema?.required || [];
};

export const isFieldRequired = (stepName: string, fieldName: string, role?: string): boolean => {
  const requiredFields = getRequiredFields(stepName, role);
  return requiredFields.includes(fieldName);
};

export const getFieldValidation = (stepName: string, fieldName: string, role?: string) => {
  const fieldConfig = getFieldConfig(stepName, fieldName, role);
  if (!fieldConfig) return null;

  const validation: any = {};
  if (fieldConfig.minLength) validation.minLength = fieldConfig.minLength;
  if (fieldConfig.maxLength) validation.maxLength = fieldConfig.maxLength;
  if (fieldConfig.minimum) validation.minimum = fieldConfig.minimum;
  if (fieldConfig.maximum) validation.maximum = fieldConfig.maximum;
  if (fieldConfig.pattern) validation.pattern = new RegExp(fieldConfig.pattern);

  return validation;
};

export const getFieldUI = (stepName: string, fieldName: string, role?: string) => {
  const fieldConfig = getFieldConfig(stepName, fieldName, role);
  if (!fieldConfig) return null;

  return Object.fromEntries(
    Object.entries(fieldConfig).filter(([key]) => key.startsWith('ui:'))
  );
}; 