
import React from 'react';
import LoginDialog from '@/components/auth/LoginDialog';
import RegistrationDialog from '@/components/auth/RegistrationDialog';
import UserProfileDialog from '@/components/profile/UserProfileDialog';
import OrganizationProfileDialog from '@/components/profile/OrganizationProfileDialog';
import CandidateProfileDialog from '@/components/candidates/CandidateProfileDialog';

interface HeaderDialogsProps {
  showLogin: boolean;
  showRegister: boolean;
  showUserProfile: boolean;
  showOrgProfile: boolean;
  showCandidateDialog: boolean;
  onCloseLogin: () => void;
  onCloseRegister: () => void;
  onCloseUserProfile: () => void;
  onCloseOrgProfile: () => void;
  onCloseCandidateDialog: () => void;
  onSwitchToRegister: () => void;
  currentPath: string;
  onCandidateCreated?: () => void;
}

const HeaderDialogs: React.FC<HeaderDialogsProps> = ({
  showLogin,
  showRegister,
  showUserProfile,
  showOrgProfile,
  showCandidateDialog,
  onCloseLogin,
  onCloseRegister,
  onCloseUserProfile,
  onCloseOrgProfile,
  onCloseCandidateDialog,
  onSwitchToRegister,
  currentPath,
  onCandidateCreated
}) => {
  // Determine default role based on path
  const getDefaultRole = (): 'individual' | 'organization' => {
    // Disabled organization registration - always return individual
    return 'individual';
  };

  // Create a combined handler for when a candidate is created
  const handleCandidateCreated = (profile: any) => {
    if (onCandidateCreated) {
      onCandidateCreated();
    }
  };

  return (
    <>
      <LoginDialog
        isOpen={showLogin}
        onClose={onCloseLogin}
        onSwitchToRegister={onSwitchToRegister}
        defaultRole={getDefaultRole()}
      />
      
      <RegistrationDialog
        isOpen={showRegister}
        onClose={onCloseRegister}
        defaultRole={getDefaultRole()}
      />
      
      <UserProfileDialog
        isOpen={showUserProfile}
        onClose={onCloseUserProfile}
      />
      
      <OrganizationProfileDialog
        isOpen={showOrgProfile}
        onClose={onCloseOrgProfile}
      />

      <CandidateProfileDialog
        isOpen={showCandidateDialog}
        onClose={onCloseCandidateDialog}
        mode="add"
        preventReload={true}
        onProfileCreated={handleCandidateCreated}
      />
    </>
  );
};

export default HeaderDialogs;
