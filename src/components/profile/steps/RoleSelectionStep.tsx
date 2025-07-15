import React from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Briefcase } from 'lucide-react';
import { JOB_ROLES_BY_INDUSTRY } from '@/constants/jobRoles';
import { useProfileForm } from '../ProfileFormProvider';
import PriorityRolesSection from '../role-selection/PriorityRolesSection';
import IndustryRolesSection from '../role-selection/IndustryRolesSection';
interface RoleSelectionStepProps {
  onVoiceStart?: () => void;
}
const RoleSelectionStep: React.FC<RoleSelectionStepProps> = ({
  onVoiceStart
}) => {
  const {
    profile,
    setProfile,
    searchQuery,
    setSearchQuery
  } = useProfileForm();

  // Priority roles to show at top
  const priorityRoles = ['Industrial Tailor', 'Warehouse Loader & Picker',/* 'Field Sales Executive',*/ 'In Store Promoter', 'Recruitment Associate'];
  const getFilteredRoles = () => {
    if (!searchQuery) return JOB_ROLES_BY_INDUSTRY;
    const filtered: Partial<typeof JOB_ROLES_BY_INDUSTRY> = {};
    Object.entries(JOB_ROLES_BY_INDUSTRY).forEach(([industry, roles]) => {
      const matchingRoles = roles.filter(role => role.toLowerCase().includes(searchQuery.toLowerCase()));
      if (matchingRoles.length > 0) {
        filtered[industry as keyof typeof JOB_ROLES_BY_INDUSTRY] = matchingRoles;
      }
    });
    return filtered;
  };
  const getFilteredPriorityRoles = () => {
    if (!searchQuery) return priorityRoles;
    return priorityRoles.filter(role => role.toLowerCase().includes(searchQuery.toLowerCase()));
  };
  const handleRoleSelection = (role: string, industry?: string) => {
    // Find industry for priority roles if not provided
    let roleIndustry = industry;
    if (!roleIndustry) {
      for (const [ind, roles] of Object.entries(JOB_ROLES_BY_INDUSTRY)) {
        if (roles.includes(role)) {
          roleIndustry = ind;
          break;
        }
      }
    }
    setProfile({
      ...profile,
      interestedRole: role,
      interestedIndustry: roleIndustry || 'Other'
    });
  };
  const filteredRoles = getFilteredRoles();
  const filteredPriorityRoles = getFilteredPriorityRoles();
  const industries = Object.keys(filteredRoles);
  return <div className="flex flex-col h-full max-h-[60vh]">
      {/* Header - Fixed */}
      <div className="text-center mb-4 flex-shrink-0">
        
        <p className="text-sm text-muted-foreground">Find suitable work for you</p>
      </div>
      
      {/* Search Bar - Fixed */}
      <div className="relative mb-4 flex-shrink-0">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input placeholder="Search job roles..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-6">
            {/* Priority Roles - Always visible at top */}
            <PriorityRolesSection roles={filteredPriorityRoles} selectedRole={profile.interestedRole} onRoleSelect={role => handleRoleSelection(role)} />

            {/* All Other Roles in Accordion */}
            <IndustryRolesSection filteredRoles={filteredRoles} selectedRole={profile.interestedRole} onRoleSelect={handleRoleSelection} />
          </div>
        </ScrollArea>
      </div>

      {/* Selected Role Display - Fixed */}
      {profile.interestedRole && <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex-shrink-0">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-blue-900 text-sm truncate">Selected: {profile.interestedRole}</p>
              <p className="text-xs text-blue-700 truncate">Industry: {profile.interestedIndustry}</p>
            </div>
          </div>
        </div>}
    </div>;
};
export default RoleSelectionStep;