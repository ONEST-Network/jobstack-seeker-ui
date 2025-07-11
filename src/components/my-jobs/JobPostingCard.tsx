
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Users, Building } from 'lucide-react';
import JobMediaCarousel from '@/components/JobMediaCarousel';

interface JobPosting {
  id: string;
  title: string;
  location: string;
  postedDate: string;
  salary: string;
  jobType: string;
  status: string;
  applicationsCount: number;
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
    alt?: string;
    duration?: string;
  }>;
  logo?: string; // Add logo field
}

interface JobPostingCardProps {
  job: JobPosting;
  onViewCandidate: (candidate: any) => void;
  getStatusColor: (status: string) => string;
  getApplicationStatusColor: (status: string) => string;
}

const JobPostingCard: React.FC<JobPostingCardProps> = ({ 
  job, 
  onViewCandidate, 
  getStatusColor, 
  getApplicationStatusColor 
}) => {
  // Helper function to render company logo
  const renderCompanyLogo = () => {
    // Check if job has a logo URL (from GCS storage)
    if (job.logo && typeof job.logo === 'string' && job.logo.startsWith('http')) {
      return (
        <img 
          src={job.logo} 
          alt="Company logo"
          className="w-10 h-10 object-cover rounded-lg"
          onError={(e) => {
            // Fallback to building icon if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove('hidden');
          }}
        />
      );
    }
    
    // Fallback to building icon
    return (
      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
        <Building className="h-5 w-5 text-gray-600" />
      </div>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-40 flex-shrink-0">
              <JobMediaCarousel 
                media={job.media || []} 
                title={job.title}
                className="w-full"
              />
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl truncate">{job.title}</CardTitle>
                <Badge className={getStatusColor(job.status)}>
                  {job.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{job.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Posted on {new Date(job.postedDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{job.applicationsCount} applications</span>
                </div>
              </div>
              <div className="text-sm">
                <span className="font-medium">{job.salary}</span> • {job.jobType}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {renderCompanyLogo()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            onClick={() => onViewCandidate({ jobId: job.id, jobTitle: job.title })}
          >
            View Applications
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobPostingCard;
