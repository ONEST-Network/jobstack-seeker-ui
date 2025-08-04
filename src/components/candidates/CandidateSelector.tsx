
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Plus, User, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import CandidateProfileDialog from '@/components/candidates/CandidateProfileDialog';

interface CandidateSelectorProps {
  onAddCandidate: () => void;
}

const CandidateSelector: React.FC<CandidateSelectorProps> = ({ onAddCandidate }) => {
  const { user, selectCandidate, getSelectedCandidate } = useAuth();
  const selectedCandidate = getSelectedCandidate();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  if (!user || user.role !== 'individual' || user.managedCandidates.length === 0) {
    return null;
  }

  const handleEditProfile = (profileId: string) => {
    setEditingProfileId(profileId);
    setShowProfileDialog(true);
  };

  const handleCloseProfileDialog = () => {
    setShowProfileDialog(false);
    setEditingProfileId(null);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 min-w-0 flex-1 sm:flex-none">
            <User className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium truncate">
              {selectedCandidate?.nickname || selectedCandidate?.name || 'Select Profile'}
            </span>
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
                  <div
                    key={candidate.id}
                    className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                      selectedCandidate?.id === candidate.id 
                        ? 'bg-accent text-accent-foreground' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <DropdownMenuItem
                      onClick={() => selectCandidate(candidate.id)}
                      className="flex items-center justify-between flex-1 p-0 cursor-pointer"
                    >
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-medium truncate">
                          {candidate.nickname || candidate.name}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {candidate.interestedRole || 'No role specified'}
                        </span>
                      </div>
                      {selectedCandidate?.id === candidate.id && (
                        <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                          Active
                        </Badge>
                      )}
                    </DropdownMenuItem>
                    
                    {/* Edit button for each profile */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProfile(candidate.id);
                      }}
                      className="h-6 w-6 p-0 ml-1"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Fixed Footer */}
            <div className="border-t">
              <DropdownMenuItem 
                onClick={onAddCandidate} 
                className="gap-2 p-2 cursor-pointer hover:bg-muted rounded-none"
              >
                <Plus className="h-4 w-4" />
                Add New Profile
              </DropdownMenuItem>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Profile Dialog for editing */}
      {showProfileDialog && editingProfileId && (
        <CandidateProfileDialog
          isOpen={showProfileDialog}
          onClose={handleCloseProfileDialog}
          mode="edit"
          isUpdate={true}
          candidateId={editingProfileId}
          profileId={editingProfileId}
        />
      )}
    </>
  );
};

export default CandidateSelector;
