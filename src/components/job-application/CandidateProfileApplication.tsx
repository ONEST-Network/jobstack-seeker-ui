import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileForm, ProfileFormProvider } from '@/components/profile/ProfileFormProvider';
import DynamicFormStep from '@/components/profile/DynamicFormStep';
import { JobApplicationData } from '@/hooks/useJobApplication';
import { getUnifiedSchema } from '@/schemas';

interface CandidateProfileApplicationProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (applicationData: JobApplicationData) => Promise<void>;
  job: any;
  applying?: boolean;
}

const CandidateProfileApplicationContent: React.FC<CandidateProfileApplicationProps> = ({
  isOpen,
  onClose,
  onSubmit,
  job,
  applying = false
}) => {
  const { user, getSelectedCandidate } = useAuth();
  const selectedCandidate = getSelectedCandidate();
  const [activeTab, setActiveTab] = useState('whoIAm');
  const { profile, setProfile } = useProfileForm();
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Helper function to map job title to role name based on descriptor name
  const getRoleFromJobTitle = (jobTitle: string): string => {
    const lowerJobTitle = jobTitle.toLowerCase();
    
    // Map based on keywords in the job title
    if (lowerJobTitle.includes('tailor') || lowerJobTitle.includes('stitch') || lowerJobTitle.includes('garment')) {
      return 'Industrial Tailor';
    }
    if (lowerJobTitle.includes('warehouse') || lowerJobTitle.includes('loader') || lowerJobTitle.includes('picker') || lowerJobTitle.includes('logistics')) {
      return 'Warehouse Loader & Picker';
    }
    if (lowerJobTitle.includes('recruitment') || lowerJobTitle.includes('hr') || lowerJobTitle.includes('talent') || lowerJobTitle.includes('hiring')) {
      return 'Recruitment Associate';
    }
    if (lowerJobTitle.includes('sales') || lowerJobTitle.includes('field') || lowerJobTitle.includes('executive')) {
      return 'Field Sales Executive';
    }
    if (lowerJobTitle.includes('promoter') || lowerJobTitle.includes('store') || lowerJobTitle.includes('retail')) {
      return 'In Store Promoter';
    }
    
    // Default to Industrial Tailor if no match found
    return 'Industrial Tailor';
  };

  // Get job title from job object
  const getJobTitle = (job: any): string => {
    // Try to get title from descriptor.name first (BAP format)
    if (job.descriptor?.name) {
      return job.descriptor.name;
    }
    // Fallback to job.title
    if (job.title) {
      return job.title;
    }
    // Last fallback
    return 'Unknown Job';
  };

  // Transform existing profile data to unified schema format
  const transformProfileToUnifiedSchema = (existingProfile: any, mappedRole: string) => {
    const unifiedProfile = {
      interestedRole: mappedRole,
      whoIAm: {},
      whatIHave: {},
      whatIWant: {}
    } as any;

    // Transform WhoIAm data
    if (existingProfile) {
      unifiedProfile.whoIAm = {
        name: existingProfile.name || existingProfile.whoIAm?.name || '',
        dateOfBirth: existingProfile.dateOfBirth || existingProfile.whoIAm?.dateOfBirth,
        age: existingProfile.age || existingProfile.whoIAm?.age,
        gender: existingProfile.gender || existingProfile.whoIAm?.gender,
        hometown: existingProfile.hometown || existingProfile.whoIAm?.hometown,
        aadharNumber: existingProfile.aadharNumber || existingProfile.whoIAm?.aadharNumber,
        phone: existingProfile.phone || existingProfile.whoIAm?.phone || '',
        location: existingProfile.currentLocation || existingProfile.whoIAm?.currentLocation || existingProfile.whoIAm?.location || '',
        currentLocation: existingProfile.currentLocation || existingProfile.whoIAm?.currentLocation || '',
        desiredLocation: existingProfile.desiredLocation || existingProfile.whoIAm?.desiredLocation || '',
        isNameVerified: existingProfile.isNameVerified || existingProfile.whoIAm?.isNameVerified || false,
        isAgeVerified: existingProfile.isAgeVerified || existingProfile.whoIAm?.isAgeVerified || false
      };

      // Transform WhatIHave data - map to correct schema field names
      unifiedProfile.whatIHave = {
        // Map legacy fields to new schema fields
        age: existingProfile.age || existingProfile.whatIHave?.age,
        jukiMachineExperience: existingProfile.jukiMachineExperience || existingProfile.whatIHave?.jukiMachineExperience,
        stitchingSpeed: existingProfile.stitchingSpeed || existingProfile.whatIHave?.stitchingSpeed,
        qualityScore: existingProfile.qualityScore || existingProfile.whatIHave?.qualityScore,
        qualityScoreExplanation: existingProfile.qualityScoreExplanation || existingProfile.whatIHave?.qualityScoreExplanation,
        taskVideo: existingProfile.taskVideo || existingProfile.whatIHave?.taskVideo,
        qrCodeScan: existingProfile.qrCodeScan || existingProfile.whatIHave?.qrCodeScan,
        
        // Also keep legacy field mappings for backward compatibility
        basicLiteracy: existingProfile.basicLiteracy || existingProfile.whatIHave?.basicLiteracy,
        skillProofVideo: existingProfile.skillProofVideo || existingProfile.whatIHave?.skillProofVideo,
        qualityProofImage: existingProfile.qualityProofImage || existingProfile.whatIHave?.qualityProofImage,
        hasWorkExperience: existingProfile.hasWorkExperience || existingProfile.whatIHave?.hasWorkExperience,
        previousCompany: existingProfile.previousCompany || existingProfile.whatIHave?.previousCompany,
        previousLocation: existingProfile.previousLocation || existingProfile.whatIHave?.previousLocation,
        experienceMonths: existingProfile.experienceMonths || existingProfile.whatIHave?.experienceMonths,
        machinesOperated: existingProfile.machinesOperated || existingProfile.whatIHave?.machinesOperated || []
      };

      // Transform WhatIWant data - map to correct schema field names
      unifiedProfile.whatIWant = {
        // Map legacy fields to new schema fields
        readyToMigrate: existingProfile.readyToMigrate || existingProfile.whatIWant?.readyToMigrate,
        workHoursPerDay: existingProfile.workHoursPerDay || existingProfile.whatIWant?.workHoursPerDay,
        monthlyInHandPreferred: existingProfile.monthlyInHandPreferred || existingProfile.whatIWant?.monthlyInHandPreferred,
        monthlyOTExpectation: existingProfile.monthlyOTExpectation || existingProfile.whatIWant?.monthlyOTExpectation,
        monthlyPFESIC: existingProfile.monthlyPFESIC || existingProfile.whatIWant?.monthlyPFESIC,
        stayPreferences: existingProfile.stayPreferences || existingProfile.whatIWant?.stayPreferences,
        maxCostPerSharingBed: existingProfile.maxCostPerSharingBed || existingProfile.whatIWant?.maxCostPerSharingBed,
        
        // Also keep legacy field mappings for backward compatibility
        salaryFrequency: existingProfile.salaryFrequency || existingProfile.whatIWant?.salaryFrequency,
        advanceMonthsAvailable: existingProfile.advanceMonthsAvailable || existingProfile.whatIWant?.advanceMonthsAvailable,
        advanceFrequency: existingProfile.advanceFrequency || existingProfile.whatIWant?.advanceFrequency,
        monthlySalary: existingProfile.monthlySalary || existingProfile.whatIWant?.monthlySalary,
        pfDeduction: existingProfile.pfDeduction || existingProfile.whatIWant?.pfDeduction,
        esicDeduction: existingProfile.esicDeduction || existingProfile.whatIWant?.esicDeduction,
        inHandSalary: existingProfile.inHandSalary || existingProfile.whatIWant?.inHandSalary,
        housingFacility: existingProfile.housingFacility || existingProfile.whatIWant?.housingFacility,
        foodFacility: existingProfile.foodFacility || existingProfile.whatIWant?.foodFacility,
        overtimeAvailable: existingProfile.overtimeAvailable || existingProfile.whatIWant?.overtimeAvailable,
        overtimePayMultiplier: existingProfile.overtimePayMultiplier || existingProfile.whatIWant?.overtimePayMultiplier,
        gradeUpgradation: existingProfile.gradeUpgradation || existingProfile.whatIWant?.gradeUpgradation,
        factoryTrustScore: existingProfile.factoryTrustScore || existingProfile.whatIWant?.factoryTrustScore
      };

      // Keep legacy fields for backward compatibility
      unifiedProfile.name = existingProfile.name || '';
      unifiedProfile.phone = existingProfile.phone || '';
      unifiedProfile.currentLocation = existingProfile.currentLocation || '';
      unifiedProfile.desiredLocation = existingProfile.desiredLocation || '';
      unifiedProfile.interestedIndustry = existingProfile.interestedIndustry || '';
      unifiedProfile.experience = existingProfile.experience || [];
      unifiedProfile.skills = existingProfile.skills || [];
      unifiedProfile.certificates = existingProfile.certificates || [];
      unifiedProfile.education = existingProfile.education || [];
      unifiedProfile.skillCertifications = existingProfile.skillCertifications || [];
      unifiedProfile.workExperience = existingProfile.workExperience || [];
      unifiedProfile.isNameVerified = existingProfile.isNameVerified || false;
      unifiedProfile.isAgeVerified = existingProfile.isAgeVerified || false;
    }

    return unifiedProfile;
  };

  // Initialize profile with existing data and set job role
  React.useEffect(() => {
    const jobTitle = getJobTitle(job);
    const mappedRole = getRoleFromJobTitle(jobTitle);
    
    // Get existing profile data
    let existingProfile = null;
    if (user?.profile && 'age' in user.profile) {
      existingProfile = user.profile;
    } else if (selectedCandidate) {
      existingProfile = selectedCandidate;
    }

    // Transform existing profile to unified schema format
    const unifiedProfile = transformProfileToUnifiedSchema(existingProfile, mappedRole);
    setProfile(unifiedProfile);
    setIsDataLoaded(true);
  }, [user, selectedCandidate, setProfile, job]);

  // Additional effect to ensure profile is updated when user data changes
  React.useEffect(() => {
    if (user || selectedCandidate) {
      const jobTitle = getJobTitle(job);
      const mappedRole = getRoleFromJobTitle(jobTitle);
      
      let existingProfile = null;
      if (user?.profile && 'age' in user.profile) {
        existingProfile = user.profile;
      } else if (selectedCandidate) {
        existingProfile = selectedCandidate;
      }

      if (existingProfile) {
        const unifiedProfile = transformProfileToUnifiedSchema(existingProfile, mappedRole);
        setProfile(unifiedProfile);
        setIsDataLoaded(true);
      }
    }
  }, [user, selectedCandidate, job, setProfile]);

  const handleSubmit = async () => {
    // Transform profile data to JobApplicationData format
    const applicationData: JobApplicationData = {
      name: profile.name || profile.whoIAm?.name || user?.name || '',
      age: profile.age?.toString() || profile.whoIAm?.age?.toString() || profile.whatIHave?.age?.toString(),
      gender: profile.gender || profile.whoIAm?.gender,
      phone: profile.phone || profile.whoIAm?.phone || user?.phone || '',
      email: user?.email || '',
      expectedSalary: profile.monthlyInHandPreferred?.toString() || profile.whatIWant?.monthlyInHandPreferred?.toString() || profile.monthlySalary?.toString() || '1200000',
      totalExperience: profile.experienceMonths?.toString() || profile.whatIHave?.experienceMonths?.toString() || '0',
      location: {
        lat: 12.9716, // Default to Bangalore coordinates
        lng: 77.5946,
        address: profile.currentLocation || profile.whoIAm?.currentLocation || 'Bangalore',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India'
      },
      skills: profile.skills?.map(skill => ({ code: skill, name: skill })) || [
        { code: "UI", name: "UI Design" }
      ],
      languages: [
        { code: "en", name: "English" }
      ],
      profileId: selectedCandidate?.id, // Include the profile ID
      profileData: {
        whoIAm: profile.whoIAm || {},
        whatIHave: profile.whatIHave || {},
        whatIWant: profile.whatIWant || {},
        // Include all profile data for completeness
        ...profile
      }
    };
    
    await onSubmit(applicationData);
  };

  const canSubmit = () => {
    // Require name field but keep other fields optional
    const name = profile.name || profile.whoIAm?.name;
    return name?.trim() !== '';
  };

  const jobTitle = getJobTitle(job);
  const mappedRole = getRoleFromJobTitle(jobTitle);
  const unifiedSchema = getUnifiedSchema(mappedRole);

  // Show loading state while data is being loaded
  if (!isDataLoaded) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Loading Profile Data...
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <div className="text-sm text-muted-foreground">
                Loading your profile data...
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Check if we have a valid schema for this role
  if (!unifiedSchema) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Complete Your Profile for {jobTitle}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-600 mb-2">Schema not found for role: {mappedRole}</div>
              <div className="text-sm text-gray-600">
                Available roles: Industrial Tailor, Warehouse Loader & Picker, Recruitment Associate, Field Sales Executive, In Store Promoter
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 border-t pt-4">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onClose} 
                className="h-12 px-8 text-base"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Complete Your Profile for {jobTitle}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="whoIAm" className="text-base py-3">
                Who I Am
              </TabsTrigger>
              <TabsTrigger value="whatIHave" className="text-base py-3">
                What I Have
              </TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-y-auto">
              <TabsContent value="whoIAm" className="mt-0 h-full">
                <DynamicFormStep stepName="whoIAm" role={mappedRole} />
              </TabsContent>
              
              <TabsContent value="whatIHave" className="mt-0 h-full">
                <DynamicFormStep stepName="whatIHave" role={mappedRole} />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="flex-shrink-0 border-t pt-4">
          <div className="flex gap-3">
            <Button 
              onClick={handleSubmit} 
              className="flex-1 h-12 text-base font-medium"
              disabled={applying || !canSubmit()}
            >
              {applying ? 'Submitting...' : 'Submit Application'}
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="h-12 px-8 text-base"
              disabled={applying}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CandidateProfileApplication: React.FC<CandidateProfileApplicationProps> = (props) => {
  const { user, getSelectedCandidate } = useAuth();
  const selectedCandidate = getSelectedCandidate();
  
  // Helper function to map job title to role name
  const getRoleFromJobTitle = (jobTitle: string): string => {
    const lowerJobTitle = jobTitle.toLowerCase();
    
    // Map based on keywords in the job title
    if (lowerJobTitle.includes('tailor') || lowerJobTitle.includes('stitch') || lowerJobTitle.includes('garment')) {
      return 'Industrial Tailor';
    }
    if (lowerJobTitle.includes('warehouse') || lowerJobTitle.includes('loader') || lowerJobTitle.includes('picker') || lowerJobTitle.includes('logistics')) {
      return 'Warehouse Loader & Picker';
    }
    if (lowerJobTitle.includes('recruitment') || lowerJobTitle.includes('hr') || lowerJobTitle.includes('talent') || lowerJobTitle.includes('hiring')) {
      return 'Recruitment Associate';
    }
    if (lowerJobTitle.includes('sales') || lowerJobTitle.includes('field') || lowerJobTitle.includes('executive')) {
      return 'Field Sales Executive';
    }
    if (lowerJobTitle.includes('promoter') || lowerJobTitle.includes('store') || lowerJobTitle.includes('retail')) {
      return 'In Store Promoter';
    }
    
    // Default to Industrial Tailor if no match found
    return 'Industrial Tailor';
  };

  // Get job title from job object
  const getJobTitle = (job: any): string => {
    // Try to get title from descriptor.name first (BAP format)
    if (job.descriptor?.name) {
      return job.descriptor.name;
    }
    // Fallback to job.title
    if (job.title) {
      return job.title;
    }
    // Last fallback
    return 'Unknown Job';
  };

  // Transform existing profile data to unified schema format
  const transformProfileToUnifiedSchema = (existingProfile: any, mappedRole: string) => {
    const unifiedProfile = {
      interestedRole: mappedRole,
      whoIAm: {},
      whatIHave: {},
      whatIWant: {}
    } as any;

    // Transform WhoIAm data
    if (existingProfile) {
      unifiedProfile.whoIAm = {
        name: existingProfile.name || existingProfile.whoIAm?.name || '',
        dateOfBirth: existingProfile.dateOfBirth || existingProfile.whoIAm?.dateOfBirth,
        age: existingProfile.age || existingProfile.whoIAm?.age,
        gender: existingProfile.gender || existingProfile.whoIAm?.gender,
        hometown: existingProfile.hometown || existingProfile.whoIAm?.hometown,
        aadharNumber: existingProfile.aadharNumber || existingProfile.whoIAm?.aadharNumber,
        phone: existingProfile.phone || existingProfile.whoIAm?.phone || '',
        location: existingProfile.currentLocation || existingProfile.whoIAm?.currentLocation || existingProfile.whoIAm?.location || '',
        currentLocation: existingProfile.currentLocation || existingProfile.whoIAm?.currentLocation || '',
        desiredLocation: existingProfile.desiredLocation || existingProfile.whoIAm?.desiredLocation || '',
        isNameVerified: existingProfile.isNameVerified || existingProfile.whoIAm?.isNameVerified || false,
        isAgeVerified: existingProfile.isAgeVerified || existingProfile.whoIAm?.isAgeVerified || false
      };

      // Transform WhatIHave data
      unifiedProfile.whatIHave = {
        basicLiteracy: existingProfile.basicLiteracy || existingProfile.whatIHave?.basicLiteracy,
        skillProofVideo: existingProfile.skillProofVideo || existingProfile.whatIHave?.skillProofVideo,
        qualityProofImage: existingProfile.qualityProofImage || existingProfile.whatIHave?.qualityProofImage,
        hasWorkExperience: existingProfile.hasWorkExperience || existingProfile.whatIHave?.hasWorkExperience,
        previousCompany: existingProfile.previousCompany || existingProfile.whatIHave?.previousCompany,
        previousLocation: existingProfile.previousLocation || existingProfile.whatIHave?.previousLocation,
        experienceMonths: existingProfile.experienceMonths || existingProfile.whatIHave?.experienceMonths,
        machinesOperated: existingProfile.machinesOperated || existingProfile.whatIHave?.machinesOperated || []
      };

      // Transform WhatIWant data
      unifiedProfile.whatIWant = {
        salaryFrequency: existingProfile.salaryFrequency || existingProfile.whatIWant?.salaryFrequency,
        advanceMonthsAvailable: existingProfile.advanceMonthsAvailable || existingProfile.whatIWant?.advanceMonthsAvailable,
        advanceFrequency: existingProfile.advanceFrequency || existingProfile.whatIWant?.advanceFrequency,
        monthlySalary: existingProfile.monthlySalary || existingProfile.whatIWant?.monthlySalary,
        pfDeduction: existingProfile.pfDeduction || existingProfile.whatIWant?.pfDeduction,
        esicDeduction: existingProfile.esicDeduction || existingProfile.whatIWant?.esicDeduction,
        inHandSalary: existingProfile.inHandSalary || existingProfile.whatIWant?.inHandSalary,
        housingFacility: existingProfile.housingFacility || existingProfile.whatIWant?.housingFacility,
        foodFacility: existingProfile.foodFacility || existingProfile.whatIWant?.foodFacility,
        workHoursPerDay: existingProfile.workHoursPerDay || existingProfile.whatIWant?.workHoursPerDay,
        overtimeAvailable: existingProfile.overtimeAvailable || existingProfile.whatIWant?.overtimeAvailable,
        overtimePayMultiplier: existingProfile.overtimePayMultiplier || existingProfile.whatIWant?.overtimePayMultiplier,
        gradeUpgradation: existingProfile.gradeUpgradation || existingProfile.whatIWant?.gradeUpgradation,
        factoryTrustScore: existingProfile.factoryTrustScore || existingProfile.whatIWant?.factoryTrustScore
      };

      // Keep legacy fields for backward compatibility
      unifiedProfile.name = existingProfile.name || '';
      unifiedProfile.phone = existingProfile.phone || '';
      unifiedProfile.currentLocation = existingProfile.currentLocation || '';
      unifiedProfile.desiredLocation = existingProfile.desiredLocation || '';
      unifiedProfile.interestedIndustry = existingProfile.interestedIndustry || '';
      unifiedProfile.experience = existingProfile.experience || [];
      unifiedProfile.skills = existingProfile.skills || [];
      unifiedProfile.certificates = existingProfile.certificates || [];
      unifiedProfile.education = existingProfile.education || [];
      unifiedProfile.skillCertifications = existingProfile.skillCertifications || [];
      unifiedProfile.workExperience = existingProfile.workExperience || [];
      unifiedProfile.isNameVerified = existingProfile.isNameVerified || false;
      unifiedProfile.isAgeVerified = existingProfile.isAgeVerified || false;
    }

    return unifiedProfile;
  };
  
  // Get initial profile data
  const getInitialProfile = () => {
    const jobTitle = getJobTitle(props.job);
    const mappedRole = getRoleFromJobTitle(jobTitle);
    
    // Get existing profile data
    let existingProfile = null;
    if (user?.profile && 'age' in user.profile) {
      existingProfile = user.profile;
    } else if (selectedCandidate) {
      existingProfile = selectedCandidate;
    }

    // Transform existing profile to unified schema format
    const unifiedProfile = transformProfileToUnifiedSchema(existingProfile, mappedRole);
    return unifiedProfile;
  };

  // Create a unique key based on user and selectedCandidate to force re-render when data changes
  const profileKey = `${user?.id || 'no-user'}-${selectedCandidate?.id || 'no-candidate'}-${props.job?.id || 'no-job'}`;

  return (
    <ProfileFormProvider key={profileKey} initialProfile={getInitialProfile()}>
      <CandidateProfileApplicationContent {...props} />
    </ProfileFormProvider>
  );
};

export default CandidateProfileApplication; 