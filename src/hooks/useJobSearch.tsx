import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

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
  status?: string; // Job status (draft, active, closed, etc.)
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
  const [scoresLoading, setScoresLoading] = useState(false);
  const [isAutoRetrying, setIsAutoRetrying] = useState(false);
  
  const { user } = useAuth();
  
  const maxRetries = 3;
  const requestTimeout = 30000; // 30 seconds timeout
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Function to fetch trust and match scores for specific jobs
  const fetchScoresForJobs = useCallback(async (jobsToScore: JobItem[]) => {
    if (!user || !user.profile || jobsToScore.length === 0) {
      console.log('User not logged in, no profile, or no jobs to score');
      return jobsToScore;
    }

    setScoresLoading(true);
    
    try {
      // Get seeker data from profile API
      const profileResponse = await apiClient.getProfile();
      
      // Extract the actual profile data object - handle both array and object responses
      let seekerData = profileResponse.data;
      
      // If the data is an array, take the first element
      if (Array.isArray(seekerData)) {
        console.log('Profile data is an array, extracting first element');
        seekerData = seekerData[0];
      }
      
      // Debug: Log the structure of seeker data
      console.log('Seeker data structure:', {
        isArray: Array.isArray(seekerData),
        type: typeof seekerData,
        keys: seekerData ? Object.keys(seekerData) : [],
        data: seekerData
      });

      // Ensure we have valid seeker data
      if (!seekerData || typeof seekerData !== 'object') {
        console.error('Invalid seeker data structure:', seekerData);
        return jobsToScore;
      }

      // Fetch trust scores and match scores for each job
      const jobsWithScores = await Promise.all(
        jobsToScore.map(async (job) => {
          try {
            // Fetch both trust score and match score
            const [trustResult, matchResult] = await Promise.all([
              apiClient.getTrustScore(job, seekerData),
              apiClient.getMatchScore(job, seekerData)
            ]);
            
            return {
              ...job,
              trustScore: trustResult.trustScore,
              matchScore: matchResult.matchScore
            };
          } catch (error) {
            console.error(`Failed to get scores for job ${job.id}:`, error);
            return job; // Return job without scores on error
          }
        })
      );

      return jobsWithScores;
    } catch (error) {
      console.error('Failed to fetch scores:', error);
      return jobsToScore;
    } finally {
      setScoresLoading(false);
    }
  }, [user]);

  // Transform job data from API response
  const transformJobData = useCallback((data: JobSearchResponse): JobItem[] => {
    const transformedJobs: JobItem[] = [];

    if (!data?.results || !Array.isArray(data.results)) {
      console.log('No results array in API response');
      return transformedJobs;
    }

    data.results.forEach(result => {
      if (!result?.message?.catalog?.providers) return;

      result.message.catalog.providers.forEach(provider => {
        if (!provider?.items || !Array.isArray(provider.items)) return;

        provider.items.forEach(item => {
          if (!item?.descriptor?.name) return;

          const tags = item.tags || {};
          const location = provider.locations?.[0];
          const locationString = location 
            ? `${location.city || ''}, ${location.state || ''}`.trim() || location.address || 'Location not specified'
            : 'Location not specified';

          // Extract salary information
          const salary = tags?.basicInfo?.monthlySalary 
            ? `₹${tags.basicInfo.monthlySalary}/month`
            : tags?.basicInfo?.salaryRange 
              ? tags.basicInfo.salaryRange
              : 'Salary not specified';

          // Extract working hours
          const workingHours = tags?.basicInfo?.workingHours || 'Not specified';

          // Extract monthly in-hand salary
          const monthlyInHand = tags?.basicInfo?.monthlyInHand 
            ? `₹${tags.basicInfo.monthlyInHand}/month`
            : undefined;

          // Extract monthly PF/ESIC
          const monthlyPfEsic = tags?.basicInfo?.monthlyPfEsic 
            ? `₹${tags.basicInfo.monthlyPfEsic}/month`
            : undefined;

          // Extract monthly overtime
          const monthlyOvertime = tags?.basicInfo?.monthlyOvertime 
            ? `₹${tags.basicInfo.monthlyOvertime}/month`
            : undefined;

          // Extract cost per sharing bed
          const costPerSharingBed = tags?.basicInfo?.costPerSharingBed 
            ? `₹${tags.basicInfo.costPerSharingBed}/month`
            : undefined;

          // Extract stay provided
          const stayProvided = tags?.basicInfo?.stayProvided || false;

          // Extract trust score
          const trustScore = tags?.assessment?.trustScore || 0;

          // Extract match score
          const matchScore = tags?.assessment?.matchScore || 0;

          // Extract number of openings
          const openings = tags?.basicInfo?.openings || 1;

          // Extract job description
          const description = item.descriptor.name;

          // Extract industry
          const industry = tags?.basicInfo?.industry || 'Not specified';

          // Extract experience
          const experience = tags?.basicInfo?.experience || 'Not specified';

          // Extract job status
          const jobStatus = tags?.basicInfo?.status || 'active';

          // Extract contact person
          const contactPerson = tags?.contactPerson ? {
            name: tags.contactPerson.name || 'Not specified',
            email: tags.contactPerson.email || 'Not specified',
            phone: tags.contactPerson.phone || 'Not specified'
          } : undefined;

          // Extract job details
          const jobDetails = tags?.jobDetails || {};

          // Extract media (images/videos)
          const media: Array<{
            type: 'image' | 'video';
            url: string;
            thumbnail?: string;
            alt?: string;
            duration?: string;
          }> = [];

          // Extract workplace images
          if (tags?.jobNeeds?.workplaceImages && Array.isArray(tags.jobNeeds.workplaceImages)) {
            tags.jobNeeds.workplaceImages.forEach((imageUrl: string, index: number) => {
              if (imageUrl) {
                media.push({
                  type: 'image',
                  url: imageUrl,
                  alt: `${item.descriptor.name} workplace image ${index + 1}`
                });
              }
            });
          }

          // Extract workplace videos
          if (tags?.jobNeeds?.workplaceVideos && Array.isArray(tags.jobNeeds.workplaceVideos)) {
            tags.jobNeeds.workplaceVideos.forEach((videoUrl: string, index: number) => {
              if (videoUrl) {
                media.push({
                  type: 'video',
                  url: videoUrl,
                  alt: `${item.descriptor.name} workplace video ${index + 1}`
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
            status: jobStatus, // Include job status
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

  // Function to get user-friendly error message
  const getErrorMessage = (error: any): string => {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('timeout') || message.includes('abort')) {
        return 'Request timed out. Please check your internet connection and try again.';
      }
      
      if (message.includes('network') || message.includes('fetch')) {
        return 'Network error. Please check your internet connection and try again.';
      }
      
      if (message.includes('404')) {
        return 'Job service temporarily unavailable. Please try again later.';
      }
      
      if (message.includes('500') || message.includes('server')) {
        return 'Server error. Please try again in a few moments.';
      }
      
      if (message.includes('unauthorized') || message.includes('401')) {
        return 'Authentication required. Please log in and try again.';
      }
      
      if (message.includes('forbidden') || message.includes('403')) {
        return 'Access denied. Please check your permissions and try again.';
      }
      
      return error.message;
    }
    
    return 'An unexpected error occurred. Please try again.';
  };

  // Function to handle auto-retry
  const handleAutoRetry = useCallback((currentRetryCount: number, error: any) => {
    if (currentRetryCount < maxRetries) {
      setIsAutoRetrying(true);
      const delay = Math.min(1000 * Math.pow(2, currentRetryCount), 5000); // Exponential backoff with max 5s
      
      retryTimeoutRef.current = setTimeout(() => {
        console.log(`Auto-retrying job fetch (attempt ${currentRetryCount + 1}/${maxRetries})`);
        fetchJobs(true);
      }, delay);
    } else {
      // Max retries reached, show final error
      const finalErrorMessage = getErrorMessage(error);
      setError(`${finalErrorMessage} (Retried ${maxRetries} times)`);
      setLoadingState('error');
      setIsAutoRetrying(false);
    }
  }, [maxRetries]);

  // Fetch jobs from API
  const fetchJobs = useCallback(async (isRetry = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoadingState('loading');
      setError(null);

      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      loadingTimeoutRef.current = setTimeout(() => {
        setLoadingState('partial');
      }, 2000);

      const data = await apiClient.searchJobs();
      
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      // Log the API response structure for debugging
      console.log('API Response structure:', {
        hasData: !!data,
        dataType: typeof data,
        hasResults: !!data?.results,
        resultsType: Array.isArray(data?.results) ? 'array' : typeof data?.results,
        resultsLength: Array.isArray(data?.results) ? data.results.length : 'not array',
        keys: data ? Object.keys(data) : []
      });

      setOriginalResponse(data);
      
      // Transform the data
      const transformedJobs = transformJobData(data);
      
      console.log('Transformed jobs count:', transformedJobs.length);
      
      // Set jobs without trust scores initially
      setJobs(transformedJobs);

      setPagination({
        limit: data?.pagination?.limit || 10,
        offset: data?.pagination?.offset || 0,
        total: data?.pagination?.total || transformedJobs.length
      });

      setLastFetchTime(Date.now());
      setLoadingState('complete');
      setIsInitialLoad(false);
      setIsAutoRetrying(false);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      console.error('Failed to fetch jobs:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        setError('Request cancelled');
        setLoadingState('error');
        setIsAutoRetrying(false);
        return;
      }

      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      setLoadingState('error');
      
      // Handle auto-retry logic
      if (isRetry) {
        // This is an auto-retry, increment retry count
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        handleAutoRetry(newRetryCount, error);
      } else {
        // This is a manual retry or initial fetch, start auto-retry sequence
        setRetryCount(1);
        handleAutoRetry(1, error);
      }
    }
  }, [transformJobData, retryCount, handleAutoRetry]);

  // Initial fetch
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const refetch = useCallback(() => {
    setRetryCount(0);
    setIsAutoRetrying(false);
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    fetchJobs();
  }, [fetchJobs]);

  const retry = useCallback(() => {
    setRetryCount(0);
    setIsAutoRetrying(false);
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    loading: loadingState === 'loading' || loadingState === 'partial',
    loadingState,
    error,
    pagination,
    refetch,
    retry,
    retryCount,
    findProviderAndJobIds,
    isInitialLoad,
    lastFetchTime,
    scoresLoading,
    fetchScoresForJobs,
    isAutoRetrying
  };
}; 