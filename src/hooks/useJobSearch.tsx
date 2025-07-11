import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api';

export interface JobItem {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  workingHours?: string;
  monthlyInHand?: string;
  monthlyPfEsic?: string;
  monthlyOvertime?: string;
  costPerSharingBed?: string;
  stayProvided?: boolean;
  trustScore?: number;
  matchScore?: number;
  verified?: boolean;
  openings?: number;
  description?: string;
  industry?: string;
  experience?: string;
  positions?: number;
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
    alt?: string;
    duration?: string;
  }>;
  contactPerson?: {
    name: string;
    email: string;
    phone: string;
  };
  jobProviderName?: string;
  jobProviderLocation?: {
    address: string;
    city: string;
    state: string;
    country: string;
    gps?: {
      lat: number;
      lng: number;
    };
  };
  jobDetails?: Record<string, any>;
  tags?: Record<string, any>;
}

export interface JobSearchResponse {
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
  results: Array<{
    context: any;
    message: {
      catalog: {
        descriptor: {
          name: string;
        };
        providers: Array<{
          descriptor: {
            name: string;
          };
          id: string;
          items: Array<{
            descriptor: {
              name: string;
            };
            id: string;
            tags: any;
          }>;
          locations: Array<{
            address: string;
            city: string;
            state: string;
            country: string;
            gps?: {
              lat: number;
              lng: number;
            };
          }>;
        }>;
      };
    };
  }>;
}

export type LoadingState = 'idle' | 'initial' | 'loading' | 'partial' | 'complete' | 'error';

export const useJobSearch = () => {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
    total: 0
  });
  const [retryCount, setRetryCount] = useState(0);
  const [originalResponse, setOriginalResponse] = useState<JobSearchResponse | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const maxRetries = 3;
  const requestTimeout = 30000; // 30 seconds timeout
  const cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to find provider and job IDs from original response
  const findProviderAndJobIds = useCallback((jobId: string): { providerId: string; jobId: string } | null => {
    if (!originalResponse?.results) {
      return null;
    }

    for (const result of originalResponse.results) {
      if (!result?.message?.catalog?.providers) continue;
      
      for (const provider of result.message.catalog.providers) {
        if (!provider?.items) continue;
        
        for (const item of provider.items) {
          if (item.id === jobId) {
            return {
              providerId: provider.id,
              jobId: item.id
            };
          }
        }
      }
    }
    
    return null;
  }, [originalResponse]);

  const transformJobData = useCallback((apiResponse: JobSearchResponse): JobItem[] => {
    const transformedJobs: JobItem[] = [];

    // Check if results exist and have the expected structure
    if (!apiResponse.results || !Array.isArray(apiResponse.results)) {
      console.warn('No results found in API response');
      return transformedJobs;
    }

    apiResponse.results.forEach(result => {
      // Check if message and catalog exist
      if (!result?.message?.catalog) {
        console.warn('Missing catalog in API response result');
        return;
      }

      const catalog = result.message.catalog;
      
      // Check if providers exist and is an array
      if (!catalog.providers || !Array.isArray(catalog.providers)) {
        console.warn('No providers found in catalog');
        return;
      }

      catalog.providers.forEach(provider => {
        // Check if provider has items
        if (!provider?.items || !Array.isArray(provider.items)) {
          console.warn('No items found in provider:', provider?.descriptor?.name);
          return;
        }

        provider.items.forEach(item => {
          // Check if item has required properties
          if (!item?.descriptor?.name || !item?.id) {
            console.warn('Invalid item structure:', item);
            return;
          }

          const tags = item.tags || {};
          
          // Extract location from provider locations or item tags
          const location = provider.locations?.[0] || tags?.jobProviderLocation || {};
          const locationString = location.city && location.state 
            ? `${location.city}, ${location.state}`
            : location.address || 'Location not specified';

          // Extract salary information
          const salary = tags?.industrialTailorDetails?.monthlyInHand 
            ? `₹${tags.industrialTailorDetails.monthlyInHand}`
            : tags?.salaryRange || 'Salary not specified';

          // Extract working hours
          const workingHours = tags?.workingHours || tags?.industrialTailorDetails?.workingMode || '8 hours/day';

          // Extract monthly in-hand salary
          const monthlyInHand = tags?.industrialTailorDetails?.monthlyInHand 
            ? `₹${tags.industrialTailorDetails.monthlyInHand}`
            : 'Not specified';

          // Extract PF & ESIC
          const monthlyPfEsic = tags?.industrialTailorDetails?.monthlyPfEsicBenefits 
            ? `₹${tags.industrialTailorDetails.monthlyPfEsicBenefits}`
            : 'Included';

          // Extract overtime
          const monthlyOvertime = tags?.industrialTailorDetails?.minimumOvertimeCommitted 
            ? `₹${tags.industrialTailorDetails.minimumOvertimeCommitted}`
            : 'Not specified';

          // Extract stay provided
          const stayProvided = tags?.housingFacility || false;

          // Extract cost per sharing bed (if available)
          const costPerSharingBed = tags?.costPerSharingBed || 'Not specified';

          // Extract trust and match scores (default values for now)
          const trustScore = tags?.factoryTrustScore || Math.floor(Math.random() * 3) + 7; // 7-9
          const matchScore = Math.floor(Math.random() * 3) + 7; // 7-9

          // Extract openings/positions
          const openings = tags?.jobDetails?.positions || tags?.positions || 1;

          // Extract job details from tags
          const jobDetails = tags?.jobDetails || {};

          // Extract description
          const description = tags?.jobDescription?.description || tags?.description || '';

          // Extract industry
          const industry = tags?.industry || 'Not specified';

          // Extract experience
          const experience = tags?.experience || tags?.jobNeeds?.experience || 'Not specified';

          // Extract contact person
          const contactPerson = tags?.hiringManager ? {
            name: tags.hiringManager.managerName || 'Not specified',
            email: tags.hiringManager.emailId || 'Not specified',
            phone: tags.hiringManager.phoneNo || 'Not specified'
          } : undefined;

          // Extract media from tags
          const media: Array<{
            type: 'image' | 'video';
            url: string;
            thumbnail?: string;
            alt?: string;
            duration?: string;
          }> = [];

          // Extract company logo
          if (tags?.basicInfo?.jobProviderLogo) {
            media.push({
              type: 'image',
              url: tags.basicInfo.jobProviderLogo,
              alt: `${tags.basicInfo.jobProviderName || 'Company'} logo`
            });
          }

          // Extract job details video
          if (tags?.jobDetails?.jobDetailsVideo) {
            media.push({
              type: 'video',
              url: tags.jobDetails.jobDetailsVideo,
              alt: `${item.descriptor.name} job details video`
            });
          }

          // Extract job location photos
          if (tags?.jobDetails?.jobLocationPhotos && Array.isArray(tags.jobDetails.jobLocationPhotos)) {
            tags.jobDetails.jobLocationPhotos.forEach((photoUrl: string, index: number) => {
              if (photoUrl) {
                media.push({
                  type: 'image',
                  url: photoUrl,
                  alt: `${item.descriptor.name} location photo ${index + 1}`
                });
              }
            });
          }

          // Extract sample task video
          if (tags?.jobNeeds?.sampleTaskVideo) {
            media.push({
              type: 'video',
              url: tags.jobNeeds.sampleTaskVideo,
              alt: `${item.descriptor.name} sample task video`
            });
          }

          // Extract sample task image
          if (tags?.jobNeeds?.sampleTaskImage) {
            media.push({
              type: 'image',
              url: tags.jobNeeds.sampleTaskImage,
              alt: `${item.descriptor.name} sample task image`
            });
          }

          // Extract speed proof documents and sample media
          if (tags?.jobNeeds?.jukiSpeedSubsection) {
            const speedSubsection = tags.jobNeeds.jukiSpeedSubsection;
            
            // Speed proof documents
            if (speedSubsection.uploadSpeedProof && Array.isArray(speedSubsection.uploadSpeedProof)) {
              speedSubsection.uploadSpeedProof.forEach((docUrl: string, index: number) => {
                if (docUrl) {
                  media.push({
                    type: 'image',
                    url: docUrl,
                    alt: `Speed proof document ${index + 1}`
                  });
                }
              });
            }

            // Speed sample media
            if (speedSubsection.uploadSpeedSampleMedia && Array.isArray(speedSubsection.uploadSpeedSampleMedia)) {
              speedSubsection.uploadSpeedSampleMedia.forEach((mediaUrl: string, index: number) => {
                if (mediaUrl) {
                  media.push({
                    type: 'video',
                    url: mediaUrl,
                    alt: `Speed sample media ${index + 1}`
                  });
                }
              });
            }
          }

          // Extract error proof documents and sample media
          if (tags?.jobNeeds?.jukiErrorSubsection) {
            const errorSubsection = tags.jobNeeds.jukiErrorSubsection;
            
            // Error proof documents
            if (errorSubsection.uploadErrorProof && Array.isArray(errorSubsection.uploadErrorProof)) {
              errorSubsection.uploadErrorProof.forEach((docUrl: string, index: number) => {
                if (docUrl) {
                  media.push({
                    type: 'image',
                    url: docUrl,
                    alt: `Error proof document ${index + 1}`
                  });
                }
              });
            }

            // Error sample media
            if (errorSubsection.uploadErrorSampleMedia && Array.isArray(errorSubsection.uploadErrorSampleMedia)) {
              errorSubsection.uploadErrorSampleMedia.forEach((mediaUrl: string, index: number) => {
                if (mediaUrl) {
                  media.push({
                    type: 'video',
                    url: mediaUrl,
                    alt: `Error sample media ${index + 1}`
                  });
                }
              });
            }
          }

          const transformedJob: JobItem = {
            id: item.id,
            title: item.descriptor.name,
            company: tags?.basicInfo?.jobProviderName || provider.descriptor?.name || 'Unknown Company',
            location: locationString,
            salary,
            workingHours,
            monthlyInHand,
            monthlyPfEsic,
            monthlyOvertime,
            costPerSharingBed,
            stayProvided,
            trustScore,
            matchScore,
            verified: true, // Assume verified for now
            openings,
            description,
            industry,
            experience,
            positions: openings,
            contactPerson,
            jobProviderName: tags?.basicInfo?.jobProviderName || provider.descriptor?.name || 'Unknown Company',
            jobProviderLocation: tags?.jobProviderLocation || location,
            jobDetails,
            tags,
            media
          };

          transformedJobs.push(transformedJob);
        });
      });
    });

    return transformedJobs;
  }, []);

  // Check if we have cached data that's still valid
  const isCacheValid = useCallback(() => {
    if (!lastFetchTime) return false;
    return Date.now() - lastFetchTime < cacheTimeout;
  }, [lastFetchTime]);

  const fetchJobs = useCallback(async (isRetry = false, forceRefresh = false) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Check cache validity (unless force refresh)
    if (!forceRefresh && isCacheValid() && jobs.length > 0) {
      setLoadingState('complete');
      return;
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      if (!isRetry) {
        setLoadingState(isInitialLoad ? 'initial' : 'loading');
        setError(null);
        setRetryCount(0);
      }
      
      // Set a timeout for the request
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, requestTimeout);

      // Set a loading timeout to show "taking longer than expected" message
      loadingTimeoutRef.current = setTimeout(() => {
        if (loadingState === 'initial' || loadingState === 'loading') {
          setLoadingState('partial');
        }
      }, 5000); // Show partial loading after 5 seconds

      const response: JobSearchResponse = await apiClient.searchJobs();
      
      // Clear timeouts
      clearTimeout(timeoutId);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      // Validate response structure
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid API response format');
      }

      // Check if response has the expected structure
      if (!response.results) {
        console.warn('API response missing results property');
        setJobs([]);
        setLoadingState('complete');
        return;
      }
      
      // Store original response for extracting provider and job IDs
      setOriginalResponse(response);
      
      const transformedJobs = transformJobData(response);
      setJobs(transformedJobs);
      setLastFetchTime(Date.now());
      
      if (response.pagination) {
        setPagination(response.pagination);
      }

      setLoadingState('complete');
      setIsInitialLoad(false);
      
    } catch (err) {
      // Clear timeouts
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }

      // Handle abort error
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
        setLoadingState('error');
        return;
      }

      console.error('Error fetching jobs:', err);
      
      // Auto-retry logic
      if (!isRetry && retryCount < maxRetries) {
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, newRetryCount - 1) * 1000;
        
        setTimeout(() => {
          fetchJobs(true, forceRefresh);
        }, delay);
        
        return;
      }
      
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
      setLoadingState('error');
      
      // Set empty array on error, but you could also set some fallback jobs here
      setJobs([]);
    }
  }, [isCacheValid, jobs.length, isInitialLoad, loadingState, retryCount, transformJobData]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    
    // Cleanup on unmount
    return cleanup;
  }, []);

  const refetch = useCallback((forceRefresh = false) => {
    fetchJobs(false, forceRefresh);
  }, [fetchJobs]);

  // Expose loading state as boolean for backward compatibility
  const loading = loadingState === 'initial' || loadingState === 'loading' || loadingState === 'partial';

  return {
    jobs,
    loading,
    loadingState,
    error,
    pagination,
    refetch,
    retryCount,
    findProviderAndJobIds,
    isInitialLoad,
    lastFetchTime
  };
}; 