import { useState, useEffect } from 'react';
import organizationsData from '@/data/organizations.json';

export interface Organization {
  name: string;
  code: string;
  slug: string;
  type: string;
  location: string;
  address: string;
  state: string;
  district: string;
}

export interface District {
  name: string;
  organizations: Organization[];
}

export interface State {
  name: string;
  districts: District[];
}

export interface OrganizationsData {
  states: State[];
}

export const useOrganizationSelection = () => {
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [availableStates, setAvailableStates] = useState<State[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<District[]>([]);
  const [availableOrganizations, setAvailableOrganizations] = useState<Organization[]>([]);

  // Load organizations data
  useEffect(() => {
    setAvailableStates(organizationsData.states);
  }, []);

  // Update districts when state changes
  useEffect(() => {
    if (selectedState) {
      const state = availableStates.find(s => s.name === selectedState);
      if (state) {
        setAvailableDistricts(state.districts);
        setSelectedDistrict('');
        setSelectedOrganization(null);
      } else {
        setAvailableDistricts([]);
      }
    } else {
      setAvailableDistricts([]);
      setSelectedDistrict('');
      setSelectedOrganization(null);
    }
  }, [selectedState, availableStates]);

  // Update organizations when district changes
  useEffect(() => {
    if (selectedDistrict) {
      const district = availableDistricts.find(d => d.name === selectedDistrict);
      if (district) {
        setAvailableOrganizations(district.organizations);
        setSelectedOrganization(null);
      } else {
        setAvailableOrganizations([]);
      }
    } else {
      setAvailableOrganizations([]);
      setSelectedOrganization(null);
    }
  }, [selectedDistrict, availableDistricts]);

  const handleStateChange = (stateName: string) => {
    setSelectedState(stateName);
  };

  const handleDistrictChange = (districtName: string) => {
    setSelectedDistrict(districtName);
  };

  const handleOrganizationChange = (organization: Organization | null) => {
    setSelectedOrganization(organization);
  };

  const resetSelection = () => {
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedOrganization(null);
  };

  return {
    selectedState,
    selectedDistrict,
    selectedOrganization,
    availableStates,
    availableDistricts,
    availableOrganizations,
    handleStateChange,
    handleDistrictChange,
    handleOrganizationChange,
    resetSelection,
  };
};
