import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin, Clock, Users, Star } from 'lucide-react';
import { JobItem } from '@/hooks/useJobSearch';
import JobMediaCarousel from '../JobMediaCarousel';
import { useAuth } from '@/contexts/AuthContext';

interface JobCardProps {
  job: JobItem;
  onApply: (job: JobItem) => void;
  onViewDetails: (job: JobItem) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onApply, onViewDetails }) => {
  const { user } = useAuth();

  const renderJobDetails = () => {
    const details = [];

    if (job.monthlyInHand && job.monthlyInHand !== 'Not specified') {
      details.push({
        label: 'Monthly In-Hand',
        value: job.monthlyInHand,
        icon: <Star className="h-4 w-4" />
      });
    }

    if (job.monthlyPfEsic && job.monthlyPfEsic !== 'Included') {
      details.push({
        label: 'PF & ESIC',
        value: job.monthlyPfEsic,
        icon: <Users className="h-4 w-4" />
      });
    }

    if (job.monthlyOvertime && job.monthlyOvertime !== 'Not specified') {
      details.push({
        label: 'Overtime',
        value: job.monthlyOvertime,
        icon: <Clock className="h-4 w-4" />
      });
    }

    if (job.stayProvided) {
      details.push({
        label: 'Stay Provided',
        value: 'Yes',
        icon: <Building className="h-4 w-4" />
      });
    }

    if (job.costPerSharingBed && job.costPerSharingBed !== 'Not specified') {
      details.push({
        label: 'Cost per Bed',
        value: job.costPerSharingBed,
        icon: <MapPin className="h-4 w-4" />
      });
    }

    return details.map((detail, index) => (
      <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
        {detail.icon}
        <span className="font-medium">{detail.label}:</span>
        <span>{detail.value}</span>
      </div>
    ));
  };

  const renderJobDetailsTable = () => {
    if (!job.jobDetails || Object.keys(job.jobDetails).length === 0) {
      return null;
    }

    // Convert jobDetails object to array of key-value pairs
    // Filter out video and photo URLs that should be handled by media carousel
    const detailsArray = Object.entries(job.jobDetails).filter(([key, value]) => {
      // Skip if value is null, undefined, or empty
      if (value === null || value === undefined || value === '') {
        return false;
      }
      
      // Skip video and photo related fields that should be in media carousel
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
        'url'
      ];
      
      const keyLower = key.toLowerCase();
      return !skipFields.some(field => keyLower.includes(field));
    });

    if (detailsArray.length === 0) {
      return null;
    }

    // Format field names for better display
    const formatFieldName = (key: string) => {
      return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace(/([A-Z])/g, ' $1')
        .trim();
    };

    // Format field values for better display
    const formatFieldValue = (value: any) => {
      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
      }
      if (typeof value === 'number') {
        return value.toLocaleString();
      }
      return String(value);
    };

    // Create rows with 2 columns each
    const rows = [];
    for (let i = 0; i < detailsArray.length; i += 2) {
      const row = detailsArray.slice(i, i + 2);
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
      </div>
    );
  };

  // Determine if we should show real trust scores
  const shouldShowRealScores = user && user.profile;
  
  // Get display scores - show 0 if user not logged in, real scores if logged in
  const displayTrustScore = shouldShowRealScores ? job.trustScore : 0;
  const displayMatchScore = shouldShowRealScores ? job.matchScore : 0;

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onViewDetails(job)}>
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Job Title */}
        <div className="space-y-2">
          <h3 className="text-lg sm:text-xl font-semibold text-foreground line-clamp-2">
            {job.title}
            {job.openings && job.openings > 0 && (
              <span className="text-muted-foreground font-normal"> ({job.openings})</span>
            )}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {job.location}
          </div>
        </div>

        {/* Company Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
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
        <div className="w-full" onClick={(e) => e.stopPropagation()}>
          <JobMediaCarousel 
            media={job.media || []} 
            title={job.title}
            className="w-full"
          />
        </div>

        {/* Dynamic Job Details Section */}
        {renderJobDetails()}

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
      </CardContent>
    </Card>
  );
};

export default JobCard;
