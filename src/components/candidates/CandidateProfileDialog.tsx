
import React from 'react';
import { useAuth, CandidateProfile } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useDraftProfileSync } from '@/hooks/useDraftProfileSync';
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
}

const CandidateProfileDialog: React.FC<CandidateProfileDialogProps> = ({
  isOpen,
  onClose,
  mode,
  candidateId,
  isUpdate,
  profileId,
  preSelectedRole
}) => {
  const { user, addCandidate, updateCandidate, getSelectedCandidate, refreshProfileData } = useAuth();
  const { toast } = useToast();
  const { updateAllDraftsWithProfile } = useDraftProfileSync();

  const existingCandidate = candidateId 
    ? user?.managedCandidates.find(c => c.id === candidateId)
    : mode === 'edit' ? getSelectedCandidate() : null;

  const handleProfileComplete = (profileData: Record<string, unknown>) => {
    // Validate that we have the minimum required data before creating a profile
    const whoIAm = profileData.whoIAm as Record<string, unknown> | undefined;
    const hasRequiredData = profileData.name?.toString()?.trim() && 
                           profileData.interestedRole?.toString()?.trim() && 
                           (profileData.currentLocation?.toString()?.trim() || whoIAm?.location?.toString()?.trim()) &&
                           (profileData.phone?.toString()?.trim() || whoIAm?.phone?.toString()?.trim());

    if (!hasRequiredData) {
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
        
        // Update all drafts with the new profile data
        try {
          updateAllDraftsWithProfile(profileData).catch(error => {
            // Silently handle draft sync errors - not critical for profile save
          });
        } catch (error) {
          // Silently handle draft sync errors - not critical for profile save
        }
        
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
    />
  );
};

export default CandidateProfileDialog;
