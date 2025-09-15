import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrganizationSelection, Organization } from '@/hooks/useOrganizationSelection';

interface OrganizationSelectionProps {
  onOrganizationSelect: (organization: Organization | null) => void;
  selectedOrganization?: Organization | null;
}

const OrganizationSelection: React.FC<OrganizationSelectionProps> = ({
  onOrganizationSelect,
  selectedOrganization
}) => {
  const {
    selectedState,
    selectedDistrict,
    availableStates,
    availableDistricts,
    availableOrganizations,
    handleStateChange,
    handleDistrictChange,
    handleOrganizationChange,
  } = useOrganizationSelection();

  const handleStateSelect = (stateName: string) => {
    handleStateChange(stateName);
    onOrganizationSelect(null);
  };

  const handleDistrictSelect = (districtName: string) => {
    handleDistrictChange(districtName);
    onOrganizationSelect(null);
  };

  const handleOrganizationSelect = (organizationSlug: string) => {
    const organization = availableOrganizations.find(org => org.slug === organizationSlug) || null;
    handleOrganizationChange(organization);
    onOrganizationSelect(organization);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <Label htmlFor="state" className="text-sm font-medium">State</Label>
        <Select value={selectedState} onValueChange={handleStateSelect}>
          <SelectTrigger className="h-10 sm:h-11 text-sm">
            <SelectValue placeholder="Select a state" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px] sm:max-h-[300px]">
            {availableStates.map((state) => (
              <SelectItem key={state.name} value={state.name} className="text-sm">
                {state.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedState && (
        <div>
          <Label htmlFor="district" className="text-sm font-medium">District</Label>
          <Select value={selectedDistrict} onValueChange={handleDistrictSelect}>
            <SelectTrigger className="h-10 sm:h-11 text-sm">
              <SelectValue placeholder="Select a district" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px] sm:max-h-[300px]">
              {availableDistricts.map((district) => (
                <SelectItem key={district.name} value={district.name} className="text-sm">
                  {district.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedDistrict && (
        <div>
          <Label htmlFor="organization" className="text-sm font-medium">Organization/College</Label>
          <Select 
            value={selectedOrganization?.slug || ''} 
            onValueChange={handleOrganizationSelect}
          >
            <SelectTrigger className="h-10 sm:h-11 text-sm">
              <SelectValue placeholder="Select an organization" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px] sm:max-h-[300px] max-w-[calc(100vw-2rem)]">
              {availableOrganizations.map((organization) => (
                <SelectItem key={organization.slug} value={organization.slug} className="text-sm">
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium truncate">{organization.name}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {organization.type} • {organization.location}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedOrganization && (
        <div className="p-3 bg-muted rounded-lg">
          <h4 className="font-medium text-sm">Selected Organization:</h4>
          <p className="text-sm font-medium truncate">{selectedOrganization.name}</p>
          <p className="text-xs text-muted-foreground">
            {selectedOrganization.type} • {selectedOrganization.location} • {selectedOrganization.district}
          </p>
          {selectedOrganization.address && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {selectedOrganization.address}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default OrganizationSelection;
