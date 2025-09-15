import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Calendar, Users, Eye, Edit, Trash2 } from 'lucide-react';
import JobMediaCarousel from '@/components/JobMediaCarousel';
import ApplicationList from './ApplicationList';
import { useTranslation } from 'react-i18next';

interface JobPostingCardProps {
  job: any;
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
  const { t } = useTranslation("jobpostingcard");

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
                  {t(`job.status.${job.status}`,)}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{job.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    {t('job.postedOn')} {new Date(job.postedDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    {t('job.applicationsCount', { count: job.applicationsCount })}
                  </span>
                </div>
              </div>
              <div className="text-sm">
                <span className="font-medium">
                  {job.salary && job.salary !== 'Salary not specified' && job.salary !== 'Not specified' 
                    ? job.salary 
                    : t('job.notAvailable')
                  }
                </span> • {job.jobType}
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              {t('job.actions.view')}
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              {t('job.actions.edit')}
            </Button>
            <Button variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              {t('job.actions.delete')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="applications" className="w-full">
          <TabsList>
            <TabsTrigger value="applications">
              {t('job.tabs.applications')} ({job.applications.length})
            </TabsTrigger>
            <TabsTrigger value="details">{t('job.tabs.details')}</TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-4">
            <ApplicationList 
              applications={job.applications}
              onViewCandidate={onViewCandidate}
              getApplicationStatusColor={getApplicationStatusColor}
            />
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">{t('job.fields.type')}:</span> {job.jobType}
              </div>
              <div>
                <span className="font-medium">{t('job.fields.salary')}:</span>{' '}
                {job.salary && job.salary !== 'Salary not specified' && job.salary !== 'Not specified' 
                  ? job.salary 
                  : t('job.notAvailable')
                }
              </div>
              <div>
                <span className="font-medium">{t('job.fields.location')}:</span> {job.location}
              </div>
              <div>
                <span className="font-medium">{t('job.fields.status')}:</span>{' '}
                {t(`job.status.${job.status}`)}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default JobPostingCard;
