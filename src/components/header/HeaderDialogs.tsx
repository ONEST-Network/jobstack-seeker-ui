
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
  currentPath
}) => {
  // Determine default role based on path
  const getDefaultRole = (): 'individual' | 'organization' => {
    if (currentPath.startsWith('/seeker')) {
      return 'individual';
    } else if (currentPath.startsWith('/provider')) {
      return 'organization';
    }
    return 'individual'; // default fallback
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
      />
    </>
  );
};

export default HeaderDialogs;
