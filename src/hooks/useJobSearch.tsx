import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, cleanContaminatedProfile } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'react-router-dom';
import { useOrgDetails } from '@/hooks/useOrgDetails';

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
  providerId?: string; // Provider ID for sharing functionality
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
  tags?: {
    basicInfo?: {
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
      jobProviderLogo?: string;
      jobProviderRegistration?: string;
    };
    industry?: string;
    jobDetails?: Record<string, any>;
    jobNeeds?: Record<string, any>;
    status?: string;
    role?: string;
    assessment?: {
      trustScore?: number;
      matchScore?: number;
    };
    contactPerson?: {
      name: string;
      email: string;
      phone: string;
    };
    [key: string]: any;
  };
}

export interface JobSearchResponse {
  results: Array<{
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
            tags: {
              basicInfo?: {
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
                jobProviderLogo?: string;
                jobProviderRegistration?: string;
              };
              industry?: string;
              jobDetails?: Record<string, any>;
              jobNeeds?: Record<string, any>;
              status?: string;
              role?: string;
              assessment?: {
                trustScore?: number;
                matchScore?: number;
              };
              contactPerson?: {
                name: string;
                email: string;
                phone: string;
              };
              [key: string]: any;
            };
          }>;
          fulfillments?: Array<{
            id: string;
            stops: Array<{
              location: {
                address?: string;
                city?: string;
                country?: string;
                gps?: {
                  lat: number;
                  lng: number;
                };
                state?: string;
                tag?: string;
              };
              type: string;
            }>;
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
            tag?: string;
          }>;
        }>;
      };
      pagination: {
        limit: number;
        page: number;
        totalCount: number;
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
    limit: 5,
    page: 1,
    totalCount: 0,
    totalPages: 0
  });
  const [retryCount, setRetryCount] = useState(0);
  const [originalResponse, setOriginalResponse] = useState<JobSearchResponse | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [isAutoRetrying, setIsAutoRetrying] = useState(false);
  const [intentOverrides, setIntentOverrides] = useState<Record<string, any> | null>(null);
  // Derive intent overrides from organization metadata (if any)
  const { orgSlug } = useParams<{ orgSlug?: string }>();
  const { data: orgDetails, isLoading: orgLoading } = useOrgDetails(orgSlug || null);

  useEffect(() => {
    // Default: no org filter or default org '0' -> no overrides
    if (!orgSlug || orgSlug === '0') {
      setIntentOverrides({});
      return;
    }

    if (orgLoading) return;

    try {
      const rawMeta = orgDetails?.data?.metadata ?? null;
      let meta: any = null;
      if (typeof rawMeta === 'string') {
        try { meta = JSON.parse(rawMeta); } catch { meta = null; }
      } else if (rawMeta && typeof rawMeta === 'object') {
        meta = rawMeta;
      }

      const overrides: Record<string, any> = {};
      const providerName = meta?.search_on_provider;
      const jobName = meta?.search_on_job;

      if (typeof providerName === 'string' && providerName.trim().length > 0) {
        overrides.provider = { descriptor: { name: providerName } };
      }
      if (typeof jobName === 'string' && jobName.trim().length > 0) {
        overrides.item = { descriptor: { name: jobName } };
      }

      setIntentOverrides(overrides);
    } catch {
      setIntentOverrides({});
    }
  }, [orgSlug, orgLoading, orgDetails?.data?.metadata]);

  
  const { user, getSelectedCandidate } = useAuth();
  const selectedCandidate = getSelectedCandidate();
  
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
    if (!user || jobsToScore.length === 0) {
      return jobsToScore;
    }

    setScoresLoading(true);
    
    try {
      // Get seeker data from selected candidate or user's profile
      let seekerData;
      
      if (selectedCandidate) {
        // Use selected candidate's profile data
        console.log('Using selected candidate for match score:', selectedCandidate);
        
        // Clean the candidate profile data first to remove contamination
        const cleanedCandidate = cleanContaminatedProfile(selectedCandidate);
        console.log('Cleaned candidate profile:', cleanedCandidate);
        
        // Transform the cleaned candidate data to use the correct field names for the API
        seekerData = {
          id: cleanedCandidate.id,
          type: 'personal',
          metadata: {
            name: cleanedCandidate.name,
            age: cleanedCandidate.age,
            gender: cleanedCandidate.gender,
            phone: cleanedCandidate.phone,
            currentLocation: cleanedCandidate.currentLocation,
            desiredLocation: cleanedCandidate.desiredLocation,
            // Transform camelCase to lowercase for API compatibility - use cleaned data
            whoiam: cleanedCandidate.whoIAm || {},
            whatihave: cleanedCandidate.whatIHave || {},
            whatiwant: cleanedCandidate.whatIWant || {},
            // Include other fields
            skills: cleanedCandidate.skills || [],
            experience: cleanedCandidate.experience || [],
            certificates: cleanedCandidate.certificates || [],
            education: cleanedCandidate.education || [],
            skillCertifications: cleanedCandidate.skillCertifications || [],
            workExperience: cleanedCandidate.workExperience || [],
            // Verification status
            isGenderVerified: cleanedCandidate.isGenderVerified || false,
            isAadharVerified: cleanedCandidate.isAadharVerified || false,
            isHometownVerified: cleanedCandidate.isHometownVerified || false,
            isNameVerified: cleanedCandidate.isNameVerified || false,
            isAgeVerified: cleanedCandidate.isAgeVerified || false,
            // Assessment scores
            assessmentScores: cleanedCandidate.assessmentScores || [],
            documentVerificationStatus: cleanedCandidate.documentVerificationStatus || []
          },
          createdAt: cleanedCandidate.createdAt || new Date().toISOString()
        };
        
        console.log('Using cleaned candidate data for match score:', JSON.stringify(seekerData, null, 2));
      } else {
        // Fallback to user's profile if no candidate is selected
        const profileResponse = await apiClient.getProfile();
        
        // Extract the actual profile data object - handle both array and object responses
        let profileData = profileResponse.data;
        
        // If the data is an array, take the first element
        if (Array.isArray(profileData)) {
          profileData = profileData[0];
        }

        // Ensure we have valid profile data
        if (!profileData || typeof profileData !== 'object') {
          return jobsToScore;
        }

        // Create a candidate-like object from profile data and clean it
        const candidateFromProfile = {
          id: profileData.id,
          interestedRole: profileData.metadata?.role,
          whoIAm: profileData.metadata?.whoIAm || {},
          whatIHave: profileData.metadata?.whatIHave || {},
          whatIWant: profileData.metadata?.whatIWant || {},
          name: profileData.metadata?.name,
          age: profileData.metadata?.age,
          gender: profileData.metadata?.gender,
          phone: profileData.metadata?.phone,
          currentLocation: profileData.metadata?.currentLocation,
          desiredLocation: profileData.metadata?.desiredLocation,
          skills: profileData.metadata?.skills || [],
          experience: profileData.metadata?.experience || [],
          certificates: profileData.metadata?.certificates || [],
          education: profileData.metadata?.education || [],
          skillCertifications: profileData.metadata?.skillCertifications || [],
          workExperience: profileData.metadata?.workExperience || [],
          isGenderVerified: profileData.metadata?.isGenderVerified || false,
          isAadharVerified: profileData.metadata?.isAadharVerified || false,
          isHometownVerified: profileData.metadata?.isHometownVerified || false,
          isNameVerified: profileData.metadata?.isNameVerified || false,
          isAgeVerified: profileData.metadata?.isAgeVerified || false,
          assessmentScores: profileData.metadata?.assessmentScores || [],
          documentVerificationStatus: profileData.metadata?.documentVerificationStatus || []
        };

        // Clean the profile data to remove contamination
        const cleanedProfile = cleanContaminatedProfile(candidateFromProfile);
        console.log('Cleaned user profile data:', cleanedProfile);

        // Transform the cleaned seeker data to use the correct field names for the API
        seekerData = {
          id: cleanedProfile.id,
          type: profileData.type || 'personal',
          metadata: {
            name: cleanedProfile.name,
            age: cleanedProfile.age,
            gender: cleanedProfile.gender,
            phone: cleanedProfile.phone,
            currentLocation: cleanedProfile.currentLocation,
            desiredLocation: cleanedProfile.desiredLocation,
            // Transform camelCase to lowercase for API compatibility - use cleaned data
            whoiam: cleanedProfile.whoIAm || {},
            whatihave: cleanedProfile.whatIHave || {},
            whatiwant: cleanedProfile.whatIWant || {},
            // Include other fields
            skills: cleanedProfile.skills || [],
            experience: cleanedProfile.experience || [],
            certificates: cleanedProfile.certificates || [],
            education: cleanedProfile.education || [],
            skillCertifications: cleanedProfile.skillCertifications || [],
            workExperience: cleanedProfile.workExperience || [],
            // Verification status
            isGenderVerified: cleanedProfile.isGenderVerified || false,
            isAadharVerified: cleanedProfile.isAadharVerified || false,
            isHometownVerified: cleanedProfile.isHometownVerified || false,
            isNameVerified: cleanedProfile.isNameVerified || false,
            isAgeVerified: cleanedProfile.isAgeVerified || false,
            // Assessment scores
            assessmentScores: cleanedProfile.assessmentScores || [],
            documentVerificationStatus: cleanedProfile.documentVerificationStatus || []
          },
          createdAt: (profileData as any).createdAt || new Date().toISOString()
        };

        console.log('Using cleaned user profile data for match score:', JSON.stringify(seekerData, null, 2));
      }

      // Ensure we have valid seeker data
      if (!seekerData || typeof seekerData !== 'object') {
        console.error('Invalid seeker data:', seekerData);
        return jobsToScore;
      }

      // Fetch trust scores and match scores for each job
      console.log('Fetching scores for jobs:', jobsToScore.length, 'jobs');
      const jobsWithScores = await Promise.all(
        jobsToScore.map(async (job) => {
          try {
            console.log(`Fetching scores for job: ${job.id} - ${job.title}`);
            
            // Log the job data being sent
            console.log('Job data being sent to API:', JSON.stringify(job, null, 2));
            
            // Fetch both trust score and match score
            const [trustResult, matchResult] = await Promise.all([
              apiClient.getTrustScore(job, seekerData),
              apiClient.getMatchScore(job, seekerData)
            ]);
            
            console.log(`Scores for job ${job.id}:`, { trustScore: trustResult.trustScore, matchScore: matchResult.matchScore });
            
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
  }, [user, selectedCandidate]);

  // Transform job data from API response
  const transformJobData = useCallback((data: JobSearchResponse): JobItem[] => {
    const transformedJobs: JobItem[] = [];

    data.results.forEach(result => {
      const catalog = result.message.catalog;
      
      catalog.providers.forEach(provider => {
        provider.items.forEach(item => {
          const tags = item.tags;
          
          // Only show jobs with status 'open'
          if (tags?.status !== 'open') {
            return;
          }
          
          // Extract location from the new BAP API format
          const jobProviderLocation = tags?.basicInfo?.jobProviderLocation || tags?.jobProviderLocation;
          const locationString = jobProviderLocation ? 
            `${jobProviderLocation.city}, ${jobProviderLocation.state}` : 
            'Location not specified';
          
          // Extract salary information from jobDetails
          const jobDetails = tags?.jobDetails || {};
          const salary = jobDetails.monthlyInHand ? 
            `₹${jobDetails.monthlyInHand.toLocaleString()}` : 
            'Salary not specified';
          const workingHours = jobDetails.workingHoursPerDay ? 
            `${jobDetails.workingHoursPerDay} hours/day` : 
            'Not specified';
          const monthlyInHand = jobDetails.monthlyInHand ? 
            `₹${jobDetails.monthlyInHand.toLocaleString()}` : 
            'Not specified';
          const monthlyPfEsic = jobDetails.monthlyPfEsicBenefits ? 
            `₹${jobDetails.monthlyPfEsicBenefits.toLocaleString()}` : 
            'Not specified';
          const monthlyOvertime = jobDetails.monthlyAverageOT || jobDetails.monthlyAverageOt ? 
            `₹${(jobDetails.monthlyAverageOT || jobDetails.monthlyAverageOt).toLocaleString()}` : 
            'Not specified';
          const costPerSharingBed = jobDetails.costPerSharingBed ? 
            `₹${jobDetails.costPerSharingBed}` : 
            'Not specified';

          // Extract stay provided
          const stayProvided = jobDetails.stayProvided === 'yes-free' || jobDetails.stayProvided === 'yes-paid';

          // Extract trust score
          const trustScore = tags?.assessment?.trustScore || 0;

          // Extract match score
          const matchScore = tags?.assessment?.matchScore || 0;

          // Extract number of positions from jobDetails
          const positions = jobDetails.positions || 1;

          // Extract job description
          const description = item.descriptor.name;

          // Extract industry
          const industry = tags?.industry || 'Not specified';

          // Extract experience
          const experience = tags?.jobNeeds?.hrWorkExperienceOther || 'Not specified';

          // Extract job status
          const jobStatus = tags?.status || 'active';

          // Extract contact person
          const contactPerson = tags?.contactPerson ? {
            name: tags.contactPerson.name || 'Not specified',
            email: tags.contactPerson.email || 'Not specified',
            phone: tags.contactPerson.phone || 'Not specified'
          } : undefined;

          // Extract media (images/videos) - Dynamic approach
          const media: Array<{
            type: 'image' | 'video';
            url: string;
            thumbnail?: string;
            alt?: string;
            duration?: string;
          }> = [];

          // Helper function to check if a string is a Google Storage URL
          const isGoogleStorageUrl = (url: string): boolean => {
            return url && typeof url === 'string' && (
              url.includes('storage.googleapis.com') ||
              url.includes('firebasestorage.googleapis.com') ||
              url.startsWith('gs://') ||
              url.includes('googleapis.com/storage') ||
              url.includes('firebaseapp.com') ||
              url.includes('appspot.com') ||
              // Also include other common storage URLs that might be used
              url.includes('amazonaws.com') ||
              url.includes('blob.core.windows.net') ||
              url.includes('digitaloceanspaces.com') ||
              // Check for common image/video file extensions
              /\.(jpg|jpeg|png|gif|bmp|webp|svg|mp4|avi|mov|wmv|flv|webm|mkv)$/i.test(url) ||
              // Check for URLs that look like media files (no extension but have ID patterns)
              /\/job\/id\d+$/.test(url) ||
              /\/media\/id\d+$/.test(url) ||
              /\/file\/id\d+$/.test(url)
            );
          };

          // Helper function to determine media type from URL and field name
          const getMediaType = (url: string, fieldName: string): 'image' | 'video' => {
            const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp'];
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
            
            const lowerUrl = url.toLowerCase();
            const lowerFieldName = fieldName.toLowerCase();
            
            // Check for video extensions in URL
            if (videoExtensions.some(ext => lowerUrl.includes(ext))) {
              return 'video';
            }
            
            // Check for image extensions in URL
            if (imageExtensions.some(ext => lowerUrl.includes(ext))) {
              return 'image';
            }
            
            // Check for video-related keywords in the URL path
            const videoKeywords = ['video', 'mp4', 'mov', 'avi', 'webm'];
            if (videoKeywords.some(keyword => lowerUrl.includes(keyword))) {
              return 'video';
            }
            
            // Check field name for video indicators
            const videoFieldKeywords = ['video', 'mp4', 'mov', 'avi', 'webm', 'testimonial', 'walkthrough'];
            if (videoFieldKeywords.some(keyword => lowerFieldName.includes(keyword))) {
              return 'video';
            }
            
            // Check field name for image indicators
            const imageFieldKeywords = ['photo', 'image', 'logo', 'picture'];
            if (imageFieldKeywords.some(keyword => lowerFieldName.includes(keyword))) {
              return 'image';
            }
            
            // Default to image if extension is not recognized
            return 'image';
          };

          // Helper function to generate video thumbnail URL
          const generateVideoThumbnail = (videoUrl: string): string => {
            // For Google Storage videos, we can't generate thumbnails easily
            // So we'll use a placeholder approach
            return videoUrl; // For now, use the same URL, but the carousel will handle it properly
          };

          // Recursive function to extract Google Storage URLs from any object
          const extractGoogleStorageUrls = (obj: any, path: string = ''): Array<{url: string, path: string}> => {
            const urls: Array<{url: string, path: string}> = [];
            
            if (!obj || typeof obj !== 'object') {
              return urls;
            }
            
            if (Array.isArray(obj)) {
              obj.forEach((item, index) => {
                if (typeof item === 'string' && isGoogleStorageUrl(item)) {
                  urls.push({ url: item, path: `${path}[${index}]` });
                } else if (typeof item === 'object') {
                  urls.push(...extractGoogleStorageUrls(item, `${path}[${index}]`));
                }
              });
            } else {
              Object.entries(obj).forEach(([key, value]) => {
                const currentPath = path ? `${path}.${key}` : key;
                
                if (typeof value === 'string' && isGoogleStorageUrl(value)) {
                  urls.push({ url: value, path: currentPath });
                } else if (typeof value === 'object' && value !== null) {
                  urls.push(...extractGoogleStorageUrls(value, currentPath));
                }
              });
            }
            
            return urls;
          };

          // Extract all Google Storage URLs from the entire job data
          const allUrls = extractGoogleStorageUrls(tags);

          // Also check jobDetails for any media URLs
          const jobDetailsUrls = extractGoogleStorageUrls(jobDetails);

          // Combine all URLs and remove duplicates
          const allUniqueUrls = [...allUrls, ...jobDetailsUrls]
            .filter((item, index, self) => 
              index === self.findIndex(t => t.url === item.url)
            );

          // Convert URLs to media objects
          allUniqueUrls.forEach(({ url, path }, index) => {
            const fieldName = path.split('.').pop() || 'media';
            const mediaType = getMediaType(url, fieldName);
            
            media.push({
              type: mediaType,
              url: url,
              alt: `${item.descriptor.name} ${fieldName} ${index + 1}`,
              thumbnail: mediaType === 'video' ? generateVideoThumbnail(url) : undefined // For videos, use the same URL as thumbnail for now
            });
          });

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
            openings: positions,
            description,
            industry,
            experience,
            positions,
            status: jobStatus, // Include job status
            providerId: provider.id, // Add provider ID for sharing
            contactPerson,
            jobProviderName: tags?.basicInfo?.jobProviderName || provider.descriptor?.name || 'Unknown Company',
            jobProviderLocation: jobProviderLocation,
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

  // Internal fetch function with integrated retry logic to avoid circular dependencies
  const fetchJobsInternal = useCallback(async (
    isRetry = false,
    currentRetryCount = 0,
    intent: Record<string, any> | null = intentOverrides,
    page: number = pagination.page,
    limit: number = pagination.limit
  ) => {
    // Safety check to prevent infinite loops
    if (currentRetryCount >= maxRetries) {
      setError(`No jobs found currently. Please check later. (Retried ${maxRetries} times)`);
      setLoadingState('error');
      setIsAutoRetrying(false);
      return;
    }
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

      const data = await apiClient.searchJobs(intent || undefined, page, limit);
      
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      setOriginalResponse(data);
      
      // Transform the data
      const transformedJobs = transformJobData(data);
      
      // Extract pagination info from the first result's message.pagination
      const paginationInfo = data?.results?.[0]?.message?.pagination || {
        page: page,
        limit: limit,
        totalCount: 0
      };
      
      // Check if we got any jobs after transformation
      if (transformedJobs.length === 0) {
        // No jobs available - this is a valid state, not an error
        setJobs([]);
        setPagination({
          limit: paginationInfo.limit,
          page: paginationInfo.page,
          totalCount: paginationInfo.totalCount,
          totalPages: Math.ceil(paginationInfo.totalCount / paginationInfo.limit)
        });
        setLastFetchTime(Date.now());
        setLoadingState('complete');
        setIsInitialLoad(false);
        setIsAutoRetrying(false);
        setRetryCount(0); // Reset retry count on success
        setError(null); // Clear any previous errors
        return;
      }
      
      // Set jobs without trust scores initially
      setJobs(transformedJobs);

      setPagination({
        limit: paginationInfo.limit,
        page: paginationInfo.page,
        totalCount: paginationInfo.totalCount,
        totalPages: Math.ceil(paginationInfo.totalCount / paginationInfo.limit)
      });

      setLastFetchTime(Date.now());
      setLoadingState('complete');
      setIsInitialLoad(false);
      setIsAutoRetrying(false);
      setRetryCount(0); // Reset retry count on success
      setError(null); // Clear any previous errors
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
        const newRetryCount = currentRetryCount + 1;
        setRetryCount(newRetryCount);
        
        // Only continue retrying if we haven't reached max retries
        if (newRetryCount < maxRetries) {
          setIsAutoRetrying(true);
          setLoadingState('loading'); // Show loading state during retry
          const delay = Math.min(1000 * Math.pow(2, newRetryCount), 5000); // Exponential backoff with max 5s
          
           retryTimeoutRef.current = setTimeout(() => {
            fetchJobsInternal(true, newRetryCount, intent, page, limit);
          }, delay);
        } else {
          // Max retries reached, stop retrying
          setError(`No jobs found currently. Please check later. (Retried ${maxRetries} times)`);
          setLoadingState('error');
          setIsAutoRetrying(false);
        }
      } else {
        // This is a manual retry or initial fetch, start auto-retry sequence
        setRetryCount(1);
        setIsAutoRetrying(true);
        setLoadingState('loading'); // Show loading state during retry
        const delay = Math.min(1000 * Math.pow(2, 1), 5000); // Exponential backoff with max 5s
        
        retryTimeoutRef.current = setTimeout(() => {
          fetchJobsInternal(true, 1, intent, page, limit);
        }, delay);
      }
    }
  }, [transformJobData, maxRetries, intentOverrides, pagination.page, pagination.limit]);

  // Public fetch function
  const fetchJobs = useCallback(async (isRetry = false) => {
    return fetchJobsInternal(isRetry, 0, intentOverrides);
  }, [fetchJobsInternal, intentOverrides]);

  // Fetch when intent overrides are ready or change
  useEffect(() => {
    if (intentOverrides === null) return; // wait until computed
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intentOverrides]);

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

  // Function to fetch jobs for a specific page
  const fetchJobsForPage = useCallback(async (page: number, limit?: number) => {
    const actualLimit = limit || pagination.limit;
    return fetchJobsInternal(false, 0, intentOverrides, page, actualLimit);
  }, [fetchJobsInternal, intentOverrides, pagination.limit]);

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
    fetchJobsForPage,
    isAutoRetrying
  };
}; 