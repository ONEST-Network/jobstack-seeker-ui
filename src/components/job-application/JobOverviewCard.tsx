import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import JobMediaCarousel from '@/components/JobMediaCarousel';

interface JobOverviewCardProps {
  job: any;
}

const JobOverviewCard: React.FC<JobOverviewCardProps> = ({ job }) => {
  const { t } = useTranslation("joboverviewcard");

  const salaryNotSpecified = [
    t('jobOverview.salaryNotSpecified'),
    t('jobOverview.notSpecified')
  ];

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
                <p className="text-muted-foreground font-medium text-sm">{job.company}</p>
                <p className="text-xs text-muted-foreground">{job.location}</p>
              </div>
            </div>
            {(job.salary && !salaryNotSpecified.includes(job.salary)) && (
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="text-xl font-bold text-green-700">{job.salary}</div>
                <div className="text-sm text-green-600">
                  {t('jobOverview.perMonth')} • {job.type}
                </div>
              </div>
            )}
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
                <p className="text-muted-foreground font-medium">{job.company}</p>
                <p className="text-sm text-muted-foreground">{job.location}</p>
              </div>
            </div>
            {(job.salary && !salaryNotSpecified.includes(job.salary)) && (
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-bold text-green-600 mb-1">{job.salary}</div>
                <div className="text-sm text-muted-foreground">{t('jobOverview.perMonth')}</div>
                <div className="text-sm text-green-600 font-medium">{job.type}</div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobOverviewCard;
