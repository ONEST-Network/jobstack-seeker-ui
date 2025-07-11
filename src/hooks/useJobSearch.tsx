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
  
  const { user } = useAuth();
  
  const maxRetries = 3;
  const requestTimeout = 30000; // 30 seconds timeout
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
  const transformJobData = useCallback((apiResponse: JobSearchResponse): JobItem[] => {
    const transformedJobs: JobItem[] = [];

    apiResponse.results.forEach(result => {
      const catalog = result?.message?.catalog;
      if (!catalog?.providers) {
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
          
          // Filter out draft jobs - don't show them in search results
          const jobStatus = tags.status;
          if (jobStatus === 'draft') {
            console.log(`Skipping draft job: ${item.descriptor.name} (ID: ${item.id})`);
            return;
          }
          
          // Log job status for debugging (only for non-draft jobs)
          if (jobStatus) {
            console.log(`Job status for ${item.descriptor.name}: ${jobStatus}`);
          }
          
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

          // Extract trust and match scores (default to 0 initially)
          const trustScore = 0; // Will be updated by trust score API
          const matchScore = 0; // Will be updated by trust score API

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

      setOriginalResponse(data);
      
      // Transform the data
      const transformedJobs = transformJobData(data);
      
      // Set jobs without trust scores initially
      setJobs(transformedJobs);

      setPagination({
        limit: data.pagination?.limit || 10,
        offset: data.pagination?.offset || 0,
        total: data.pagination?.total || transformedJobs.length
      });

      setLastFetchTime(Date.now());
      setLoadingState('complete');
      setIsInitialLoad(false);
    } catch (error) {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      console.error('Failed to fetch jobs:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        setError('Request cancelled');
        setLoadingState('error');
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch jobs';
      setError(errorMessage);
      setLoadingState('error');
      
      if (!isRetry && retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchJobs(true), 1000 * (retryCount + 1));
      }
    }
  }, [transformJobData, retryCount, maxRetries]);

  // Initial fetch
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const refetch = useCallback(() => {
    setRetryCount(0);
    fetchJobs();
  }, [fetchJobs]);

  const retry = useCallback(() => {
    setRetryCount(0);
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
    fetchScoresForJobs
  };
}; 