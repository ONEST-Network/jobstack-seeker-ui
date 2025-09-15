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
import { useTranslation } from 'react-i18next';

const JobFilters = () => {
  const { t } = useTranslation("jobfilters");
  const [salaryRange, setSalaryRange] = useState([15000, 50000]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  const jobRoles = t('filters.jobRoles', { returnObjects: true }) as string[];
  const locations = t('filters.locations', { returnObjects: true }) as string[];

  const workTypes = t('filters.workTypes', { returnObjects: true }) as { id: string; label: string }[];
  const experienceLevels = t('filters.experienceLevels', { returnObjects: true }) as { id: string; label: string }[];
  const qualifications = t('filters.qualifications', { returnObjects: true }) as { id: string; label: string }[];
  const benefits = t('filters.benefits', { returnObjects: true }) as { id: string; label: string }[];

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
        <h3 className="text-lg font-semibold text-foreground">{t('filters.title')}</h3>
        <Button variant="ghost" size="sm" onClick={clearAllFilters}>
          {t('filters.clearAll')}
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={["location", "role", "salary"]} className="space-y-2">
        {/* Location Filter */}
        <AccordionItem value="location">
          <AccordionTrigger className="text-sm font-medium">{t('filters.location.title')}</AccordionTrigger>
          <AccordionContent className="space-y-3">
            <Input placeholder={t('filters.location.searchPlaceholder')} className="text-sm" />
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
          <AccordionTrigger className="text-sm font-medium">{t('filters.role.title')}</AccordionTrigger>
          <AccordionContent className="space-y-3">
            <Input placeholder={t('filters.role.searchPlaceholder')} className="text-sm" />
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
          </AccordionContent>
        </AccordionItem>

        {/* Salary Range Filter */}
        <AccordionItem value="salary">
          <AccordionTrigger className="text-sm font-medium">{t('filters.salary.title')}</AccordionTrigger>
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
          <AccordionTrigger className="text-sm font-medium">{t('filters.workType.title')}</AccordionTrigger>
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
          <AccordionTrigger className="text-sm font-medium">{t('filters.experience.title')}</AccordionTrigger>
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
          <AccordionTrigger className="text-sm font-medium">{t('filters.education.title')}</AccordionTrigger>
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
          <AccordionTrigger className="text-sm font-medium">{t('filters.benefits.title')}</AccordionTrigger>
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
          <AccordionTrigger className="text-sm font-medium">{t('filters.date.title')}</AccordionTrigger>
          <AccordionContent>
            <Select>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder={t('filters.date.placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">{t('filters.date.options.today')}</SelectItem>
                <SelectItem value="week">{t('filters.date.options.week')}</SelectItem>
                <SelectItem value="month">{t('filters.date.options.month')}</SelectItem>
                <SelectItem value="all">{t('filters.date.options.all')}</SelectItem>
              </SelectContent>
            </Select>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mt-6 pt-6 border-t border-border">
        <Button className="w-full bg-primary hover:bg-primary/90">
          {t('filters.apply')}
        </Button>
      </div>
    </div>
  );
};

export default JobFilters;
