import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Building, Users, Star, Home, Banknote, BedDouble, ChevronDown, ChevronUp } from 'lucide-react';
import JobMediaCarousel from '@/components/JobMediaCarousel';

interface JobCardProps {
  job: any;
  onApply: (job: any) => void;
  onViewDetails: (job: any) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onApply, onViewDetails }) => {
  const [showAllDetails, setShowAllDetails] = useState(false);
  
  // Extract job details from the job object
  const jobDetails = job.jobDetails || {};
  
  // Convert job details to array of key-value pairs, excluding positions (already shown in title)
  const jobDetailsArray = Object.entries(jobDetails)
    .filter(([key, value]) => key !== 'positions' && value !== null && value !== undefined && value !== '')
    .map(([key, value]) => ({
      key: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      value: typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)
    }));

  const hasJobDetails = jobDetailsArray.length > 0;
  const hasMoreDetails = jobDetailsArray.length > 8;
  const displayDetails = showAllDetails ? jobDetailsArray : jobDetailsArray.slice(0, 8);

  // Helper function to render job details in 2-column grid
  const renderJobDetails = () => {
    if (!hasJobDetails) {
      return (
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div className="md:col-span-2 text-center py-4">
            <div className="text-sm sm:text-base font-semibold text-muted-foreground">
              Contact job provider
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              No additional details available
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {displayDetails.map((detail, index) => (
            <div key={index}>
              <div className="text-sm sm:text-base font-semibold text-foreground">
                {detail.value}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                {detail.key}
              </div>
            </div>
          ))}
        </div>
        
        {hasMoreDetails && (
          <div className="flex justify-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowAllDetails(!showAllDetails);
              }}
              className="text-primary hover:text-primary/80"
            >
              {showAllDetails ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  View More ({jobDetailsArray.length - 8} more)
                </>
              )}
            </Button>
          </div>
        )}
      </>
    );
  };

  return (
    <Card 
      className="hover:shadow-lg transition-shadow duration-300 border border-border cursor-pointer" 
      onClick={() => onViewDetails(job)}
    >
      <CardContent className="p-4 space-y-4">
        {/* Job Name with Openings and Location */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">
            {job.title} {job.openings && `(${job.openings})`}
          </h3>
          <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground flex-shrink-0">
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="truncate">{job.location}</span>
          </div>
        </div>

        {/* Logo, Company Name and Verified */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building className="h-4 w-4 sm:h-6 sm:w-6 text-gray-600" />
          </div>
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
            <span className="font-medium text-sm sm:text-base text-foreground truncate">{job.company}</span>
            {job.verified && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs flex-shrink-0">
                ✓
              </Badge>
            )}
          </div>
        </div>

        {/* Job Details Video & Photos Carousel */}
        <div className="w-full">
          <JobMediaCarousel 
            media={job.media || []} 
            title={job.title}
            className="w-full"
          />
        </div>

        {/* Dynamic Job Details Section */}
        {renderJobDetails()}

        {/* Trust Score & Match Score (if user is logged in) */}
        <div className="flex gap-2 sm:gap-4">
          <div className="bg-blue-50 rounded-lg p-2 sm:p-3 flex-1 text-center">
            <div className="text-xs text-blue-600">Trust Score</div>
            <div className="text-sm sm:text-base font-bold text-blue-700">{job.trustScore}/10</div>
          </div>
          <div className="bg-green-50 rounded-lg p-2 sm:p-3 flex-1 text-center">
            <div className="text-xs text-green-600">Match Score</div>
            <div className="text-sm sm:text-base font-bold text-green-700">{job.matchScore}/10</div>
          </div>
        </div>

        {/* Apply Now Button */}
        <Button 
          className="w-full bg-primary hover:bg-primary/90 h-10 sm:h-12 text-sm sm:text-base font-medium"
          onClick={(e) => {
            e.stopPropagation();
            onApply(job);
          }}
        >
          Apply Now
        </Button>
      </CardContent>
    </Card>
  );
};

export default JobCard;
