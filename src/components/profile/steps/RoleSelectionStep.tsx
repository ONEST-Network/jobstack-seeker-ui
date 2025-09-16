import React from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Briefcase, SearchX } from 'lucide-react';
import { JOB_ROLES_BY_INDUSTRY } from '@/constants/jobRoles';
import { getSectorForRole } from '@/constants/sectors';
import { useProfileForm } from '../ProfileFormProvider';
import SectorRolesSection from '../role-selection/SectorRolesSection';
import { jobSectorsConfig } from '@/schemas';

interface RoleSelectionStepProps {
  onVoiceStart?: () => void;
  isUpdate?: boolean;
}

const RoleSelectionStep: React.FC<RoleSelectionStepProps> = ({
  onVoiceStart,
  isUpdate = false
}) => {
  const {
    profile,
    setProfile,
    searchQuery,
    setSearchQuery
  } = useProfileForm();

  // Get all available roles from sectors for searching
  const getAllRoles = () => {
    const allRoles: string[] = [];
    Object.values(jobSectorsConfig.sectors).forEach(sector => {
      allRoles.push(...sector.roles);
    });
    return allRoles;
  };

  const allRoles = getAllRoles();
  
  const getFilteredRoles = () => {
    if (!searchQuery) return allRoles;
    return allRoles.filter(role => role.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const handleRoleSelection = (role: string) => {
    // Don't allow role selection in update mode
    if (isUpdate) {
      return;
    }
    
    // Get sector for the selected role (this will be shown as "Industry")
    const roleSector = getSectorForRole(role);
    
    setProfile({
      ...profile,
      interestedRole: role,
      interestedIndustry: roleSector
    });
  };

  const filteredRoles = getFilteredRoles();
  const hasSearchResults = filteredRoles.length > 0;

  return (
    <div className="flex flex-col h-full max-h-[60vh]">
      {/* Header - Fixed */}
      <div className="text-center mb-4 flex-shrink-0">
        <p className="text-sm text-muted-foreground">
          {isUpdate ? 'Current role (cannot be changed)' : 'Find suitable work for you'}
        </p>
      </div>
      
      {/* Search Bar - Fixed (only show when not in update mode) */}
      {!isUpdate && (
        <div className="relative mb-4 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search job roles..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
      )}

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-6">
            {/* No Results Message */}
            {searchQuery && !hasSearchResults && (
              <div className="text-center py-8">
                <SearchX className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium text-foreground mb-2">No roles found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  We couldn't find any job roles matching "{searchQuery}"
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Try searching for roles from these sectors:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Garment Manufacturing:</strong> Industrial Tailor, Warehouse Loader & Picker</li>
                    <li><strong>Customer Facing:</strong> Field Sales Person, Tele Salesperson, In Store Promoter, Recruitment Associate</li>
                    <li><strong>ITeS:</strong> Data Entry Operator</li>
                    <li><strong>ITI/Polytechnic:</strong> Electrician, Fitter, Mechanic, Machine Operator, ITI (Other)</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Sector-based Roles - Always visible at top (when there are results) */}
            {hasSearchResults && (
              <SectorRolesSection 
                selectedRole={profile.interestedRole} 
                onRoleSelect={handleRoleSelection}
                searchQuery={searchQuery}
                isUpdate={isUpdate}
              />
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Selected Role Display - Fixed */}
      {profile.interestedRole && (
        <div className={`mt-4 p-3 border rounded-lg flex-shrink-0 ${isUpdate ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center gap-2">
            <Briefcase className={`h-4 w-4 flex-shrink-0 ${isUpdate ? 'text-gray-600' : 'text-blue-600'}`} />
            <div className="min-w-0">
              <p className={`font-medium text-sm truncate ${isUpdate ? 'text-gray-900' : 'text-blue-900'}`}>
                {isUpdate ? 'Current Role' : 'Selected'}: {profile.interestedRole}
              </p>
              <p className={`text-xs truncate ${isUpdate ? 'text-gray-700' : 'text-blue-700'}`}>
                Industry: {profile.interestedIndustry}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSelectionStep;