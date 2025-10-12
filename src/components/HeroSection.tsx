
import React, { useState } from 'react';
import { Search, MapPin, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/hooks/useI18n';

const HeroSection = () => {
  const [searchLocation, setSearchLocation] = useState('');
  const [searchRole, setSearchRole] = useState('');
  const t = useTranslation('hero');

  const jobRoles = t('jobRoles') || [
    'Electrician',
    'Plumber',
    'Carpenter',
    'Welder',
    'Driver',
    'Security Guard',
    'Tailor',
    'Mason',
    'Painter',
    'Machine Operator',
    'Factory Worker',
    'Sales Representative',
  ];

  const locations = t('locations') || [
    'Mumbai',
    'Delhi',
    'Bangalore',
    'Chennai',
    'Hyderabad',
    'Kolkata',
    'Pune',
    'Ahmedabad',
    'Surat',
    'Jaipur',
    'Lucknow',
    'Kanpur',
  ];

  return (
    <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-16">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
          {t('title', 'Find Your Perfect')}{' '}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t('jobMatch', 'Job Match')}
          </span>
        </h1>
        
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          {t('subtitle', 'Discover opportunities across India with AI-powered matching, verified credentials, and support in your local language')}
        </p>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-12 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Select value={searchLocation} onValueChange={setSearchLocation}>
                <SelectTrigger className="pl-10 h-12">
                  <SelectValue placeholder={t('searchForm.selectLocation', 'Select Location')} />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Briefcase className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Select value={searchRole} onValueChange={setSearchRole}>
                <SelectTrigger className="pl-10 h-12">
                  <SelectValue placeholder={t('searchForm.selectRole', 'Select Role')} />
                </SelectTrigger>
                <SelectContent>
                  {jobRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Search className="h-5 w-5 mr-2" />
              {t('searchForm.findJobs', 'Find Jobs')}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{t('stats.values.activeJobs', '50K+')}</div>
            <div className="text-muted-foreground">{t('stats.activeJobs', 'Active Jobs')}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{t('stats.values.jobSeekers', '100K+')}</div>
            <div className="text-muted-foreground">{t('stats.jobSeekers', 'Job Seekers')}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{t('stats.values.companies', '5K+')}</div>
            <div className="text-muted-foreground">{t('stats.companies', 'Companies')}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{t('stats.values.languages', '15')}</div>
            <div className="text-muted-foreground">{t('stats.languages', 'Languages')}</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
