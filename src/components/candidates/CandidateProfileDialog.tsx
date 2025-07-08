
import React from 'react';
import { useAuth, CandidateProfile } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import UserProfileDialog from '@/components/profile/UserProfileDialog';

interface CandidateProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  candidateId?: string;
}

const CandidateProfileDialog: React.FC<CandidateProfileDialogProps> = ({
  isOpen,
  onClose,
  mode,
  candidateId
}) => {
  const { user, addCandidate, updateCandidate } = useAuth();
  const { toast } = useToast();

  const existingCandidate = candidateId 
    ? user?.managedCandidates.find(c => c.id === candidateId)
    : null;

  const handleProfileComplete = (profileData: any) => {
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
      nickname: profileData.nickname || `${profileData.interestedRole || 'Profile'} - ${new Date().toLocaleDateString()}`
    };

    if (mode === 'add') {
      addCandidate(candidateData);
      toast({
        title: "Profile Created",
        description: "New candidate profile has been created successfully."
      });
    } else if (candidateId) {
      updateCandidate(candidateId, candidateData);
      toast({
        title: "Profile Updated",
        description: "Candidate profile has been updated successfully."
      });
    }

    onClose();
  };

  // Convert candidate profile to user profile format for the dialog
  const getInitialProfile = () => {
    if (!existingCandidate) return undefined;
    
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
      nickname: existingCandidate.nickname
    };
  };

  return (
    <UserProfileDialog
      isOpen={isOpen}
      onClose={onClose}
      onComplete={handleProfileComplete}
      mode="candidate"
      initialProfile={getInitialProfile()}
    />
  );
};

export default CandidateProfileDialog;
