import industrialTailorSchema from './industrial-tailor-schema.json';
import warehouseLoaderPickerSchema from './warehouse-loader-picker-schema.json';
import recruitmentAssociateSchema from './recruitment-associate-schema.json';
import inStorePromoterSchema from './in-store-promoter.json';
import electricianSchema from './electrician.json';
import fitterSchema from './fitter.json';
import mechanicSchema from './mechanic.json';
import machineOperatorSchema from './machine-operator.json';
import dataEntryOperatorSchema from './data-entry-operator.json';
import teleSalespersonSchema from './tele-salesperson.json';
import fieldSalesPersonSchema from './field-sales-person.json';
import genericITISchema from './GenericITI.json';
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
  'industrial-tailor': industrialTailorSchema,
  'warehouse-loader-picker': warehouseLoaderPickerSchema,
  'recruitment-associate': recruitmentAssociateSchema,
};

export const getSchema = (stepName: string, role?: string): ProfileStepSchema | null => {
  // This function is deprecated - use getUnifiedSchemaStep instead
  console.warn('getSchema is deprecated. Use getUnifiedSchemaStep instead.');
  return getUnifiedSchemaStep(role, stepName);
};

export const getUnifiedSchema = (role?: string): any => {
  if (role === 'Industrial Tailor') {
    return industrialTailorSchema;
  }
  if (role === 'Warehouse Loader & Picker') {
    return warehouseLoaderPickerSchema;
  }
  if (role === 'Recruitment Associate') {
    return recruitmentAssociateSchema;
  }
  if (role === 'In Store Promoter') {
    return inStorePromoterSchema;
  }
  if (role === 'Electrician') {
    return electricianSchema;
  }
  if (role === 'Fitter') {
    return fitterSchema;
  }
  if (role === 'Mechanic') {
    return mechanicSchema;
  }
  if (role === 'Machine Operator') {
    return machineOperatorSchema;
  }
  if (role === 'Data Entry Operator') {
    return dataEntryOperatorSchema;
  }
  if (role === 'Tele Salesperson') {
    return teleSalespersonSchema;
  }
  if (role === 'Field Sales Person') {
    return fieldSalesPersonSchema;
  }
      if (role === 'ITI (Other)') {
    return genericITISchema;
  }
  // For roles without specific schemas, fall back to Industrial Tailor
  if (role === 'Field Sales Executive') {
    return industrialTailorSchema;
  }
  return null;
};

export const getUnifiedSchemaStep = (role?: string, stepName?: string): ProfileStepSchema | null => {
  const unifiedSchema = getUnifiedSchema(role);
  if (!unifiedSchema || !stepName) return null;

  const stepSchema = unifiedSchema.properties?.[stepName];
  if (!stepSchema) return null;

  return {
    $schema: unifiedSchema.$schema,
    title: stepSchema.title,
    description: stepSchema.description,
    type: stepSchema.type,
    properties: stepSchema.properties,
    required: stepSchema.required,
    ui: stepSchema.ui
  } as ProfileStepSchema;
};

export const getAllSchemas = (): Record<string, ProfileStepSchema> => {
  console.warn('getAllSchemas is deprecated. Use getUnifiedSchema instead.');
  return {};
};

export const getSchemaFields = (stepName: string, role?: string): string[] => {
  const schema = getUnifiedSchemaStep(role, stepName);
  return schema?.ui?.order || Object.keys(schema?.properties || {});
};

export const getSchemaDescription = (stepName: string, role?: string): string => {
  const schema = getUnifiedSchemaStep(role, stepName);
  return schema?.ui?.description || schema?.description || '';
};

export const getSchemaSections = (stepName: string, role?: string) => {
  const schema = getUnifiedSchemaStep(role, stepName);
  return schema?.ui?.sections || [];
};

export const getFieldConfig = (stepName: string, fieldName: string, role?: string) => {
  const schema = getUnifiedSchemaStep(role, stepName);
  return schema?.properties?.[fieldName] || null;
};

export const getRequiredFields = (stepName: string, role?: string): string[] => {
  const schema = getUnifiedSchemaStep(role, stepName);
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