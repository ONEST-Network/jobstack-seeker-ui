
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import CandidateSelector from '@/components/candidates/CandidateSelector';
import Logo from './Logo';
import LanguageSelector from './LanguageSelector';
import UserMenu from './UserMenu';
import HeaderDialogs from './HeaderDialogs';
import UnifiedAuthDialog from '@/components/auth/UnifiedAuthDialog';

const Header = () => {
  const [showUnifiedAuth, setShowUnifiedAuth] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showOrgProfile, setShowOrgProfile] = useState(false);
  const [showCandidateDialog, setShowCandidateDialog] = useState(false);
  
  const { user } = useAuth();
  const location = useLocation();

  const handleProfileComplete = () => {
    if (user?.role === 'individual') {
      setShowUserProfile(true);
    } else if (user?.role === 'organization') {
      setShowOrgProfile(true);
    }
  };

  const handleShowAuth = () => {
    setShowUnifiedAuth(true);
  };

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Logo />

          {/* Right Section */}
          <div className="flex items-center gap-1 sm:gap-3">
            {/* Candidate Selector - For individual users */}
            {user?.role === 'individual' && user.managedCandidates.length > 0 && (
              <CandidateSelector onAddCandidate={() => setShowCandidateDialog(true)} />
            )}

            <LanguageSelector />

            {/* Location - Hidden on mobile */}
            {/* <Button variant="ghost" size="sm" className="gap-2 hidden sm:flex">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Mumbai</span>
            </Button> */}


            <UserMenu onShowLogin={handleShowAuth} />
          </div>
        </div>
      </div>

      {/* Unified Auth Dialog */}
      <UnifiedAuthDialog
        isOpen={showUnifiedAuth}
        onClose={() => setShowUnifiedAuth(false)}
        defaultRole="individual"
      />

      <HeaderDialogs
        showLogin={false}
        showRegister={false}
        showUserProfile={showUserProfile}
        showOrgProfile={showOrgProfile}
        showCandidateDialog={showCandidateDialog}
        onCloseLogin={() => {}}
        onCloseRegister={() => {}}
        onCloseUserProfile={() => setShowUserProfile(false)}
        onCloseOrgProfile={() => setShowOrgProfile(false)}
        onCloseCandidateDialog={() => setShowCandidateDialog(false)}
        onSwitchToRegister={() => {}}
        currentPath={location.pathname}
      />
    </header>
  );
};

export default Header;
