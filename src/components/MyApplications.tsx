import React from 'react';
import ApplicationTabs from './my-applications/ApplicationTabs';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { User } from 'lucide-react'; // Added User icon import

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
  profileId?: string; // Add profile ID to track which profile was used
}

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useRef } from 'react';

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
  const { user, getSelectedCandidate } = useAuth();
  const selectedCandidate = getSelectedCandidate();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusLoading, setStatusLoading] = useState<boolean>(false);
  const isMobile = useIsMobile();
  
  // Add refs to track if we're already fetching to prevent duplicate calls
  const isFetchingRef = useRef(false);
  const statusCache = useRef<Map<string, string>>(new Map());

  // Function to fetch status for a specific application with retry
  const fetchApplicationStatus = async (orderId: string, transactionId: string, retryCount = 0): Promise<string> => {
    // Check cache first
    const cacheKey = `${orderId}-${transactionId}`;
    if (statusCache.current.has(cacheKey)) {
      return statusCache.current.get(cacheKey)!;
    }

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
        let status: string;
        switch (code) {
          case 'archived':
            status = 'rejected';
            break;
          case 'open':
            status = 'applied';
            break;
          case 'closed':
            status = 'hired';
            break;
          default:
            status = 'applied'; // Default fallback
        }
        
        // Cache the result
        statusCache.current.set(cacheKey, status);
        return status;
      }
      
      const defaultStatus = 'applied';
      statusCache.current.set(cacheKey, defaultStatus);
      return defaultStatus; // Default fallback
    } catch (error) {
      console.error('Failed to fetch application status:', error);
      
      // Retry logic for failed requests
      if (retryCount < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return fetchApplicationStatus(orderId, transactionId, retryCount + 1);
      }
      
      const fallbackStatus = 'applied';
      statusCache.current.set(cacheKey, fallbackStatus);
      return fallbackStatus; // Default fallback on error
    }
  };

  // Function to extract profile ID from application data
  const extractProfileId = (app: any): string => {
    // Try to extract profile ID from various possible locations in the application data
    const person = app?.metadata?.message?.order?.fulfillments?.[0]?.customer?.person;
    
    // Check metadata first
    if (person?.metadata?.profileId) {
      return person.metadata.profileId;
    }
    
    // Check tags for profile ID
    const tags = person?.tags;
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        if (tag.descriptor?.code === 'emp-details' && tag.list) {
          for (const item of tag.list) {
            if (item.descriptor?.code === 'profile-id') {
              return item.value;
            }
          }
        }
      }
    }
    
    // Check transaction ID for profile ID (if it was included in the transaction ID)
    const transactionId = app?.metadata?.context?.transaction_id || app?.transaction_id;
    if (transactionId && transactionId.includes('-')) {
      const parts = transactionId.split('-');
      if (parts.length > 2) {
        const lastPart = parts[parts.length - 1];
        // If the last part looks like a profile ID (not a random string), use it
        if (lastPart && lastPart.length > 5 && !isNaN(parseInt(lastPart))) {
          return lastPart;
        }
      }
    }
    
    // Default to 'default' if no profile ID found
    return 'default';
  };

  // Function to fetch all applications with their statuses
  const fetchApplicationsWithStatus = async () => {
    if (!user?.id || isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    setIsLoading(true);
    setStatusLoading(true);
    
    try {
      // Use profile ID (selected candidate ID) instead of user ID for fetching applications
      const profileIdForApi = selectedCandidate?.id || user.id;
      const url = `${import.meta.env.VITE_BAP_URL}/api/v1/job-applications?user_id=${profileIdForApi}`;
      const response = await fetch(url);
      const data = await response.json();
      
      const applicationsData = data?.applications || [];
      
      // First, create applications with default status and extract profile IDs
      const applicationsWithDefaultStatus = applicationsData.map((app: any) => {
        const item = app?.metadata?.message?.order?.items?.[0] || {};
        const provider = app?.metadata?.message?.order?.provider || {};
        const locationObj = (provider.locations && provider.locations[0]) || {};
        const tag = item?.tag || {};
        const basicInfo = tag?.basicInfo || {};
        const jobDetails = tag?.jobDetails || {};
        const profileId = extractProfileId(app);

        // Extract salary from various possible locations
        let salary = 'N/A';
        

        
        // Check all possible locations for salary data
        const salaryValue = 
          jobDetails?.salaryCTC ||
          jobDetails?.monthlyInHand ||
          jobDetails?.monthlySalary ||
          tag?.jobDetails?.monthlyInHand ||
          tag?.jobDetails?.salaryCTC ||
          item?.tag?.jobDetails?.monthlyInHand ||
          item?.tag?.jobDetails?.salaryCTC ||
          item?.tag?.basicInfo?.salaryCTC ||
          item?.tag?.basicInfo?.monthlyInHand ||
          item?.tag?.jobDetails?.salaryCTC ||
          item?.tag?.jobDetails?.monthlyInHand;
        
        if (salaryValue && salaryValue !== 'N/A' && salaryValue !== 'undefined') {
          // Handle both string and number values
          const numValue = typeof salaryValue === 'string' ? parseFloat(salaryValue) : salaryValue;
          if (!isNaN(numValue)) {
            salary = `₹${numValue.toLocaleString()}`;
          }
        }
        
        // If still no salary found, search deeper in the application structure
        if (salary === 'N/A') {
          const searchForSalary = (obj: any): any => {
            if (!obj || typeof obj !== 'object') return null;
            
            // Check for salary-related keys
            const salaryKeys = ['salaryCTC', 'monthlyInHand', 'monthlySalary', 'salary', 'inHandSalary'];
            for (const key of salaryKeys) {
              if (obj[key] && obj[key] !== 'N/A' && obj[key] !== 'undefined') {
                return obj[key];
              }
            }
            
            // Recursively search nested objects
            for (const [key, value] of Object.entries(obj)) {
              if (typeof value === 'object' && value !== null) {
                const found = searchForSalary(value);
                if (found) return found;
              }
            }
            
            return null;
          };
          
          const foundSalary = searchForSalary(app);
          if (foundSalary) {
            const numValue = typeof foundSalary === 'string' ? parseFloat(foundSalary) : foundSalary;
            if (!isNaN(numValue)) {
              salary = `₹${numValue.toLocaleString()}`;
            }
          }
        }
        


        return {
          id: app.order_id ?? app.transaction_id ?? app.job_id,
          jobId: item.id ?? app.job_id,
          jobTitle: item?.descriptor?.name ?? 'Unknown',
          company: basicInfo?.jobProviderName ?? provider?.descriptor?.name ?? 'Unknown',
          location: `${locationObj.city ?? ''}${locationObj.state ? ', ' + locationObj.state : ''}`.trim(),
          salary: salary,
          appliedDate: app?.metadata?.context?.timestamp ?? new Date().toISOString(),
          status: 'applied' as JobApplication['status'], // Default status
          raw: app,
          media: [],
          profileId, // Include the extracted profile ID
        } as JobApplication;
      });

      // Since we're now fetching applications by profile ID, we don't need to filter again
      // The API should return only applications for the selected profile
      const filteredApplications = applicationsWithDefaultStatus;



      // Set applications with default status first
      setApplications(filteredApplications);
      setIsLoading(false);

      // Then fetch status for each application (only if we have applications)
      if (filteredApplications.length > 0) {
        const applicationsWithStatus = await Promise.all(
          filteredApplications.map(async (app, index) => {
            const orderId = app.raw?.metadata?.message?.order?.id || app.raw?.order_id;
            const transactionId = app.raw?.metadata?.context?.transaction_id || app.raw?.transaction_id;

            if (orderId && transactionId) {
              const status = await fetchApplicationStatus(orderId, transactionId);
              return {
                ...app,
                status: status as JobApplication['status']
              };
            } else {
              return app;
            }
          })
        );

        setApplications(applicationsWithStatus);
      }
    } catch (error) {
      console.error('Failed to fetch job applications', error);
    } finally {
      setIsLoading(false);
      setStatusLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Function to refresh only statuses
  const refreshStatuses = async () => {
    if (!applications.length || statusLoading) return;
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
    // Clear cache when user or selected candidate changes
    statusCache.current.clear();
    fetchApplicationsWithStatus();
  }, [user, selectedCandidate]); // Re-fetch when selected candidate changes

  const activeApplications = applications.filter(app => !['hired', 'rejected'].includes(app.status));
  const completedApplications = applications.filter(app => ['hired', 'rejected'].includes(app.status));

  return (
    <div className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      ) : (
        <>
          {/* {applications.length > 0 && (
            <div className={`flex ${isMobile ? 'justify-center' : 'justify-end'}`}>
              <Button 
                onClick={refreshStatuses} 
                disabled={statusLoading}
                variant="outline" 
                size={isMobile ? "default" : "sm"}
                className={`flex items-center gap-2 ${isMobile ? 'h-12 px-6 text-base' : ''}`}
              >
                <RefreshCw className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} ${statusLoading ? 'animate-spin' : ''}`} />
                {statusLoading ? 'Updating...' : 'Refresh Status'}
              </Button>
            </div>
          )} */}
          
          {statusLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Updating application statuses...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No applications found</h3>
              <p className="text-muted-foreground mb-4">
                {selectedCandidate 
                  ? `You haven't applied to any jobs with the profile "${selectedCandidate.nickname || selectedCandidate.name}" yet.`
                  : "You haven't applied to any jobs yet."
                }
              </p>
              <p className="text-sm text-muted-foreground">
                Switch to a different profile or apply to jobs to see your applications here.
              </p>
            </div>
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
