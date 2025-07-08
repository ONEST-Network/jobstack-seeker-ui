
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserProfile, Experience } from '@/contexts/AuthContext';
import { Education, SkillCertification, WorkExperience } from '@/types/profile';

interface ProfileFormContextType {
  profile: UserProfile & {
    education?: Education[];
    skillCertifications?: SkillCertification[];
    workExperience?: WorkExperience[];
    isNameVerified?: boolean;
    isAgeVerified?: boolean;
    isGenderVerified?: boolean;
    isAadharVerified?: boolean;
    isHometownVerified?: boolean;
  };
  setProfile: React.Dispatch<React.SetStateAction<UserProfile & {
    education?: Education[];
    skillCertifications?: SkillCertification[];
    workExperience?: WorkExperience[];
    isNameVerified?: boolean;
    isAgeVerified?: boolean;
    isGenderVerified?: boolean;
    isAadharVerified?: boolean;
    isHometownVerified?: boolean;
  }>>;
  newExperience: Partial<Experience>;
  setNewExperience: React.Dispatch<React.SetStateAction<Partial<Experience>>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
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
    isNameVerified?: boolean;
    isAgeVerified?: boolean;
    isGenderVerified?: boolean;
    isAadharVerified?: boolean;
    isHometownVerified?: boolean;
  }>({
    // Who I Am - Basic Personal Information
    name: '',
    age: undefined,
    currentLocation: '',
    desiredLocation: '',
    
    // What I Have - Legacy fields for backward compatibility
    experience: [],
    skills: [],
    certificates: [],
    
    // New fields
    education: [],
    skillCertifications: [],
    workExperience: [],
    
    // Verification flags
    isNameVerified: false,
    isAgeVerified: false,
    isGenderVerified: false,
    isAadharVerified: false,
    isHometownVerified: false,
    
    // Apply initial profile if provided
    ...initialProfile
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

  return (
    <ProfileFormContext.Provider value={{
      profile,
      setProfile,
      newExperience,
      setNewExperience,
      searchQuery,
      setSearchQuery
    }}>
      {children}
    </ProfileFormContext.Provider>
  );
};
