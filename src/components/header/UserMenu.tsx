import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User, LogOut, Building2, Users, FileText } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CandidateProfileDialog from '@/components/candidates/CandidateProfileDialog';

interface UserMenuProps {
  onShowLogin: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ onShowLogin }) => {
  const navigate = useNavigate();
  const { user, logout, getSelectedCandidate } = useAuth();
  const selectedCandidate = getSelectedCandidate();
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);

  const handleCompleteProfile = () => {
    if (user?.role === 'individual') {
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

  if (!user) {
    return (
      <Button variant="ghost" size="sm" className="gap-2" onClick={onShowLogin}>
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">Login</span>
      </Button>
    );
  }

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
          {(!user.profile || !user.profile.name) && (
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
              <DropdownMenuItem onClick={handleManageCandidates}>
                <Users className="h-4 w-4 mr-2" />
                Manage Profiles
              </DropdownMenuItem>
            </>
          )}
          {user.role === 'organization' && (
            <DropdownMenuItem onClick={handleManageEmployers}>
              <Building2 className="h-4 w-4 mr-2" />
              Manage Employers
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => {}}>
            Account Settings
          </DropdownMenuItem>
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
          mode="add"
        />
      )}
    </>
  );
};

export default UserMenu;
