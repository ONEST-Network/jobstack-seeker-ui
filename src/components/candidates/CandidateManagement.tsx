import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Plus, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import CandidateCard from './CandidateCard';
import CandidateProfileDialog from './CandidateProfileDialog';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const CandidateManagement: React.FC = () => {
  const { t } = useTranslation();
  const { user, selectCandidate, deleteProfile, getSelectedCandidate } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<string | null>(null);
  
  const selectedCandidate = getSelectedCandidate();

  if (!user || user.role !== 'individual') {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              {t('candidateManagement.onlyAvailableForIndividuals')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredCandidates = user.managedCandidates.filter(candidate =>
    candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.interestedRole?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCandidate = (candidateId: string) => {
    selectCandidate(candidateId);
    toast({
      title: t('candidateManagement.toast.profileSelectedTitle'),
      description: t('candidateManagement.toast.profileSelectedDescription')
    });
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    if (candidateId === 'default-candidate') {
      toast({
        title: t('candidateManagement.toast.cannotDeleteTitle'),
        description: t('candidateManagement.toast.cannotDeleteDescription'),
        variant: "destructive"
      });
      return;
    }
    
    try {
      await deleteProfile(candidateId);
      toast({
        title: t('candidateManagement.toast.profileDeletedTitle'),
        description: t('candidateManagement.toast.profileDeletedDescription')
      });
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast({
        title: t('candidateManagement.toast.deleteFailedTitle'),
        description: t('candidateManagement.toast.deleteFailedDescription'),
        variant: "destructive"
      });
    }
  };

  const handleEditCandidate = (candidateId: string) => {
    setEditingCandidate(candidateId);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {t('candidateManagement.title')}
            </h2>
            <p className="text-muted-foreground">
              {t('candidateManagement.subtitle')}
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('candidateManagement.addNewProfile')}
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('candidateManagement.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{user.managedCandidates.length}</div>
              <div className="text-sm text-muted-foreground">
                {t('candidateManagement.stats.totalProfiles')}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">1</div>
              <div className="text-sm text-muted-foreground">
                {t('candidateManagement.stats.activeProfile')}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {user.managedCandidates.filter(c => c.experience?.length > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('candidateManagement.stats.withExperience')}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {user.managedCandidates.filter(c => c.interestedRole).length}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('candidateManagement.stats.withTargetRole')}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Candidate Grid */}
        {filteredCandidates.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t('candidateManagement.noProfilesFound')}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? t('candidateManagement.noProfilesMatch') 
                  : t('candidateManagement.createFirstProfile')}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t('candidateManagement.createProfile')}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCandidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                isSelected={selectedCandidate?.id === candidate.id}
                onSelect={() => handleSelectCandidate(candidate.id)}
                onEdit={() => handleEditCandidate(candidate.id)}
                onDelete={() => handleDeleteCandidate(candidate.id)}
                isDefault={candidate.id === 'default-candidate'}
              />
            ))}
          </div>
        )}

        {/* Dialogs */}
        <CandidateProfileDialog
          isOpen={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          mode="add"
        />
        
        {editingCandidate && (
          <CandidateProfileDialog
            isOpen={true}
            onClose={() => setEditingCandidate(null)}
            mode="edit"
            candidateId={editingCandidate}
          />
        )}
      </div>
    </div>
  );
};

export default CandidateManagement;
