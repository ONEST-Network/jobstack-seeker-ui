import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient, type AuthResponse, type SignUpResponse, type SessionResponse, type ProfileResponse, type ProfilesResponse, cleanContaminatedProfile } from '@/lib/api';
import { Education, SkillCertification, WorkExperience } from '@/types/profile';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  role: 'individual' | 'organization';
  isVerified: boolean;
  emailVerified?: boolean;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
  profile?: UserProfile | OrganizationProfile;
  profileId?: string;
  managedEmployers: EmployerProfile[];
  selectedEmployerId?: string;
  managedCandidates: CandidateProfile[];
  selectedCandidateId?: string;
  // Organization role properties
  organizationRole?: 'admin' | 'member' | 'viewer' | 'owner';
  activeOrganizationId?: string;
  organizations?: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
    type: string;
  }>;
}

export interface UserProfile {
  // Who I Am
  name: string;
  dateOfBirth?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  hometown?: string;
  aadharNumber?: string;
  phone?: string;
  isNameVerified: boolean;
  isAgeVerified: boolean;
  currentLocation: string;
  desiredLocation: string;
  
  // What I Have
  basicLiteracy?: 'below-8th' | '8th-pass' | '10th-pass' | '12th-pass' | 'graduate';
  skillProofVideo?: string;
  qualityProofImage?: string;
  hasWorkExperience?: boolean;
  previousCompany?: string;
  previousLocation?: string;
  experienceMonths?: number;
  machinesOperated?: string[];
  
  // What I Want
  salaryFrequency?: 'weekly' | 'monthly';
  advanceMonthsAvailable?: number;
  advanceFrequency?: 'monthly' | 'quarterly' | 'half-yearly';
  monthlySalary?: number;
  pfDeduction?: number;
  esicDeduction?: number;
  inHandSalary?: number;
  housingFacility?: boolean;
  foodFacility?: boolean;
  workHoursPerDay?: number;
  overtimeAvailable?: boolean;
  overtimePayMultiplier?: number;
  gradeUpgradation?: boolean;
  factoryTrustScore?: number;
  
  // Legacy fields for backward compatibility
  interestedRole?: string;
  interestedIndustry?: string;
  experience: Experience[];
  skills: string[];
  certificates: Certificate[];
  assessmentScores?: AssessmentScore[];
  documentVerificationStatus?: DocumentVerification[];
  
  // Unified schema fields
  whoIAm?: Record<string, any>;
  whatIHave?: Record<string, any>;
  whatIWant?: Record<string, any>;
}

export interface CandidateProfile {
  id: string;
  // Who I Am
  name: string;
  dateOfBirth?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  hometown?: string;
  aadharNumber?: string;
  phone?: string;
  isNameVerified: boolean;
  isAgeVerified: boolean;
  currentLocation: string;
  desiredLocation: string;
  
  // What I Have
  basicLiteracy?: 'below-8th' | '8th-pass' | '10th-pass' | '12th-pass' | 'graduate';
  skillProofVideo?: string;
  qualityProofImage?: string;
  hasWorkExperience?: boolean;
  previousCompany?: string;
  previousLocation?: string;
  experienceMonths?: number;
  machinesOperated?: string[];
  
  // What I Want
  salaryFrequency?: 'weekly' | 'monthly';
  advanceMonthsAvailable?: number;
  advanceFrequency?: 'monthly' | 'quarterly' | 'half-yearly';
  monthlySalary?: number;
  pfDeduction?: number;
  esicDeduction?: number;
  inHandSalary?: number;
  housingFacility?: boolean;
  foodFacility?: boolean;
  workHoursPerDay?: number;
  overtimeAvailable?: boolean;
  overtimePayMultiplier?: number;
  gradeUpgradation?: boolean;
  factoryTrustScore?: number;
  
  // Legacy and metadata fields
  interestedRole?: string;
  interestedIndustry?: string;
  experience: Experience[];
  skills: string[];
  certificates: Certificate[];
  assessmentScores?: AssessmentScore[];
  documentVerificationStatus?: DocumentVerification[];
  createdAt: string;
  isActive: boolean;
  profileImage?: string;
  nickname?: string;
  // Unified schema fields
  whoIAm?: Record<string, any>;
  whatIHave?: Record<string, any>;
  whatIWant?: Record<string, any>;
  // Verification status
  isGenderVerified?: boolean;
  isAadharVerified?: boolean;
  isHometownVerified?: boolean;
  // Education
  education?: Education[];
  // Skill Certifications
  skillCertifications?: SkillCertification[];
  // Work Experience
  workExperience?: WorkExperience[];
}

export interface AssessmentScore {
  id: string;
  assessmentType: string;
  score: number;
  maxScore: number;
  completedAt: string;
  isVerified: boolean;
}

export interface DocumentVerification {
  id: string;
  documentType: string;
  isVerified: boolean;
  verifiedAt?: string;
  trustScore: number;
}

export interface Experience {
  id: string;
  designation: string;
  company: string;
  location: string;
  duration: string;
  workType: 'full-time' | 'part-time' | 'contract' | 'internship';
  description: string;
}

export interface Certificate {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  isVerified: boolean;
  documentUrl?: string;
}

export interface OrganizationProfile {
  name: string;
  address: string;
  gstNumber: string;
  logo?: string;
  contactPersonName: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  description: string;
}

export interface EmployerProfile {
  id: string;
  name: string;
  address: string;
  gstNumber: string;
  logo?: string;
  contactPersonName: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  description: string;
  createdAt: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  requestOTP: (data: { phoneNumber?: string; email?: string; name?: string }) => Promise<{ ok: boolean; otp: string }>;
  verifyOTP: (data: { 
    phoneNumber?: string; 
    email?: string; 
    otp: string;
    name?: string;
    rememberMe?: boolean;
    joinOrg?: {
      join: boolean;
      orgSlug: string;
      role: string;
    };
    createAdmin?: boolean;
  }) => Promise<{ token: string; user: any }>;
  logout: () => void;
  updateProfile: (profile: UserProfile | OrganizationProfile) => void;
  refreshProfileData: () => Promise<void>;
  refreshSession: () => Promise<void>;
  addEmployer: (employer: Omit<EmployerProfile, 'id' | 'createdAt'>) => void;
  updateEmployer: (employerId: string, employer: Partial<EmployerProfile>) => void;
  deleteEmployer: (employerId: string) => void;
  selectEmployer: (employerId: string) => void;
  getSelectedEmployer: () => EmployerProfile | null;
  addCandidate: (candidate: Omit<CandidateProfile, 'id' | 'createdAt'>) => void;
  updateCandidate: (candidateId: string, candidate: Partial<CandidateProfile>) => void;
  deleteCandidate: (candidateId: string) => void;
  selectCandidate: (candidateId: string) => void;
  getSelectedCandidate: () => CandidateProfile | null;
  cleanupIncompleteProfiles: () => void;
  hasAdminRole: () => boolean;
  // Organization management methods
  initializeOrganizationData: () => Promise<void>;
  setActiveOrganization: (organizationId: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for existing session with backend
    const checkSession = async () => {
      try {
        const sessionData = await apiClient.getSession() as SessionResponse;
        
        if (sessionData.user && sessionData.session) {
          const backendUser = sessionData.user;
          
          // Transform backend user to our User interface
          const transformedUser: User = {
            id: backendUser.id,
            email: backendUser.email,
            name: backendUser.name,
            role: 'individual', // Default to individual, will be updated based on profile data
            isVerified: backendUser.emailVerified,
            emailVerified: backendUser.emailVerified,
            image: backendUser.image,
            createdAt: backendUser.createdAt,
            updatedAt: backendUser.updatedAt,
            managedEmployers: [],
            selectedEmployerId: undefined,
            managedCandidates: [],
            selectedCandidateId: undefined
          };

          // Check for saved local data and merge
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            
            // Merge local profile data with backend user
            transformedUser.profile = parsedUser.profile;
            transformedUser.profileId = parsedUser.profileId; // Merge profile ID
            transformedUser.managedEmployers = parsedUser.managedEmployers || [];
            transformedUser.selectedEmployerId = parsedUser.selectedEmployerId;
            transformedUser.managedCandidates = parsedUser.managedCandidates || [];
            transformedUser.selectedCandidateId = parsedUser.selectedCandidateId;
            transformedUser.role = parsedUser.role || 'individual';
          }
          
          // Handle backward compatibility - create default employer if none exists but org profile exists
          if (transformedUser.profile && transformedUser.role === 'organization' && transformedUser.managedEmployers.length === 0) {
            const defaultEmployer = createDefaultEmployerFromProfile(transformedUser.profile as OrganizationProfile);
            transformedUser.managedEmployers = [defaultEmployer];
            transformedUser.selectedEmployerId = defaultEmployer.id;
          }
          
          // Handle backward compatibility - create default candidate if none exists but user profile exists
          if (transformedUser.profile && transformedUser.role === 'individual' && transformedUser.managedCandidates.length === 0) {
            const defaultCandidate = createDefaultCandidateFromProfile(transformedUser.profile as UserProfile);
            transformedUser.managedCandidates = [defaultCandidate];
            transformedUser.selectedCandidateId = defaultCandidate.id;
          }

          // Always fetch fresh profile data to ensure we have the latest
          try {
            const profileResponse = await apiClient.getProfile() as ProfileResponse;
            
            if (profileResponse && profileResponse.data) {
              const profileData = profileResponse.data;
              
              // Determine role based on profile type or metadata
              const isOrganization = profileData.metadata?.gstNumber || 
                                   profileData.metadata?.contactPersonName ||
                                   profileData.metadata?.organizationName ||
                                   profileData.metadata?.address;
              
              const profileType = profileData.type;
              const isOrgByType = profileType === 'organization' || profileType === 'employer';
              
              transformedUser.role = (isOrganization || isOrgByType) ? 'organization' : 'individual';
              
              // Transform API profile data to our UserProfile format
              const userProfile: UserProfile = {
                name: profileData.metadata?.name || profileData.metadata?.whoIAm?.name || '',
                dateOfBirth: profileData.metadata?.dateOfBirth || profileData.metadata?.whoIAm?.dateOfBirth,
                age: profileData.metadata?.age || profileData.metadata?.whatIHave?.age,
                gender: (profileData.metadata?.gender || profileData.metadata?.whoIAm?.gender) as 'male' | 'female' | 'other' | undefined,
                hometown: profileData.metadata?.hometown || profileData.metadata?.whoIAm?.hometown,
                aadharNumber: profileData.metadata?.aadharNumber || profileData.metadata?.whoIAm?.aadharNumber,
                phone: profileData.contact?.phoneNumber?.[0] || profileData.metadata?.whoIAm?.phone || '',
                currentLocation: profileData.location?.address || profileData.metadata?.whoIAm?.currentLocation || '',
                desiredLocation: profileData.metadata?.desiredLocation || profileData.metadata?.whoIAm?.desiredLocation || '',
                isNameVerified: profileData.metadata?.isNameVerified || profileData.metadata?.whoIAm?.isNameVerified || false,
                isAgeVerified: profileData.metadata?.isAgeVerified || profileData.metadata?.whoIAm?.isAgeVerified || false,
                interestedRole: profileData.metadata?.role,
                interestedIndustry: profileData.metadata?.industry,
                basicLiteracy: (profileData.metadata?.basicLiteracy || profileData.metadata?.whatIHave?.basicLiteracy) as 'below-8th' | '8th-pass' | '10th-pass' | '12th-pass' | 'graduate' | undefined,
                skillProofVideo: profileData.metadata?.skillProofVideo || profileData.metadata?.whatIHave?.skillProofVideo,
                qualityProofImage: profileData.metadata?.qualityProofImage || profileData.metadata?.whatIHave?.qualityProofImage,
                hasWorkExperience: profileData.metadata?.hasWorkExperience || profileData.metadata?.whatIHave?.hasWorkExperience,
                previousCompany: profileData.metadata?.previousCompany || profileData.metadata?.whatIHave?.previousCompany,
                previousLocation: profileData.metadata?.previousLocation || profileData.metadata?.whatIHave?.previousLocation,
                experienceMonths: profileData.metadata?.experienceMonths || profileData.metadata?.whatIHave?.experienceMonths,
                machinesOperated: profileData.metadata?.machinesOperated || profileData.metadata?.whatIHave?.machinesOperated,
                salaryFrequency: (profileData.metadata?.salaryFrequency || profileData.metadata?.whatIWant?.salaryFrequency) as 'weekly' | 'monthly' | undefined,
                advanceMonthsAvailable: profileData.metadata?.advanceMonthsAvailable || profileData.metadata?.whatIWant?.advanceMonthsAvailable,
                advanceFrequency: (profileData.metadata?.advanceFrequency || profileData.metadata?.whatIWant?.advanceFrequency) as 'monthly' | 'quarterly' | 'half-yearly' | undefined,
                monthlySalary: profileData.metadata?.monthlySalary || profileData.metadata?.whatIWant?.monthlySalary,
                pfDeduction: profileData.metadata?.pfDeduction || profileData.metadata?.whatIWant?.pfDeduction,
                esicDeduction: profileData.metadata?.esicDeduction || profileData.metadata?.whatIWant?.esicDeduction,
                inHandSalary: profileData.metadata?.inHandSalary || profileData.metadata?.whatIWant?.inHandSalary,
                housingFacility: profileData.metadata?.housingFacility || profileData.metadata?.whatIWant?.housingFacility,
                foodFacility: profileData.metadata?.foodFacility || profileData.metadata?.whatIWant?.foodFacility,
                workHoursPerDay: profileData.metadata?.workHoursPerDay || profileData.metadata?.whatIWant?.workHoursPerDay,
                overtimeAvailable: profileData.metadata?.overtimeAvailable || profileData.metadata?.whatIWant?.overtimeAvailable,
                overtimePayMultiplier: profileData.metadata?.overtimePayMultiplier || profileData.metadata?.whatIWant?.overtimePayMultiplier,
                gradeUpgradation: profileData.metadata?.gradeUpgradation || profileData.metadata?.whatIWant?.gradeUpgradation,
                factoryTrustScore: profileData.metadata?.factoryTrustScore || profileData.metadata?.whatIWant?.factoryTrustScore,
                experience: profileData.metadata?.experience || [],
                skills: profileData.metadata?.skills || [],
                certificates: profileData.metadata?.certificates || [],
                assessmentScores: profileData.metadata?.assessmentScores || [],
                documentVerificationStatus: profileData.metadata?.documentVerificationStatus || [],
              };

              transformedUser.profile = userProfile;
              transformedUser.profileId = profileData.id;

              // Create default candidate for individual users
              if (transformedUser.role === 'individual') {
                const defaultCandidate = createDefaultCandidateFromProfile(userProfile);
                transformedUser.managedCandidates = [defaultCandidate];
                transformedUser.selectedCandidateId = defaultCandidate.id;
              }
            }
          } catch (profileError) {
            // No profile found or error fetching profile - user can create one later
          }

          // Always fetch profiles for individual users to ensure we have the latest data
          if (transformedUser.role === 'individual') {
            try {
              const profiles = await fetchAndTransformProfiles();
              if (profiles.length > 0) {
                transformedUser.managedCandidates = profiles;
                transformedUser.selectedCandidateId = profiles[0].id;
              } else {
                if (transformedUser.profile) {
                  const defaultCandidate = createDefaultCandidateFromProfile(transformedUser.profile as UserProfile);
                  transformedUser.managedCandidates = [defaultCandidate];
                  transformedUser.selectedCandidateId = defaultCandidate.id;
                }
              }
            } catch (profilesError) {
              // Error fetching profiles
              if (transformedUser.profile) {
                const defaultCandidate = createDefaultCandidateFromProfile(transformedUser.profile as UserProfile);
                transformedUser.managedCandidates = [defaultCandidate];
                transformedUser.selectedCandidateId = defaultCandidate.id;
              }
            }
          }
          
          // Handle backward compatibility - create default employer if none exists but org profile exists
          if (transformedUser.profile && transformedUser.role === 'organization' && transformedUser.managedEmployers.length === 0) {
            const defaultEmployer = createDefaultEmployerFromProfile(transformedUser.profile as OrganizationProfile);
            transformedUser.managedEmployers = [defaultEmployer];
            transformedUser.selectedEmployerId = defaultEmployer.id;
          }
          
          // Handle backward compatibility - create default candidate if none exists but user profile exists
          if (transformedUser.profile && transformedUser.role === 'individual' && transformedUser.managedCandidates.length === 0) {
            const defaultCandidate = createDefaultCandidateFromProfile(transformedUser.profile as UserProfile);
            transformedUser.managedCandidates = [defaultCandidate];
            transformedUser.selectedCandidateId = defaultCandidate.id;
          }
          
          localStorage.setItem('user', JSON.stringify(transformedUser));
          setUser(transformedUser);
          
          // Initialize organization data after successful session check
          try {
            // Get list of organizations
            const organizations = await apiClient.getOrganizationList();
            
            if (organizations.length > 0) {
              // Set the first organization as active
              const firstOrg = organizations[0];
              await apiClient.setActiveOrganization(firstOrg.id);
              
              // Get active member details to determine role
              const memberInfo = await apiClient.getActiveOrganizationMember();
              
              // Update user with organization data
              const updatedUserWithOrg: User = {
                ...transformedUser,
                organizationRole: memberInfo.role as 'admin' | 'member' | 'viewer' | 'owner',
                activeOrganizationId: memberInfo.organizationId,
                organizations: organizations.map(org => ({
                  id: org.id,
                  name: org.name,
                  slug: org.slug,
                  role: memberInfo.role, // For now, assume same role across orgs
                  type: org.type
                }))
              };
              
              setUser(updatedUserWithOrg);
              localStorage.setItem('user', JSON.stringify(updatedUserWithOrg));
            }
          } catch (orgError) {
            console.log('No organization data available or error fetching during initial load:', orgError);
            // Don't throw error to avoid breaking the main flow
          }
        } else {
          // No valid session, check localStorage for fallback (development mode)
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
          }
        }
      } catch (error) {
        // No active session found
        // Clear any invalid session data
        localStorage.removeItem('user');
      }
    };

    checkSession();
  }, []);

  const createDefaultEmployerFromProfile = (orgProfile: OrganizationProfile): EmployerProfile => {
    return {
      id: 'default-employer',
      name: orgProfile.name,
      address: orgProfile.address,
      gstNumber: orgProfile.gstNumber,
      logo: orgProfile.logo,
      contactPersonName: orgProfile.contactPersonName,
      contactEmail: orgProfile.contactEmail,
      contactPhone: orgProfile.contactPhone,
      website: orgProfile.website,
      description: orgProfile.description,
      createdAt: new Date().toISOString(),
      isActive: true
    };
  };

  const createDefaultCandidateFromProfile = (userProfile: UserProfile): CandidateProfile => {
    return {
      id: 'default-candidate',
      name: userProfile.name,
      age: userProfile.age,
      isNameVerified: userProfile.isNameVerified,
      isAgeVerified: userProfile.isAgeVerified,
      currentLocation: userProfile.currentLocation,
      desiredLocation: userProfile.desiredLocation,
      interestedRole: userProfile.interestedRole,
      interestedIndustry: userProfile.interestedIndustry,
      experience: userProfile.experience,
      skills: userProfile.skills,
      certificates: userProfile.certificates,
      assessmentScores: userProfile.assessmentScores,
      documentVerificationStatus: userProfile.documentVerificationStatus,
      createdAt: new Date().toISOString(),
      isActive: true,
      nickname: userProfile.name, // Use the actual name instead of 'Main Profile'
      // Add unified schema data
      whoIAm: {
        name: userProfile.name,
        dateOfBirth: userProfile.dateOfBirth,
        age: userProfile.age,
        gender: userProfile.gender,
        hometown: userProfile.hometown,
        aadharNumber: userProfile.aadharNumber,
        phone: userProfile.phone,
        isNameVerified: userProfile.isNameVerified,
        isAgeVerified: userProfile.isAgeVerified,
        currentLocation: userProfile.currentLocation,
        desiredLocation: userProfile.desiredLocation,
      },
      whatIHave: {
        basicLiteracy: userProfile.basicLiteracy,
        skillProofVideo: userProfile.skillProofVideo,
        qualityProofImage: userProfile.qualityProofImage,
        hasWorkExperience: userProfile.hasWorkExperience,
        previousCompany: userProfile.previousCompany,
        previousLocation: userProfile.previousLocation,
        experienceMonths: userProfile.experienceMonths,
        machinesOperated: userProfile.machinesOperated,
      },
      whatIWant: {
        salaryFrequency: userProfile.salaryFrequency,
        advanceMonthsAvailable: userProfile.advanceMonthsAvailable,
        advanceFrequency: userProfile.advanceFrequency,
        monthlySalary: userProfile.monthlySalary,
        pfDeduction: userProfile.pfDeduction,
        esicDeduction: userProfile.esicDeduction,
        inHandSalary: userProfile.inHandSalary,
        housingFacility: userProfile.housingFacility,
        foodFacility: userProfile.foodFacility,
        workHoursPerDay: userProfile.workHoursPerDay,
        overtimeAvailable: userProfile.overtimeAvailable,
        overtimePayMultiplier: userProfile.overtimePayMultiplier,
        gradeUpgradation: userProfile.gradeUpgradation,
        factoryTrustScore: userProfile.factoryTrustScore,
      },
      // Verification status
      isGenderVerified: false,
      isAadharVerified: false,
      isHometownVerified: false,
      // Education and certifications
      education: [],
      skillCertifications: [],
      workExperience: [],
    };
  };

  const fetchAndTransformProfiles = async (): Promise<CandidateProfile[]> => {
    try {
      const profilesResponse = await apiClient.getProfiles() as ProfilesResponse;
      
      if (profilesResponse.data && profilesResponse.data.length > 0) {
        const transformedProfiles = profilesResponse.data.map((profile, index) => {
          const metadata = profile.metadata;
          
          // Transform API profile to CandidateProfile format
          const candidateProfile: CandidateProfile = {
            id: profile.id,
            name: metadata.name || metadata.whoIAm?.name || 'Unnamed Profile',
            age: metadata.whatIHave?.age,
            isNameVerified: metadata.isNameVerified || false,
            isAgeVerified: metadata.isAgeVerified || false,
            currentLocation: metadata.whoIAm?.location || '',
            desiredLocation: metadata.whoIAm?.location || '',
            interestedRole: metadata.role,
            interestedIndustry: metadata.industry,
            experience: metadata.experience || [],
            skills: metadata.skills || [],
            certificates: metadata.certificates || [],
            assessmentScores: metadata.assessmentScores || [],
            documentVerificationStatus: metadata.documentVerificationStatus || [],
            createdAt: profile.createdAt,
            isActive: true,
            nickname: metadata.name || metadata.whoIAm?.name || `Profile ${index + 1}`,
            // Add unified schema data (cleaned for role)
            whoIAm: metadata.whoIAm as any,
            whatIHave: metadata.whatIHave as any,
            whatIWant: metadata.whatIWant as any,
            // Add other fields
            education: metadata.education || [],
            skillCertifications: metadata.skillCertifications || [],
            workExperience: metadata.workExperience || [],
            // Verification status
            isGenderVerified: metadata.isGenderVerified || false,
            isAadharVerified: metadata.isAadharVerified || false,
            isHometownVerified: metadata.isHometownVerified || false,
          };
          
          // Clean contaminated profile data based on role
          const cleanedProfile = cleanContaminatedProfile(candidateProfile);
          
          return cleanedProfile;
        });
        
        return transformedProfiles;
      }
      
      return [];
    } catch (error) {
      // Error fetching profiles
      return [];
    }
  };



  // New OTP-based authentication methods
  const requestOTP = async (data: { phoneNumber?: string; email?: string; name?: string }) => {
    setIsLoading(true);
    try {
      const response = await apiClient.requestOTP(data);
      return response as { ok: boolean; otp: string };
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (data: { 
    phoneNumber?: string; 
    email?: string; 
    otp: string;
    name?: string;
    rememberMe?: boolean;
    joinOrg?: {
      join: boolean;
      orgSlug: string;
      role: string;
    };
    createAdmin?: boolean;
  }) => {
    setIsLoading(true);
    try {
      const response = await apiClient.verifyOTP(data) as { token: string; user: any };
      
      // After successful OTP verification, get the complete session data
      const sessionData = await apiClient.getSession() as SessionResponse;
      
      if (sessionData.user && sessionData.session) {
        const backendUser = sessionData.user;
        
        // Transform backend user to our User interface
        const transformedUser: User = {
          id: backendUser.id,
          email: backendUser.email,
          name: backendUser.name,
          role: 'individual', // Default to individual, will be updated based on profile data
          isVerified: backendUser.emailVerified,
          emailVerified: backendUser.emailVerified,
          image: backendUser.image,
          createdAt: backendUser.createdAt,
          updatedAt: backendUser.updatedAt,
          managedEmployers: [],
          selectedEmployerId: undefined,
          managedCandidates: [],
          selectedCandidateId: undefined
        };

        // Check for saved local data and merge
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          
          // Merge local profile data with backend user
          transformedUser.profile = parsedUser.profile;
          transformedUser.profileId = parsedUser.profileId;
          transformedUser.managedEmployers = parsedUser.managedEmployers || [];
          transformedUser.selectedEmployerId = parsedUser.selectedEmployerId;
          transformedUser.managedCandidates = parsedUser.managedCandidates || [];
          transformedUser.selectedCandidateId = parsedUser.selectedCandidateId;
          transformedUser.role = parsedUser.role || 'individual';
        }

        // Always fetch fresh profile data to ensure we have the latest
        try {
          const profileResponse = await apiClient.getProfile() as ProfileResponse;
          
          if (profileResponse && profileResponse.data) {
            const profileData = profileResponse.data;
            
            // Determine role based on profile type or metadata
            const isOrganization = profileData.metadata?.gstNumber || 
                                 profileData.metadata?.contactPersonName ||
                                 profileData.metadata?.organizationName ||
                                 profileData.metadata?.address;
            
            const profileType = profileData.type;
            const isOrgByType = profileType === 'organization' || profileType === 'employer';
            
            transformedUser.role = (isOrganization || isOrgByType) ? 'organization' : 'individual';
            
            // Transform API profile data to our UserProfile format
            const userProfile: UserProfile = {
              name: profileData.metadata?.name || profileData.metadata?.whoIAm?.name || '',
              dateOfBirth: profileData.metadata?.dateOfBirth || profileData.metadata?.whoIAm?.dateOfBirth,
              age: profileData.metadata?.age || profileData.metadata?.whatIHave?.age,
              gender: (profileData.metadata?.gender || profileData.metadata?.whoIAm?.gender) as 'male' | 'female' | 'other' | undefined,
              hometown: profileData.metadata?.hometown || profileData.metadata?.whoIAm?.hometown,
              aadharNumber: profileData.metadata?.aadharNumber || profileData.metadata?.whoIAm?.aadharNumber,
              phone: profileData.contact?.phoneNumber?.[0] || profileData.metadata?.whoIAm?.phone || '',
              currentLocation: profileData.location?.address || profileData.metadata?.whoIAm?.currentLocation || '',
              desiredLocation: profileData.metadata?.desiredLocation || profileData.metadata?.whoIAm?.desiredLocation || '',
              isNameVerified: profileData.metadata?.isNameVerified || profileData.metadata?.whoIAm?.isNameVerified || false,
              isAgeVerified: profileData.metadata?.isAgeVerified || profileData.metadata?.whoIAm?.isAgeVerified || false,
              interestedRole: profileData.metadata?.role,
              interestedIndustry: profileData.metadata?.industry,
              basicLiteracy: (profileData.metadata?.basicLiteracy || profileData.metadata?.whatIHave?.basicLiteracy) as 'below-8th' | '8th-pass' | '10th-pass' | '12th-pass' | 'graduate' | undefined,
              skillProofVideo: profileData.metadata?.skillProofVideo || profileData.metadata?.whatIHave?.skillProofVideo,
              qualityProofImage: profileData.metadata?.qualityProofImage || profileData.metadata?.whatIHave?.qualityProofImage,
              hasWorkExperience: profileData.metadata?.hasWorkExperience || profileData.metadata?.whatIHave?.hasWorkExperience,
              previousCompany: profileData.metadata?.previousCompany || profileData.metadata?.whatIHave?.previousCompany,
              previousLocation: profileData.metadata?.previousLocation || profileData.metadata?.whatIHave?.previousLocation,
              experienceMonths: profileData.metadata?.experienceMonths || profileData.metadata?.whatIHave?.experienceMonths,
              machinesOperated: profileData.metadata?.machinesOperated || profileData.metadata?.whatIHave?.machinesOperated,
              salaryFrequency: (profileData.metadata?.salaryFrequency || profileData.metadata?.whatIWant?.salaryFrequency) as 'weekly' | 'monthly' | undefined,
              advanceMonthsAvailable: profileData.metadata?.advanceMonthsAvailable || profileData.metadata?.whatIWant?.advanceMonthsAvailable,
              advanceFrequency: (profileData.metadata?.advanceFrequency || profileData.metadata?.whatIWant?.advanceFrequency) as 'monthly' | 'quarterly' | 'half-yearly' | undefined,
              monthlySalary: profileData.metadata?.monthlySalary || profileData.metadata?.whatIWant?.monthlySalary,
              pfDeduction: profileData.metadata?.pfDeduction || profileData.metadata?.whatIWant?.pfDeduction,
              esicDeduction: profileData.metadata?.esicDeduction || profileData.metadata?.whatIWant?.esicDeduction,
              inHandSalary: profileData.metadata?.inHandSalary || profileData.metadata?.whatIWant?.inHandSalary,
              housingFacility: profileData.metadata?.housingFacility || profileData.metadata?.whatIWant?.housingFacility,
              foodFacility: profileData.metadata?.foodFacility || profileData.metadata?.whatIWant?.foodFacility,
              workHoursPerDay: profileData.metadata?.workHoursPerDay || profileData.metadata?.whatIWant?.workHoursPerDay,
              overtimeAvailable: profileData.metadata?.overtimeAvailable || profileData.metadata?.whatIWant?.overtimeAvailable,
              overtimePayMultiplier: profileData.metadata?.overtimePayMultiplier || profileData.metadata?.whatIWant?.overtimePayMultiplier,
              gradeUpgradation: profileData.metadata?.gradeUpgradation || profileData.metadata?.whatIWant?.gradeUpgradation,
              factoryTrustScore: profileData.metadata?.factoryTrustScore || profileData.metadata?.whatIWant?.factoryTrustScore,
              experience: profileData.metadata?.experience || [],
              skills: profileData.metadata?.skills || [],
              certificates: profileData.metadata?.certificates || [],
              assessmentScores: profileData.metadata?.assessmentScores || [],
              documentVerificationStatus: profileData.metadata?.documentVerificationStatus || [],
            };

            transformedUser.profile = userProfile;
            transformedUser.profileId = profileData.id;

            // Create default candidate for individual users
            if (transformedUser.role === 'individual') {
              const defaultCandidate = createDefaultCandidateFromProfile(userProfile);
              transformedUser.managedCandidates = [defaultCandidate];
              transformedUser.selectedCandidateId = defaultCandidate.id;
            }
          }
        } catch (profileError) {
          // No profile found or error fetching profile - user can create one later
          console.log('No profile found for user:', profileError);
        }

        // Always fetch profiles for individual users to ensure we have the latest data
        if (transformedUser.role === 'individual') {
          try {
            const profiles = await fetchAndTransformProfiles();
            if (profiles.length > 0) {
              transformedUser.managedCandidates = profiles;
              transformedUser.selectedCandidateId = profiles[0].id;
            } else {
              // Create default candidate if no profiles found
              if (transformedUser.profile) {
                const defaultCandidate = createDefaultCandidateFromProfile(transformedUser.profile as UserProfile);
                transformedUser.managedCandidates = [defaultCandidate];
                transformedUser.selectedCandidateId = defaultCandidate.id;
              }
            }
          } catch (profilesError) {
            console.log('Error fetching profiles:', profilesError);
            // Create default candidate if error
            if (transformedUser.profile) {
              const defaultCandidate = createDefaultCandidateFromProfile(transformedUser.profile as UserProfile);
              transformedUser.managedCandidates = [defaultCandidate];
              transformedUser.selectedCandidateId = defaultCandidate.id;
            }
          }
        }
        
        // Handle backward compatibility - create default employer if none exists but org profile exists
        if (transformedUser.profile && transformedUser.role === 'organization' && transformedUser.managedEmployers.length === 0) {
          const defaultEmployer = createDefaultEmployerFromProfile(transformedUser.profile as OrganizationProfile);
          transformedUser.managedEmployers = [defaultEmployer];
          transformedUser.selectedEmployerId = defaultEmployer.id;
        }
        
        // Handle backward compatibility - create default candidate if none exists but user profile exists
        if (transformedUser.profile && transformedUser.role === 'individual' && transformedUser.managedCandidates.length === 0) {
          const defaultCandidate = createDefaultCandidateFromProfile(transformedUser.profile as UserProfile);
          transformedUser.managedCandidates = [defaultCandidate];
          transformedUser.selectedCandidateId = defaultCandidate.id;
        }
        
        // Store user data
        setUser(transformedUser);
        localStorage.setItem('user', JSON.stringify(transformedUser));
        
        // Initialize organization data after successful verification
        try {
          // Get list of organizations
          const organizations = await apiClient.getOrganizationList();
          
          if (organizations.length > 0) {
            // Set the first organization as active
            const firstOrg = organizations[0];
            await apiClient.setActiveOrganization(firstOrg.id);
            
            // Get active member details to determine role
            const memberInfo = await apiClient.getActiveOrganizationMember();
            
            // Update user with organization data
            const updatedUserWithOrg: User = {
              ...transformedUser,
              organizationRole: memberInfo.role as 'admin' | 'member' | 'viewer' | 'owner',
              activeOrganizationId: memberInfo.organizationId,
              organizations: organizations.map(org => ({
                id: org.id,
                name: org.name,
                slug: org.slug,
                role: memberInfo.role, // For now, assume same role across orgs
                type: org.type
              }))
            };
            
            setUser(updatedUserWithOrg);
            localStorage.setItem('user', JSON.stringify(updatedUserWithOrg));
          }
        } catch (orgError) {
          console.log('No organization data available or error fetching:', orgError);
          // Don't throw error to avoid breaking the main flow
        }
      } else {
        // Fallback to the original response if session is not available
        const backendUser = response.user;
        const transformedUser: User = {
          id: backendUser.id,
          email: backendUser.email,
          phone: backendUser.phoneNumber,
          name: backendUser.name,
          role: 'individual',
          isVerified: backendUser.emailVerified || backendUser.phoneNumberVerified,
          emailVerified: backendUser.emailVerified,
          image: backendUser.image,
          createdAt: backendUser.createdAt,
          updatedAt: backendUser.updatedAt,
          managedEmployers: [],
          selectedEmployerId: undefined,
          managedCandidates: [],
          selectedCandidateId: undefined
        };
        
        setUser(transformedUser);
        localStorage.setItem('user', JSON.stringify(transformedUser));
      }
      
      return response;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Set loading state to prevent multiple logout attempts
      setIsLoading(true);
      
      // Clear user state immediately to prevent UI issues
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('pendingUser');
      
      // Clear auth token is handled in apiClient.signOut()
      await apiClient.signOut();
      
      // Additional cleanup
      localStorage.removeItem('authToken');
      localStorage.removeItem('session');
      
      // Small delay to ensure all state changes are processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log('Logout error:', error);
      // Even if API call fails, we still want to clear local state
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfileData = async () => {
    if (!user) return;
    
    try {
      // Fetch latest profile data from API
      const profileResponse = await apiClient.getProfile() as ProfileResponse;
      if (profileResponse && profileResponse.data) {
        const profileData = profileResponse.data;
        
        // Transform API profile data to our UserProfile format
        const userProfile: UserProfile = {
          name: profileData.metadata?.name || profileData.metadata?.whoIAm?.name || '',
          dateOfBirth: profileData.metadata?.dateOfBirth || profileData.metadata?.whoIAm?.dateOfBirth,
          age: profileData.metadata?.age || profileData.metadata?.whatIHave?.age,
          gender: (profileData.metadata?.gender || profileData.metadata?.whoIAm?.gender) as 'male' | 'female' | 'other' | undefined,
          hometown: profileData.metadata?.hometown || profileData.metadata?.whoIAm?.hometown,
          aadharNumber: profileData.metadata?.aadharNumber || profileData.metadata?.whoIAm?.aadharNumber,
          phone: profileData.contact?.phoneNumber?.[0] || profileData.metadata?.whoIAm?.phone || '',
          currentLocation: profileData.location?.address || profileData.metadata?.whoIAm?.currentLocation || '',
          desiredLocation: profileData.metadata?.desiredLocation || profileData.metadata?.whoIAm?.desiredLocation || '',
          isNameVerified: profileData.metadata?.isNameVerified || profileData.metadata?.whoIAm?.isNameVerified || false,
          isAgeVerified: profileData.metadata?.isAgeVerified || profileData.metadata?.whoIAm?.isAgeVerified || false,
          interestedRole: profileData.metadata?.role,
          interestedIndustry: profileData.metadata?.industry,
          basicLiteracy: (profileData.metadata?.basicLiteracy || profileData.metadata?.whatIHave?.basicLiteracy) as 'below-8th' | '8th-pass' | '10th-pass' | '12th-pass' | 'graduate' | undefined,
          skillProofVideo: profileData.metadata?.skillProofVideo || profileData.metadata?.whatIHave?.skillProofVideo,
          qualityProofImage: profileData.metadata?.qualityProofImage || profileData.metadata?.whatIHave?.qualityProofImage,
          hasWorkExperience: profileData.metadata?.hasWorkExperience || profileData.metadata?.whatIHave?.hasWorkExperience,
          previousCompany: profileData.metadata?.previousCompany || profileData.metadata?.whatIHave?.previousCompany,
          previousLocation: profileData.metadata?.previousLocation || profileData.metadata?.whatIHave?.previousLocation,
          experienceMonths: profileData.metadata?.experienceMonths || profileData.metadata?.whatIHave?.experienceMonths,
          machinesOperated: profileData.metadata?.machinesOperated || profileData.metadata?.whatIHave?.machinesOperated,
          salaryFrequency: (profileData.metadata?.salaryFrequency || profileData.metadata?.whatIWant?.salaryFrequency) as 'weekly' | 'monthly' | undefined,
          advanceMonthsAvailable: profileData.metadata?.advanceMonthsAvailable || profileData.metadata?.whatIWant?.advanceMonthsAvailable,
          advanceFrequency: (profileData.metadata?.advanceFrequency || profileData.metadata?.whatIWant?.advanceFrequency) as 'monthly' | 'quarterly' | 'half-yearly' | undefined,
          monthlySalary: profileData.metadata?.monthlySalary || profileData.metadata?.whatIWant?.monthlySalary,
          pfDeduction: profileData.metadata?.pfDeduction || profileData.metadata?.whatIWant?.pfDeduction,
          esicDeduction: profileData.metadata?.esicDeduction || profileData.metadata?.whatIWant?.esicDeduction,
          inHandSalary: profileData.metadata?.inHandSalary || profileData.metadata?.whatIWant?.inHandSalary,
          housingFacility: profileData.metadata?.housingFacility || profileData.metadata?.whatIWant?.housingFacility,
          foodFacility: profileData.metadata?.foodFacility || profileData.metadata?.whatIWant?.foodFacility,
          workHoursPerDay: profileData.metadata?.workHoursPerDay || profileData.metadata?.whatIWant?.workHoursPerDay,
          overtimeAvailable: profileData.metadata?.overtimeAvailable || profileData.metadata?.whatIWant?.overtimeAvailable,
          overtimePayMultiplier: profileData.metadata?.overtimePayMultiplier || profileData.metadata?.whatIWant?.overtimePayMultiplier,
          gradeUpgradation: profileData.metadata?.gradeUpgradation || profileData.metadata?.whatIWant?.gradeUpgradation,
          factoryTrustScore: profileData.metadata?.factoryTrustScore || profileData.metadata?.whatIWant?.factoryTrustScore,
          experience: profileData.metadata?.experience || [],
          skills: profileData.metadata?.skills || [],
          certificates: profileData.metadata?.certificates || [],
          assessmentScores: profileData.metadata?.assessmentScores || [],
          documentVerificationStatus: profileData.metadata?.documentVerificationStatus || [],
        };

        // Update user with fresh profile data
        const updatedUser = { ...user, profile: userProfile, profileId: profileData.id };
        
        // Update default candidate for individual users
        if (user.role === 'individual') {
          const defaultCandidate = createDefaultCandidateFromProfile(userProfile);
          const existingDefaultIndex = updatedUser.managedCandidates.findIndex(cand => cand.id === 'default-candidate');
          
          if (existingDefaultIndex >= 0) {
            updatedUser.managedCandidates[existingDefaultIndex] = defaultCandidate;
          } else {
            updatedUser.managedCandidates = [defaultCandidate, ...updatedUser.managedCandidates];
          }
          
          if (!updatedUser.selectedCandidateId) {
            updatedUser.selectedCandidateId = defaultCandidate.id;
          }
        }
        
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.log('Error refreshing profile data:', error);
    }
  };

  const refreshSession = async () => {
    try {
      const sessionData = await apiClient.getSession() as SessionResponse;
      
      if (sessionData.user && sessionData.session) {
        const backendUser = sessionData.user;
        
        // Transform backend user to our User interface
        const transformedUser: User = {
          id: backendUser.id,
          email: backendUser.email,
          name: backendUser.name,
          role: 'individual', // Default to individual, will be updated based on profile data
          isVerified: backendUser.emailVerified,
          emailVerified: backendUser.emailVerified,
          image: backendUser.image,
          createdAt: backendUser.createdAt,
          updatedAt: backendUser.updatedAt,
          managedEmployers: [],
          selectedEmployerId: undefined,
          managedCandidates: [],
          selectedCandidateId: undefined
        };

        // Check for saved local data and merge
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          
          // Merge local profile data with backend user
          transformedUser.profile = parsedUser.profile;
          transformedUser.profileId = parsedUser.profileId; // Merge profile ID
          transformedUser.managedEmployers = parsedUser.managedEmployers || [];
          transformedUser.selectedEmployerId = parsedUser.selectedEmployerId;
          transformedUser.managedCandidates = parsedUser.managedCandidates || [];
          transformedUser.selectedCandidateId = parsedUser.selectedCandidateId;
          transformedUser.role = parsedUser.role || 'individual';
        }

        // Always fetch fresh profile data to ensure we have the latest
        try {
          const profileResponse = await apiClient.getProfile() as ProfileResponse;
          
          if (profileResponse && profileResponse.data) {
            const profileData = profileResponse.data;
            
            // Determine role based on profile type or metadata
            // If profile has organization-specific fields, it's an organization
            const isOrganization = profileData.metadata?.gstNumber || 
                                 profileData.metadata?.contactPersonName ||
                                 profileData.metadata?.organizationName ||
                                 profileData.metadata?.address; // Address might indicate organization
            
            // Also check if the profile type indicates organization
            const profileType = profileData.type;
            const isOrgByType = profileType === 'organization' || profileType === 'employer';
            
            transformedUser.role = (isOrganization || isOrgByType) ? 'organization' : 'individual';
            
            // Transform API profile data to our UserProfile format
            const userProfile: UserProfile = {
              name: profileData.metadata?.name || profileData.metadata?.whoIAm?.name || '',
              dateOfBirth: profileData.metadata?.dateOfBirth || profileData.metadata?.whoIAm?.dateOfBirth,
              age: profileData.metadata?.age || profileData.metadata?.whatIHave?.age,
              gender: (profileData.metadata?.gender || profileData.metadata?.whoIAm?.gender) as 'male' | 'female' | 'other' | undefined,
              hometown: profileData.metadata?.hometown || profileData.metadata?.whoIAm?.hometown,
              aadharNumber: profileData.metadata?.aadharNumber || profileData.metadata?.whoIAm?.aadharNumber,
              phone: profileData.contact?.phoneNumber?.[0] || profileData.metadata?.whoIAm?.phone || '',
              currentLocation: profileData.location?.address || profileData.metadata?.whoIAm?.currentLocation || '',
              desiredLocation: profileData.metadata?.desiredLocation || profileData.metadata?.whoIAm?.desiredLocation || '',
              isNameVerified: profileData.metadata?.isNameVerified || profileData.metadata?.whoIAm?.isNameVerified || false,
              isAgeVerified: profileData.metadata?.isAgeVerified || profileData.metadata?.whoIAm?.isAgeVerified || false,
              interestedRole: profileData.metadata?.role,
              interestedIndustry: profileData.metadata?.industry,
              basicLiteracy: (profileData.metadata?.basicLiteracy || profileData.metadata?.whatIHave?.basicLiteracy) as 'below-8th' | '8th-pass' | '10th-pass' | '12th-pass' | 'graduate' | undefined,
              skillProofVideo: profileData.metadata?.skillProofVideo || profileData.metadata?.whatIHave?.skillProofVideo,
              qualityProofImage: profileData.metadata?.qualityProofImage || profileData.metadata?.whatIHave?.qualityProofImage,
              hasWorkExperience: profileData.metadata?.hasWorkExperience || profileData.metadata?.whatIHave?.hasWorkExperience,
              previousCompany: profileData.metadata?.previousCompany || profileData.metadata?.whatIHave?.previousCompany,
              previousLocation: profileData.metadata?.previousLocation || profileData.metadata?.whatIHave?.previousLocation,
              experienceMonths: profileData.metadata?.experienceMonths || profileData.metadata?.whatIHave?.experienceMonths,
              machinesOperated: profileData.metadata?.machinesOperated || profileData.metadata?.whatIHave?.machinesOperated,
              salaryFrequency: (profileData.metadata?.salaryFrequency || profileData.metadata?.whatIWant?.salaryFrequency) as 'weekly' | 'monthly' | undefined,
              advanceMonthsAvailable: profileData.metadata?.advanceMonthsAvailable || profileData.metadata?.whatIWant?.advanceMonthsAvailable,
              advanceFrequency: (profileData.metadata?.advanceFrequency || profileData.metadata?.whatIWant?.advanceFrequency) as 'monthly' | 'quarterly' | 'half-yearly' | undefined,
              monthlySalary: profileData.metadata?.monthlySalary || profileData.metadata?.whatIWant?.monthlySalary,
              pfDeduction: profileData.metadata?.pfDeduction || profileData.metadata?.whatIWant?.pfDeduction,
              esicDeduction: profileData.metadata?.esicDeduction || profileData.metadata?.whatIWant?.esicDeduction,
              inHandSalary: profileData.metadata?.inHandSalary || profileData.metadata?.whatIWant?.inHandSalary,
              housingFacility: profileData.metadata?.housingFacility || profileData.metadata?.whatIWant?.housingFacility,
              foodFacility: profileData.metadata?.foodFacility || profileData.metadata?.whatIWant?.foodFacility,
              workHoursPerDay: profileData.metadata?.workHoursPerDay || profileData.metadata?.whatIWant?.workHoursPerDay,
              overtimeAvailable: profileData.metadata?.overtimeAvailable || profileData.metadata?.whatIWant?.overtimeAvailable,
              overtimePayMultiplier: profileData.metadata?.overtimePayMultiplier || profileData.metadata?.whatIWant?.overtimePayMultiplier,
              gradeUpgradation: profileData.metadata?.gradeUpgradation || profileData.metadata?.whatIWant?.gradeUpgradation,
              factoryTrustScore: profileData.metadata?.factoryTrustScore || profileData.metadata?.whatIWant?.factoryTrustScore,
              experience: profileData.metadata?.experience || [],
              skills: profileData.metadata?.skills || [],
              certificates: profileData.metadata?.certificates || [],
              assessmentScores: profileData.metadata?.assessmentScores || [],
              documentVerificationStatus: profileData.metadata?.documentVerificationStatus || [],
            };

            transformedUser.profile = userProfile;
            transformedUser.profileId = profileData.id; // Store profile ID

            // Create default candidate for individual users
            if (transformedUser.role === 'individual') {
              const defaultCandidate = createDefaultCandidateFromProfile(userProfile);
              transformedUser.managedCandidates = [defaultCandidate];
              transformedUser.selectedCandidateId = defaultCandidate.id;
            }
          }
        } catch (profileError) {
          // No profile found or error fetching profile - user can create one later
        }

        // Always fetch profiles for individual users to ensure we have the latest data
        if (transformedUser.role === 'individual') {
          try {
            const profiles = await fetchAndTransformProfiles();
            if (profiles.length > 0) {
              transformedUser.managedCandidates = profiles;
              transformedUser.selectedCandidateId = profiles[0].id;
            } else {
              // Create default candidate if no profiles found
              if (transformedUser.profile) {
                const defaultCandidate = createDefaultCandidateFromProfile(transformedUser.profile as UserProfile);
                transformedUser.managedCandidates = [defaultCandidate];
                transformedUser.selectedCandidateId = defaultCandidate.id;
              }
            }
          } catch (profilesError) {
            console.log('Error fetching profiles:', profilesError);
            // Create default candidate if error
            if (transformedUser.profile) {
              const defaultCandidate = createDefaultCandidateFromProfile(transformedUser.profile as UserProfile);
              transformedUser.managedCandidates = [defaultCandidate];
              transformedUser.selectedCandidateId = defaultCandidate.id;
            }
          }
        }
        
        // Handle backward compatibility - create default employer if none exists but org profile exists
        if (transformedUser.profile && transformedUser.role === 'organization' && transformedUser.managedEmployers.length === 0) {
          const defaultEmployer = createDefaultEmployerFromProfile(transformedUser.profile as OrganizationProfile);
          transformedUser.managedEmployers = [defaultEmployer];
          transformedUser.selectedEmployerId = defaultEmployer.id;
        }
        
        // Handle backward compatibility - create default candidate if none exists but user profile exists
        if (transformedUser.profile && transformedUser.role === 'individual' && transformedUser.managedCandidates.length === 0) {
          const defaultCandidate = createDefaultCandidateFromProfile(transformedUser.profile as UserProfile);
          transformedUser.managedCandidates = [defaultCandidate];
          transformedUser.selectedCandidateId = defaultCandidate.id;
        }
        
        localStorage.setItem('user', JSON.stringify(transformedUser));
        setUser(transformedUser);
        
        // Initialize organization data after successful session refresh
        try {
          // Get list of organizations
          const organizations = await apiClient.getOrganizationList();
          
          if (organizations.length > 0) {
            // Set the first organization as active
            const firstOrg = organizations[0];
            await apiClient.setActiveOrganization(firstOrg.id);
            
            // Get active member details to determine role
            const memberInfo = await apiClient.getActiveOrganizationMember();
            
            // Update user with organization data
            const updatedUserWithOrg: User = {
              ...transformedUser,
              organizationRole: memberInfo.role as 'admin' | 'member' | 'viewer' | 'owner',
              activeOrganizationId: memberInfo.organizationId,
              organizations: organizations.map(org => ({
                id: org.id,
                name: org.name,
                slug: org.slug,
                role: memberInfo.role, // For now, assume same role across orgs
                type: org.type
              }))
            };
            
            setUser(updatedUserWithOrg);
            localStorage.setItem('user', JSON.stringify(updatedUserWithOrg));
          }
        } catch (orgError) {
          console.log('No organization data available or error fetching during refresh:', orgError);
          // Don't throw error to avoid breaking the main flow
        }
      } else {
        console.log('🔍 refreshSession - No valid session found');
        // No valid session, clear user state
        setUser(null);
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.log('Error refreshing session:', error);
      // Clear any invalid session data
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  const updateProfile = (profile: UserProfile | OrganizationProfile) => {
    if (user) {
      const updatedUser = { ...user, profile };
      
      // If this is an organization profile, create/update default employer
      if (user.role === 'organization') {
        const orgProfile = profile as OrganizationProfile;
        const defaultEmployer = createDefaultEmployerFromProfile(orgProfile);
        
        // Check if default employer already exists
        const existingDefaultIndex = updatedUser.managedEmployers.findIndex(emp => emp.id === 'default-employer');
        
        if (existingDefaultIndex >= 0) {
          // Update existing default employer
          updatedUser.managedEmployers[existingDefaultIndex] = defaultEmployer;
        } else {
          // Add new default employer at the beginning
          updatedUser.managedEmployers = [defaultEmployer, ...updatedUser.managedEmployers];
        }
        
        // Set as selected if no employer is currently selected
        if (!updatedUser.selectedEmployerId) {
          updatedUser.selectedEmployerId = defaultEmployer.id;
        }
      }
      
      // If this is an individual profile, create/update default candidate
      if (user.role === 'individual') {
        const userProfile = profile as UserProfile;
        const defaultCandidate = createDefaultCandidateFromProfile(userProfile);
        
        // Check if default candidate already exists
        const existingDefaultIndex = updatedUser.managedCandidates.findIndex(cand => cand.id === 'default-candidate');
        
        if (existingDefaultIndex >= 0) {
          // Update existing default candidate
          updatedUser.managedCandidates[existingDefaultIndex] = defaultCandidate;
        } else {
          // Add new default candidate at the beginning
          updatedUser.managedCandidates = [defaultCandidate, ...updatedUser.managedCandidates];
        }
        
        // Set as selected if no candidate is currently selected
        if (!updatedUser.selectedCandidateId) {
          updatedUser.selectedCandidateId = defaultCandidate.id;
        }
      }
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const addEmployer = (employer: Omit<EmployerProfile, 'id' | 'createdAt'>) => {
    if (user) {
      const newEmployer: EmployerProfile = {
        ...employer,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        isActive: true
      };
      
      const updatedUser = {
        ...user,
        managedEmployers: [...user.managedEmployers, newEmployer],
        selectedEmployerId: user.selectedEmployerId || newEmployer.id
      };
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const updateEmployer = (employerId: string, employerUpdate: Partial<EmployerProfile>) => {
    if (user) {
      const updatedEmployers = user.managedEmployers.map(emp => 
        emp.id === employerId ? { ...emp, ...employerUpdate } : emp
      );
      
      const updatedUser = { ...user, managedEmployers: updatedEmployers };
      
      // If updating the default employer, also update the organization profile
      if (employerId === 'default-employer' && user.profile && user.role === 'organization') {
        const updatedEmployer = updatedEmployers.find(emp => emp.id === 'default-employer');
        if (updatedEmployer) {
          const updatedOrgProfile: OrganizationProfile = {
            ...user.profile as OrganizationProfile,
            name: updatedEmployer.name,
            address: updatedEmployer.address,
            gstNumber: updatedEmployer.gstNumber,
            logo: updatedEmployer.logo,
            contactPersonName: updatedEmployer.contactPersonName,
            contactEmail: updatedEmployer.contactEmail,
            contactPhone: updatedEmployer.contactPhone,
            website: updatedEmployer.website,
            description: updatedEmployer.description
          };
          updatedUser.profile = updatedOrgProfile;
        }
      }
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const deleteEmployer = (employerId: string) => {
    if (user) {
      // Prevent deletion of default employer
      if (employerId === 'default-employer') {
        return;
      }
      
      const updatedEmployers = user.managedEmployers.filter(emp => emp.id !== employerId);
      const updatedUser = {
        ...user,
        managedEmployers: updatedEmployers,
        selectedEmployerId: user.selectedEmployerId === employerId 
          ? (updatedEmployers.length > 0 ? updatedEmployers[0].id : undefined)
          : user.selectedEmployerId
      };
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const selectEmployer = (employerId: string) => {
    if (user) {
      const updatedUser = { ...user, selectedEmployerId: employerId };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const getSelectedEmployer = (): EmployerProfile | null => {
    if (user && user.selectedEmployerId) {
      return user.managedEmployers.find(emp => emp.id === user.selectedEmployerId) || null;
    }
    return null;
  };

  const addCandidate = (candidate: Omit<CandidateProfile, 'id' | 'createdAt'>) => {
    if (user) {
      // Validate that the candidate has required data before adding
      const hasRequiredData = candidate.name?.trim() && 
                             candidate.interestedRole?.trim() && 
                             (candidate.currentLocation?.trim() || candidate.whoIAm?.location?.trim()) &&
                             (candidate.phone?.trim() || candidate.whoIAm?.phone?.trim());

      if (!hasRequiredData) {
        console.log('Incomplete candidate data, not adding candidate:', candidate);
        return;
      }

      const newCandidate: CandidateProfile = {
        ...candidate,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        isActive: true
      };
      
      const updatedUser = {
        ...user,
        managedCandidates: [...user.managedCandidates, newCandidate],
        selectedCandidateId: user.selectedCandidateId || newCandidate.id
      };
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const updateCandidate = (candidateId: string, candidateUpdate: Partial<CandidateProfile>) => {
    if (user) {
      const updatedCandidates = user.managedCandidates.map(cand => 
        cand.id === candidateId ? { ...cand, ...candidateUpdate } : cand
      );
      
      const updatedUser = { ...user, managedCandidates: updatedCandidates };
      
      // If updating the default candidate, also update the user profile
      if (candidateId === 'default-candidate' && user.profile && user.role === 'individual') {
        const updatedCandidate = updatedCandidates.find(cand => cand.id === 'default-candidate');
        if (updatedCandidate) {
          const updatedUserProfile: UserProfile = {
            ...user.profile as UserProfile,
            name: updatedCandidate.name,
            age: updatedCandidate.age,
            isNameVerified: updatedCandidate.isNameVerified,
            isAgeVerified: updatedCandidate.isAgeVerified,
            currentLocation: updatedCandidate.currentLocation,
            desiredLocation: updatedCandidate.desiredLocation,
            interestedRole: updatedCandidate.interestedRole,
            interestedIndustry: updatedCandidate.interestedIndustry,
            experience: updatedCandidate.experience,
            skills: updatedCandidate.skills,
            certificates: updatedCandidate.certificates,
            assessmentScores: updatedCandidate.assessmentScores,
            documentVerificationStatus: updatedCandidate.documentVerificationStatus
          };
          updatedUser.profile = updatedUserProfile;
        }
      }
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const deleteCandidate = (candidateId: string) => {
    if (user) {
      // Prevent deletion of default candidate
      if (candidateId === 'default-candidate') {
        return;
      }
      
      const updatedCandidates = user.managedCandidates.filter(cand => cand.id !== candidateId);
      const updatedUser = {
        ...user,
        managedCandidates: updatedCandidates,
        selectedCandidateId: user.selectedCandidateId === candidateId 
          ? (updatedCandidates.length > 0 ? updatedCandidates[0].id : undefined)
          : user.selectedCandidateId
      };
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const selectCandidate = (candidateId: string) => {
    if (user) {
      const updatedUser = { ...user, selectedCandidateId: candidateId };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const getSelectedCandidate = (): CandidateProfile | null => {
    if (user && user.selectedCandidateId) {
      return user.managedCandidates.find(cand => cand.id === user.selectedCandidateId) || null;
    }
    return null;
  };

  // Clean up incomplete profiles
  const cleanupIncompleteProfiles = () => {
    if (user) {
      const completeProfiles = user.managedCandidates.filter(candidate => {
        const hasRequiredData = candidate.name?.trim() && 
                               candidate.interestedRole?.trim() && 
                               (candidate.currentLocation?.trim() || candidate.whoIAm?.location?.trim()) &&
                               (candidate.phone?.trim() || candidate.whoIAm?.phone?.trim());
        return hasRequiredData;
      });

      if (completeProfiles.length !== user.managedCandidates.length) {
        const updatedUser = {
          ...user,
          managedCandidates: completeProfiles,
          selectedCandidateId: completeProfiles.length > 0 ? completeProfiles[0].id : undefined
        };
        
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    }
  };

  // Check if user has admin role
  const hasAdminRole = (): boolean => {
    if (!user) return false;
    
    // Check if user has admin or owner role in any organization
    return user.organizationRole === 'admin' || user.organizationRole === 'owner';
  };

  // Initialize organization data after successful OTP verification
  const initializeOrganizationData = async (): Promise<void> => {
    if (!user) return;
    
    try {
      // 1. Get list of organizations
      const organizations = await apiClient.getOrganizationList();
      
      if (organizations.length > 0) {
        // 2. Set the first organization as active (or use existing logic)
        const firstOrg = organizations[0];
        await apiClient.setActiveOrganization(firstOrg.id);
        
        // 3. Get active member details to determine role
        const memberInfo = await apiClient.getActiveOrganizationMember();
        
        // Update user with organization data
        const updatedUser: User = {
          ...user,
          organizationRole: memberInfo.role as 'admin' | 'member' | 'viewer' | 'owner',
          activeOrganizationId: memberInfo.organizationId,
          organizations: organizations.map(org => ({
            id: org.id,
            name: org.name,
            slug: org.slug,
            role: memberInfo.role, // For now, assume same role across orgs
            type: org.type
          }))
        };
        
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error initializing organization data:', error);
      // Don't throw error to avoid breaking the flow
    }
  };

  // Set active organization
  const setActiveOrganization = async (organizationId: string): Promise<void> => {
    if (!user) return;
    
    try {
      // Set active organization
      await apiClient.setActiveOrganization(organizationId);
      
      // Get updated member info
      const memberInfo = await apiClient.getActiveOrganizationMember();
      
      // Update user with new active organization and role
      const updatedUser: User = {
        ...user,
        organizationRole: memberInfo.role as 'admin' | 'member' | 'viewer' | 'owner',
        activeOrganizationId: memberInfo.organizationId
      };
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error setting active organization:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      requestOTP,
      verifyOTP,
      logout,
      updateProfile,
      refreshProfileData,
      refreshSession,
      addEmployer,
      updateEmployer,
      deleteEmployer,
      selectEmployer,
      getSelectedEmployer,
      addCandidate,
      updateCandidate,
      deleteCandidate,
      selectCandidate,
      getSelectedCandidate,
      cleanupIncompleteProfiles,
      hasAdminRole,
      initializeOrganizationData,
      setActiveOrganization,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};
