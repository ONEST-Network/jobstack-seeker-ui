import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User, LogOut, Building2, Users, FileText } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CandidateProfileDialog from '@/components/candidates/CandidateProfileDialog';
import { apiClient, ProfileResponse, ProfilesResponse } from '@/lib/api';

interface UserMenuProps {
  onShowLogin: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ onShowLogin }) => {
  const navigate = useNavigate();
  const { user, logout, getSelectedCandidate, refreshProfileData } = useAuth();
  const selectedCandidate = getSelectedCandidate();
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [profileMode, setProfileMode] = useState<'add' | 'edit'>('add');

  const handleCompleteProfile = () => {
    if (user?.role === 'individual') {
      setProfileMode('add');
      setShowCompleteProfile(true);
    } else if (user?.role === 'organization') {
      // This will be handled by parent component
    }
  };

  const handleUpdateProfile = async () => {
    if (user?.role === 'individual') {
      // Get all profiles for the user to find the most recent one
      try {
        const profilesResponse = await apiClient.getProfiles() as ProfilesResponse;
        
        if (profilesResponse?.data && profilesResponse.data.length > 0) {
          // Get the most recent profile (first in the array based on your API response)
          const mostRecentProfile = profilesResponse.data[0];
          const profileId = mostRecentProfile.id;
          const profileName = mostRecentProfile.metadata?.name;
          
          if (profileId) {
            // Refresh profile data to update the user state
            await refreshProfileData();
            setProfileMode('edit');
            setShowCompleteProfile(true);
          } else {
            setProfileMode('add');
            setShowCompleteProfile(true);
          }
        } else {
          setProfileMode('add');
          setShowCompleteProfile(true);
        }
      } catch (error) {
        console.log('Error getting profiles data:', error);
        // Still try to open the dialog even if API call fails
        setProfileMode('edit');
        setShowCompleteProfile(true);
      }
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

  if (!user) {
    return (
      <Button variant="ghost" size="sm" className="gap-2" onClick={onShowLogin}>
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">Login</span>
      </Button>
    );
  }

  const hasProfileName =
    (selectedCandidate && selectedCandidate.name) ||
    (user.profile && user.profile.name);



  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">
              {selectedCandidate?.name || user.profile?.name || user.email || user.phone}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!hasProfileName ? (
            <DropdownMenuItem onClick={handleCompleteProfile}>
              Complete Profile
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleUpdateProfile}>
              <Users className="h-4 w-4 mr-2" />
              Update Profile
            </DropdownMenuItem>
          )}
          {(user.role === 'individual' || !user.role) && (
            <>
              <DropdownMenuItem onClick={handleMyApplications}>
                <FileText className="h-4 w-4 mr-2" />
                My Applications
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
    </>
  );
};

export default UserMenu;
