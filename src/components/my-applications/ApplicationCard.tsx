
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar } from 'lucide-react';
import JobMediaCarousel from '@/components/JobMediaCarousel';
import ApplicationStatusBadge from './ApplicationStatusBadge';
import ApplicationDetailDialog from './ApplicationDetailDialog';
import ApplicationViewModal from './ApplicationViewModal';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  salary: string;
  appliedDate: string;
  status: 'applied' | 'viewed' | 'shortlisted' | 'interview' | 'hired' | 'rejected';
  raw?: any;
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
    alt?: string;
    duration?: string;
  }>;
}

interface ApplicationCardProps {
  application: JobApplication;
  isCompleted?: boolean;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, isCompleted = false }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewApplicationOpen, setViewApplicationOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const cardStyle = isCompleted 
    ? `hover:shadow-md transition-shadow ${
        application.status === 'hired' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
      }`
    : 'hover:shadow-md transition-shadow';

  return (
    <Card className={cardStyle}>
      <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
        {isMobile ? (
          // Mobile layout - stacked vertically
          <div className="space-y-4">
            {/* Header with job title and company */}
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-1 truncate">{application.jobTitle}</h3>
                  <p className="text-muted-foreground font-medium truncate">{application.company}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="text-lg font-bold text-green-600 mb-1">
                    {application.salary}
                  </div>
                  <div className="text-xs text-muted-foreground">per month</div>
                </div>
              </div>
              
              {/* Status badge */}
              <div className="flex justify-start">
                <ApplicationStatusBadge status={application.status} />
              </div>
            </div>

            {/* Media carousel - smaller on mobile */}
            {application.media && application.media.length > 0 && (
              <div className="w-full">
                <JobMediaCarousel 
                  media={application.media} 
                  title={application.jobTitle}
                  className="w-full"
                />
              </div>
            )}

            {/* Location and date info */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{application.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span>Applied: {new Date(application.appliedDate).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Action buttons - full width on mobile */}
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setViewApplicationOpen(true)}
                className="flex-1 h-10"
              >
                View Application
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setDialogOpen(true)}
                className="flex-1 h-10"
              >
                View Details
              </Button>
            </div>
          </div>
        ) : (
          // Desktop layout - horizontal
          <div className="flex items-start gap-4">
            <div className="w-32 flex-shrink-0">
              <JobMediaCarousel 
                media={application.media || []} 
                title={application.jobTitle}
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold mb-1">{application.jobTitle}</h3>
                  <p className="text-muted-foreground font-medium">{application.company}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-green-600 mb-1">
                    {application.salary}
                  </div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{application.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Applied: {new Date(application.appliedDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <ApplicationStatusBadge status={application.status} />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setViewApplicationOpen(true)}>
                    View Application
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <ApplicationDetailDialog
        application={application.raw ?? application}
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
      <ApplicationViewModal
        isOpen={viewApplicationOpen}
        onClose={() => setViewApplicationOpen(false)}
        applicationId={application.id}
      />
    </Card>
  );
};

export default ApplicationCard;
