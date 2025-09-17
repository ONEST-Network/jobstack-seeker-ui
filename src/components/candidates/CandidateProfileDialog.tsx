
import React from 'react';
import { useAuth, CandidateProfile } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

import UserProfileDialog from '@/components/profile/UserProfileDialog';
import { apiClient, ProfilesResponse } from '@/lib/api';

interface CandidateProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  candidateId?: string;
  isUpdate?: boolean;
  profileId?: string;
  preSelectedRole?: string;
  onProfileCreated?: (profile: CandidateProfile) => void; // Callback when profile is successfully created
  preventReload?: boolean; // Prevent page reload after profile creation (for apply now flow)
}

const CandidateProfileDialog: React.FC<CandidateProfileDialogProps> = ({
  isOpen,
  onClose,
  mode,
  candidateId,
  isUpdate,
  profileId,
  preSelectedRole,
  onProfileCreated,
  preventReload = false
}) => {
  const { user, addCandidate, updateCandidate, getSelectedCandidate, refreshProfileData, selectCandidate } = useAuth();
  const { toast } = useToast();


  const existingCandidate = candidateId 
    ? user?.managedCandidates.find(c => c.id === candidateId)
    : mode === 'edit' ? getSelectedCandidate() : null;

  const handleProfileComplete = async (profileData: Record<string, unknown>) => {
    console.log('CandidateProfileDialog: handleProfileComplete called, mode =', mode, 'preventReload =', preventReload);
    
    // Validate that we have the minimum required data before creating a profile
    // The profileData is already flattened by UserProfileDialog, so check flat fields
    
    // Check each required field and collect validation errors
    const validationErrors: string[] = [];
    
    // Check flat fields (already extracted from nested structure by UserProfileDialog)
    if (!profileData.name?.toString()?.trim()) {
      validationErrors.push("Full name");
    }
    
    if (!profileData.interestedRole?.toString()?.trim()) {
      validationErrors.push("Job role");
    }
    
    if (!profileData.phone?.toString()?.trim()) {
      validationErrors.push("Phone number");
    }
    
    if (!profileData.currentLocation?.toString()?.trim()) {
      validationErrors.push("Location");
    }
    
    // If there are validation errors, show them and stop
    if (validationErrors.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please complete the following fields: ${validationErrors.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    const candidateData: Omit<CandidateProfile, 'id' | 'createdAt'> = {
      name: (profileData.name as string) || 'New Profile',
      age: profileData.age as number,
      isNameVerified: (profileData.isNameVerified as boolean) || false,
      isAgeVerified: (profileData.isAgeVerified as boolean) || false,
      currentLocation: (profileData.currentLocation as string) || '',
      desiredLocation: (profileData.desiredLocation as string) || '',
      interestedRole: profileData.interestedRole as string,
      interestedIndustry: profileData.interestedIndustry as string,
      experience: (Array.isArray(profileData.experience) ? profileData.experience : []) as CandidateProfile['experience'],
      skills: (profileData.skills as string[]) || [],
      certificates: (Array.isArray(profileData.certificates) ? profileData.certificates : []) as CandidateProfile['certificates'],
      assessmentScores: (Array.isArray(profileData.assessmentScores) ? profileData.assessmentScores : []) as CandidateProfile['assessmentScores'],
      documentVerificationStatus: (Array.isArray(profileData.documentVerificationStatus) ? profileData.documentVerificationStatus : []) as CandidateProfile['documentVerificationStatus'],
      isActive: true,
      nickname: (profileData.nickname as string) || `${(profileData.interestedRole as string) || 'Profile'} - ${new Date().toLocaleDateString()}`,
      // Unified schema data
      whoIAm: profileData.whoIAm as Record<string, unknown>,
      whatIHave: profileData.whatIHave as Record<string, unknown>,
      whatIWant: profileData.whatIWant as Record<string, unknown>,
      // Verification status
      isGenderVerified: (profileData.isGenderVerified as boolean) || false,
      isAadharVerified: (profileData.isAadharVerified as boolean) || false,
      isHometownVerified: (profileData.isHometownVerified as boolean) || false,
      // Education and certifications
      education: (Array.isArray(profileData.education) ? profileData.education : []) as CandidateProfile['education'],
      skillCertifications: (Array.isArray(profileData.skillCertifications) ? profileData.skillCertifications : []) as CandidateProfile['skillCertifications'],
      workExperience: (Array.isArray(profileData.workExperience) ? profileData.workExperience : []) as CandidateProfile['workExperience'],
    };

    if (mode === 'add') {
      // Add the candidate and automatically select it
      const newProfile = addCandidate(candidateData, true); // Auto-select the new profile
      
      if (newProfile) {
        toast({
          title: "Profile Created",
          description: "New candidate profile has been created successfully."
        });
        
        // Refresh profile data to sync with API, but ensure our new profile stays selected
        try {
          await refreshProfileData();
          
          // After refresh, re-select our newly created profile to ensure it remains active
          // This handles the case where API might not yet have the new profile or returns different order
          selectCandidate(newProfile.id);
          console.log('CandidateProfileDialog: Profile data refreshed and new profile re-selected:', newProfile.id);
        } catch (error) {
          console.log('CandidateProfileDialog: Profile refresh error (non-critical):', error);
        }
        
        // Call the callback if provided (for apply now flow) - IMPORTANT: Call this BEFORE closing dialogs
        if (onProfileCreated) {
          console.log('CandidateProfileDialog: Calling onProfileCreated callback for apply now flow');
          onProfileCreated(newProfile);
        }
        
        // Close the dialog after callback
        onClose();
        
        // The profile is already activated and refreshed
        console.log('CandidateProfileDialog: Profile created, activated, and refreshed successfully - Name:', newProfile.name, 'ID:', newProfile.id);
        
        if (!preventReload) {
          console.log('CandidateProfileDialog: Initiating automated page reload in 300ms for immediate profile activation');
          // Faster reload for better user experience - profile becomes active immediately
          setTimeout(() => {
            console.log('CandidateProfileDialog: Executing automated page reload - new profile will be active after reload');
            window.location.reload();
          }, 300); // Faster reload for better UX
        } else {
          console.log('CandidateProfileDialog: Automated reload disabled (preventReload=true)');
        }
        
        return;
      } else {
        toast({
          title: "Profile Creation Failed",
          description: "Failed to create profile. Please check all required fields.",
          variant: "destructive"
        });
        return;
      }
    } else if (mode === 'edit') {
      const candidateToUpdate = candidateId || existingCandidate?.id;
      if (candidateToUpdate) {
        updateCandidate(candidateToUpdate, candidateData);
        
        // Auto sync disabled - users can manually sync drafts using the sync button
        
        toast({
          title: "Profile Updated",
          description: "Candidate profile has been updated successfully."
        });
        
        // Conditionally refresh the page after successful profile update
        if (!preventReload) {
          setTimeout(() => {
            window.location.reload();
          }, 1000); // Small delay to show the success toast
        }
      }
    }

    // Refresh profile data to ensure UI updates
    refreshProfileData();

    onClose();
  };

  // Convert candidate profile to user profile format for the dialog
  const getInitialProfile = () => {
    // Only return initial profile data for edit mode
    if (mode === 'edit' && existingCandidate) {
      // Ensure we preserve all file URLs and other data properly
      const initialProfile = {
        name: existingCandidate.name,
        age: existingCandidate.age,
        isNameVerified: existingCandidate.isNameVerified,
        isAgeVerified: existingCandidate.isAgeVerified,
        currentLocation: existingCandidate.currentLocation,
        desiredLocation: existingCandidate.desiredLocation,
        interestedRole: existingCandidate.interestedRole,
        interestedIndustry: existingCandidate.interestedIndustry,
        experience: existingCandidate.experience,
        skills: existingCandidate.skills,
        certificates: existingCandidate.certificates,
        assessmentScores: existingCandidate.assessmentScores,
        documentVerificationStatus: existingCandidate.documentVerificationStatus,
        nickname: existingCandidate.nickname,
        // Unified schema data - preserve all nested data including file URLs
        whoIAm: existingCandidate.whoIAm || {},
        whatIHave: existingCandidate.whatIHave || {},
        whatIWant: existingCandidate.whatIWant || {},
        // Verification status
        isGenderVerified: existingCandidate.isGenderVerified,
        isAadharVerified: existingCandidate.isAadharVerified,
        isHometownVerified: existingCandidate.isHometownVerified,
        // Education and certifications
        education: existingCandidate.education,
        skillCertifications: existingCandidate.skillCertifications,
        workExperience: existingCandidate.workExperience,
      };

      return initialProfile;
    }
    
    // For new profiles (mode === 'add'), return undefined to start fresh
    return undefined;
  };

  // Get the current user to access the profileId
  const { user: currentUser } = useAuth();
  
  // For update mode, we need to get the profile ID from the API
  const [currentProfileId, setCurrentProfileId] = React.useState<string | undefined>(profileId);
  
  React.useEffect(() => {
    const getProfileId = async () => {
      if (isUpdate && !profileId) {
        try {
          const profilesResponse = await apiClient.getProfiles() as ProfilesResponse;
          if (profilesResponse?.data && profilesResponse.data.length > 0) {
            const mostRecentProfile = profilesResponse.data[0];
            setCurrentProfileId(mostRecentProfile.id);
          }
        } catch (error) {
          // Silently handle profile ID errors
        }
      } else {
        // For edit mode with a specific candidate, use the candidateId as the profileId
        // since the candidate ID is actually the profile ID from the backend
        const effectiveProfileId = mode === 'edit' && candidateId ? candidateId : (profileId || currentUser?.profileId);
        setCurrentProfileId(effectiveProfileId);
      }
    };
    
    getProfileId();
  }, [isUpdate, profileId, currentUser?.profileId, mode, candidateId]);
  
  return (
    <UserProfileDialog
      isOpen={isOpen}
      onClose={onClose}
      onComplete={isUpdate ? undefined : handleProfileComplete} // Don't use onComplete for updates, let UserProfileDialog handle API call
      mode="candidate"
      initialProfile={getInitialProfile()}
      isUpdate={isUpdate}
      profileId={currentProfileId}
      preSelectedRole={preSelectedRole}
      preventReload={preventReload} // Only prevent reload when explicitly requested
    />
  );
};

export default CandidateProfileDialog;
