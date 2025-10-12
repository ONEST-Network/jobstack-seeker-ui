
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/useI18n';
import { useProfileRestrictions } from '@/hooks/useProfileRestrictions';
import { getAllAvailableRoles } from '@/constants/sectors';

const JobFilters = () => {
  const t = useTranslation('jobs');
  const [salaryRange, setSalaryRange] = useState([15000, 50000]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  const { 
    hasRestrictions, 
    allowedRoles, 
    loading: restrictionsLoading 
  } = useProfileRestrictions();

  // Get available job roles based on restrictions
  const getAvailableJobRoles = () => {
    if (hasRestrictions) {
      return allowedRoles;
    }
    
    // Fallback to all available roles from sectors plus some additional common roles
    const allRoles = getAllAvailableRoles();
    const additionalRoles = [
      'Driver', 'Security Guard', 'Mason', 'Painter', 
      'Factory Worker', 'Sales Representative', 'Cook', 'Cleaner'
    ];
    
    return [...allRoles, ...additionalRoles];
  };

  const jobRoles = getAvailableJobRoles();

  const locations = [
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad',
    'Kolkata', 'Pune', 'Ahmedabad', 'Surat', 'Jaipur',
    'Lucknow', 'Kanpur', 'Nagpur', 'Indore'
  ];

  const workTypes = [
    { id: 'full-time', label: 'Full-time' },
    { id: 'part-time', label: 'Part-time' },
    { id: 'contract', label: 'Contract' },
    { id: 'internship', label: 'Internship' },
    { id: 'trainee', label: 'Trainee' }
  ];

  const experienceLevels = [
    { id: 'fresher', label: 'Fresher (0-1 years)' },
    { id: 'junior', label: 'Junior (1-3 years)' },
    { id: 'mid', label: 'Mid-level (3-5 years)' },
    { id: 'senior', label: 'Senior (5+ years)' }
  ];

  const qualifications = [
    { id: '10th', label: '10th Pass' },
    { id: '12th', label: '12th Pass' },
    { id: 'iti', label: 'ITI' },
    { id: 'diploma', label: 'Diploma' },
    { id: 'graduation', label: 'Graduation' }
  ];

  const benefits = [
    { id: 'accommodation', label: 'Accommodation' },
    { id: 'transportation', label: 'Transportation' },
    { id: 'insurance', label: 'Health Insurance' },
    { id: 'pf', label: 'Provident Fund' },
    { id: 'food', label: 'Food Allowance' },
    { id: 'bonus', label: 'Performance Bonus' }
  ];

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleLocationToggle = (location: string) => {
    setSelectedLocations(prev => 
      prev.includes(location) 
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  const clearAllFilters = () => {
    setSalaryRange([15000, 50000]);
    setSelectedRoles([]);
    setSelectedLocations([]);
  };

  return (
    <div className="p-6 bg-background border-r border-border h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Filters</h3>
        <Button variant="ghost" size="sm" onClick={clearAllFilters}>
          Clear All
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={["location", "role", "salary"]} className="space-y-2">
        {/* Location Filter */}
        <AccordionItem value="location">
          <AccordionTrigger className="text-sm font-medium">Location</AccordionTrigger>
          <AccordionContent className="space-y-3">
            <Input placeholder="Search locations..." className="text-sm" />
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {locations.map((location) => (
                <div key={location} className="flex items-center space-x-2">
                  <Checkbox
                    id={`location-${location}`}
                    checked={selectedLocations.includes(location)}
                    onCheckedChange={() => handleLocationToggle(location)}
                  />
                  <Label htmlFor={`location-${location}`} className="text-sm flex-1 cursor-pointer">
                    {location}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Job Role Filter */}
        <AccordionItem value="role">
          <AccordionTrigger className="text-sm font-medium">
            Job Role {hasRestrictions && `(${jobRoles.length} available)`}
          </AccordionTrigger>
          <AccordionContent className="space-y-3">
            {hasRestrictions && (
              <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                Only showing roles available for this organization
              </div>
            )}
            <Input placeholder={t('jobFilters.searchRoles', 'Search roles...')} className="text-sm" />
            {restrictionsLoading ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                Loading available roles...
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {jobRoles.map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role}`}
                      checked={selectedRoles.includes(role)}
                      onCheckedChange={() => handleRoleToggle(role)}
                    />
                    <Label htmlFor={`role-${role}`} className="text-sm flex-1 cursor-pointer">
                      {role}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Salary Range Filter */}
        <AccordionItem value="salary">
          <AccordionTrigger className="text-sm font-medium">Salary Range</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="px-2">
              <Slider
                value={salaryRange}
                onValueChange={setSalaryRange}
                max={100000}
                min={10000}
                step={1000}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>₹{salaryRange[0].toLocaleString()}</span>
                <span>₹{salaryRange[1].toLocaleString()}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Work Type Filter */}
        <AccordionItem value="worktype">
          <AccordionTrigger className="text-sm font-medium">Work Type</AccordionTrigger>
          <AccordionContent className="space-y-2">
            {workTypes.map((type) => (
              <div key={type.id} className="flex items-center space-x-2">
                <Checkbox id={type.id} />
                <Label htmlFor={type.id} className="text-sm cursor-pointer">
                  {type.label}
                </Label>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Experience Level Filter */}
        <AccordionItem value="experience">
          <AccordionTrigger className="text-sm font-medium">Experience Level</AccordionTrigger>
          <AccordionContent className="space-y-2">
            {experienceLevels.map((level) => (
              <div key={level.id} className="flex items-center space-x-2">
                <Checkbox id={level.id} />
                <Label htmlFor={level.id} className="text-sm cursor-pointer">
                  {level.label}
                </Label>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Education Filter */}
        <AccordionItem value="education">
          <AccordionTrigger className="text-sm font-medium">Education</AccordionTrigger>
          <AccordionContent className="space-y-2">
            {qualifications.map((qual) => (
              <div key={qual.id} className="flex items-center space-x-2">
                <Checkbox id={qual.id} />
                <Label htmlFor={qual.id} className="text-sm cursor-pointer">
                  {qual.label}
                </Label>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Benefits Filter */}
        <AccordionItem value="benefits">
          <AccordionTrigger className="text-sm font-medium">Benefits</AccordionTrigger>
          <AccordionContent className="space-y-2">
            {benefits.map((benefit) => (
              <div key={benefit.id} className="flex items-center space-x-2">
                <Checkbox id={benefit.id} />
                <Label htmlFor={benefit.id} className="text-sm cursor-pointer">
                  {benefit.label}
                </Label>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Date Posted Filter */}
        <AccordionItem value="date">
          <AccordionTrigger className="text-sm font-medium">Date Posted</AccordionTrigger>
          <AccordionContent>
            <Select>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mt-6 pt-6 border-t border-border">
        <Button className="w-full bg-primary hover:bg-primary/90">
          Apply Filters
        </Button>
      </div>
    </div>
  );
};

export default JobFilters;
