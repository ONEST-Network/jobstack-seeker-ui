import React from 'react';
import ApplicationTabs from './my-applications/ApplicationTabs';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

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

// Status API response interface
interface StatusResponse {
  context: {
    action: string;
    bap_id: string;
    bap_uri: string;
    bpp_id: string;
    bpp_uri: string;
    domain: string;
    message_id: string;
    timestamp: string;
    transaction_id: string;
    version: string;
  };
  message: {
    order: {
      fulfillments: Array<{
        id: string;
        state: {
          descriptor: {
            code: string;
            name: string;
          };
        };
      }>;
      id: string;
      items: Array<any>;
      provider: any;
    };
  };
}

const MyApplications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusLoading, setStatusLoading] = useState<boolean>(false);

  // Function to fetch status for a specific application with retry
  const fetchApplicationStatus = async (orderId: string, transactionId: string, retryCount = 0): Promise<string> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BAP_URL}/api/v1/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: {
            bpp_id: "bpp1.dhiway.com",
            bpp_uri: "https://beckn-adapter.dhiway.net/bpp/receiver",
            transaction_id: transactionId
          },
          message: {
            order: {
              id: orderId
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Status API failed: ${response.status}`);
      }

      const data: StatusResponse = await response.json();
      
      // Validate response structure
      if (!data.message?.order?.fulfillments || !Array.isArray(data.message.order.fulfillments)) {
        console.warn('Invalid status response structure:', data);
        return 'applied'; // Default fallback
      }
      
      // Extract status from the response
      const fulfillment = data.message.order.fulfillments[0];
      if (fulfillment?.state?.descriptor?.code) {
        const code = fulfillment.state.descriptor.code;
        
        // Map API codes to our status types
        // API Response Codes:
        // - 'archived' -> 'rejected' (Application was rejected)
        // - 'open' -> 'applied' (Application is still active/under review)
        // - 'closed' -> 'hired' (Application was accepted/hired)
        switch (code) {
          case 'archived':
            return 'rejected';
          case 'open':
            return 'applied';
          case 'closed':
            return 'hired';
          default:
            console.log(`Unknown status code: ${code}, defaulting to applied`);
            return 'applied'; // Default fallback
        }
      }
      
      console.log('No status code found in response, defaulting to applied');
      return 'applied'; // Default fallback
    } catch (error) {
      console.error('Failed to fetch application status:', error);
      
      // Retry logic for failed requests
      if (retryCount < 2) {
        console.log(`Retrying status fetch for order ${orderId}, attempt ${retryCount + 1}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return fetchApplicationStatus(orderId, transactionId, retryCount + 1);
      }
      
      return 'applied'; // Default fallback on error
    }
  };

  // Function to fetch all applications with their statuses
  const fetchApplicationsWithStatus = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setStatusLoading(true);
    
    try {
      const url = `${import.meta.env.VITE_BAP_URL}/api/v1/job-applications?user_id=${user.id}`;
      const response = await fetch(url);
      const data = await response.json();
      
      const applicationsData = data?.applications || [];
      console.log(`Found ${applicationsData.length} applications to process`);
      
      // First, create applications with default status
      const applicationsWithDefaultStatus = applicationsData.map((app: any) => {
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
          status: 'applied' as JobApplication['status'], // Default status
          raw: app,
          media: [],
        } as JobApplication;
      });

      // Set applications with default status first
      setApplications(applicationsWithDefaultStatus);
      setIsLoading(false);

      // Then fetch status for each application
      console.log('Starting status fetch for applications...');
      const applicationsWithStatus = await Promise.all(
        applicationsWithDefaultStatus.map(async (app, index) => {
          const orderId = app.raw?.metadata?.message?.order?.id || app.raw?.order_id;
          const transactionId = app.raw?.metadata?.context?.transaction_id || app.raw?.transaction_id;

          if (orderId && transactionId) {
            console.log(`Fetching status for application ${index + 1}/${applicationsWithDefaultStatus.length}: ${app.jobTitle}`);
            const status = await fetchApplicationStatus(orderId, transactionId);
            console.log(`Status for ${app.jobTitle}: ${status}`);
            return {
              ...app,
              status: status as JobApplication['status']
            };
          } else {
            console.warn(`Missing orderId or transactionId for application: ${app.jobTitle}`);
            return app;
          }
        })
      );

      setApplications(applicationsWithStatus);
      console.log('Completed status fetch for all applications');
    } catch (error) {
      console.error('Failed to fetch job applications', error);
    } finally {
      setIsLoading(false);
      setStatusLoading(false);
    }
  };

  // Function to refresh only statuses
  const refreshStatuses = async () => {
    if (!applications.length) return;
    setStatusLoading(true);
    
    try {
      const applicationsWithUpdatedStatus = await Promise.all(
        applications.map(async (app) => {
          const orderId = app.raw?.metadata?.message?.order?.id || app.raw?.order_id;
          const transactionId = app.raw?.metadata?.context?.transaction_id || app.raw?.transaction_id;

          if (orderId && transactionId) {
            const status = await fetchApplicationStatus(orderId, transactionId);
            return {
              ...app,
              status: status as JobApplication['status']
            };
          }
          
          return app;
        })
      );

      setApplications(applicationsWithUpdatedStatus);
    } catch (error) {
      console.error('Failed to refresh application statuses', error);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationsWithStatus();
  }, [user]);

  const activeApplications = applications.filter(app => !['hired', 'rejected'].includes(app.status));
  const completedApplications = applications.filter(app => ['hired', 'rejected'].includes(app.status));

  return (
    <div className="space-y-6">
      {isLoading ? (
        <p className="text-center text-muted-foreground">Loading applications...</p>
      ) : (
        <>
          {applications.length > 0 && (
            <div className="flex justify-end">
              <Button 
                onClick={refreshStatuses} 
                disabled={statusLoading}
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${statusLoading ? 'animate-spin' : ''}`} />
                {statusLoading ? 'Updating...' : 'Refresh Status'}
              </Button>
            </div>
          )}
          
          {statusLoading ? (
            <p className="text-center text-muted-foreground">Updating application statuses...</p>
          ) : (
            <ApplicationTabs 
              activeApplications={activeApplications}
              completedApplications={completedApplications}
            />
          )}
        </>
      )}
    </div>
  );
};

export default MyApplications;
