import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileForm, ProfileFormProvider } from '@/components/profile/ProfileFormProvider';
import WhoIAmStep from '@/components/profile/steps/WhoIAmStep';
import WhatIHaveStep from '@/components/profile/steps/WhatIHaveStep';
import { JobApplicationData } from '@/hooks/useJobApplication';
import jobRolesConfig from '@/schemas/job-roles-config.json';

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

  // Helper function to map job title to role name
  const getRoleFromJobTitle = (jobTitle: string): string => {
    const jobRoles = jobRolesConfig.jobRoles as any;
    
    // Try exact match first
    if (jobRoles[jobTitle]) {
      return jobTitle;
    }
    
    // Try case-insensitive match
    const lowerJobTitle = jobTitle.toLowerCase();
    for (const roleName in jobRoles) {
      if (roleName.toLowerCase() === lowerJobTitle) {
        return roleName;
      }
    }
    
    // Try partial match
    for (const roleName in jobRoles) {
      if (roleName.toLowerCase().includes(lowerJobTitle) || lowerJobTitle.includes(roleName.toLowerCase())) {
        return roleName;
      }
    }
    
    // Default to first role if no match found
    return Object.keys(jobRoles)[0] || 'Industrial Tailor';
  };

  // Initialize profile with existing data and set job role
  React.useEffect(() => {
    const mappedRole = getRoleFromJobTitle(job.title);
    console.log('Job title:', job.title, 'Mapped role:', mappedRole);
    if (user?.profile && 'age' in user.profile) {
      setProfile({ ...user.profile, interestedRole: mappedRole });
    } else if (selectedCandidate) {
      setProfile({ ...selectedCandidate, interestedRole: mappedRole });
    } else {
      setProfile(prev => ({ ...prev, interestedRole: mappedRole }));
    }
  }, [user, selectedCandidate, setProfile, job.title]);

  const handleSubmit = async () => {
    // Transform profile data to JobApplicationData format
    const applicationData: JobApplicationData = {
      name: profile.name || user?.name || '',
      age: profile.age?.toString(),
      gender: profile.gender,
      phone: profile.phone || user?.phone || '',
      email: user?.email || '',
      expectedSalary: profile.monthlySalary?.toString() || '1200000',
      totalExperience: profile.experienceMonths?.toString() || '0',
      location: {
        lat: 12.9716, // Default to Bangalore coordinates
        lng: 77.5946,
        address: profile.currentLocation || 'Bangalore',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India'
      },
      skills: profile.skills?.map(skill => ({ code: skill, name: skill })) || [
        { code: "UI", name: "UI Design" }
      ],
      languages: [
        { code: "en", name: "English" }
      ]
    };
    
    await onSubmit(applicationData);
  };

  const canSubmit = () => {
    // Require name field but keep other fields optional
    return profile.name?.trim() !== '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Complete Your Profile for {job.title}
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
                <WhoIAmStep />
              </TabsContent>
              
              <TabsContent value="whatIHave" className="mt-0 h-full">
                <WhatIHaveStep />
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
    const jobRoles = jobRolesConfig.jobRoles as any;
    
    // Try exact match first
    if (jobRoles[jobTitle]) {
      return jobTitle;
    }
    
    // Try case-insensitive match
    const lowerJobTitle = jobTitle.toLowerCase();
    for (const roleName in jobRoles) {
      if (roleName.toLowerCase() === lowerJobTitle) {
        return roleName;
      }
    }
    
    // Try partial match
    for (const roleName in jobRoles) {
      if (roleName.toLowerCase().includes(lowerJobTitle) || lowerJobTitle.includes(roleName.toLowerCase())) {
        return roleName;
      }
    }
    
    // Default to first role if no match found
    return Object.keys(jobRoles)[0] || 'Industrial Tailor';
  };
  
  // Get initial profile data
  const getInitialProfile = () => {
    const mappedRole = getRoleFromJobTitle(props.job.title);
    const baseProfile = {
      name: '',
      phone: '',
      currentLocation: '',
      desiredLocation: '',
      interestedRole: mappedRole,
      interestedIndustry: '',
      experience: [],
      skills: [],
      certificates: [],
      education: [],
      skillCertifications: [],
      workExperience: [],
      isNameVerified: false,
      isAgeVerified: false
    } as any;

    if (user?.profile && 'age' in user.profile) {
      return { ...user.profile, interestedRole: mappedRole };
    } else if (selectedCandidate) {
      return { ...selectedCandidate, interestedRole: mappedRole };
    }
    return baseProfile;
  };

  return (
    <ProfileFormProvider initialProfile={getInitialProfile()}>
      <CandidateProfileApplicationContent {...props} />
    </ProfileFormProvider>
  );
};

export default CandidateProfileApplication; 