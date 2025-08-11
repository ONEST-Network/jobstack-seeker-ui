import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Plus, User, CheckCircle, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const [tempSelectedCandidate, setTempSelectedCandidate] = useState<any>(selectedCandidate);
  const [preSelectedRole, setPreSelectedRole] = useState<string>('');
  const isMobile = useIsMobile();

  // Helper function to map job title to role name
  const getRoleFromJobTitle = (jobTitle: string): string => {
    const lowerJobTitle = jobTitle.toLowerCase();
    
    // Map based on keywords in the job title - Order matters! More specific patterns first
    
    // Check for specific multi-word patterns first
    if (lowerJobTitle.includes('data entry operator') || lowerJobTitle.includes('data entry') || lowerJobTitle.includes('data-entry-operator') || lowerJobTitle.includes('data-entry')) {
      return 'Data Entry Operator';
    }
    if (lowerJobTitle.includes('tele sales') || lowerJobTitle.includes('telesales') || lowerJobTitle.includes('tele salesperson') || lowerJobTitle.includes('telecaller') || lowerJobTitle.includes('tele-sales') || lowerJobTitle.includes('tele-salesperson')) {
      return 'Tele Salesperson';
    }
    if (lowerJobTitle.includes('field sales person') || lowerJobTitle.includes('field salesperson') || lowerJobTitle.includes('field-sales-person') || lowerJobTitle.includes('field-salesperson')) {
      return 'Field Sales Person';
    }
    if (lowerJobTitle.includes('machine operator')) {
      return 'Machine Operator';
    }
    if (lowerJobTitle.includes('iti') || lowerJobTitle.includes('industrial training') || lowerJobTitle.includes('technical') || lowerJobTitle.includes('vocational')) {
      return 'ITI Student';
    }
    
    // Then check for more general patterns
    if (lowerJobTitle.includes('tailor') || lowerJobTitle.includes('stitch') || lowerJobTitle.includes('garment')) {
      return 'Industrial Tailor';
    }
    if (lowerJobTitle.includes('warehouse') || lowerJobTitle.includes('loader') || lowerJobTitle.includes('picker') || lowerJobTitle.includes('logistics')) {
      return 'Warehouse Loader & Picker';
    }
    if (lowerJobTitle.includes('recruitment') || lowerJobTitle.includes('hr') || lowerJobTitle.includes('talent') || lowerJobTitle.includes('hiring')) {
      return 'Recruitment Associate';
    }
    if (lowerJobTitle.includes('sales') || lowerJobTitle.includes('field') || lowerJobTitle.includes('executive')) {
      return 'Field Sales Executive';
    }
    if (lowerJobTitle.includes('promoter') || lowerJobTitle.includes('store') || lowerJobTitle.includes('retail')) {
      return 'In Store Promoter';
    }
    if (lowerJobTitle.includes('electrician') || lowerJobTitle.includes('electrical') || lowerJobTitle.includes('wiring')) {
      return 'Electrician';
    }
    if (lowerJobTitle.includes('fitter') || lowerJobTitle.includes('fitting') || lowerJobTitle.includes('assembly')) {
      return 'Fitter';
    }
    if (lowerJobTitle.includes('mechanic') || lowerJobTitle.includes('maintenance') || lowerJobTitle.includes('repair')) {
      return 'Mechanic';
    }
    if (lowerJobTitle.includes('operator') || lowerJobTitle.includes('machine')) {
      return 'Machine Operator';
    }
    
    return 'Industrial Tailor';
  };

  // Get job title from job object
  const getJobTitle = (job: any): string => {
    if (job.descriptor?.name) {
      return job.descriptor.name;
    }
    if (job.title) {
      return job.title;
    }
    return 'Unknown Job';
  };

  const handleProfileSelect = (candidateId: string) => {
    // Only select the candidate temporarily, don't proceed to next step
    const candidate = user?.managedCandidates.find(c => c.id === candidateId);
    if (candidate) {
      setTempSelectedCandidate(candidate);
    }
  };

  const handleContinueWithSelectedProfile = () => {
    if (tempSelectedCandidate) {
      selectCandidate(tempSelectedCandidate.id);
      onProfileSelected(tempSelectedCandidate);
    }
  };

  const handleAddNewProfile = () => {
    setProfileMode('add');
    // Extract role from job and set it
    const jobTitle = getJobTitle(job);
    const mappedRole = getRoleFromJobTitle(jobTitle);
    setPreSelectedRole(mappedRole);
    setShowCandidateDialog(true);
  };

  // Reset state when dialog closes
  const handleClose = () => {
    setShowCandidateDialog(false);
    setTempSelectedCandidate(null);
    setPreSelectedRole('');
    setProfileMode('add');
    onClose();
  };

  // Reset state when main dialog closes
  const handleMainClose = () => {
    setTempSelectedCandidate(null);
    setPreSelectedRole('');
    setProfileMode('add');
    setShowCandidateDialog(false);
    onClose();
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
            // Extract role from job and set it
            const jobTitle = getJobTitle(job);
            const mappedRole = getRoleFromJobTitle(jobTitle);
            setPreSelectedRole(mappedRole);
            setShowCandidateDialog(true);
          }
        } else {
          setProfileMode('add');
          // Extract role from job and set it
          const jobTitle = getJobTitle(job);
          const mappedRole = getRoleFromJobTitle(jobTitle);
          setPreSelectedRole(mappedRole);
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

  const jobTitle = getJobTitle(job);

  const renderContent = () => (
    <div className="space-y-4">
      {user?.role === 'individual' && user.managedCandidates.length > 0 ? (
        <div className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground">Choose a profile to apply with:</div>
          
          {/* Mobile-friendly profile list */}
          {isMobile ? (
            <div className="space-y-2">
              {user.managedCandidates.map((candidate) => (
                <Card
                  key={candidate.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    tempSelectedCandidate?.id === candidate.id 
                      ? 'border-green-500 bg-green-50' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleProfileSelect(candidate.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          tempSelectedCandidate?.id === candidate.id 
                            ? 'bg-green-100' 
                            : 'bg-muted'
                        }`}>
                          <User className={`h-5 w-5 ${
                            tempSelectedCandidate?.id === candidate.id 
                              ? 'text-green-600' 
                              : 'text-muted-foreground'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium truncate ${
                            tempSelectedCandidate?.id === candidate.id 
                              ? 'text-green-800' 
                              : ''
                          }`}>
                            {candidate.nickname || candidate.name}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {candidate.interestedRole || 'No role specified'}
                          </div>
                        </div>
                      </div>
                      {tempSelectedCandidate?.id === candidate.id && (
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          Selected
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium truncate">
                      {tempSelectedCandidate?.nickname || tempSelectedCandidate?.name || 'Select Profile'}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-[280px] sm:w-[320px] p-0"
                sideOffset={8}
                avoidCollisions={true}
              >
                <div className="flex flex-col max-h-[40vh]">
                  {/* Header */}
                  <div className="p-2 border-b">
                    <div className="text-sm font-medium text-muted-foreground">Switch Profile</div>
                  </div>
                  
                  {/* Scrollable Profile List */}
                  <div className="overflow-y-auto flex-1 min-h-0" style={{ maxHeight: 'calc(40vh - 80px)' }}>
                    <div className="p-2 space-y-1">
                      {user.managedCandidates.map((candidate) => (
                        <DropdownMenuItem
                          key={candidate.id}
                          onClick={() => handleProfileSelect(candidate.id)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                            tempSelectedCandidate?.id === candidate.id 
                              ? 'bg-accent text-accent-foreground' 
                              : 'hover:bg-muted'
                          }`}
                        >
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-medium truncate">{candidate.nickname || candidate.name}</span>
                            <span className="text-xs text-muted-foreground truncate">
                              {candidate.interestedRole || 'No role specified'}
                            </span>
                          </div>
                          {tempSelectedCandidate?.id === candidate.id && (
                            <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">Selected</Badge>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </div>
                  
                  {/* Fixed Footer */}
                  <div className="border-t">
                    <DropdownMenuItem 
                      onClick={handleAddNewProfile} 
                      className="gap-2 p-2 cursor-pointer hover:bg-muted rounded-none"
                    >
                      <Plus className="h-4 w-4" />
                      Add New Profile
                    </DropdownMenuItem>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {tempSelectedCandidate && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-green-800">
                      {tempSelectedCandidate.nickname || tempSelectedCandidate.name}
                    </div>
                    <div className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {tempSelectedCandidate.interestedRole || 'Profile'}
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

      {/* Mobile-friendly action buttons */}
      <div className={`flex gap-2 pt-2 ${isMobile ? 'flex-col' : ''}`}>
        <Button 
          onClick={handleAddNewProfile}
          className={`${isMobile ? 'w-full h-12 text-base' : 'flex-1'}`}
          variant="outline"
        >
          <Plus className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} mr-2`} />
          Add New Profile
        </Button>
        {tempSelectedCandidate ? (
          <Button 
            onClick={handleContinueWithSelectedProfile}
            className={`${isMobile ? 'w-full h-12 text-base' : 'flex-1'}`}
          >
            Continue with Selected Profile
          </Button>
        ) : (
          <Button 
            onClick={handleAddNewProfile}
            className={`${isMobile ? 'w-full h-12 text-base' : 'flex-1'}`}
          >
            Create Profile & Continue
          </Button>
        )}
      </div>
    </div>
  );

  // Mobile version with Drawer
  if (isMobile) {
    return (
      <>
        <Drawer open={isOpen} onOpenChange={handleMainClose}>
          <DrawerContent className="h-[95vh]">
            <DrawerHeader className="text-left border-b pb-3">
              <div className="flex items-center justify-between">
                <DrawerTitle className="text-lg">Select Profile for {jobTitle}</DrawerTitle>
                <Button variant="ghost" size="sm" onClick={handleMainClose} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto p-4">
              {renderContent()}
            </div>
          </DrawerContent>
        </Drawer>

        {/* Profile Creation/Edit Dialog */}
        {user?.role === 'individual' && (
          <CandidateProfileDialog
            isOpen={showCandidateDialog}
            onClose={() => setShowCandidateDialog(false)}
            mode={profileMode}
            isUpdate={profileMode === 'edit'}
            profileId={user.profileId}
            preSelectedRole={preSelectedRole}
          />
        )}
      </>
    );
  }

  // Desktop version with Dialog
  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleMainClose}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Select Profile for {jobTitle}</DialogTitle>
          </DialogHeader>
          {renderContent()}
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
          preSelectedRole={preSelectedRole}
        />
      )}
    </>
  );
};

export default ProfileSelectionModal; 