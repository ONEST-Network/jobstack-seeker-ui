import React from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Briefcase, SearchX } from 'lucide-react';
import { JOB_ROLES_BY_INDUSTRY } from '@/constants/jobRoles';
import { useProfileForm } from '../ProfileFormProvider';
import PriorityRolesSection from '../role-selection/PriorityRolesSection';

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

  // Priority roles to show at top
  const priorityRoles = ['Industrial Tailor', 'Warehouse Loader & Picker',/* 'Field Sales Executive',*/ 'In Store Promoter', 'Recruitment Associate', 'Electrician', 'Fitter', 'Mechanic', 'Machine Operator', 'Data Entry Operator', 'Tele Salesperson', 'Field Sales Person', 'Generic ITI'];
  
  const getFilteredPriorityRoles = () => {
    if (!searchQuery) return priorityRoles;
    return priorityRoles.filter(role => role.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const handleRoleSelection = (role: string) => {
    // Don't allow role selection in update mode
    if (isUpdate) {
      return;
    }
    
    // Find industry for the selected role
    let roleIndustry = 'Other';
    for (const [industry, roles] of Object.entries(JOB_ROLES_BY_INDUSTRY)) {
      if (roles.includes(role)) {
        roleIndustry = industry;
        break;
      }
    }
    
    setProfile({
      ...profile,
      interestedRole: role,
      interestedIndustry: roleIndustry
    });
  };

  const filteredPriorityRoles = getFilteredPriorityRoles();
  const hasSearchResults = filteredPriorityRoles.length > 0;

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
                  <p>Try searching for:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Industrial Tailor</li>
                    <li>Warehouse Loader & Picker</li>
                    <li>In Store Promoter</li>
                    <li>Recruitment Associate</li>
                    <li>Electrician, Fitter, Mechanic</li>
                    <li>Machine Operator</li>
                    <li>Data Entry Operator</li>
                    <li>Tele Salesperson</li>
                    <li>Field Sales Person</li>
                    <li>Generic ITI</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Priority Roles - Always visible at top (when there are results) */}
            {hasSearchResults && (
              <PriorityRolesSection 
                roles={filteredPriorityRoles} 
                selectedRole={profile.interestedRole} 
                onRoleSelect={handleRoleSelection}
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