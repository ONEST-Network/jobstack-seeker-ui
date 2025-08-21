
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserProfile, Experience } from '@/contexts/AuthContext';
import { Education, SkillCertification, WorkExperience } from '@/types/profile';
import { useITIAutoFill } from '@/hooks/useITIAutoFill';

interface ProfileFormContextType {
  profile: UserProfile & {
    education?: Education[];
    skillCertifications?: SkillCertification[];
    workExperience?: WorkExperience[];
    // Unified schema support
    whoIAm?: Record<string, any>;
    whatIHave?: Record<string, any>;
    whatIWant?: Record<string, any>;
    [key: string]: any; // Allow dynamic step data
  };
  setProfile: React.Dispatch<React.SetStateAction<UserProfile & {
    education?: Education[];
    skillCertifications?: SkillCertification[];
    workExperience?: WorkExperience[];
    // Unified schema support
    whoIAm?: Record<string, any>;
    whatIHave?: Record<string, any>;
    whatIWant?: Record<string, any>;
    [key: string]: any; // Allow dynamic step data
  }>>;
  newExperience: Partial<Experience>;
  setNewExperience: React.Dispatch<React.SetStateAction<Partial<Experience>>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  // New validation state management
  fieldValidations: Record<string, { isValid: boolean; errors: string[] }>;
  setFieldValidation: (fieldName: string, validation: { isValid: boolean; errors: string[] }) => void;
  clearFieldValidation: (fieldName: string) => void;
  clearAllValidations: () => void;
  clearStepValidations: (stepName: string) => void;
}

const ProfileFormContext = createContext<ProfileFormContextType | undefined>(undefined);

export const useProfileForm = () => {
  const context = useContext(ProfileFormContext);
  if (!context) {
    throw new Error('useProfileForm must be used within a ProfileFormProvider');
  }
  return context;
};

interface ProfileFormProviderProps {
  children: ReactNode;
  initialProfile?: UserProfile;
}

export const ProfileFormProvider: React.FC<ProfileFormProviderProps> = ({ 
  children, 
  initialProfile 
}) => {
  const [profile, setProfile] = useState<UserProfile & {
    education?: Education[];
    skillCertifications?: SkillCertification[];
    workExperience?: WorkExperience[];
    // Unified schema support
    whoIAm?: Record<string, any>;
    whatIHave?: Record<string, any>;
    whatIWant?: Record<string, any>;
    [key: string]: any; // Allow dynamic step data
  }>({
    // Who I Am - Basic Personal Information
    name: initialProfile?.name || '',
    age: initialProfile?.age || undefined,
    currentLocation: initialProfile?.currentLocation || '',
    desiredLocation: initialProfile?.desiredLocation || '',
    
    // What I Have - Legacy fields for backward compatibility
    experience: initialProfile?.experience || [],
    skills: initialProfile?.skills || [],
    certificates: initialProfile?.certificates || [],
    
    // New fields - only use if they exist in UserProfile
    education: [],
    skillCertifications: [],
    workExperience: [],
    
    // Verification flags - only use UserProfile fields
    isNameVerified: initialProfile?.isNameVerified || false,
    isAgeVerified: initialProfile?.isAgeVerified || false,
    
    // Unified schema support - initialize with proper merging
    whoIAm: initialProfile?.whoIAm || {},
    whatIHave: initialProfile?.whatIHave || {},
    whatIWant: initialProfile?.whatIWant || {},
    
    // Apply initial profile if provided - ensure proper merging
    ...(initialProfile || {})
  });

  const [newExperience, setNewExperience] = useState<Partial<Experience>>({
    designation: '',
    company: '',
    location: '',
    duration: '',
    workType: 'full-time',
    description: ''
  });
  const [searchQuery, setSearchQuery] = useState('');

  // New validation state management
  const [fieldValidations, setFieldValidations] = useState<Record<string, { isValid: boolean; errors: string[] }>>({});

  const setFieldValidation = (fieldName: string, validation: { isValid: boolean; errors: string[] }) => {
    setFieldValidations(prev => ({
      ...prev,
      [fieldName]: validation
    }));
  };

  const clearFieldValidation = (fieldName: string) => {
    setFieldValidations(prev => {
      const newValidations = { ...prev };
      delete newValidations[fieldName];
      return newValidations;
    });
  };

  const clearAllValidations = () => {
    setFieldValidations({});
  };

  const clearStepValidations = (stepName: string) => {
    setFieldValidations(prev => {
      const newValidations = { ...prev };
      Object.keys(newValidations).forEach(key => {
        if (key.startsWith(`${stepName}.`)) {
          delete newValidations[key];
        }
      });
      return newValidations;
    });
  };

  // Use the ITI auto-fill hook
  useITIAutoFill({ profile, setProfile });

  return (
    <ProfileFormContext.Provider value={{
      profile,
      setProfile,
      newExperience,
      setNewExperience,
      searchQuery,
      setSearchQuery,
      fieldValidations,
      setFieldValidation,
      clearFieldValidation,
      clearAllValidations,
      clearStepValidations
    }}>
      {children}
    </ProfileFormContext.Provider>
  );
};
