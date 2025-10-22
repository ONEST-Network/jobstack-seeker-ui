import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin, Clock, Users, Star, ChevronDown, ChevronUp, Share2, Copy } from 'lucide-react';
import { JobItem } from '@/hooks/useJobSearch';
import JobMediaCarousel from '../JobMediaCarousel';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'react-router-dom';

interface JobCardProps {
  job: JobItem;
  onApply: (job: JobItem) => void;
  onViewDetails: (job: JobItem) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onApply, onViewDetails }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { orgSlug } = useParams<{ orgSlug?: string }>();
  const [showAllDetails, setShowAllDetails] = useState(false);

  // Helper function to get provider and job IDs for sharing
  const getShareableLink = () => {
    // Try to find provider and job IDs from the job data
    // This assumes the job data contains the necessary IDs from the search API
    const providerId = job.providerId;
    const jobId = job.id;
    
    if (providerId && jobId) {
      // Use the new route structure with organization slug
      return `${window.location.origin}/${orgSlug || '0'}/${providerId}/${jobId}`;
    }
    
    return null;
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const shareUrl = getShareableLink();
    
    if (!shareUrl) {
      toast({
        title: "Share Unavailable",
        description: "This job cannot be shared at the moment.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Always copy to clipboard first
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied!",
        description: "Job link has been copied to clipboard. You can now share it manually.",
      });

      // Then try native sharing if available (mobile devices)
      if (navigator.share) {
        try {
          await navigator.share({
            title: job.title,
            text: `Check out this job opportunity: ${job.title}`,
            url: shareUrl
          });
        } catch (shareError) {
          // If native sharing fails, that's okay - we already copied to clipboard
          console.log('Native sharing cancelled or failed, but link was copied to clipboard');
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Share Failed",
        description: "Failed to copy job link. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Helper function to format location display from BAP API response
  const formatLocation = (location: string | { city?: string; state?: string } | null | undefined): string => {
    if (!location) {
      return 'Location not specified';
    }

    // Handle the new BAP API location format
    if (typeof location === 'object' && location.city && location.state) {
      return `${location.city}, ${location.state}`;
    }

    // Handle string location (fallback)
    if (typeof location === 'string') {
      if (location === 'Location not specified') {
        return 'Location not specified';
      }
      
      // If it's a full address with commas, extract city and state
      if (location.includes(',')) {
        const parts = location.split(',').map(part => part.trim());
        if (parts.length >= 2) {
          // Return city and state only
          return `${parts[1]}, ${parts[2] || ''}`.trim();
        }
      }
      
      return location;
    }

    return 'Location not specified';
  };

  // Helper function to format field values for better display
  const formatFieldValue = (value: string | number | boolean | null | undefined): string => {
    if (value === null || value === undefined || value === '') {
      return 'Not specified';
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    
    if (typeof value === 'string') {
      // Handle currency formatting
      if (value.includes('INR') || value.includes('₹')) {
        return value;
      }
      
      // Handle time formatting
      if (value.includes('AM') || value.includes('PM') || value.includes(':')) {
        return value;
      }
      
      return value;
    }
    
    return String(value);
  };

  const renderJobDetailsTable = () => {
    // Helper function to get salary range
    const getSalaryRange = () => {
      const minSalary = job.tags?.jobDetails?.minMonthlyInHand || job.jobDetails?.minMonthlyInHand;
      const maxSalary = job.tags?.jobDetails?.maxMonthlyInHand || job.jobDetails?.maxMonthlyInHand;
      
      if (minSalary && maxSalary) {
        return `₹${minSalary.toLocaleString()} - ₹${maxSalary.toLocaleString()}`;
      } else if (maxSalary) {
        return `Up to ₹${maxSalary.toLocaleString()}`;
      } else if (minSalary) {
        return `From ₹${minSalary.toLocaleString()}`;
      }
      return 'Not specified';
    };

    // Helper function to get location from BAP API format
    const getJobLocation = () => {
      const location = job.tags?.basicInfo?.jobProviderLocation;
      if (location && location.city && location.state) {
        return `${location.city}, ${location.state}`;
      }
      return formatLocation(job.jobProviderLocation || job.location);
    };

    // Define structured job details in the required order
    const structuredDetails = [
      {
        label: 'Role Name',
        value: job.title, // Using title as role name
        key: 'roleName'
      },
      {
        label: 'Openings',
        value: job.tags?.jobDetails?.positions || job.positions || job.openings || 1,
        key: 'openings'
      },
      {
        label: 'Role Details',
        value: '', // Empty for now as requested
        key: 'roleDetails'
      },
      {
        label: 'Location',
        value: getJobLocation(),
        key: 'location'
      },
      {
        label: 'Work Timings',
        value: job.tags?.jobDetails?.workingHoursPerDay || job.jobDetails?.workingHoursPerDay || 'Not specified',
        key: 'workTimings'
      },
      {
        label: 'Monthly Salary Range',
        value: getSalaryRange(),
        key: 'salaryRange'
      },
      {
        label: 'Monthly Avg. Overtime (OT)',
        value: job.tags?.jobDetails?.monthlyAverageOT || job.jobDetails?.monthlyAverageOT || 'Not specified',
        key: 'overtime'
      },
      {
        label: 'Travel Provided',
        value: job.tags?.jobDetails?.travelProvided || job.jobDetails?.travelProvided || 'Not specified',
        key: 'travelProvided'
      },
      {
        label: 'Minimum Age',
        value: job.tags?.jobNeeds?.ageAllowedLowerLimit || job.jobDetails?.ageAllowedLowerLimit || 'Not specified',
        key: 'minimumAge'
      }
    ];

    // Filter out empty role details and any other fields that shouldn't be shown
    const displayDetails = structuredDetails.filter(detail => {
      if (detail.key === 'roleDetails' && !detail.value) {
        return false; // Skip empty role details
      }
      return detail.value !== null && detail.value !== undefined && detail.value !== '';
    });

    if (displayDetails.length === 0) {
      return null;
    }

    // Limit to 8 items initially (4 rows × 2 columns)
    const maxItems = 8;
    const visibleDetails = showAllDetails ? displayDetails : displayDetails.slice(0, maxItems);
    const hasMoreDetails = displayDetails.length > maxItems;

    // Create rows with 2 columns each
    const rows = [];
    for (let i = 0; i < visibleDetails.length; i += 2) {
      const row = visibleDetails.slice(i, i + 2);
      rows.push(row);
    }

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Job Details</h4>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b last:border-b-0">
                  {row.map((detail, colIndex) => (
                    <td key={colIndex} className="p-2 sm:p-3 text-xs sm:text-sm">
                      <div className="font-medium text-muted-foreground">
                        {detail.label}
                      </div>
                      <div className="text-foreground font-semibold">
                        {formatFieldValue(detail.value)}
                      </div>
                    </td>
                  ))}
                  {/* Fill empty cells if row has only one item */}
                  {row.length === 1 && (
                    <td className="p-2 sm:p-3"></td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* View More/Less Button */}
        {hasMoreDetails && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowAllDetails(!showAllDetails);
            }}
            className="w-full text-xs text-muted-foreground hover:text-foreground"
          >
            {showAllDetails ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                View More ({displayDetails.length - maxItems} more)
              </>
            )}
          </Button>
        )}
      </div>
    );
  };

  // Determine if we should show real trust scores
  const shouldShowRealScores = user && user.profile;
  
  // Get display scores - show 0 if user not logged in, real scores if logged in
  const displayTrustScore = shouldShowRealScores ? job.trustScore : 0;
  const displayMatchScore = shouldShowRealScores ? job.matchScore : 0;

  // Get location from the new BAP API format
  const jobLocation = job.tags?.basicInfo?.jobProviderLocation || job.jobProviderLocation || job.location;
  const formattedLocation = formatLocation(jobLocation);

  // Get positions from the new BAP API format
  const positions = job.tags?.jobDetails?.positions || job.positions || job.openings || 1;

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onViewDetails(job)}>
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Job Title */}
        <div className="space-y-2">
          <h3 className="text-lg sm:text-xl font-semibold text-foreground line-clamp-2">
            {job.title}
            {positions && positions > 0 && (
              <span className="text-muted-foreground font-normal"> ({positions})</span>
            )}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {formattedLocation}
          </div>
        </div>

        {/* Company Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            <Building className="h-4 w-4 sm:h-6 sm:w-6 text-gray-600" />
          </div>
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
            <span className="font-medium text-sm sm:text-base text-foreground truncate">
              {job.tags?.basicInfo?.jobProviderName || job.company}
            </span>
{/*             {job.verified && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs flex-shrink-0">
                ✓
              </Badge>
            )} */}
          </div>
        </div>

        {/* Job Details Video & Photos Carousel */}
        <div className="w-full" onClick={(e) => e.stopPropagation()}>
          <JobMediaCarousel 
            media={job.media || []} 
            title={job.title}
            className="w-full"
          />
        </div>

        {/* Job Details Table */}
        {renderJobDetailsTable()}

        {/* Trust Score & Match Score */}
        <div className="flex gap-2 sm:gap-4">
          <div className="bg-blue-50 rounded-lg p-2 sm:p-3 flex-1 text-center">
            <div className="text-xs text-blue-600">Trust Score</div>
            <div className="text-sm sm:text-base font-bold text-blue-700">
              {shouldShowRealScores ? `${displayTrustScore}/10` : '0/10'}
            </div>
            {!shouldShowRealScores && (
              <div className="text-xs text-blue-500 mt-1">Login to see</div>
            )}
          </div>
          <div className="bg-green-50 rounded-lg p-2 sm:p-3 flex-1 text-center">
            <div className="text-xs text-green-600">Match Score</div>
            <div className="text-sm sm:text-base font-bold text-green-700">{displayMatchScore}/10</div>
            {!shouldShowRealScores && (
              <div className="text-xs text-green-500 mt-1">Login to see</div>
            )}
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

        {/* Share Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="w-full text-xs text-muted-foreground hover:text-foreground"
        >
          <Copy className="h-3 w-3 mr-1" />
          Share Job
        </Button>
      </CardContent>
    </Card>
  );
};

export default JobCard;
