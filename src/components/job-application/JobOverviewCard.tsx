
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import JobMediaCarousel from '@/components/JobMediaCarousel';
import { Building } from 'lucide-react';

interface Job {
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
    alt?: string;
    duration?: string;
  }>;
  logo?: string; // Add logo field
}

interface JobOverviewCardProps {
  job: Job;
}

const JobOverviewCard: React.FC<JobOverviewCardProps> = ({ job }) => {
  // Helper function to render company logo
  const renderCompanyLogo = () => {
    // Check if job has a logo URL (from GCS storage)
    if (job.logo && typeof job.logo === 'string' && job.logo.startsWith('http')) {
      return (
        <img 
          src={job.logo} 
          alt={`${job.company} logo`}
          className="w-8 h-8 object-cover rounded-lg"
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
      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
        <Building className="h-4 w-4 text-gray-600" />
      </div>
    );
  };

  return (
    <Card>
      <CardContent className="p-4">
        {/* Mobile Layout */}
        <div className="block sm:hidden">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-20 flex-shrink-0">
                <JobMediaCarousel 
                  media={job.media || []} 
                  title={job.title}
                  className="w-full"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg mb-1 leading-tight">{job.title}</h3>
                <div className="flex items-center gap-2 mb-1">
                  {renderCompanyLogo()}
                  <p className="text-muted-foreground font-medium text-sm">{job.company}</p>
                </div>
                <p className="text-xs text-muted-foreground">{job.location}</p>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="text-xl font-bold text-green-700">{job.salary}</div>
              <div className="text-sm text-green-600">per month • {job.type}</div>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:block">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-32 flex-shrink-0">
                <JobMediaCarousel 
                  media={job.media || []} 
                  title={job.title}
                  className="w-full"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg mb-1">{job.title}</h3>
                <div className="flex items-center gap-2 mb-1">
                  {renderCompanyLogo()}
                  <p className="text-muted-foreground font-medium">{job.company}</p>
                </div>
                <p className="text-sm text-muted-foreground">{job.location}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-bold text-green-600 mb-1">{job.salary}</div>
              <div className="text-sm text-muted-foreground">per month</div>
              <div className="text-sm text-green-600 font-medium">{job.type}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobOverviewCard;
