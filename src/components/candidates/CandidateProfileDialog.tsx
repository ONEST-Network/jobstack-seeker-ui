
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
}

const CandidateProfileDialog: React.FC<CandidateProfileDialogProps> = ({
  isOpen,
  onClose,
  mode,
  candidateId,
  isUpdate,
  profileId
}) => {
  const { user, addCandidate, updateCandidate, getSelectedCandidate, refreshProfileData } = useAuth();
  const { toast } = useToast();

  const existingCandidate = candidateId 
    ? user?.managedCandidates.find(c => c.id === candidateId)
    : mode === 'edit' ? getSelectedCandidate() : null;

  const handleProfileComplete = (profileData: any) => {
    // Validate that we have the minimum required data before creating a profile
    const hasRequiredData = profileData.name?.trim() && 
                           profileData.interestedRole?.trim() && 
                           (profileData.currentLocation?.trim() || profileData.whoIAm?.location?.trim()) &&
                           (profileData.phone?.trim() || profileData.whoIAm?.phone?.trim());

    if (!hasRequiredData) {
      console.log('Incomplete profile data, not creating profile:', profileData);
      onClose();
      return;
    }

    const candidateData: Omit<CandidateProfile, 'id' | 'createdAt'> = {
      name: profileData.name || 'New Profile',
      age: profileData.age,
      isNameVerified: profileData.isNameVerified || false,
      isAgeVerified: profileData.isAgeVerified || false,
      currentLocation: profileData.currentLocation || '',
      desiredLocation: profileData.desiredLocation || '',
      interestedRole: profileData.interestedRole,
      interestedIndustry: profileData.interestedIndustry,
      experience: profileData.experience || [],
      skills: profileData.skills || [],
      certificates: profileData.certificates || [],
      assessmentScores: profileData.assessmentScores,
      documentVerificationStatus: profileData.documentVerificationStatus,
      isActive: true,
      nickname: profileData.nickname || `${profileData.interestedRole || 'Profile'} - ${new Date().toLocaleDateString()}`,
      // Unified schema data
      whoIAm: profileData.whoIAm,
      whatIHave: profileData.whatIHave,
      whatIWant: profileData.whatIWant,
      // Verification status
      isGenderVerified: profileData.isGenderVerified || false,
      isAadharVerified: profileData.isAadharVerified || false,
      isHometownVerified: profileData.isHometownVerified || false,
      // Education and certifications
      education: profileData.education || [],
      skillCertifications: profileData.skillCertifications || [],
      workExperience: profileData.workExperience || [],
    };

    if (mode === 'add') {
      addCandidate(candidateData);
      toast({
        title: "Profile Created",
        description: "New candidate profile has been created successfully."
      });
      
      // Refresh the page after successful profile creation to update the UI
      setTimeout(() => {
        window.location.reload();
      }, 1000); // Small delay to show the success toast
    } else if (mode === 'edit') {
      const candidateToUpdate = candidateId || existingCandidate?.id;
      if (candidateToUpdate) {
        updateCandidate(candidateToUpdate, candidateData);
        toast({
          title: "Profile Updated",
          description: "Candidate profile has been updated successfully."
        });
        
        // Refresh the page after successful profile update to update the UI
        setTimeout(() => {
          window.location.reload();
        }, 1000); // Small delay to show the success toast
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
      return {
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
        // Unified schema data
        whoIAm: existingCandidate.whoIAm,
        whatIHave: existingCandidate.whatIHave,
        whatIWant: existingCandidate.whatIWant,
        // Verification status
        isGenderVerified: existingCandidate.isGenderVerified,
        isAadharVerified: existingCandidate.isAadharVerified,
        isHometownVerified: existingCandidate.isHometownVerified,
        // Education and certifications
        education: existingCandidate.education,
        skillCertifications: existingCandidate.skillCertifications,
        workExperience: existingCandidate.workExperience,
      };
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
          console.log('Error getting profile ID:', error);
        }
      } else {
        setCurrentProfileId(profileId || currentUser?.profileId);
      }
    };
    
    getProfileId();
  }, [isUpdate, profileId, currentUser?.profileId]);
  
  return (
    <UserProfileDialog
      isOpen={isOpen}
      onClose={onClose}
      onComplete={isUpdate ? undefined : handleProfileComplete} // Don't use onComplete for updates, let UserProfileDialog handle API call
      mode="candidate"
      initialProfile={getInitialProfile()}
      isUpdate={isUpdate}
      profileId={currentProfileId}
    />
  );
};

export default CandidateProfileDialog;
