import React, { useEffect, useState, useRef , useCallback} from 'react';
import ApplicationTabs from './my-applications/ApplicationTabs';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { User } from 'lucide-react'; // Added User icon import
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/hooks/useI18n';

interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  salary: string;
  appliedDate: string;

  status: 'applied' | 'viewed' | 'shortlisted' | 'interview' | 'hired' | 'rejected' | 'draft';

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
  // const [draftApplications, setDraftApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusLoading, setStatusLoading] = useState<boolean>(false);
  const isMobile = useIsMobile();
  const t = useTranslation('applications');
  
  // Add refs to track if we're already fetching to prevent duplicate calls
  const isFetchingRef = useRef(false);
  const statusCache = useRef<Map<string, { status: string; timestamp: number }>>(new Map());
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Function to check if cache is valid
  const isCacheValid = (timestamp: number): boolean => {
    return Date.now() - timestamp < CACHE_DURATION;
  };

  // Function to fetch status for a specific application with retry and better error handling
  const fetchApplicationStatus = async (orderId: string, transactionId: string, bpp_id?: string, bpp_uri?: string, retryCount = 0): Promise<string> => {
    // Check cache first
    const cacheKey = `${orderId}-${transactionId}`;
    const cachedResult = statusCache.current.get(cacheKey);
    if (cachedResult && isCacheValid(cachedResult.timestamp)) {
      return cachedResult.status;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BAP_URL}/api/v1/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: {
            bpp_id: bpp_id || "bpp1.dhiway.com",
            bpp_uri: bpp_uri || "https://beckn-adapter.dhiway.net/bpp/receiver",
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
        // Handle different HTTP error codes
        if (response.status === 404 || response.status === 410) {
          // Job not found or gone - likely deleted
          const deletedStatus = 'deleted';
          statusCache.current.set(cacheKey, { status: deletedStatus, timestamp: Date.now() });
          return deletedStatus;
        }
        throw new Error(`Status API failed: ${response.status}`);
      }

      const data: StatusResponse = await response.json();
      
      // Check if the response indicates the job/order doesn't exist
      if (!data.message?.order) {
        const deletedStatus = 'deleted';
        statusCache.current.set(cacheKey, { status: deletedStatus, timestamp: Date.now() });
        return deletedStatus;
      }

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
        // - 'closed' -> 'shortlisted' (Application was shortlisted)
        // - 'deleted' or 'cancelled' -> 'deleted' (Job was deleted by provider)
        // - 'inactive' or 'expired' -> 'deleted' (Job is no longer active)
        let status: string;
        switch (code.toLowerCase()) {
          case 'archived':
            status = 'rejected';
            break;
          case 'open':
          case 'active':
            status = 'applied';
            break;
          case 'closed':
          case 'completed':
            status = 'shortlisted';
            break;
          case 'deleted':
          case 'cancelled':
          case 'inactive':
          case 'expired':
          case 'removed':
            status = 'deleted';
            break;
          default:
            status = 'applied'; // Default fallback
        }
        
        // Cache the result with timestamp
        statusCache.current.set(cacheKey, { status, timestamp: Date.now() });
        return status;
      }
      
      const defaultStatus = 'applied';
      statusCache.current.set(cacheKey, { status: defaultStatus, timestamp: Date.now() });
      return defaultStatus; // Default fallback
    } catch (error) {
      console.error('Failed to fetch application status:', error);
      
      // Retry logic for failed requests
      if (retryCount < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return fetchApplicationStatus(orderId, transactionId, bpp_id, bpp_uri, retryCount + 1);
      }
      
      const fallbackStatus = 'applied';
      statusCache.current.set(cacheKey, { status: fallbackStatus, timestamp: Date.now() });
      return fallbackStatus; // Default fallback on error
    }
  };

  // Optimized batch status fetching with parallel requests but rate limiting
  const fetchMultipleStatuses = async (applications: JobApplication[]): Promise<JobApplication[]> => {
    const batchSize = 5; // Process 5 requests at a time to avoid overwhelming the API
    const updatedApplications: JobApplication[] = [];

    for (let i = 0; i < applications.length; i += batchSize) {
      const batch = applications.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (app) => {
        const orderId = app.raw?.metadata?.message?.order?.id || app.raw?.order_id;
        const transactionId = app.raw?.metadata?.context?.transaction_id || app.raw?.transaction_id;
        const context = app.raw?.metadata?.context;
        const bpp_id = context?.bpp_id;
        const bpp_uri = context?.bpp_uri;

        if (orderId && transactionId) {
          const status = await fetchApplicationStatus(orderId, transactionId, bpp_id, bpp_uri);
          return {
            ...app,
            status: status as JobApplication['status']
          };
        } else {
          return app;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      updatedApplications.push(...batchResults);

      // Add a small delay between batches to be respectful to the API
      if (i + batchSize < applications.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return updatedApplications;
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

  // Function to fetch draft applications - DISABLED
  /*
  const fetchDraftApplications = async () => {
    if (!user?.id) return;
    
    try {
      // Prefer the `userId` from the profile GET API as requested
      let profileUserId: string | undefined = undefined;
      try {
        const profileResp = await apiClient.getProfile();
        const profileDataAny = (profileResp as any)?.data;
        // Prefer explicit userId if provided by profile API, then other common fields, then fallbacks
        profileUserId = profileDataAny?.userId || profileDataAny?.user_id || profileDataAny?.user?.id || profileDataAny?.id || selectedCandidate?.id || user.id;
      } catch (err) {
        // Fallback to selected candidate id or auth user id
        profileUserId = selectedCandidate?.id || user.id;
      }

      const url = `${import.meta.env.VITE_BAP_URL}/api/v1/job-applications/drafts?user_id=${profileUserId}`;
      const response = await fetch(url);
      const data = await response.json();

      // Support different response shapes: try common fields used elsewhere
      const draftApplicationsData = data?.applications || data?.message?.applications || data?.results || data || [];
      
      const processedDraftApplications = draftApplicationsData.map((app: any) => {
        // Extract job details from the new structure where job info is in person metadata
        const fulfillment = app?.metadata?.order?.fulfillments?.[0];
        const personMetadata = fulfillment?.customer?.person?.metadata;
        const jobDetails = personMetadata?.jobDetails || {};
        
        // Extract from the new jobDetails structure first, then fallback to old structure
        const item = app?.metadata?.message?.order?.items?.[0] || {};
        const provider = app?.metadata?.message?.order?.provider || {};
        const locationObj = (provider.locations && provider.locations[0]) || {};
        const tag = item?.tag || {};
        const basicInfo = tag?.basicInfo || {};
        const profileId = extractProfileId(app);

        // Extract salary from the new jobDetails structure first
        let salary = 'N/A';
        
        // Check for salary in the new jobDetails structure
        const monthlyInHand = jobDetails?.monthlyInHand;
        const maxMonthlyInHand = jobDetails?.maxMonthlyInHand;
        const minMonthlyInHand = jobDetails?.minMonthlyInHand;
        
        if (maxMonthlyInHand && minMonthlyInHand) {
          // Both min and max available - show as range
          const minValue = typeof minMonthlyInHand === 'string' ? parseFloat(minMonthlyInHand) : minMonthlyInHand;
          const maxValue = typeof maxMonthlyInHand === 'string' ? parseFloat(maxMonthlyInHand) : maxMonthlyInHand;
          
          if (!isNaN(minValue) && !isNaN(maxValue)) {
            salary = `₹${minValue.toLocaleString()} - ₹${maxValue.toLocaleString()}`;
          }
        } else if (maxMonthlyInHand) {
          // Only max available
          const maxValue = typeof maxMonthlyInHand === 'string' ? parseFloat(maxMonthlyInHand) : maxMonthlyInHand;
          if (!isNaN(maxValue)) {
            salary = `Up to ₹${maxValue.toLocaleString()}`;
          }
        } else if (minMonthlyInHand) {
          // Only min available
          const minValue = typeof minMonthlyInHand === 'string' ? parseFloat(minMonthlyInHand) : minMonthlyInHand;
          if (!isNaN(minValue)) {
            salary = `From ₹${minValue.toLocaleString()}`;
          }
        } else if (monthlyInHand && monthlyInHand !== 'Not specified' && monthlyInHand !== 'N/A') {
          // Single monthly in hand salary
          const numValue = typeof monthlyInHand === 'string' ? parseFloat(monthlyInHand) : monthlyInHand;
          if (!isNaN(numValue)) {
            salary = `₹${numValue.toLocaleString()}`;
          }
        } else {
          // Fallback to existing single salary extraction logic
          const salaryValue = 
            jobDetails?.salaryCTC ||
            jobDetails?.monthlySalary ||
            tag?.jobDetails?.monthlyInHand ||
            tag?.jobDetails?.salaryCTC ||
            item?.tag?.jobDetails?.monthlyInHand ||
            item?.tag?.jobDetails?.salaryCTC ||
            item?.tag?.basicInfo?.salaryCTC ||
            item?.tag?.basicInfo?.monthlyInHand;
          
          if (salaryValue && salaryValue !== 'N/A' && salaryValue !== 'undefined' && salaryValue !== 'Not specified') {
            // Handle both string and number values
            const numValue = typeof salaryValue === 'string' ? parseFloat(salaryValue) : salaryValue;
            if (!isNaN(numValue)) {
              salary = `₹${numValue.toLocaleString()}`;
            }
          }
        }

        // Extract job title from the new jobDetails structure first
        const titleCandidates = [
          jobDetails?.jobTitle, // New structure
          jobDetails?.title,    // New structure
          item?.descriptor?.name,
          tag?.jobDetails?.jobTitle,
          tag?.jobDetails?.title,
          basicInfo?.jobTitle,
          basicInfo?.title,
          item?.tag?.jobDetails?.jobTitle,
          item?.tag?.jobDetails?.title,
          item?.tag?.basicInfo?.jobTitle,
          item?.tag?.basicInfo?.title,
        ];

        const jobTitle = titleCandidates.find(title => title && title !== 'N/A' && title !== 'undefined') || 'N/A';

        // Extract company name from the new jobDetails structure first
        const companyCandidates = [
          jobDetails?.companyName, // New structure
          jobDetails?.company,      // New structure
          basicInfo?.jobProviderName,
          basicInfo?.companyName,
          basicInfo?.company,
          item?.tag?.basicInfo?.jobProviderName,
          item?.tag?.basicInfo?.companyName,
          item?.tag?.basicInfo?.company,
          provider?.descriptor?.name,
        ];

        const company = companyCandidates.find(company => company && company !== 'N/A' && company !== 'undefined') || 'N/A';

        // Extract location from the new jobDetails structure first
        const locationCandidates = [
          jobDetails?.location, // New structure
          locationObj?.address,
          locationObj?.city,
          locationObj?.state,
          basicInfo?.jobProviderLocation?.address,
          basicInfo?.jobProviderLocation?.city,
          basicInfo?.jobProviderLocation?.state,
          item?.tag?.basicInfo?.jobProviderLocation?.address,
          item?.tag?.basicInfo?.jobProviderLocation?.city,
          item?.tag?.basicInfo?.jobProviderLocation?.state,
        ];

        const location = locationCandidates.find(loc => loc && loc !== 'N/A' && loc !== 'undefined') || 'N/A';

        return {
          id: app.id || app.metadata?.order?.id || `draft-${Date.now()}`,
          jobId: app.metadata?.order?.items?.[0]?.id || 'N/A',
          jobTitle,
          company,
          location,
          salary,
          appliedDate: app.createdAt || app.metadata?.order?.createdAt || new Date().toISOString(),
          status: 'draft' as const,
          raw: app,
          media: [],
          profileId,
        } as JobApplication;
      });

      setDraftApplications(processedDraftApplications);
    } catch (error) {
      console.error('Failed to fetch draft applications', error);
      setDraftApplications([]);
    }
  };
  */

  // Function to fetch all applications with their statuses
  const fetchApplicationsWithStatus = useCallback(async () => {
    console.log('MyApplications: fetchApplicationsWithStatus called', {
      'user?.id': user?.id,
      'isFetchingRef.current': isFetchingRef.current,
      'selectedCandidate?.id': selectedCandidate?.id,
      'timestamp': new Date().toISOString()
    });
    
    if (!user?.id || isFetchingRef.current) {
      console.log('MyApplications: Skipping fetch - no user ID or already fetching');
      return;
    }
    
    isFetchingRef.current = true;
    setIsLoading(true);
    setStatusLoading(true);
    
    try {
      // Use profile ID (selected candidate ID) instead of user ID for fetching applications
      const profileIdForApi = selectedCandidate?.id || user.id;
      
      console.log('🔍 MyApplications: DETAILED PROFILE ID ANALYSIS:', {
        'selectedCandidate?.id': selectedCandidate?.id,
        'selectedCandidate?.name': selectedCandidate?.name,
        'user.id': user.id,
        'finalProfileIdForApi': profileIdForApi,
        'selectedCandidateExists': !!selectedCandidate,
        'Profile ID characteristics': {
          'length': profileIdForApi?.length,
          'isUUID (>20 chars)': profileIdForApi && profileIdForApi.length > 20,
          'isNumeric (timestamp)': profileIdForApi && profileIdForApi.match(/^\d+$/),
          'first10chars': profileIdForApi?.substring(0, 10),
          'last10chars': profileIdForApi?.substring(profileIdForApi.length - 10)
        }
      });
      
      const url = `${import.meta.env.VITE_BAP_URL}/api/v1/job-applications?user_id=${profileIdForApi}`;
      console.log('🌐 MyApplications: Making API request to:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('📊 MyApplications: Detailed API response analysis:', {
        'response.status': response.status,
        'response.ok': response.ok,
        'data.applications?.length': data?.applications?.length,
        'data.user_id': data?.user_id,
        'requested_user_id': profileIdForApi,
        'user_id_matches': data?.user_id === profileIdForApi,
        'Applications found': data?.applications?.map(app => ({
          jobId: app.jobId || app.job_id || 'unknown',
          profileId: extractProfileId(app),
          appliedDate: app.appliedDate || app.created_at || 'unknown'
        })) || []
      });
      
      // Log individual applications for debugging
      if (data?.applications && data.applications.length > 0) {
        console.log('📋 MyApplications: Found applications - detailed analysis:');
        data.applications.forEach((app, index) => {
          console.log(`Application ${index + 1}:`, {
            jobId: app.jobId || app.job_id || 'unknown',
            profileId: extractProfileId(app),
            status: app.status,
            raw: app
          });
        });
      } else {
        console.log('📭 MyApplications: No applications found for profile ID:', profileIdForApi);
      }
      
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
        
        // Check for salary range first (maxMonthlyInHand and minMonthlyInHand)
        const maxSalary = jobDetails?.maxMonthlyInHand || tag?.jobDetails?.maxMonthlyInHand || item?.tag?.jobDetails?.maxMonthlyInHand;
        const minSalary = jobDetails?.minMonthlyInHand || tag?.jobDetails?.minMonthlyInHand || item?.tag?.jobDetails?.minMonthlyInHand;
        
        if (maxSalary && minSalary) {
          // Both min and max available - show as range
          const minValue = typeof minSalary === 'string' ? parseFloat(minSalary) : minSalary;
          const maxValue = typeof maxSalary === 'string' ? parseFloat(maxSalary) : maxSalary;
          
          if (!isNaN(minValue) && !isNaN(maxValue)) {
            salary = `₹${minValue.toLocaleString()} - ₹${maxValue.toLocaleString()}`;
          }
        } else if (maxSalary) {
          // Only max available
          const maxValue = typeof maxSalary === 'string' ? parseFloat(maxSalary) : maxSalary;
          if (!isNaN(maxValue)) {
            salary = `Up to ₹${maxValue.toLocaleString()}`;
          }
        } else if (minSalary) {
          // Only min available
          const minValue = typeof minSalary === 'string' ? parseFloat(minSalary) : minSalary;
          if (!isNaN(minValue)) {
            salary = `From ₹${minValue.toLocaleString()}`;
          }
        } else {
          // Fallback to existing single salary extraction logic
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
        }
        
        // If still no salary found, search deeper in the application structure
        if (salary === 'N/A') {
          const searchForSalaryRange = (obj: any): { min?: any, max?: any, single?: any } => {
            if (!obj || typeof obj !== 'object') return {};
            
            let result: { min?: any, max?: any, single?: any } = {};
            
            // Check for salary-related keys including min/max
            if (obj.maxMonthlyInHand) result.max = obj.maxMonthlyInHand;
            if (obj.minMonthlyInHand) result.min = obj.minMonthlyInHand;
            if (!result.min && !result.max) {
              const salaryKeys = ['salaryCTC', 'monthlyInHand', 'monthlySalary', 'salary', 'inHandSalary'];
              for (const key of salaryKeys) {
                if (obj[key] && obj[key] !== 'N/A' && obj[key] !== 'undefined') {
                  result.single = obj[key];
                  break;
                }
              }
            }
            
            // If we found something, return it
            if (result.min || result.max || result.single) return result;
            
            // Recursively search nested objects
            for (const [key, value] of Object.entries(obj)) {
              if (typeof value === 'object' && value !== null) {
                const found = searchForSalaryRange(value);
                if (found.min || found.max || found.single) return found;
              }
            }
            
            return {};
          };
          
          const foundSalaryData = searchForSalaryRange(app);
          if (foundSalaryData.min && foundSalaryData.max) {
            const minValue = typeof foundSalaryData.min === 'string' ? parseFloat(foundSalaryData.min) : foundSalaryData.min;
            const maxValue = typeof foundSalaryData.max === 'string' ? parseFloat(foundSalaryData.max) : foundSalaryData.max;
            if (!isNaN(minValue) && !isNaN(maxValue)) {
              salary = `₹${minValue.toLocaleString()} - ₹${maxValue.toLocaleString()}`;
            }
          } else if (foundSalaryData.max) {
            const maxValue = typeof foundSalaryData.max === 'string' ? parseFloat(foundSalaryData.max) : foundSalaryData.max;
            if (!isNaN(maxValue)) {
              salary = `Up to ₹${maxValue.toLocaleString()}`;
            }
          } else if (foundSalaryData.min) {
            const minValue = typeof foundSalaryData.min === 'string' ? parseFloat(foundSalaryData.min) : foundSalaryData.min;
            if (!isNaN(minValue)) {
              salary = `From ₹${minValue.toLocaleString()}`;
            }
          } else if (foundSalaryData.single) {
            const numValue = typeof foundSalaryData.single === 'string' ? parseFloat(foundSalaryData.single) : foundSalaryData.single;
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

      // Then fetch status for each application using optimized batch processing
      if (filteredApplications.length > 0) {
        const applicationsWithStatus = await fetchMultipleStatuses(filteredApplications);
        setApplications(applicationsWithStatus);
      }
    } catch (error) {
      console.error('Failed to fetch job applications', error);
    } finally {
      setIsLoading(false);
      setStatusLoading(false);
      isFetchingRef.current = false;
    }
  }, [user, selectedCandidate]);

  // Function to refresh only statuses with optimized batch processing
  const refreshStatuses = async () => {
    if (!applications.length || statusLoading) return;
    setStatusLoading(true);
    
    try {
      const applicationsWithUpdatedStatus = await fetchMultipleStatuses(applications);
      setApplications(applicationsWithUpdatedStatus);
    } catch (error) {
      console.error('Failed to refresh application statuses', error);
    } finally {
      setStatusLoading(false);
    }
  };

  // Auto refresh functionality
  const startAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
    }
    
    // Refresh every 2 minutes
    autoRefreshInterval.current = setInterval(() => {
      if (applications.length > 0 && !statusLoading && !isLoading) {
        refreshStatuses();
      }
    }, 2 * 60 * 1000);
  }, [applications.length, statusLoading, isLoading]);

  useEffect(() => {
    console.log('🎯 MyApplications: MAIN useEffect triggered (selectedCandidate or user change)', {
      'user?.id': user?.id,
      'selectedCandidate?.id': selectedCandidate?.id,
      'selectedCandidate?.name': selectedCandidate?.name,
      'selectedCandidate exists': !!selectedCandidate,
      'trigger': 'user or selectedCandidate dependency change',
      'timestamp': new Date().toISOString()
    });
    
    // Clear cache when user or selected candidate changes
    statusCache.current.clear();
    fetchApplicationsWithStatus();
    // fetchDraftApplications(); // Commented out as per edit hint

  }, [user, selectedCandidate]); // Re-fetch when selected candidate changes


  // Add a refresh mechanism when component mounts to catch new applications
  useEffect(() => {
    const handleFocus = () => {
      // Refresh applications when the window regains focus (user navigates back)
      if (user?.id) {
        fetchApplicationsWithStatus();
        // fetchDraftApplications(); // Commented out as per edit hint
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user?.id]);

  // Additional refresh when component mounts and user is available
  useEffect(() => {
    console.log('🔄 MyApplications: Additional refresh useEffect triggered', {
      'user?.id': user?.id,
      'isFetchingRef.current': isFetchingRef.current,
      'selectedCandidate?.id': selectedCandidate?.id,
      'trigger': 'user?.id change or mount'
    });
    
    if (user?.id && !isFetchingRef.current) {
      // Small delay to ensure any pending applications are processed
      const timer = setTimeout(() => {
        console.log('🔄 MyApplications: Triggering fetchApplicationsWithStatus from timer (mount/user change)');
        fetchApplicationsWithStatus();
        // fetchDraftApplications(); // Commented out as per edit hint
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user?.id]);

  const activeApplications = applications.filter(app => !['rejected'].includes(app.status));
  const completedApplications = applications.filter(app => ['rejected'].includes(app.status))

  return (
    <div className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      ) : (
        <>
          {applications.length > 0 && (
            <div className={`flex ${isMobile ? 'justify-center' : 'justify-end'} mb-4`}>
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
          )}
          
          {statusLoading ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm">{t('myApplications.updatingStatuses', 'Updating application statuses...')}</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">{t('myApplications.noApplicationsFound', 'No applications found')}</h3>
              <p className="text-muted-foreground mb-4">
                {selectedCandidate 
                  ? `${t('myApplications.noApplicationsWithProfile', 'You haven\'t applied to any jobs with the profile')} "${selectedCandidate.nickname || selectedCandidate.name}" ${t('common.yet', 'yet')}.`
                  : t('myApplications.noApplicationsYet', 'You haven\'t applied to any jobs yet.')
                }
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {t('myApplications.switchProfileHint', 'Switch to a different profile or apply to jobs to see your applications here.')}
              </p>
              <Button 
                onClick={() => {
                  fetchApplicationsWithStatus();
                  // fetchDraftApplications(); // Commented out as per edit hint
                }}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? t('myApplications.updating', 'Refreshing...') : t('myApplications.refreshStatus', 'Refresh Applications')}
              </Button>
            </div>
          ) : (
            <ApplicationTabs 
              activeApplications={activeApplications}
              completedApplications={completedApplications}
              draftApplications={[]} // Removed draftApplications prop
              onApplicationSubmitted={() => {
                fetchApplicationsWithStatus();
                // fetchDraftApplications(); // Commented out as per edit hint
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default MyApplications;
