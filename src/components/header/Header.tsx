
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MapPin, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import CandidateSelector from '@/components/candidates/CandidateSelector';
import OrgLogo from './OrgLogo';
import LanguageSelector from './LanguageSelector';
import UserMenu from './UserMenu';
import HeaderDialogs from './HeaderDialogs';
import UnifiedAuthDialog from '@/components/auth/UnifiedAuthDialog';

interface HeaderProps {
  orgSlug?: string | null;
}

const Header: React.FC<HeaderProps> = ({ orgSlug }) => {
  const [showUnifiedAuth, setShowUnifiedAuth] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showOrgProfile, setShowOrgProfile] = useState(false);
  const [showCandidateDialog, setShowCandidateDialog] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Reset auth modal state when user changes (login/logout)
  useEffect(() => {
    if (!user) {
      setShowUnifiedAuth(false);
    }
  }, [user]);

  // Cleanup effect to reset modal state
  useEffect(() => {
    return () => {
      setShowUnifiedAuth(false);
      setShowUserProfile(false);
      setShowOrgProfile(false);
      setShowCandidateDialog(false);
    };
  }, []);

  const handleProfileComplete = () => {
    if (user?.role === 'individual') {
      setShowUserProfile(true);
    } else if (user?.role === 'organization') {
      setShowOrgProfile(true);
    }
  };

  const handleCandidateCreated = () => {
    // Close the dialog first
    setShowCandidateDialog(false);
    
    // Force a re-render after a small delay to ensure the context has updated
    setTimeout(() => {
      setForceUpdate(prev => prev + 1);
    }, 50);
  };

  const handleShowAuth = () => {
    // Prevent opening auth modal if still loading from logout
    if (isLoading) return;
    
    // Ensure modal state is clean before opening
    setShowUnifiedAuth(false);
    
    // Use setTimeout to ensure state is properly reset before opening
    setTimeout(() => {
      setShowUnifiedAuth(true);
    }, 10);
  };

  const handleCloseAuth = () => {
    setShowUnifiedAuth(false);
  };

  return (
    <header className="bg-gray-50/90 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <OrgLogo orgSlug={orgSlug} />

          {/* Right Section */}
          <div className="flex items-center gap-1 sm:gap-3">
            {/* Candidate Selector - For individual users with profiles */}
            {user?.role === 'individual' && user.managedCandidates.length > 0 && (
              <CandidateSelector onAddCandidate={() => setShowCandidateDialog(true)} />
            )}
            
            {/* Create Profile Button - For individual users without profiles */}
            {user?.role === 'individual' && user.managedCandidates.length === 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowCandidateDialog(true)}
                className="gap-2 bg-primary/10 border-primary/30 hover:bg-primary/20 text-primary hover:text-primary font-medium shadow-sm"
                title="Create your first profile to start applying for jobs"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create Profile</span>
                <span className="sm:hidden">Create</span>
              </Button>
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
        onClose={handleCloseAuth}
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
        onCandidateCreated={handleCandidateCreated}
      />
    </header>
  );
};

export default Header;
