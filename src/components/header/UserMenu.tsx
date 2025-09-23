import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User, LogOut, Building2, Users, FileText, Mail, Phone, Eye, Settings, Loader2, Plus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CandidateProfileDialog from '@/components/candidates/CandidateProfileDialog';
import ViewAllProfiles from '@/components/ViewAllProfiles';
import { apiClient, ProfileResponse, ProfilesResponse } from '@/lib/api';

interface UserMenuProps {
  onShowLogin: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ onShowLogin }) => {
  const navigate = useNavigate();
  const { orgSlug } = useParams<{ orgSlug?: string }>();
  const { user, logout, getSelectedCandidate, refreshProfileData, cleanupIncompleteProfiles, hasAdminRole, isLoading } = useAuth();
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
    navigate(`/${orgSlug || '0'}/provider`);
  };

  const handleManageCandidates = () => {
    navigate(`/${orgSlug || '0'}/seeker?tab=profiles`);
  };

  const handleMyApplications = () => {
    navigate(`/${orgSlug || '0'}/seeker?tab=applications`);
  };

  const handleViewAllProfiles = () => {
    setShowViewAllProfiles(true);
  };

  const handleAdminDashboard = () => {
    navigate(`/${orgSlug || '0'}/seeker?tab=admin`);
  };

  if (!user) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className="gap-2" 
        onClick={onShowLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <User className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">
          {isLoading ? 'Loading...' : 'Login'}
        </span>
      </Button>
    );
  }

  // Always show user name from session, fallback to email if no name
  const displayName = user.name || user.email || user.phone || 'User';
  
  // Debug logging to verify user data
  console.log('UserMenu - User object:', user);
  console.log('UserMenu - Email:', user.email);
  console.log('UserMenu - Phone:', user.phone);

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
          
          {/* Show Create Profile option when no profiles exist
          {user.managedCandidates.length === 0 && (
            <>
              <DropdownMenuItem 
                onClick={handleCompleteProfile}
                className="bg-primary/5 text-primary hover:bg-primary/10 font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )} */}
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
          
          {/* Admin Dashboard - Only show if user has admin role */}
          {hasAdminRole() && (
            <DropdownMenuItem onClick={handleAdminDashboard}>
              <Settings className="h-4 w-4 mr-2" />
              Admin Dashboard
            </DropdownMenuItem>
          )}
          
          {/* <DropdownMenuItem onClick={() => {}}>
            Account Settings
          </DropdownMenuItem> */}
          <DropdownMenuItem onClick={logout} disabled={isLoading}>
            <LogOut className="h-4 w-4 mr-2" />
            {isLoading ? 'Logging out...' : 'Logout'}
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
          forceBackendSync={true}
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
