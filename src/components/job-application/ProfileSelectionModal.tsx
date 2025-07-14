import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Plus, User, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import CandidateProfileDialog from '@/components/candidates/CandidateProfileDialog';

interface ProfileSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileSelected: (profile: any) => void;
  job: any;
}

const ProfileSelectionModal: React.FC<ProfileSelectionModalProps> = ({
  isOpen,
  onClose,
  onProfileSelected,
  job
}) => {
  const { user, selectCandidate, getSelectedCandidate, refreshProfileData } = useAuth();
  const selectedCandidate = getSelectedCandidate();
  const [showCandidateDialog, setShowCandidateDialog] = useState(false);
  const [profileMode, setProfileMode] = useState<'add' | 'edit'>('add');

  const handleProfileSelect = (candidateId: string) => {
    selectCandidate(candidateId);
    const candidate = user?.managedCandidates.find(c => c.id === candidateId);
    if (candidate) {
      onProfileSelected(candidate);
    }
  };

  const handleAddNewProfile = () => {
    setProfileMode('add');
    setShowCandidateDialog(true);
  };

  const handleUpdateProfile = async () => {
    if (user?.role === 'individual') {
      try {
        const profilesResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/profile`, {
          method: 'GET',
          credentials: 'include'
        });
        
        if (profilesResponse.ok) {
          const data = await profilesResponse.json();
          if (data?.data && data.data.length > 0) {
            const mostRecentProfile = data.data[0];
            setProfileMode('edit');
            setShowCandidateDialog(true);
          } else {
            setProfileMode('add');
            setShowCandidateDialog(true);
          }
        } else {
          setProfileMode('add');
          setShowCandidateDialog(true);
        }
      } catch (error) {
        console.log('Error getting profiles data:', error);
        setProfileMode('edit');
        setShowCandidateDialog(true);
      }
    }
  };

  const handleProfileComplete = (profile: any) => {
    setShowCandidateDialog(false);
    // The profile will be automatically added to the user's managedCandidates
    // We can close the dialog and let the user select from the updated list
    
    // Refresh profile data to ensure UI updates
    refreshProfileData();
  };

  const getJobTitle = (job: any): string => {
    if (job.descriptor?.name) {
      return job.descriptor.name;
    }
    if (job.title) {
      return job.title;
    }
    return 'Unknown Job';
  };

  const jobTitle = getJobTitle(job);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Select Profile for {jobTitle}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {user?.role === 'individual' && user.managedCandidates.length > 0 ? (
              <div className="space-y-3">
                <div className="text-sm font-medium text-muted-foreground">Choose a profile to apply with:</div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">
                          {selectedCandidate?.nickname || selectedCandidate?.name || 'Select Profile'}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-full">
                    <div className="p-2">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Switch Profile</div>
                      {user.managedCandidates.map((candidate) => (
                        <DropdownMenuItem
                          key={candidate.id}
                          onClick={() => handleProfileSelect(candidate.id)}
                          className={`flex items-center justify-between p-2 ${
                            selectedCandidate?.id === candidate.id ? 'bg-accent' : ''
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{candidate.nickname || candidate.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {candidate.interestedRole || 'No role specified'}
                            </span>
                          </div>
                          {selectedCandidate?.id === candidate.id && (
                            <Badge variant="secondary" className="text-xs">Active</Badge>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleAddNewProfile} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add New Profile
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {selectedCandidate && (
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-green-800">
                            {selectedCandidate.nickname || selectedCandidate.name}
                          </div>
                          <div className="text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {selectedCandidate.interestedRole || 'Profile'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm font-medium text-muted-foreground">No profiles found. Create your first profile:</div>
                <Card className="border-dashed border-2 border-muted-foreground/25">
                  <CardContent className="p-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <User className="h-8 w-8 text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">
                        No profiles available
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button 
                onClick={handleAddNewProfile}
                className="flex-1"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Profile
              </Button>
              {selectedCandidate ? (
                <Button 
                  onClick={() => onProfileSelected(selectedCandidate)}
                  className="flex-1"
                >
                  Continue with Selected Profile
                </Button>
              ) : (
                <Button 
                  onClick={handleAddNewProfile}
                  className="flex-1"
                >
                  Create Profile & Continue
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Creation/Edit Dialog */}
      {user?.role === 'individual' && (
        <CandidateProfileDialog
          isOpen={showCandidateDialog}
          onClose={() => setShowCandidateDialog(false)}
          mode={profileMode}
          isUpdate={profileMode === 'edit'}
          profileId={user.profileId}
        />
      )}
    </>
  );
};

export default ProfileSelectionModal; 