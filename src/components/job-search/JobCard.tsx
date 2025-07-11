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
        <div className="w-full">
          <JobMediaCarousel 
            media={job.media || []} 
            title={job.title}
            className="w-full"
          />
        </div>

        {/* Dynamic Job Details Section */}
        {renderJobDetails()}

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
