
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar } from 'lucide-react';
import JobMediaCarousel from '@/components/JobMediaCarousel';
import ApplicationStatusBadge from './ApplicationStatusBadge';
import ApplicationDetailDialog from './ApplicationDetailDialog';
import { useState } from 'react';

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
  const cardStyle = isCompleted 
    ? `hover:shadow-md transition-shadow ${
        application.status === 'hired' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
      }`
    : 'hover:shadow-md transition-shadow';

  return (
    <Card className={cardStyle}>
      <CardContent className="p-6">
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
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                View Details
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <ApplicationDetailDialog
        application={application.raw ?? application}
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </Card>
  );
};

export default ApplicationCard;
