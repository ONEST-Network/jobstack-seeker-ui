import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, cleanContaminatedProfile } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'react-router-dom';
import { useOrgDetails } from '@/hooks/useOrgDetails';
import { useProfileChangeDetector } from '@/hooks/useProfileChangeDetector';

export interface JobItem {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  workingHours: string;
  monthlyInHand: string;
  monthlyPfEsic?: string;
  monthlyOvertime: string;
  costPerSharingBed: string;
  travelProvided?: boolean;
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
  context?: {
    bpp_id: string;
    bpp_uri: string;
    transaction_id?: string;
  };
}

export interface JobSearchResponse {
  status: string;
  page: number;
  limit: number;
  data: {
    total: number; // v3 API returns total as a number
    items: Array<{
      match_score: number | null;
      profile_id: string | null;
      job: {
        id: string;
        job_id: string;
        bpp_id: string;
        bpp_uri: string;
        provider_id: string;
        transaction_id: string;
        hash?: string;
        created_at?: string;
        updated_at?: string;
        last_synced_at?: string;
        metadata?: Record<string, any> | null;
        beckn_structure: {
          descriptor: {
            name: string;
          };
          id: string;
          locations: {
            address: string;
            city: string;
            state: string;
            country: string;
            gps?: {
              lat: number;
              lng: number;
            };
            tag?: string;
          };
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
            [key: string]: any;
          };
        };
      };
    }>;
  };
}

export type LoadingState = 'idle' | 'initial' | 'loading' | 'partial' | 'complete' | 'error';

export const useJobSearch = (searchQuery?: string, options?: { autoFetch?: boolean }) => {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    limit: 30,
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
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string | undefined>(searchQuery);
  
  // Add debouncing refs to prevent duplicate API calls
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchParamsRef = useRef<string>('');
  const isFetchingRef = useRef<boolean>(false);
  const isManualPageChangeRef = useRef<boolean>(false); // Track manual page changes
  
  // Sync currentSearchQuery with searchQuery prop changes
  useEffect(() => {
    console.log(`📝 Search query prop changed: "${searchQuery}" -> updating currentSearchQuery`);
    setCurrentSearchQuery(searchQuery);
  }, [searchQuery]);

  // Note: fetchJobsInternal is defined later in the file
  
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
      const providerNames = meta?.search_on_provider;
      const jobNames = meta?.search_on_job;
      const profileRestrictions = meta?.profile_restriction;

      // Handle search_on_provider: can be string or array
      let providerSearchTerms: string[] = [];
      if (typeof providerNames === 'string' && providerNames.trim().length > 0) {
        providerSearchTerms = [providerNames.trim()];
      } else if (Array.isArray(providerNames)) {
        providerSearchTerms = providerNames.filter(name => typeof name === 'string' && name.trim().length > 0);
      }

      // Handle search_on_job: can be string or array
      let jobSearchTerms: string[] = [];
      if (typeof jobNames === 'string' && jobNames.trim().length > 0) {
        jobSearchTerms = [jobNames.trim()];
      } else if (Array.isArray(jobNames)) {
        jobSearchTerms = jobNames.filter(name => typeof name === 'string' && name.trim().length > 0);
      }

      // Create search terms and primary filters from the arrays
      const searchTerms = [...providerSearchTerms, ...jobSearchTerms];
      if (searchTerms.length > 0) {
        // Store search terms for primary_filters - these are always included for org filtering
        overrides.primaryFilters = searchTerms.join(',');
        // Don't set searchQuery here - it will only be set when user actively searches
        console.log(`🔍 Organization filtering: Generated primary_filters from metadata: "${overrides.primaryFilters}"`);
      }

      // Store profile restrictions for use in profile creation
      if (Array.isArray(profileRestrictions)) {
        overrides.profileRestrictions = profileRestrictions;
        console.log(`🔒 Profile restrictions detected:`, profileRestrictions);
      }

      setIntentOverrides(overrides);
    } catch {
      setIntentOverrides({});
    }
  }, [orgSlug, orgLoading, orgDetails?.data?.metadata]);

  
  const { user, getSelectedCandidate, authReady } = useAuth();
  const profileChangeCounter = useProfileChangeDetector();
  const selectedCandidate = getSelectedCandidate();
  
  const maxRetries = 3;
  const requestTimeout = 30000; // 30 seconds timeout
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to find provider and job IDs from original v3 response
  const findProviderAndJobIds = useCallback((jobId: string): { providerId: string; jobId: string } | null => {
    if (!originalResponse?.data?.items) {
      return null;
    }

    for (const item of originalResponse.data.items) {
      if (item?.job?.job_id === jobId) {
        return {
          providerId: item.job.provider_id,
          jobId: item.job.job_id
        };
      }
    }

    return null;
  }, [originalResponse]);

  // Function to fetch trust and match scores for specific jobs (ONLY the jobs passed to it)
  const fetchScoresForJobs = useCallback(async (jobsToScore: JobItem[]) => {
    if (!user || jobsToScore.length === 0) {
      return jobsToScore;
    }

    setScoresLoading(true);
    
    console.log(`🔍 fetchScoresForJobs called for ${jobsToScore.length} jobs (this should match the number of visible jobs on current page)`);
    
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

      // Fetch ONLY trust scores for each job - match scores come from search API
      console.log(`🚀 Actually fetching TRUST SCORES for ${jobsToScore.length} jobs (match scores from search API)`);
      const jobsWithScores = await Promise.all(
        jobsToScore.map(async (job) => {
          try {
            console.log(`📊 Fetching scores for job: ${job.id} - ${job.title}`);
            
            // Log the job data being sent
            console.log('Job data being sent to API:', JSON.stringify(job, null, 2));
            
            // Fetch only trust score - match score comes from search API response
            // COMMENTED OUT: Match score API call - using match score from search API instead
            const trustResult = await apiClient.getTrustScore(job, seekerData);
            
            /* OLD CODE - Calling both APIs
            const [trustResult, matchResult] = await Promise.all([
              apiClient.getTrustScore(job, seekerData),
              apiClient.getMatchScore(job, seekerData)
            ]);
            */
            
            console.log(`✅ Scores for job ${job.id}:`, { trustScore: trustResult.trustScore, matchScore: job.matchScore });
            
            return {
              ...job,
              trustScore: trustResult.trustScore,
              // Keep match score from search API response, don't overwrite it
              matchScore: job.matchScore
            };
          } catch (error) {
            console.error(`❌ Failed to get scores for job ${job.id}:`, error);
            return job; // Return job without scores on error
          }
        })
      );

      console.log(`✨ Successfully processed ${jobsWithScores.length} jobs with scores`);
      return jobsWithScores;
    } catch (error) {
      console.error('❌ Failed to fetch scores:', error);
      return jobsToScore;
    } finally {
      setScoresLoading(false);
    }
  }, [user, selectedCandidate]);

  // Transform job data from API response (v3)
  const transformJobData = useCallback((data: JobSearchResponse): JobItem[] => {
    const transformedJobs: JobItem[] = [];

    data.data.items.forEach(item => {
      const beckn = item.job.beckn_structure;
      const tags = beckn.tags;

      // Only show jobs with status 'open'
      if (tags?.status !== 'open') {
        return;
      }

      // Extract location from the v3 BAP API format (locations is a single object, not array)
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
      const monthlyOvertime = jobDetails.monthlyAverageOT || jobDetails.monthlyAverageOt ?
        `₹${(jobDetails.monthlyAverageOT || jobDetails.monthlyAverageOt).toLocaleString()}` :
        'Not specified';
      const costPerSharingBed = jobDetails.costPerSharingBed ?
        `₹${jobDetails.costPerSharingBed}` :
        'Not specified';

      // Extract travel provided
      const travelProvided = jobDetails.travelProvided === 'yes-free' || jobDetails.travelProvided === 'yes-paid';

      // Extract trust score
      const trustScore = tags?.assessment?.trustScore || 0;

      // Extract match score — top-level on each v3 item
      const matchScore = item.match_score || 0;

      // Extract number of positions from jobDetails
      const positions = jobDetails.positions || 1;

      // Extract job description (title from beckn descriptor)
      const description = beckn.descriptor.name;

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
          obj.forEach((el, index) => {
            if (typeof el === 'string' && isGoogleStorageUrl(el)) {
              urls.push({ url: el, path: `${path}[${index}]` });
            } else if (typeof el === 'object') {
              urls.push(...extractGoogleStorageUrls(el, `${path}[${index}]`));
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

      // Extract all Google Storage URLs from the entire job tags
      const allUrls = extractGoogleStorageUrls(tags);

      // Also check jobDetails for any media URLs
      const jobDetailsUrls = extractGoogleStorageUrls(jobDetails);

      // Combine all URLs and remove duplicates
      const allUniqueUrls = [...allUrls, ...jobDetailsUrls]
        .filter((el, index, self) =>
          index === self.findIndex(t => t.url === el.url)
        );

      // Convert URLs to media objects
      allUniqueUrls.forEach(({ url, path }, index) => {
        const fieldName = path.split('.').pop() || 'media';
        const mediaType = getMediaType(url, fieldName);

        media.push({
          type: mediaType,
          url: url,
          alt: `${beckn.descriptor.name} ${fieldName} ${index + 1}`,
          thumbnail: mediaType === 'video' ? generateVideoThumbnail(url) : undefined
        });
      });

      // Build context from v3 job fields
      const context = {
        bpp_id: item.job.bpp_id,
        bpp_uri: item.job.bpp_uri,
        transaction_id: item.job.transaction_id
      };

      const transformedJob: JobItem = {
        id: item.job.job_id,
        title: beckn.descriptor.name,
        company: tags?.basicInfo?.jobProviderName || 'Unknown Company',
        location: locationString,
        salary,
        workingHours,
        monthlyInHand,
        monthlyOvertime,
        costPerSharingBed,
        travelProvided,
        trustScore,
        matchScore,
        verified: true,
        openings: positions,
        description,
        industry,
        experience,
        positions,
        status: jobStatus,
        providerId: item.job.provider_id,
        contactPerson,
        jobProviderName: tags?.basicInfo?.jobProviderName || 'Unknown Company',
        jobProviderLocation: jobProviderLocation,
        jobDetails,
        tags,
        media,
        context
      };

      transformedJobs.push(transformedJob);
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
    limit: number = pagination.limit,
    searchQuery: string | undefined = currentSearchQuery
  ) => {
    // Safety check to prevent infinite loops
    if (currentRetryCount >= maxRetries) {
      setError(`No jobs found currently. Please check later. (Retried ${maxRetries} times)`);
      setLoadingState('error');
      setIsAutoRetrying(false);
      // CRITICAL FIX: Clear stale data when max retries reached initially
      setJobs([]);
      setPagination({
        limit: limit,
        page: page,
        totalCount: 0,
        totalPages: 0
      });
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

      // Use search API only if user provided a search query, otherwise use regular search with primary_filters
      const userSearchQuery = searchQuery?.trim();
      const orgPrimaryFilters = intent?.primaryFilters;
      
      console.log(`🔍 fetchJobsInternal: User search query: "${userSearchQuery}"`, {
        userQuery: userSearchQuery,
        orgPrimaryFilters: orgPrimaryFilters,
        hasUserSearch: !!userSearchQuery,
        hasOrgFilters: !!orgPrimaryFilters
      });

      // Get active profile data to include in search payload
      const selectedCandidate = getSelectedCandidate();
      let profileData = null;
      
      if (selectedCandidate) {
        // Transform candidate profile to the expected API format
        profileData = {
          id: selectedCandidate.id,
          userId: selectedCandidate.id, // Using profile ID as userId for API compatibility
          type: "personal",
          metadata: {
            name: selectedCandidate.name,
            role: selectedCandidate.interestedRole,
            age: selectedCandidate.age,
            gender: selectedCandidate.gender,
            skills: selectedCandidate.skills || [],
            whoIAm: {
              name: selectedCandidate.name,
              phone: selectedCandidate.phone || selectedCandidate.whoIAm?.phone,
              age: selectedCandidate.age,
              gender: selectedCandidate.gender,
              location: selectedCandidate.currentLocation,
              locationData: selectedCandidate.whoIAm?.locationData,
              ...(selectedCandidate.whoIAm || {})
            },
            whatIHave: {
              age: selectedCandidate.age,
              ...(selectedCandidate.whatIHave || {})
            },
            whatIWant: {
              workHoursPerDay: selectedCandidate.workHoursPerDay,
              monthlyInHandPreferred: selectedCandidate.monthlySalary,
              ...(selectedCandidate.whatIWant || {})
            },
            industry: selectedCandidate.interestedIndustry,
            education: selectedCandidate.education || [],
            experience: selectedCandidate.experience || [],
            certificates: selectedCandidate.certificates || [],
            workExperience: selectedCandidate.workExperience || [],
            skillCertifications: selectedCandidate.skillCertifications || []
          }
        };
        
        console.log(`📋 Including profile data in search:`, {
          profileId: profileData.id,
          profileName: profileData.metadata.name,
          profileRole: profileData.metadata.role
        });
      } else {
        console.log(`⚠️ No active profile selected for search`);
      }
      
      let data;
      if (userSearchQuery) {
        // User is actively searching - use search API with their query + org filters + profile
        console.log(`➡️ Calling searchJobsWithQuery with user query: "${userSearchQuery}"`);
        const intentWithFilters = orgPrimaryFilters ? { ...intent, primaryFilters: orgPrimaryFilters } : intent;
        data = await apiClient.searchJobsWithQuery(userSearchQuery, intentWithFilters || undefined, page, limit, profileData);
      } else {
        // No user search - use regular search API but include org filters via intent + profile
        console.log(`➡️ Calling regular searchJobs (no user search, may have org filters)`);
        data = await apiClient.searchJobs(intent || undefined, page, limit, profileData);
      }
      
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      setOriginalResponse(data);
      
      // Transform the data
      const transformedJobs = transformJobData(data);
      
      // Extract pagination info from v3 API response (page/limit at top level, total inside data)
      const actualPage = page; // Always use the requested page number
      const actualLimit = limit || data?.limit || 30;
      const totalCount = data?.data?.total ?? 0; // v3 returns total as a number
      const totalPages = Math.ceil(totalCount / actualLimit) || 1;

      console.log('Pagination Debug:', {
        requestedPage: page,
        requestedLimit: limit,
        apiPage: data?.page,
        apiLimit: data?.limit,
        apiTotal: data?.data?.total,
        calculatedValues: { actualPage, actualLimit, totalCount, totalPages }
      });
      
      // Check if we got any jobs after transformation
      if (transformedJobs.length === 0) {
        // No jobs available - this is a valid state, not an error
        setJobs([]);
        setPagination({
          limit: actualLimit,
          page: actualPage,
          totalCount: totalCount,
          totalPages: totalPages
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
        limit: actualLimit,
        page: actualPage,
        totalCount: totalCount,
        totalPages: totalPages
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
        // CRITICAL FIX: Clear stale data when request is cancelled
        setJobs([]);
        setPagination({
          limit: limit,
          page: page,
          totalCount: 0,
          totalPages: 0
        });
        return;
      }

      const errorMessage = getErrorMessage(error);
      console.log(`❌ API Error occurred, clearing stale data. Error: ${errorMessage}`);
      setError(errorMessage);
      setLoadingState('error');
      
      // CRITICAL FIX: Clear stale data when API fails
      setJobs([]); // Clear jobs array
      setPagination({
        limit: limit,
        page: page,
        totalCount: 0, // Reset to 0 so UI shows "0 jobs found"
        totalPages: 0
      });
      console.log(`📊 Pagination cleared due to error - totalCount set to 0`);
      
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
            fetchJobsInternal(true, newRetryCount, intent, page, limit, searchQuery);
          }, delay);
        } else {
          // Max retries reached, stop retrying
          setError(`No jobs found currently. Please check later. (Retried ${maxRetries} times)`);
          setLoadingState('error');
          setIsAutoRetrying(false);
          // CRITICAL FIX: Also clear stale data when max retries reached
          setJobs([]);
          setPagination({
            limit: limit,
            page: page,
            totalCount: 0,
            totalPages: 0
          });
        }
      } else {
        // This is a manual retry or initial fetch, start auto-retry sequence
        setRetryCount(1);
        setIsAutoRetrying(true);
        setLoadingState('loading'); // Show loading state during retry
        const delay = Math.min(1000 * Math.pow(2, 1), 5000); // Exponential backoff with max 5s
        
        retryTimeoutRef.current = setTimeout(() => {
          fetchJobsInternal(true, 1, intent, page, limit, searchQuery);
        }, delay);
      }
    }
  }, [transformJobData, maxRetries, intentOverrides, getSelectedCandidate, currentSearchQuery, pagination.page, pagination.limit]);

  // Public fetch function
  const fetchJobs = useCallback(async (isRetry = false) => {
    return fetchJobsInternal(isRetry, 0, intentOverrides, pagination.page, pagination.limit, currentSearchQuery);
  }, [fetchJobsInternal, intentOverrides, pagination.page, pagination.limit, currentSearchQuery]);

  // Function to update search query and trigger search
  const updateSearchQuery = useCallback((query: string | undefined) => {
    console.log(`🔄 updateSearchQuery called with: "${query}" (current: "${currentSearchQuery}")`);
    setCurrentSearchQuery(query);
    // Reset to first page when search query changes
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // Create debounced call directly
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    fetchTimeoutRef.current = setTimeout(() => {
      console.log(`🚀 updateSearchQuery: Executing fetch`);
      fetchJobsInternal(false, 0, intentOverrides, 1, 30, query);
    }, 100);
  }, [intentOverrides, currentSearchQuery, fetchJobsInternal]);

  // Track previous search query to detect actual changes
  // Initialize to null to ensure first render triggers the effect
  const prevSearchQueryRef = useRef<string | undefined | null>(null);
  
  // Trigger search when currentSearchQuery changes (for centralized search management)
  useEffect(() => {
    // Skip if we're in the middle of a manual page change
    if (isManualPageChangeRef.current) {
      console.log(`⏭️ Skipping search effect during manual page change`);
      return;
    }
    
    if (!authReady) return; // wait until auth session check completes so profile is available
    if (intentOverrides === null) return; // wait until computed
    if (options?.autoFetch !== false) { // Only if autoFetch is enabled
      // Only trigger if the search query actually changed (not just a re-render)
      // Note: prevSearchQueryRef starts as null, so it will trigger on first render
      if (prevSearchQueryRef.current !== currentSearchQuery) {
        console.log(`🔍 Triggering search for query: "${currentSearchQuery}" (prev: "${prevSearchQueryRef.current}")`);
        prevSearchQueryRef.current = currentSearchQuery;
        
        // Reset to first page when search query changes and trigger fetch
        setPagination(prev => ({ ...prev, page: 1 }));
        
        // Debounce the call
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
        
        fetchTimeoutRef.current = setTimeout(() => {
          console.log(`🚀 currentSearchQuery: Executing fetch`);
          fetchJobsInternal(false, 0, intentOverrides, 1, pagination.limit, currentSearchQuery);
        }, 100);
      }
    }
  }, [currentSearchQuery, intentOverrides, options?.autoFetch, pagination.limit, fetchJobsInternal, authReady]);

  // Track previous profile change counter to detect actual changes
  // Initialize to -1; the first profile change from auth init is skipped since
  // the initial fetch (gated by authReady) already includes the profile
  const prevProfileChangeCounterRef = useRef<number>(-1);
  
  // Trigger search when profile selection changes or profile data is updated
  // This handles real profile switches (e.g., user selects a different candidate),
  // NOT the initial auth restoration which is handled by the authReady-gated effects above
  useEffect(() => {
    // Skip if we're in the middle of a manual page change
    if (isManualPageChangeRef.current) {
      console.log(`⏭️ Skipping profile change effect during manual page change`);
      return;
    }
    
    if (!authReady) return; // wait until auth is ready
    
    const selectedCandidate = getSelectedCandidate();
    
    if (intentOverrides === null) return; // wait until computed
    if (options?.autoFetch !== false) { // Only if autoFetch is enabled
      // Only trigger if profile actually changed (not just a re-render)
      if (profileChangeCounter > 0 && prevProfileChangeCounterRef.current !== profileChangeCounter) {
        // Skip the first profile change from auth initialization — the initial fetch
        // (gated by authReady) already includes the profile data
        if (prevProfileChangeCounterRef.current === -1) {
          console.log(`⏭️ Skipping first profile change (auth init) — initial fetch already has profile`);
          prevProfileChangeCounterRef.current = profileChangeCounter;
          return;
        }
        
        console.log(`👤 Profile data changed, triggering search with updated profile:`, {
          profileId: selectedCandidate?.id,
          profileName: selectedCandidate?.name,
          profileRole: selectedCandidate?.interestedRole,
          changeCounter: profileChangeCounter,
          prevCounter: prevProfileChangeCounterRef.current
        });
        prevProfileChangeCounterRef.current = profileChangeCounter;
        
        // Reset to page 1 when profile changes (this is a new search context)
        setPagination(prev => ({ ...prev, page: 1 }));
        
        // Debounce the call
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
        
        fetchTimeoutRef.current = setTimeout(() => {
          console.log(`🚀 profile-change: Executing fetch`);
          fetchJobsInternal(false, 0, intentOverrides, 1, pagination.limit, currentSearchQuery);
        }, 100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileChangeCounter, intentOverrides, options?.autoFetch, fetchJobsInternal, authReady]);

  // Initial fetch when intent overrides are ready (only if autoFetch is enabled)
  // Note: The currentSearchQuery effect above will handle search queries, this handles initial empty state
  useEffect(() => {
    if (!authReady) return; // wait until auth session check completes so profile is available
    if (intentOverrides === null) return; // wait until computed
    if (options?.autoFetch !== false && currentSearchQuery === undefined) { // Only for undefined initial state
      console.log(`🔍 Initial fetch with undefined search query`);
      
      // Debounce the call
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      
      fetchTimeoutRef.current = setTimeout(() => {
        console.log(`🚀 initial-load: Executing fetch`);
        fetchJobsInternal(false, 0, intentOverrides, pagination.page, pagination.limit, currentSearchQuery);
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intentOverrides, options?.autoFetch, currentSearchQuery, fetchJobsInternal, authReady]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
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
  const fetchJobsForPage = useCallback(async (page: number, limit?: number, searchQuery?: string) => {
    console.log(`📄 fetchJobsForPage called with page: ${page}, limit: ${limit}, query: "${searchQuery}"`);
    const actualLimit = limit || pagination.limit;
    const queryToUse = searchQuery !== undefined ? searchQuery : currentSearchQuery;
    
    // Set flag to prevent effects from interfering with manual page change
    isManualPageChangeRef.current = true;
    
    // Clear any pending debounced calls to prevent conflicts
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
    
    try {
      // Call fetch directly without debounce for pagination
      await fetchJobsInternal(false, 0, intentOverrides, page, actualLimit, queryToUse);
    } finally {
      // Clear the flag after a short delay to allow state updates to complete
      setTimeout(() => {
        isManualPageChangeRef.current = false;
        console.log(`✅ Manual page change complete, effects re-enabled`);
      }, 500);
    }
  }, [fetchJobsInternal, intentOverrides, currentSearchQuery, pagination.limit]);

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
    isAutoRetrying,
    updateSearchQuery,
    currentSearchQuery
  };
}; 