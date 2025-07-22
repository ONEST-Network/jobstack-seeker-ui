
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ApplicationCard from './ApplicationCard';
import { useIsMobile } from '@/hooks/use-mobile';

interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  salary: string;
  appliedDate: string;
  status: 'applied' | 'viewed' | 'shortlisted' | 'interview' | 'hired' | 'rejected' | 'deleted';
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
}

const ApplicationTabs: React.FC<ApplicationTabsProps> = ({ 
  activeApplications, 
  completedApplications 
}) => {
  const isMobile = useIsMobile();

  return (
    <Tabs defaultValue="active" className="w-full">
      <TabsList className={`grid w-full grid-cols-2 ${isMobile ? 'h-12' : 'h-touch'}`}>
        <TabsTrigger 
          value="active" 
          className={`${isMobile ? 'text-base font-medium' : 'text-sm font-medium'}`}
        >
          Active ({activeApplications.length})
        </TabsTrigger>
        <TabsTrigger 
          value="completed" 
          className={`${isMobile ? 'text-base font-medium' : 'text-sm font-medium'}`}
        >
          Completed ({completedApplications.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active" className={`${isMobile ? 'space-y-3 mt-4' : 'space-y-4'}`}>
        {activeApplications.length === 0 ? (
          <Card>
            <CardContent className={`${isMobile ? 'p-6' : 'p-8'} text-center`}>
              <p className="text-muted-foreground">No active applications found</p>
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
              <p className="text-muted-foreground">No completed applications found</p>
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
    </Tabs>
  );
};

export default ApplicationTabs;
