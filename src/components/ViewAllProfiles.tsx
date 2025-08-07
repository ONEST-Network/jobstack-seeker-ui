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
import { Search, Loader2, ChevronLeft, ChevronRight, Edit } from 'lucide-react';
import { apiClient, ProfilesResponse } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import UserProfileDialog from '@/components/profile/UserProfileDialog';

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
  const { user } = useAuth();

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
      // Basic info
      name: profile.metadata.name || '',
      role: profile.metadata.role || '',
      gender: profile.metadata.gender || '',
      
      // Who I Am data
      whoIAm: {
        phone: profile.metadata.whoIAm?.phone || '',
        hometown: profile.metadata.whoIAm?.hometown || '',
        location: profile.metadata.whoIAm?.location || '',
        currentLocation: profile.metadata.whoIAm?.currentLocation || '',
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
      
      // What I Have data
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
      
      // What I Want data
      whatIWant: {
        monthlyPFESIC: profile.metadata.whatIWant?.monthlyPFESIC || '',
        workHoursPerDay: profile.metadata.whatIWant?.workHoursPerDay || profile.metadata.workHoursPerDay || undefined,
        preferredModeOfWork: profile.metadata.whatIWant?.preferredModeOfWork || [],
        monthlyOTExpectation: profile.metadata.whatIWant?.monthlyOTExpectation || undefined,
        monthlyInHandPreferred: profile.metadata.whatIWant?.monthlyInHandPreferred || undefined
      },
      
      // Legacy fields
      interestedRole: profile.metadata.role || '',
      interestedIndustry: '',
      currentLocation: profile.metadata.whoIAm?.currentLocation || profile.metadata.whoIAm?.location || '',
      desiredLocation: profile.metadata.whoIAm?.desiredLocation || '',
      phone: profile.metadata.whoIAm?.phone || '',
      age: profile.metadata.whatIHave?.age || undefined,
      dateOfBirth: profile.metadata.whoIAm?.dateOfBirth || profile.metadata.dateOfBirth || '',
      hometown: profile.metadata.whoIAm?.hometown || '',
      aadharNumber: profile.metadata.whoIAm?.aadharNumber || '',
      isNameVerified: profile.metadata.whoIAm?.isNameVerified || profile.metadata.isNameVerified || false,
      isAgeVerified: profile.metadata.whoIAm?.isAgeVerified || profile.metadata.isAgeVerified || false,
      previousCompany: profile.metadata.whatIHave?.previousCompany || profile.metadata.previousCompany || '',
      skillProofVideo: profile.metadata.whatIHave?.skillProofVideo || profile.metadata.skillProofVideo || '',
      workHoursPerDay: profile.metadata.whatIWant?.workHoursPerDay || profile.metadata.workHoursPerDay || undefined,
      experience: profile.metadata.workExperience || [],
      skills: [],
      certificates: [],
      education: [],
      skillCertifications: [],
      workExperience: profile.metadata.workExperience || [],
      assessmentScores: [],
      documentVerificationStatus: []
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold">View All Profiles</h2>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Search Bar */}
            <div className="p-6 border-b">
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
                        <TableCell colSpan={10} className="text-center py-8">
                          No profiles found
                        </TableCell>
                      </TableRow>
                    ) : (
                      profiles.map((profile) => (
                        <TableRow key={profile.id}>
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditProfile(profile)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
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
        </div>
      </div>

      {/* Edit Profile Dialog */}
      {showEditDialog && editingProfile && (
        <UserProfileDialog
          isOpen={showEditDialog}
          onClose={handleCloseEditDialog}
          mode="user"
          isUpdate={true}
          profileId={editingProfile.id}
          initialProfile={transformProfileForEdit(editingProfile)}
        />
      )}
    </>
  );
};

export default ViewAllProfiles;
