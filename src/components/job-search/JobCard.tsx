import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin, Clock, Users, Star, ChevronDown, ChevronUp, Share2, Copy } from 'lucide-react';
import { JobItem } from '@/hooks/useJobSearch';
import JobMediaCarousel from '../JobMediaCarousel';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface JobCardProps {
  job: JobItem;
  onApply: (job: JobItem) => void;
  onViewDetails: (job: JobItem) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onApply, onViewDetails }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAllDetails, setShowAllDetails] = useState(false);

  // Helper function to get provider and job IDs for sharing
  const getShareableLink = () => {
    // Try to find provider and job IDs from the job data
    // This assumes the job data contains the necessary IDs from the search API
    const providerId = job.providerId;
    const jobId = job.id;
    
    if (providerId && jobId) {
      return `${window.location.origin}/${providerId}/${jobId}`;
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
  const formatLocation = (location: any): string => {
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

  // Helper function to format field names for better display
  const formatFieldName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/\s+/g, ' ');
  };

  // Helper function to format field values for better display
  const formatFieldValue = (value: any): string => {
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

  // Helper function to check if a field should be skipped
  const shouldSkipField = (key: string, value: any): boolean => {
    if (value === null || value === undefined || value === '') {
      return true;
    }

    // Skip video and photo related fields
    const skipFields = [
      'jobDetailsVideo',
      'jobLocationPhotos',
      'factoryWalkthroughVideo',
      'workerTestimonialVideo',
      'skillProofVideo',
      'qualityProofImage',
      'sampleTaskVideo',
      'sampleTaskImage',
      'uploadSpeedProof',
      'uploadSpeedSampleMedia',
      'jobProviderLogo',
      'video',
      'photo',
      'image',
      'thumbnail',
      'media',
      'url',
      'jobDetailsParagraph',
      'paragraph',
      'description'
    ];
    
    const keyLower = key.toLowerCase();
    return skipFields.some(field => keyLower.includes(field));
  };

  // Helper function to group related fields
  const groupRelatedFields = (details: [string, any][]): [string, any][][] => {
    const groups: [string, any][][] = [];
    const processed = new Set<string>();

    // Define related field pairs
    const relatedPairs = [
      ['monthlyInHand', 'monthlyMaxPerformanceBasedVariable'],
      ['startTime', 'endTime'],
      ['ageAllowedLowerLimit', 'ageAllowedUpperLimit'],
      ['monthlyAverageOT', 'monthlyAverageOt'],
      ['monthlyPfHealthInsurance', 'monthlyPfEsicBenefits']
    ];

    // Group related fields
    relatedPairs.forEach(([field1, field2]) => {
      const field1Entry = details.find(([key]) => key === field1);
      const field2Entry = details.find(([key]) => key === field2);
      
      if (field1Entry && field2Entry) {
        groups.push([field1Entry, field2Entry]);
        processed.add(field1);
        processed.add(field2);
      } else if (field1Entry) {
        groups.push([field1Entry]);
        processed.add(field1);
      } else if (field2Entry) {
        groups.push([field2Entry]);
        processed.add(field2);
      }
    });

    // Add remaining unprocessed fields
    details.forEach(([key, value]) => {
      if (!processed.has(key)) {
        groups.push([[key, value]]);
      }
    });

    return groups;
  };

  const renderJobDetailsTable = () => {
    if (!job.jobDetails || Object.keys(job.jobDetails).length === 0) {
      return null;
    }

    // Convert jobDetails object to array of key-value pairs
    const detailsArray = Object.entries(job.jobDetails).filter(([key, value]) => {
      return !shouldSkipField(key, value);
    });

    if (detailsArray.length === 0) {
      return null;
    }

    // Group related fields
    const groupedDetails = groupRelatedFields(detailsArray);

    // Flatten the grouped details into a single array
    const flattenedDetails: [string, any][] = [];
    groupedDetails.forEach(group => {
      group.forEach(([key, value]) => {
        flattenedDetails.push([key, value]);
      });
    });

    // Limit to 8 items initially (4 rows × 2 columns)
    const maxItems = 8;
    const displayDetails = showAllDetails ? flattenedDetails : flattenedDetails.slice(0, maxItems);
    const hasMoreDetails = flattenedDetails.length > maxItems;

    // Create rows with 2 columns each
    const rows = [];
    for (let i = 0; i < displayDetails.length; i += 2) {
      const row = displayDetails.slice(i, i + 2);
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
                  {row.map(([key, value], colIndex) => (
                    <td key={colIndex} className="p-2 sm:p-3 text-xs sm:text-sm">
                      <div className="font-medium text-muted-foreground">
                        {formatFieldName(key)}
                      </div>
                      <div className="text-foreground font-semibold">
                        {formatFieldValue(value)}
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
                View More ({flattenedDetails.length - maxItems} more)
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
            {job.verified && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs flex-shrink-0">
                ✓
              </Badge>
            )}
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
            <div className="text-sm sm:text-base font-bold text-blue-700">{displayTrustScore}/10</div>
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
