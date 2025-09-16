import React from 'react';
import { Button } from '@/components/ui/button';

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
  if (roles.length === 0) return null;

  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <span className="text-lg">⭐</span>
        {isUpdate ? 'Current Role (Read Only)' : 'Popular Roles'}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {roles.map(role => (
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