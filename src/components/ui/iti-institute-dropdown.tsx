import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ChevronDown, Search, MapPin } from 'lucide-react';
import organizationsData from '@/data/organizations.json';

interface Organization {
  name: string;
  slug: string;
  code: string;
  type: string;
  location: string;
  address: string;
  state: string;
  district: string;
}

interface ITIInstituteDropdownProps {
  value?: string; // The organization name
  slug?: string; // The organization slug
  onChange: (name: string, slug: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  description?: string;
}

export const ITIInstituteDropdown: React.FC<ITIInstituteDropdownProps> = ({
  value = '',
  slug = '',
  onChange,
  placeholder = 'Search and select your ITI Institute...',
  disabled = false,
  label = 'ITI Institute',
  description = 'Select your institute name from the list below'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Flatten organizations from the nested JSON structure
  useEffect(() => {
    const organizations: Organization[] = [];
    
    organizationsData.states.forEach(state => {
      state.districts.forEach(district => {
        district.organizations.forEach(org => {
          organizations.push({
            name: org.name,
            slug: org.slug,
            code: org.code,
            type: org.type,
            location: org.location,
            address: org.address,
            state: state.name,
            district: district.name
          });
        });
      });
    });
    
    setAllOrganizations(organizations);
    setFilteredOrganizations(organizations);
  }, []);

  // Filter organizations based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrganizations(allOrganizations);
    } else {
      const filtered = allOrganizations.filter(org =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOrganizations(filtered);
    }
  }, [searchQuery, allOrganizations]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleSelect = (organization: Organization) => {
    onChange(organization.name, organization.slug);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Focus the search input when opening
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const getDisplayValue = () => {
    if (value) {
      return value;
    }
    return '';
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {label && (
        <Label className="text-sm font-medium mb-2 block">
          {label}
        </Label>
      )}
      
      {description && (
        <p className="text-sm text-muted-foreground mb-3">
          {description}
        </p>
      )}
      
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          className={`w-full justify-between text-left font-normal ${
            !value ? 'text-muted-foreground' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleToggle}
          disabled={disabled}
        >
          <span className="truncate">
            {getDisplayValue() || placeholder}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg">
            {/* Search Input */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search institutes..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto">
              {filteredOrganizations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {searchQuery ? 'No institutes found' : 'Loading institutes...'}
                </div>
              ) : (
                filteredOrganizations.map((org) => (
                  <button
                    key={org.slug}
                    type="button"
                    className="w-full text-left p-3 hover:bg-muted transition-colors border-b last:border-b-0"
                    onClick={() => handleSelect(org)}
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{org.name}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{org.district}, {org.state}</span>
                        <span>•</span>
                        <span>{org.type}</span>
                        <span>•</span>
                        <span>{org.location}</span>
                      </div>
                      {org.address && (
                        <div className="text-xs text-muted-foreground truncate">
                          {org.address}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ITIInstituteDropdown;
