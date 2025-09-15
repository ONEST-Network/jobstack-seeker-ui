import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Loader2, ChevronLeft, ChevronRight, Edit, Trash2, CheckSquare, Square } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

import UserProfileDialog from '@/components/profile/UserProfileDialog';
import ConfirmDialog from '@/components/ui/confirm-dialog';

interface Profile {
  id: string;
  userId: string;
  type: string;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

interface ViewAllProfilesProps {
  isOpen: boolean;
  onClose: () => void;
}

const ViewAllProfiles: React.FC<ViewAllProfilesProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation("viewallprofiles");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { user, deleteProfile } = useAuth();
  const isMobile = useIsMobile();
  const profilesTableRef = useRef<HTMLDivElement>(null);

  const limit = 20;

  const fetchProfiles = useCallback(async (page: number, search?: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await apiClient.getProfilesPaginated(page, limit, search);
      if (response.data) {
        setProfiles(response.data);
        const estimatedTotal = response.data.length === limit ? page * limit + 1 : (page - 1) * limit + response.data.length;
        setTotalProfiles(estimatedTotal);
        setTotalPages(Math.ceil(estimatedTotal / limit));
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setProfiles([]);
      setTotalProfiles(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      fetchProfiles(currentPage, searchQuery);
    }
  }, [isOpen, currentPage, fetchProfiles]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProfiles(1, searchQuery);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setTimeout(() => {
        profilesTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

  const getDisplayValue = (value: any): string =>
    value === null || value === undefined || value === '' ? t('profiles.notSpecified') : Array.isArray(value) ? (value.length > 0 ? value.join(', ') : t('profiles.notSpecified')) : String(value);

  const handleEditProfile = (profile: Profile) => {
    setEditingProfile(profile);
    setShowEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setEditingProfile(null);
    fetchProfiles(currentPage, searchQuery);
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (window.confirm(t('profiles.confirmDeleteSingle'))) {
      try {
        await deleteProfile(profileId);
        fetchProfiles(currentPage, searchQuery);
      } catch (error) {
        console.error('Error deleting profile:', error);
        alert(t('profiles.deleteFailed'));
      }
    }
  };

  const handleBulkDeleteProfiles = async () => {
    if (selectedProfiles.size === 0) return;
    try {
      for (const profileId of selectedProfiles) {
        await deleteProfile(profileId);
      }
      setSelectedProfiles(new Set());
      setIsSelectionMode(false);
      setShowDeleteConfirm(false);
      fetchProfiles(currentPage, searchQuery);
    } catch (error) {
      console.error('Error deleting profiles:', error);
      alert(t('profiles.deleteFailed'));
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (!isSelectionMode) setSelectedProfiles(new Set());
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full max-w-7xl h-[90vh] flex flex-col p-0 [&>button]:hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <DialogTitle className="text-2xl font-bold">{t('profiles.title')}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={toggleSelectionMode} className="h-9 px-3">
                {isSelectionMode ? t('profiles.cancelSelection') : t('profiles.selectMultiple')}
              </Button>
              {isSelectionMode && selectedProfiles.size > 0 && (
                <Button variant="destructive" size="sm" onClick={handleBulkDeleteProfiles} className="h-9 px-3">
                  <Trash2 className="h-4 w-4 mr-1" />
                  {t('profiles.deleteWithCount', { count: selectedProfiles.size })}
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>{t('profiles.close')}</Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Search Bar */}
            <div className="p-6 border-b">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder={t('profiles.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('profiles.search')}
                </Button>
              </form>
            </div>

            {/* Table */}
            <div ref={profilesTableRef} className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">{t('profiles.loading')}</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('profiles.name')}</TableHead>
                      <TableHead>{t('profiles.role')}</TableHead>
                      <TableHead>{t('profiles.gender')}</TableHead>
                      <TableHead>{t('profiles.phone')}</TableHead>
                      <TableHead>{t('profiles.location')}</TableHead>
                      <TableHead>{t('profiles.age')}</TableHead>
                      <TableHead>{t('profiles.experience')}</TableHead>
                      <TableHead>{t('profiles.salary')}</TableHead>
                      <TableHead>{t('profiles.created')}</TableHead>
                      <TableHead>{t('profiles.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          {t('profiles.noProfiles')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      profiles.map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell>{getDisplayValue(profile.metadata.name)}</TableCell>
                          <TableCell>{getDisplayValue(profile.metadata.role)}</TableCell>
                          <TableCell>{getDisplayValue(profile.metadata.gender)}</TableCell>
                          <TableCell>{getDisplayValue(profile.metadata.whoIAm?.phone)}</TableCell>
                          <TableCell>{getDisplayValue(profile.metadata.whoIAm?.location)}</TableCell>
                          <TableCell>{getDisplayValue(profile.metadata.whatIHave?.age)}</TableCell>
                          <TableCell>
                            {profile.metadata.whatIHave?.totalYearsOfExperience
                              ? `${profile.metadata.whatIHave.totalYearsOfExperience} ${t('profiles.years')}`
                              : t('profiles.notSpecified')}
                          </TableCell>
                          <TableCell>
                            {profile.metadata.whatIHave?.currentMonthlySalary
                              ? `₹${profile.metadata.whatIHave.currentMonthlySalary.toLocaleString()}`
                              : t('profiles.notSpecified')}
                          </TableCell>
                          <TableCell>{formatDate(profile.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEditProfile(profile)} className="h-8 w-8 p-0">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteProfile(profile.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-6 border-t">
                <div className={`flex items-center justify-between ${isMobile ? 'flex-col gap-4' : ''}`}>
                  <div className="text-sm text-gray-600">
                    {isMobile
                      ? t('profiles.pageInfoMobile', { current: currentPage, total: totalPages })
                      : t('profiles.pageInfoDesktop', {
                          start: (currentPage - 1) * limit + 1,
                          end: Math.min(currentPage * limit, totalProfiles),
                          total: totalProfiles,
                        })}
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          {!isMobile && t('profiles.previous')}
                        </Button>
                      </PaginationItem>
                      <PaginationItem>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          {!isMobile && t('profiles.next')}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      {showEditDialog && editingProfile && (
        <UserProfileDialog
          isOpen={showEditDialog}
          onClose={handleCloseEditDialog}
          mode="candidate"
          isUpdate={true}
          profileId={editingProfile.id}
          initialProfile={editingProfile as unknown as Record<string, unknown>}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleBulkDeleteProfiles}
        title={t('profiles.deleteTitle')}
        description={t('profiles.deleteDescription', { count: selectedProfiles.size })}
        confirmText={t('profiles.confirmDelete')}
        cancelText={t('profiles.cancel')}
        variant="destructive"
      />
    </>
  );
};

export default ViewAllProfiles;
