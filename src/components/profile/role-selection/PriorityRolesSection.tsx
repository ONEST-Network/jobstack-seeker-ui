import React from 'react';
import { Button } from '@/components/ui/button';
import { useProfileRestrictions } from '@/hooks/useProfileRestrictions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

interface PriorityRolesSectionProps {
  roles: string[];
  selectedRole?: string;
  onRoleSelect: (role: string) => void;
  isUpdate?: boolean;
}

const PriorityRolesSection: React.FC<PriorityRolesSectionProps> = ({
  roles,
  selectedRole,
  onRoleSelect,
  isUpdate = false
}) => {
  const { 
    hasRestrictions, 
    isRoleAllowed, 
    loading: restrictionsLoading 
  } = useProfileRestrictions();

  // Apply profile restrictions
  const getFilteredRoles = () => {
    if (!hasRestrictions) return roles;
    return roles.filter(role => isRoleAllowed(role));
  };

  if (restrictionsLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading available roles...
      </div>
    );
  }

  const filteredRoles = getFilteredRoles();

  if (filteredRoles.length === 0) return null;

  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <span className="text-lg">⭐</span>
        {isUpdate ? 'Current Role (Read Only)' : 'Popular Roles'}
      </h4>
      
      {hasRestrictions && !isUpdate && (
        <Alert className="mb-4">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Only showing roles available for this organization.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredRoles.map(role => (
          <Button
            key={role}
            variant={selectedRole === role ? "default" : "outline"}
            onClick={() => onRoleSelect(role)}
            className={`h-auto p-3 text-left justify-start text-wrap ${isUpdate ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={role}
            disabled={isUpdate}
          >
            <span className="text-sm leading-tight">{role}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default PriorityRolesSection;