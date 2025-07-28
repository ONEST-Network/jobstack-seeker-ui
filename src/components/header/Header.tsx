
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

const Header = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
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

  const handleSwitchToRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
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


            <UserMenu onShowLogin={() => setShowLogin(true)} />
          </div>
        </div>
      </div>

      <HeaderDialogs
        showLogin={showLogin}
        showRegister={showRegister}
        showUserProfile={showUserProfile}
        showOrgProfile={showOrgProfile}
        showCandidateDialog={showCandidateDialog}
        onCloseLogin={() => setShowLogin(false)}
        onCloseRegister={() => setShowRegister(false)}
        onCloseUserProfile={() => setShowUserProfile(false)}
        onCloseOrgProfile={() => setShowOrgProfile(false)}
        onCloseCandidateDialog={() => setShowCandidateDialog(false)}
        onSwitchToRegister={handleSwitchToRegister}
        currentPath={location.pathname}
      />
    </header>
  );
};

export default Header;
