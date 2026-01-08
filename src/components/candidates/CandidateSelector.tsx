
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Plus, User, Edit, Trash2, CheckSquare, Square } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import CandidateProfileDialog from '@/components/candidates/CandidateProfileDialog';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { useTranslation } from '@/hooks/useI18n';

interface CandidateSelectorProps {
  onAddCandidate: () => void;
}

const CandidateSelector: React.FC<CandidateSelectorProps> = ({ onAddCandidate }) => {
  const { user, selectCandidate, getSelectedCandidate, deleteProfile } = useAuth();
  const selectedCandidate = getSelectedCandidate();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const t = useTranslation('candidates');

  if (!user || user.role !== 'individual' || user.managedCandidates.length === 0) {
    return null;
  }

  const limitText = (text = '', max = 25) =>
    text.length > max ? text.slice(0, max) + '…' : text;

  const handleEditProfile = (profileId: string) => {
    setEditingProfileId(profileId);
    setShowProfileDialog(true);
  };

  const handleCloseProfileDialog = () => {
    setShowProfileDialog(false);
    setEditingProfileId(null);
  };
  
  const handleAddNewProfile = () => {
    onAddCandidate();
  };

  const handleProfileCheckboxToggle = (candidateId: string) => {
    setSelectedProfiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId);
      } else {
        newSet.add(candidateId);
      }
      return newSet;
    });
  };

  const handleSelectAllProfiles = () => {
    if (selectedProfiles.size === user.managedCandidates.length) {
      setSelectedProfiles(new Set());
    } else {
      setSelectedProfiles(new Set(user.managedCandidates.map(c => c.id)));
    }
  };

  const handleBulkDeleteProfiles = async () => {
    if (selectedProfiles.size === 0) return;
    
    try {
      // Delete each selected profile
      for (const profileId of selectedProfiles) {
        await deleteProfile(profileId);
      }
      
      // Clear selection and exit selection mode
      setSelectedProfiles(new Set());
      setIsSelectionMode(false);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting profiles:', error);
      alert('Failed to delete some profiles. Please try again.');
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (!isSelectionMode) {
      setSelectedProfiles(new Set());
    }
  };

  // Keyboard shortcuts for selection mode
  useEffect(() => {
    if (!isSelectionMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        handleSelectAllProfiles();
      }
      if (e.key === 'Escape') {
        setIsSelectionMode(false);
        setSelectedProfiles(new Set());
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSelectionMode]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 min-w-0 flex-1 sm:flex-none">
            <User className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium truncate">
              {limitText(selectedCandidate?.nickname || selectedCandidate?.name || t('selectProfile', 'Select Profile'),25)}
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
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-muted-foreground">{t('switchProfile', 'Switch Profile')}</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectionMode}
                  className="h-6 px-2 text-xs"
                >
                  {isSelectionMode ? t('cancel', 'Cancel') : t('select', 'Select')}
                </Button>
              </div>
            </div>

            {/* Selection Mode Header */}
            {isSelectionMode && (
              <div className="p-2 border-b bg-muted/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {selectedProfiles.size} of {user.managedCandidates.length} selected
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllProfiles}
                    className="h-5 px-2 text-xs"
                  >
                    {selectedProfiles.size === user.managedCandidates.length ? t('deselectAll', 'Deselect All') : t('selectAll', 'Select All')}
                  </Button>
                </div>
              </div>
            )}
            
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
                    {/* Checkbox for selection mode */}
                    {isSelectionMode && (
                      <div 
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer mr-2 ${
                          selectedProfiles.has(candidate.id)
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'border-gray-300'
                        }`}
                        onClick={() => handleProfileCheckboxToggle(candidate.id)}
                      >
                        {selectedProfiles.has(candidate.id) && (
                          <CheckSquare className="h-3 w-3" />
                        )}
                      </div>
                    )}

                    <DropdownMenuItem
                      onClick={() => {
                        if (isSelectionMode) {
                          handleProfileCheckboxToggle(candidate.id);
                        } else {
                          selectCandidate(candidate.id);
                        }
                      }}
                      className="flex items-center justify-between flex-1 p-0 cursor-pointer"
                    >
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-medium truncate">
                          {limitText(candidate.nickname || candidate.name, 25)}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {limitText(candidate.interestedRole || t('noRoleSpecified', 'No role specified'),25)}
                        </span>
                      </div>
                      {selectedCandidate?.id === candidate.id && !isSelectionMode && (
                        <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                          {t('active', 'Active')}
                        </Badge>
                      )}
                    </DropdownMenuItem>
                    
                    {/* Edit button for each profile */}
                    {!isSelectionMode && (
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
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Fixed Footer */}
            <div className="border-t">
              {isSelectionMode && selectedProfiles.size > 0 ? (
                <DropdownMenuItem 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="gap-2 p-2 cursor-pointer hover:bg-red-50 text-red-600 rounded-none"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('deleteProfiles', 'Delete {{count}} Profile(s)', { count: selectedProfiles.size })}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem 
                  onClick={handleAddNewProfile} 
                  className="gap-2 p-2 cursor-pointer hover:bg-muted rounded-none"
                >
                  <Plus className="h-4 w-4" />
                  {t('addNewProfile', 'Add New Profile')}
                </DropdownMenuItem>
              )}
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
          preventReload={true}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleBulkDeleteProfiles}
        title={t('deleteProfilesTitle', 'Delete Profiles')}
        description={t('deleteProfilesDescription', 'Are you sure you want to delete {{count}} profile(s)? This action cannot be undone.', { count: selectedProfiles.size })}
        confirmText={t('delete', 'Delete')}
        cancelText={t('cancel', 'Cancel')}
        variant="destructive"
      />
    </>
  );
};

export default CandidateSelector;
