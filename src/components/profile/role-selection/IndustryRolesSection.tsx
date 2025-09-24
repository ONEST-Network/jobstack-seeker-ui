import React from 'react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { JOB_ROLES_BY_INDUSTRY } from '@/constants/jobRoles';
import { useProfileRestrictions } from '@/hooks/useProfileRestrictions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

interface IndustryRolesSectionProps {
  filteredRoles: Partial<typeof JOB_ROLES_BY_INDUSTRY>;
  selectedRole?: string;
  onRoleSelect: (role: string, industry: string) => void;
}

const IndustryRolesSection: React.FC<IndustryRolesSectionProps> = ({
  filteredRoles,
  selectedRole,
  onRoleSelect
}) => {
  const { 
    hasRestrictions, 
    isRoleAllowed, 
    loading: restrictionsLoading 
  } = useProfileRestrictions();

  // Apply profile restrictions to filtered roles
  const getRestrictedRoles = () => {
    if (!hasRestrictions) return filteredRoles;

    const restrictedRoles: Partial<typeof JOB_ROLES_BY_INDUSTRY> = {};
    
    Object.entries(filteredRoles).forEach(([industry, roles]) => {
      if (roles) {
        const allowedRoles = roles.filter(role => isRoleAllowed(role));
        if (allowedRoles.length > 0) {
          restrictedRoles[industry as keyof typeof JOB_ROLES_BY_INDUSTRY] = allowedRoles;
        }
      }
    });

    return restrictedRoles;
  };

  if (restrictionsLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading available roles...
      </div>
    );
  }

  const finalRoles = getRestrictedRoles();
  const industries = Object.keys(finalRoles);

  if (industries.length === 0) return null;

  const getIndustryIcon = (industry: string) => {
    switch (industry) {
      case 'Textile Industry': return '🧵';
      case 'Warehousing Industry': return '📦';
      case 'Hospitality': return '🏨';
      case 'Semiconductor': return '💻';
      case 'Manufacturing': return '🏭';
      case 'Electric Vehicles': return '🚗';
      case 'Sales': return '💼';
      case 'Administration': return '📋';
      default: return '💼';
    }
  };

  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-3">Browse by Industry</h4>
      
      {hasRestrictions && (
        <Alert className="mb-4">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Only showing roles available for this organization.
          </AlertDescription>
        </Alert>
      )}
      
      <Accordion type="multiple" defaultValue={industries} className="w-full">
        {Object.entries(finalRoles).map(([industry, roles]) => (
          <AccordionItem key={industry} value={industry}>
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getIndustryIcon(industry)}</span>
                <span className="font-medium">{industry}</span>
                <span className="text-sm text-muted-foreground">({roles!.length} roles)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {roles!.map(role => (
                  <Button
                    key={role}
                    variant={selectedRole === role ? "default" : "outline"}
                    onClick={() => onRoleSelect(role, industry)}
                    className="h-auto p-3 text-left justify-start text-wrap"
                    title={role}
                  >
                    <span className="text-sm leading-tight">{role}</span>
                  </Button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default IndustryRolesSection;