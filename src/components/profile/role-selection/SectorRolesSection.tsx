import React from 'react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { jobSectorsConfig } from '@/schemas';
import { useProfileRestrictions } from '@/hooks/useProfileRestrictions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

interface SectorRolesSectionProps {
  selectedRole?: string;
  onRoleSelect: (role: string) => void;
  searchQuery?: string;
  isUpdate?: boolean;
}

const SectorRolesSection: React.FC<SectorRolesSectionProps> = ({
  selectedRole,
  onRoleSelect,
  searchQuery = '',
  isUpdate = false
}) => {
  const sectors = jobSectorsConfig.sectors;
  const { 
    hasRestrictions, 
    isRoleAllowed, 
    isSectorAllowed, 
    allowedSectors, 
    allowedRoles,
    loading: restrictionsLoading 
  } = useProfileRestrictions();

  // Filter sectors and roles based on search query AND profile restrictions
  const getFilteredSectors = (): Record<string, { description: string; roles: string[] }> => {
    // When not in update mode, only show "Any" sector
    if (!isUpdate) {
      return { "Any": sectors["Any"] };
    }
    let sectorsToFilter = sectors;

    // Apply profile restrictions first if they exist
    if (hasRestrictions) {
      const restrictedSectors: Record<string, { description: string; roles: string[] }> = {};
      
      Object.entries(sectors).forEach(([sectorName, sectorData]) => {
        // Only include sector if it's allowed OR if some of its roles are allowed
        if (isSectorAllowed(sectorName)) {
          // Filter roles within the sector to only allowed ones
          const allowedRolesInSector = sectorData.roles.filter(role => isRoleAllowed(role));
          
          if (allowedRolesInSector.length > 0) {
            restrictedSectors[sectorName] = {
              ...sectorData,
              roles: allowedRolesInSector
            };
          }
        }
      });
      
      sectorsToFilter = restrictedSectors as typeof sectors;
    }

    // Then apply search filtering
    if (!searchQuery) return sectorsToFilter;

    const filtered: Record<string, { description: string; roles: string[] }> = {};
    
    Object.entries(sectorsToFilter).forEach(([sectorName, sectorData]) => {
      const matchingSectorName = sectorName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchingRoles = sectorData.roles.filter(role => 
        role.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (matchingSectorName || matchingRoles.length > 0) {
        filtered[sectorName] = {
          ...sectorData,
          roles: matchingSectorName ? sectorData.roles : matchingRoles
        };
      }
    });

    return filtered;
  };

  if (restrictionsLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading available roles...
      </div>
    );
  }

  const filteredSectors = getFilteredSectors();
  const hasResults = Object.keys(filteredSectors).length > 0;

  if (!hasResults) {
    return null;
  }

  // Check if there's only one sector with results and expand it by default
  const sectorKeys = Object.keys(filteredSectors);
  const defaultOpenSector = sectorKeys.length === 1 ? sectorKeys[0] : undefined;

  return (
    <div>
     {isUpdate && (
        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="text-lg">⭐</span>
          Current Role (Read Only)
        </h4>
      )}
      
      {hasRestrictions && !isUpdate && (
        <Alert className="mb-4">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Only showing roles available for this organization. 
            {allowedSectors.length > 0 && (
              <span> Allowed sectors: {allowedSectors.join(', ')}.</span>
            )}
            {allowedRoles.length > 0 && (
              <span> Additional allowed roles: {allowedRoles.join(', ')}.</span>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      <Accordion type="single" collapsible defaultValue={defaultOpenSector} className="space-y-2">
        {Object.entries(filteredSectors).map(([sectorName, sectorData]) => (
          <AccordionItem key={sectorName} value={sectorName} className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-left">{sectorName}</span>
                <span className="text-xs text-muted-foreground mr-2">
                  {sectorData.roles.length} role{sectorData.roles.length !== 1 ? 's' : ''}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <p className="text-xs text-muted-foreground mb-3">
                {sectorData.description}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sectorData.roles.map(role => (
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
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default SectorRolesSection;
