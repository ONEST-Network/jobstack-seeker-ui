import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ApplicationCard from './ApplicationCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';

interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  salary: string;
  appliedDate: string;
  status: 'applied' | 'viewed' | 'shortlisted' | 'interview' | 'hired' | 'rejected' | 'draft';

  media?: Array<{
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
    alt?: string;
    duration?: string;
  }>;
}

interface ApplicationTabsProps {
  activeApplications: JobApplication[];
  completedApplications: JobApplication[];
  draftApplications: JobApplication[];
  onApplicationSubmitted?: () => void;
}

const ApplicationTabs: React.FC<ApplicationTabsProps> = ({ 
  activeApplications, 
  completedApplications,
  draftApplications,
  onApplicationSubmitted
}) => {
  const isMobile = useIsMobile();
  const { t } = useTranslation("applicationtabs");

  return (
    <Tabs defaultValue="active" className="w-full">
      <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2 h-12' : 'grid-cols-2 h-touch'}`}>
        <TabsTrigger 
          value="active" 
          className="text-sm font-medium"
        >
          {t('applications.active')} ({activeApplications.length})
        </TabsTrigger>
        <TabsTrigger 
          value="completed" 
          className="text-sm font-medium"
        >
          {t('applications.completed')} ({completedApplications.length})
        </TabsTrigger>
        {/* Draft tab disabled
        <TabsTrigger 
          value="draft" 
          className="text-sm font-medium"
        >
          {t('applications.draft')} ({draftApplications.length})
        </TabsTrigger>
        */}
      </TabsList>

      <TabsContent value="active" className={`${isMobile ? 'space-y-3 mt-4' : 'space-y-4'}`}>
        {activeApplications.length === 0 ? (
          <Card>
            <CardContent className={`${isMobile ? 'p-6' : 'p-8'} text-center`}>
              <p className="text-muted-foreground">{t('applications.noActive')}</p>
            </CardContent>
          </Card>
        ) : (
          activeApplications.map(application => (
            <ApplicationCard 
              key={application.id} 
              application={application} 
              isCompleted={false}
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="completed" className={`${isMobile ? 'space-y-3 mt-4' : 'space-y-4'}`}>
        {completedApplications.length === 0 ? (
          <Card>
            <CardContent className={`${isMobile ? 'p-6' : 'p-8'} text-center`}>
              <p className="text-muted-foreground">{t('applications.noCompleted')}</p>
            </CardContent>
          </Card>
        ) : (
          completedApplications.map(application => (
            <ApplicationCard 
              key={application.id} 
              application={application} 
              isCompleted={true}
            />
          ))
        )}
      </TabsContent>

      {/* Draft tab content completely disabled
      <TabsContent value="draft" className={`${isMobile ? 'space-y-3 mt-4' : 'space-y-4'}`}>
        {draftApplications.length === 0 ? (
          <Card>
            <CardContent className={`${isMobile ? 'p-6' : 'p-8'} text-center`}>
              <p className="text-muted-foreground">{t('applications.noDraft')}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                {t('applications.draftHint')}
              </p>
            </div>
            
            {draftApplications.map(application => (
              <ApplicationCard 
                key={application.id} 
                application={application} 
                isCompleted={false}
                isDraft={true}
                onApplicationSubmitted={onApplicationSubmitted}
              />
            ))}
          </>
        )}
      </TabsContent>
      */}
    </Tabs>
  );
};

export default ApplicationTabs;
