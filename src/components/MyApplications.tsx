import React from 'react';
import ApplicationTabs from './my-applications/ApplicationTabs';

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

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';


const MyApplications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const url = `${import.meta.env.VITE_BAP_URL}/api/v1/job-applications?user_id=${user.id}`;
        const response = await fetch(url);
        const data = await response.json();
        const mapped: JobApplication[] = (data?.applications || []).map((app: any) => {
          const item = app?.metadata?.message?.order?.items?.[0] || {};
          const provider = app?.metadata?.message?.order?.provider || {};
          const locationObj = (provider.locations && provider.locations[0]) || {};
          const tag = item?.tag || {};
          const basicInfo = tag?.basicInfo || {};
          const jobDetails = tag?.jobDetails || {};

          return {
            id: app.order_id ?? app.transaction_id ?? app.job_id,
            jobId: item.id ?? app.job_id,
            jobTitle: item?.descriptor?.name ?? 'Unknown',
            company: basicInfo?.jobProviderName ?? provider?.descriptor?.name ?? 'Unknown',
            location: `${locationObj.city ?? ''}${locationObj.state ? ', ' + locationObj.state : ''}`.trim(),
            salary: jobDetails?.salaryCTC ? `₹${jobDetails.salaryCTC.toLocaleString()}` : 'N/A',
            appliedDate: app?.metadata?.context?.timestamp ?? new Date().toISOString(),
            status: (app.status as JobApplication['status']) ?? 'applied',
            raw: app,
            media: [],
          } as JobApplication;
        });
        setApplications(mapped);
      } catch (error) {
        console.error('Failed to fetch job applications', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [user]);

  const activeApplications = applications.filter(app => !['hired', 'rejected'].includes(app.status));
  const completedApplications = applications.filter(app => ['hired', 'rejected'].includes(app.status));

  return (
    <div className="space-y-6">
      {isLoading ? (
        <p className="text-center text-muted-foreground">Loading applications...</p>
      ) : (
        <ApplicationTabs 
        activeApplications={activeApplications}
        completedApplications={completedApplications}
        />
      )}
    </div>
  );
};

export default MyApplications;
