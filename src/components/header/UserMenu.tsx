import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User, LogOut, Building2, Users, FileText, Mail, Phone, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CandidateProfileDialog from '@/components/candidates/CandidateProfileDialog';
import ViewAllProfiles from '@/components/ViewAllProfiles';
import { apiClient, ProfileResponse, ProfilesResponse } from '@/lib/api';

interface UserMenuProps {
  onShowLogin: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ onShowLogin }) => {
  const navigate = useNavigate();
  const { user, logout, getSelectedCandidate, refreshProfileData, cleanupIncompleteProfiles } = useAuth();
  const selectedCandidate = getSelectedCandidate();
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [showViewAllProfiles, setShowViewAllProfiles] = useState(false);
  const [profileMode, setProfileMode] = useState<'add' | 'edit'>('add');

  // Clean up incomplete profiles when component mounts
  React.useEffect(() => {
    if (user) {
      cleanupIncompleteProfiles();
    }
  }, [user, cleanupIncompleteProfiles]);

  const handleCompleteProfile = () => {
    if (user?.role === 'individual') {
      setProfileMode('add');
      setShowCompleteProfile(true);
    } else if (user?.role === 'organization') {
      // This will be handled by parent component
    }
  };

  const handleManageEmployers = () => {
    navigate('/provider');
  };

  const handleManageCandidates = () => {
    navigate('/seeker?tab=profiles');
  };

  const handleMyApplications = () => {
    navigate('/seeker?tab=applications');
  };

  const handleViewAllProfiles = () => {
    setShowViewAllProfiles(true);
  };

  if (!user) {
    return (
      <Button variant="ghost" size="sm" className="gap-2" onClick={onShowLogin}>
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">Login</span>
      </Button>
    );
  }

  // Always show user name from session, fallback to email if no name
  const displayName = user.name || user.email || user.phone || 'User';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">
              {displayName}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* User Contact Information */}
          {user.email && (
            <DropdownMenuItem className="pointer-events-none cursor-default">
              <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{user.email}</span>
            </DropdownMenuItem>
          )}
          {user.phone && (
            <DropdownMenuItem className="pointer-events-none cursor-default">
              <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{user.phone}</span>
            </DropdownMenuItem>
          )}
          
          {/* Separator between contact info and menu items */}
          {(user.email || user.phone) && <DropdownMenuSeparator />}
          
          {/* Only show Complete Profile if user has no profile data */}
          {!user.profile && user.managedCandidates.length === 0 && (
            <DropdownMenuItem onClick={handleCompleteProfile}>
              Complete Profile
            </DropdownMenuItem>
          )}
          {(user.role === 'individual' || !user.role) && (
            <>
              <DropdownMenuItem onClick={handleMyApplications}>
                <FileText className="h-4 w-4 mr-2" />
                My Applications
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleViewAllProfiles}>
                <Eye className="h-4 w-4 mr-2" />
                View All Profiles
              </DropdownMenuItem>
            </>
          )}
          {user.role === 'organization' && (
            <DropdownMenuItem onClick={handleManageEmployers}>
              <Building2 className="h-4 w-4 mr-2" />
              Manage Employers
            </DropdownMenuItem>
          )}
          {/* <DropdownMenuItem onClick={() => {}}>
            Account Settings
          </DropdownMenuItem> */}
          <DropdownMenuItem onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Complete Profile Dialog for Individual Users */}
      {user?.role === 'individual' && (
        <CandidateProfileDialog
          isOpen={showCompleteProfile}
          onClose={() => setShowCompleteProfile(false)}
          mode={profileMode}
          isUpdate={profileMode === 'edit'}
          profileId={user.profileId}
        />
      )}

      {/* View All Profiles Dialog */}
      <ViewAllProfiles
        isOpen={showViewAllProfiles}
        onClose={() => setShowViewAllProfiles(false)}
      />
    </>
  );
};

export default UserMenu;
