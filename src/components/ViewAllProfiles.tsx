import React, { useState, useEffect, useCallback } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Loader2, ChevronLeft, ChevronRight, Edit, Trash2, CheckSquare, Square } from 'lucide-react';
import { apiClient, ProfilesResponse } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useDraftProfileSync } from '@/hooks/useDraftProfileSync';
import UserProfileDialog from '@/components/profile/UserProfileDialog';
import ConfirmDialog from '@/components/ui/confirm-dialog';

interface Profile {
  id: string;
  userId: string;
  type: string;
  metadata: {
    name?: string;
    role?: string;
    gender?: string;
    whoIAm?: {
      phone?: string;
      hometown?: string;
      location?: string;
      fatherName?: string;
      motherName?: string;
      dateOfBirth?: string;
      aadharNumber?: string;
      locationData?: {
        city?: string;
        state?: string;
        address?: string;
        country?: string;
      };
      isAgeVerified?: boolean;
      isNameVerified?: boolean;
      currentLocation?: string;
      desiredLocation?: string;
      isPhoneVerified?: boolean;
      isLocationVerified?: boolean;
    };
    whatIHave?: {
      age?: number;
      rollNumber?: string;
      itiInstitute?: string;
      isAgeVerified?: boolean;
      languageSpoken?: string[];
      previousCompany?: string;
      skillProofVideo?: string;
      machinesOperated?: string[];
      previousLocation?: string;
      trainingDuration?: number;
      itiSpecialization?: string[];
      qualityProofImage?: string;
      currentMonthlySalary?: number;
      highestQualification?: string[];
      fitterAssessmentScore?: number;
      intentAssessmentScore?: number;
      totalYearsOfExperience?: number;
    };
    whatIWant?: {
      monthlyPFESIC?: string;
      workHoursPerDay?: number;
      preferredModeOfWork?: string[];
      monthlyOTExpectation?: number;
      monthlyInHandPreferred?: number;
    };
    dateOfBirth?: string;
    isAgeVerified?: boolean;
    isNameVerified?: boolean;
    workExperience?: any[];
    previousCompany?: string;
    skillProofVideo?: string;
    workHoursPerDay?: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface ViewAllProfilesProps {
  isOpen: boolean;
  onClose: () => void;
}

const ViewAllProfiles: React.FC<ViewAllProfilesProps> = ({ isOpen, onClose }) => {
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
  const { updateAllDraftsWithProfile } = useDraftProfileSync();

  const limit = 20;

  // Improved search function that uses exact word matching
  const matchesSearch = (profile: Profile, query: string): boolean => {
    if (!query.trim()) return true;
    
    const searchTerms = query.toLowerCase().trim().split(/\s+/).filter(term => term.length > 0);
    if (searchTerms.length === 0) return true;

    const searchableFields = [
      profile.metadata.name || '',
      profile.metadata.role || '',
      profile.metadata.gender || '',
      profile.metadata.whoIAm?.phone || '',
      profile.metadata.whoIAm?.location || '',
      profile.metadata.whoIAm?.hometown || '',
      profile.metadata.whatIHave?.previousCompany || '',
      profile.metadata.whatIHave?.itiInstitute || '',
      ...(profile.metadata.whatIHave?.languageSpoken || []),
      ...(profile.metadata.whatIHave?.machinesOperated || []),
      ...(profile.metadata.whatIHave?.itiSpecialization || []),
      ...(profile.metadata.whatIHave?.highestQualification || []),
      ...(profile.metadata.whatIWant?.preferredModeOfWork || [])
    ].map(field => field.toLowerCase());

    // Check if all search terms are found in any of the searchable fields
    return searchTerms.every(term => 
      searchableFields.some(field => field.includes(term))
    );
  };

  const fetchProfiles = useCallback(async (page: number, search?: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await apiClient.getProfilesPaginated(page, limit, search);
      if (response.data) {
        let filteredProfiles = response.data;
        
        // Apply client-side filtering for more precise search
        if (search && search.trim()) {
          filteredProfiles = response.data.filter(profile => matchesSearch(profile, search));
        }
        
        setProfiles(filteredProfiles);
        // Calculate total pages based on response
        // For now, we'll estimate based on the current page and limit
        // In a real implementation, the API should return total count
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

  // Keyboard shortcuts for selection mode
  useEffect(() => {
    if (!isOpen || !isSelectionMode) return;

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
  }, [isOpen, isSelectionMode]);

  // Debounced search effect
  useEffect(() => {
    if (!isOpen) return;
    
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchProfiles(1, searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, isOpen, fetchProfiles]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProfiles(1, searchQuery);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDisplayValue = (value: any): string => {
    if (value === null || value === undefined || value === '') {
      return 'Not specified';
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'Not specified';
    }
    return String(value);
  };

  // Transform API profile structure to UserProfileDialog format
  const transformProfileForEdit = (profile: Profile): Record<string, unknown> => {
    const transformed = {
      // Basic info - these are used by legacy steps
      name: profile.metadata.name || '',
      age: profile.metadata.whatIHave?.age || undefined,
      dateOfBirth: profile.metadata.whoIAm?.dateOfBirth || profile.metadata.dateOfBirth || '',
      gender: profile.metadata.gender || undefined,
      hometown: profile.metadata.whoIAm?.hometown || '',
      aadharNumber: profile.metadata.whoIAm?.aadharNumber || '',
      phone: profile.metadata.whoIAm?.phone || '',
      currentLocation: profile.metadata.whoIAm?.currentLocation || profile.metadata.whoIAm?.location || '',
      desiredLocation: profile.metadata.whoIAm?.desiredLocation || '',
      interestedRole: profile.metadata.role || '',
      interestedIndustry: '',
      isNameVerified: profile.metadata.whoIAm?.isNameVerified || profile.metadata.isNameVerified || false,
      isAgeVerified: profile.metadata.whoIAm?.isAgeVerified || profile.metadata.isAgeVerified || false,
      
      // Legacy fields for backward compatibility
      experience: profile.metadata.workExperience || [],
      skills: [],
      certificates: [],
      assessmentScores: [],
      documentVerificationStatus: [],
      nickname: profile.metadata.name || '',
      
      // Unified schema data - preserve all nested data including file URLs
      whoIAm: {
        name: profile.metadata.name || '',
        phone: profile.metadata.whoIAm?.phone || '',
        hometown: profile.metadata.whoIAm?.hometown || '',
        location: profile.metadata.whoIAm?.location || profile.metadata.whoIAm?.currentLocation || '',
        currentLocation: profile.metadata.whoIAm?.currentLocation || profile.metadata.whoIAm?.location || '',
        desiredLocation: profile.metadata.whoIAm?.desiredLocation || '',
        dateOfBirth: profile.metadata.whoIAm?.dateOfBirth || profile.metadata.dateOfBirth || '',
        aadharNumber: profile.metadata.whoIAm?.aadharNumber || '',
        fatherName: profile.metadata.whoIAm?.fatherName || '',
        motherName: profile.metadata.whoIAm?.motherName || '',
        isAgeVerified: profile.metadata.whoIAm?.isAgeVerified || profile.metadata.isAgeVerified || false,
        isNameVerified: profile.metadata.whoIAm?.isNameVerified || profile.metadata.isNameVerified || false,
        isPhoneVerified: profile.metadata.whoIAm?.isPhoneVerified || false,
        isLocationVerified: profile.metadata.whoIAm?.isLocationVerified || false,
        locationData: profile.metadata.whoIAm?.locationData || {}
      },
      
      whatIHave: {
        age: profile.metadata.whatIHave?.age || undefined,
        rollNumber: profile.metadata.whatIHave?.rollNumber || '',
        itiInstitute: profile.metadata.whatIHave?.itiInstitute || '',
        isAgeVerified: profile.metadata.whatIHave?.isAgeVerified || false,
        languageSpoken: profile.metadata.whatIHave?.languageSpoken || [],
        previousCompany: profile.metadata.whatIHave?.previousCompany || profile.metadata.previousCompany || '',
        skillProofVideo: profile.metadata.whatIHave?.skillProofVideo || profile.metadata.skillProofVideo || '',
        machinesOperated: profile.metadata.whatIHave?.machinesOperated || [],
        previousLocation: profile.metadata.whatIHave?.previousLocation || '',
        trainingDuration: profile.metadata.whatIHave?.trainingDuration || undefined,
        itiSpecialization: profile.metadata.whatIHave?.itiSpecialization || [],
        qualityProofImage: profile.metadata.whatIHave?.qualityProofImage || '',
        currentMonthlySalary: profile.metadata.whatIHave?.currentMonthlySalary || undefined,
        highestQualification: profile.metadata.whatIHave?.highestQualification || [],
        fitterAssessmentScore: profile.metadata.whatIHave?.fitterAssessmentScore || undefined,
        intentAssessmentScore: profile.metadata.whatIHave?.intentAssessmentScore || undefined,
        totalYearsOfExperience: profile.metadata.whatIHave?.totalYearsOfExperience || undefined
      },
      
      whatIWant: {
        monthlyPFESIC: profile.metadata.whatIWant?.monthlyPFESIC || '',
        workHoursPerDay: profile.metadata.whatIWant?.workHoursPerDay || profile.metadata.workHoursPerDay || undefined,
        preferredModeOfWork: profile.metadata.whatIWant?.preferredModeOfWork || [],
        monthlyOTExpectation: profile.metadata.whatIWant?.monthlyOTExpectation || undefined,
        monthlyInHandPreferred: profile.metadata.whatIWant?.monthlyInHandPreferred || undefined
      },
      
      // Verification status
      isGenderVerified: false,
      isAadharVerified: false,
      isHometownVerified: false,
      
      // Education and certifications
      education: [],
      skillCertifications: [],
      workExperience: profile.metadata.workExperience || []
    };
    
    return transformed;
  };

  const handleEditProfile = (profile: Profile) => {
    const transformedProfile = transformProfileForEdit(profile);
    setEditingProfile(profile);
    setShowEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setEditingProfile(null);
    // Refresh the profiles list after editing
    fetchProfiles(currentPage, searchQuery);
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (window.confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      try {
        await deleteProfile(profileId);
        // Refresh the profiles list after deletion
        fetchProfiles(currentPage, searchQuery);
      } catch (error) {
        console.error('Error deleting profile:', error);
        alert('Failed to delete profile. Please try again.');
      }
    }
  };

  const handleProfileCheckboxToggle = (profileId: string) => {
    setSelectedProfiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(profileId)) {
        newSet.delete(profileId);
      } else {
        newSet.add(profileId);
      }
      return newSet;
    });
  };

  const handleSelectAllProfiles = () => {
    if (selectedProfiles.size === profiles.length) {
      setSelectedProfiles(new Set());
    } else {
      setSelectedProfiles(new Set(profiles.map(p => p.id)));
    }
  };

  const handleBulkDeleteProfiles = async () => {
    if (selectedProfiles.size === 0) return;
    
    try {
      // Delete each selected profile
      for (const profileId of selectedProfiles) {
        await deleteProfile(profileId);
      }
      
      // Clear selection and refresh
      setSelectedProfiles(new Set());
      setIsSelectionMode(false);
      setShowDeleteConfirm(false);
      fetchProfiles(currentPage, searchQuery);
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

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full max-w-7xl h-[90vh] max-h-[90vh] flex flex-col p-0 [&>button]:hidden">
          <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
            <DialogTitle className="text-2xl font-bold">View All Profiles</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectionMode}
                className="h-9 px-3"
              >
                {isSelectionMode ? 'Cancel Selection' : 'Select Multiple'}
              </Button>
              {isSelectionMode && selectedProfiles.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDeleteProfiles}
                  className="h-9 px-3"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete ({selectedProfiles.size})
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Search Bar */}
            <div className="p-6 border-b flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                {isSelectionMode && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAllProfiles}
                      className="h-8 px-3"
                    >
                      {selectedProfiles.size === profiles.length ? (
                        <CheckSquare className="h-4 w-4 mr-1" />
                      ) : (
                        <Square className="h-4 w-4 mr-1" />
                      )}
                      {selectedProfiles.size === profiles.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {selectedProfiles.size} profile(s) selected
                    </span>
                  </div>
                )}
              </div>
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search profiles by name, role, location, phone, etc..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                </Button>
              </form>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading profiles...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {isSelectionMode && (
                        <TableHead className="w-12">
                          <div 
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer mx-auto ${
                              selectedProfiles.size === profiles.length
                                ? 'bg-blue-500 border-blue-500 text-white'
                                : 'border-gray-300'
                            }`}
                            onClick={handleSelectAllProfiles}
                          >
                            {selectedProfiles.size === profiles.length && (
                              <CheckSquare className="h-3 w-3" />
                            )}
                          </div>
                        </TableHead>
                      )}
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isSelectionMode ? 11 : 10} className="text-center py-8">
                          No profiles found
                        </TableCell>
                      </TableRow>
                    ) : (
                      profiles.map((profile) => (
                        <TableRow 
                          key={profile.id}
                          className={`${
                            isSelectionMode && selectedProfiles.has(profile.id)
                              ? 'bg-blue-50 border-blue-200'
                              : ''
                          }`}
                        >
                          {isSelectionMode && (
                            <TableCell className="w-12">
                              <div 
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer mx-auto ${
                                  selectedProfiles.has(profile.id)
                                    ? 'bg-blue-500 border-blue-500 text-white'
                                    : 'border-gray-300'
                                }`}
                                onClick={() => handleProfileCheckboxToggle(profile.id)}
                              >
                                {selectedProfiles.has(profile.id) && (
                                  <CheckSquare className="h-3 w-3" />
                                )}
                              </div>
                            </TableCell>
                          )}
                          <TableCell className="font-medium">
                            {getDisplayValue(profile.metadata.name)}
                          </TableCell>
                          <TableCell>
                            {getDisplayValue(profile.metadata.role)}
                          </TableCell>
                          <TableCell>
                            {getDisplayValue(profile.metadata.gender)}
                          </TableCell>
                          <TableCell>
                            {getDisplayValue(profile.metadata.whoIAm?.phone)}
                          </TableCell>
                          <TableCell>
                            {getDisplayValue(profile.metadata.whoIAm?.location)}
                          </TableCell>
                          <TableCell>
                            {getDisplayValue(profile.metadata.whatIHave?.age)}
                          </TableCell>
                          <TableCell>
                            {profile.metadata.whatIHave?.totalYearsOfExperience 
                              ? `${profile.metadata.whatIHave.totalYearsOfExperience} years`
                              : 'Not specified'
                            }
                          </TableCell>
                          <TableCell>
                            {profile.metadata.whatIHave?.currentMonthlySalary 
                              ? `₹${profile.metadata.whatIHave.currentMonthlySalary.toLocaleString()}`
                              : 'Not specified'
                            }
                          </TableCell>
                          <TableCell>
                            {formatDate(profile.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditProfile(profile)}
                                className="h-8 w-8 p-0"
                              >
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

            {/* Selection Summary */}
            {isSelectionMode && selectedProfiles.size > 0 && (
              <div className="p-4 border-t bg-blue-50 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-blue-700">
                    <strong>{selectedProfiles.size}</strong> profile(s) selected
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="h-8 px-3"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Selected
                  </Button>
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-6 border-t flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalProfiles)} of {totalProfiles} profiles
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="gap-1"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <PaginationItem key={pageNum}>
                            <Button
                              variant={currentPage === pageNum ? "outline" : "ghost"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="gap-1"
                        >
                          Next
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
          initialProfile={transformProfileForEdit(editingProfile)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleBulkDeleteProfiles}
        title="Delete Profiles"
        description={`Are you sure you want to delete ${selectedProfiles.size} profile(s)? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  );
};

export default ViewAllProfiles;
