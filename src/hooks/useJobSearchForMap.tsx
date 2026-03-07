import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, cleanContaminatedProfile } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'react-router-dom';
import { useOrgDetails } from '@/hooks/useOrgDetails';
import { useProfileChangeDetector } from '@/hooks/useProfileChangeDetector';
import { JobItem, JobSearchResponse, LoadingState } from '@/hooks/useJobSearch';

export interface AllJobsFetchState {
  allJobs: JobItem[];
  loading: boolean;
  loadingState: LoadingState;
  error: string | null;
  totalJobsCount: number;
  totalPages: number;
  currentPagesFetched: number;
  fetchProgress: number; // 0-100 percentage
  retryCount: number;
  lastFetchTime: number | null;
  scoresLoading: boolean;
  isAutoRetrying: boolean;
}

const OPTIMIZED_PAGE_SIZE = 1000; // Increased from 20 to reduce API calls by ~98%
const FALLBACK_PAGE_SIZE = 500; // Fallback if 1000 causes timeout/memory issues
const ORIGINAL_PAGE_SIZE = 20; // Original size for comparison metrics

export const useJobSearchForMap = (options?: { autoFetch?: boolean }) => {
  const [state, setState] = useState<AllJobsFetchState>({
    allJobs: [],
    loading: false,
    loadingState: 'idle',
    error: null,
    totalJobsCount: 0,
    totalPages: 0,
    currentPagesFetched: 0,
    fetchProgress: 0,
    retryCount: 0,
    lastFetchTime: null,
    scoresLoading: false,
    isAutoRetrying: false,
  });

  const [intentOverrides, setIntentOverrides] = useState<Record<string, any> | null>(null);
  const { orgSlug } = useParams<{ orgSlug?: string }>();
  const { data: orgDetails, isLoading: orgLoading } = useOrgDetails(orgSlug || null);
  const { user, getSelectedCandidate, authReady } = useAuth();
  const selectedCandidate = getSelectedCandidate();
  const profileChangeCounter = useProfileChangeDetector();

  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchingRef = useRef<boolean>(false);
  const prevProfileChangeCounterRef = useRef<number>(-1);
  const fetchAllJobsForMapRef = useRef<(() => Promise<JobItem[] | undefined>) | null>(null);
  const maxRetries = 3;

  // Derive intent overrides from organization metadata (same as useJobSearch)
  useEffect(() => {
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
        console.log(`🔍 Map Organization filtering: Generated primary_filters from metadata: "${overrides.primaryFilters}"`);
      }

      // Store profile restrictions for use in profile creation
      if (Array.isArray(profileRestrictions)) {
        overrides.profileRestrictions = profileRestrictions;
        console.log(`🔒 Map Profile restrictions detected:`, profileRestrictions);
      }

      setIntentOverrides(overrides);
    } catch {
      setIntentOverrides({});
    }
  }, [orgSlug, orgLoading, orgDetails?.data?.metadata]);

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

      // Extract location from v3 BAP API format (locations is a single object, not array)
      const jobProviderLocation = tags?.basicInfo?.jobProviderLocation || tags?.jobProviderLocation;
      const locationString = jobProviderLocation ?
        `${jobProviderLocation.city}, ${jobProviderLocation.state}` :
        'Location not specified';

      // Extract salary and other job details
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

      const travelProvided = jobDetails.travelProvided === 'yes-free' || jobDetails.travelProvided === 'yes-paid';
      const trustScore = tags?.assessment?.trustScore || 0;
      // Match score is top-level on each v3 item
      const matchScore = item.match_score || 0;
      const positions = jobDetails.positions || 1;
      const description = beckn.descriptor.name;
      const industry = tags?.industry || 'Not specified';
      const experience = tags?.jobNeeds?.hrWorkExperienceOther || 'Not specified';
      const jobStatus = tags?.status || 'active';

      const contactPerson = tags?.contactPerson ? {
        name: tags.contactPerson.name || 'Not specified',
        email: tags.contactPerson.email || 'Not specified',
        phone: tags.contactPerson.phone || 'Not specified'
      } : undefined;

      // Extract media (same approach as useJobSearch)
      const media: Array<{
        type: 'image' | 'video';
        url: string;
        thumbnail?: string;
        alt?: string;
        duration?: string;
      }> = [];

      const isGoogleStorageUrl = (url: string): boolean => {
        return url && typeof url === 'string' && (
          url.includes('storage.googleapis.com') ||
          url.includes('firebasestorage.googleapis.com') ||
          url.startsWith('gs://') ||
          url.includes('googleapis.com/storage') ||
          url.includes('firebaseapp.com') ||
          url.includes('appspot.com') ||
          url.includes('amazonaws.com') ||
          url.includes('blob.core.windows.net') ||
          url.includes('digitaloceanspaces.com') ||
          /\.(jpg|jpeg|png|gif|bmp|webp|svg|mp4|avi|mov|wmv|flv|webm|mkv)$/i.test(url) ||
          /\/job\/id\d+$/.test(url) ||
          /\/media\/id\d+$/.test(url) ||
          /\/file\/id\d+$/.test(url)
        );
      };

      const getMediaType = (url: string, fieldName: string): 'image' | 'video' => {
        const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp'];
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];

        const lowerUrl = url.toLowerCase();
        const lowerFieldName = fieldName.toLowerCase();

        if (videoExtensions.some(ext => lowerUrl.includes(ext))) {
          return 'video';
        }

        if (imageExtensions.some(ext => lowerUrl.includes(ext))) {
          return 'image';
        }

        const videoKeywords = ['video', 'mp4', 'mov', 'avi', 'webm'];
        if (videoKeywords.some(keyword => lowerUrl.includes(keyword))) {
          return 'video';
        }

        const videoFieldKeywords = ['video', 'mp4', 'mov', 'avi', 'webm', 'testimonial', 'walkthrough'];
        if (videoFieldKeywords.some(keyword => lowerFieldName.includes(keyword))) {
          return 'video';
        }

        const imageFieldKeywords = ['photo', 'image', 'logo', 'picture'];
        if (imageFieldKeywords.some(keyword => lowerFieldName.includes(keyword))) {
          return 'image';
        }

        return 'image';
      };

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

      const allUrls = extractGoogleStorageUrls(tags);
      const jobDetailsUrls = extractGoogleStorageUrls(jobDetails);
      const allUniqueUrls = [...allUrls, ...jobDetailsUrls]
        .filter((el, index, self) =>
          index === self.findIndex(t => t.url === el.url)
        );

      allUniqueUrls.forEach(({ url, path }, index) => {
        const fieldName = path.split('.').pop() || 'media';
        const mediaType = getMediaType(url, fieldName);

        media.push({
          type: mediaType,
          url: url,
          alt: `${beckn.descriptor.name} ${fieldName} ${index + 1}`,
          thumbnail: mediaType === 'video' ? url : undefined
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
        monthlyPfEsic,
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

  // Function to fetch trust and match scores for jobs
  const fetchScoresForJobs = useCallback(async (jobsToScore: JobItem[]): Promise<JobItem[]> => {
    if (!user || jobsToScore.length === 0) {
      return jobsToScore;
    }

    setState(prev => ({ ...prev, scoresLoading: true }));
    
    try {
      let seekerData;
      
      if (selectedCandidate) {
        const cleanedCandidate = cleanContaminatedProfile(selectedCandidate);
        
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
            whoiam: cleanedCandidate.whoIAm || {},
            whatihave: cleanedCandidate.whatIHave || {},
            whatiwant: cleanedCandidate.whatIWant || {},
            skills: cleanedCandidate.skills || [],
            experience: cleanedCandidate.experience || [],
            certificates: cleanedCandidate.certificates || [],
            education: cleanedCandidate.education || [],
            skillCertifications: cleanedCandidate.skillCertifications || [],
            workExperience: cleanedCandidate.workExperience || [],
            isGenderVerified: cleanedCandidate.isGenderVerified || false,
            isAadharVerified: cleanedCandidate.isAadharVerified || false,
            isHometownVerified: cleanedCandidate.isHometownVerified || false,
            isNameVerified: cleanedCandidate.isNameVerified || false,
            isAgeVerified: cleanedCandidate.isAgeVerified || false,
            assessmentScores: cleanedCandidate.assessmentScores || [],
            documentVerificationStatus: cleanedCandidate.documentVerificationStatus || []
          },
          createdAt: cleanedCandidate.createdAt || new Date().toISOString()
        };
      } else {
        const profileResponse = await apiClient.getProfile();
        let profileData = profileResponse.data;
        
        if (Array.isArray(profileData)) {
          profileData = profileData[0];
        }

        if (!profileData || typeof profileData !== 'object') {
          return jobsToScore;
        }

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

        const cleanedProfile = cleanContaminatedProfile(candidateFromProfile);

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
            whoiam: cleanedProfile.whoIAm || {},
            whatihave: cleanedProfile.whatIHave || {},
            whatiwant: cleanedProfile.whatIWant || {},
            skills: cleanedProfile.skills || [],
            experience: cleanedProfile.experience || [],
            certificates: cleanedProfile.certificates || [],
            education: cleanedProfile.education || [],
            skillCertifications: cleanedProfile.skillCertifications || [],
            workExperience: cleanedProfile.workExperience || [],
            isGenderVerified: cleanedProfile.isGenderVerified || false,
            isAadharVerified: cleanedProfile.isAadharVerified || false,
            isHometownVerified: cleanedProfile.isHometownVerified || false,
            isNameVerified: cleanedProfile.isNameVerified || false,
            isAgeVerified: cleanedProfile.isAgeVerified || false,
            assessmentScores: cleanedProfile.assessmentScores || [],
            documentVerificationStatus: cleanedProfile.documentVerificationStatus || []
          },
          createdAt: (profileData as any).createdAt || new Date().toISOString()
        };
      }

      if (!seekerData || typeof seekerData !== 'object') {
        return jobsToScore;
      }

      // Fetch scores for jobs in batches to avoid overwhelming the API
      const batchSize = 10;
      const jobsWithScores = [];
      
      for (let i = 0; i < jobsToScore.length; i += batchSize) {
        const batch = jobsToScore.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (job) => {
            try {
              // Fetch only trust score - match score comes from search API response
              // COMMENTED OUT: Match score API call - using match score from search API instead
              const trustResult = await apiClient.getTrustScore(job, seekerData);
              
              /* OLD CODE - Calling both APIs
              const [trustResult, matchResult] = await Promise.all([
                apiClient.getTrustScore(job, seekerData),
                apiClient.getMatchScore(job, seekerData)
              ]);
              */
              
              return {
                ...job,
                trustScore: trustResult.trustScore,
                // Keep match score from search API response, don't overwrite it
                matchScore: job.matchScore
              };
            } catch (error) {
              console.error(`Failed to get scores for job ${job.id}:`, error);
              return job;
            }
          })
        );
        
        jobsWithScores.push(...batchResults);
      }

      return jobsWithScores;
    } catch (error) {
      console.error('Failed to fetch scores:', error);
      return jobsToScore;
    } finally {
      setState(prev => ({ ...prev, scoresLoading: false }));
    }
  }, [user, selectedCandidate]);

  // Function to fetch a single page of jobs
  const fetchSinglePage = useCallback(async (page: number, limit: number = OPTIMIZED_PAGE_SIZE, intent?: Record<string, any>): Promise<{ jobs: JobItem[], pagination: any }> => {
    try {
      console.log(`Fetching page ${page} with limit ${limit} for map view`);
      
      // For map view, we typically don't have user search queries, just use org filters
      const orgPrimaryFilters = intent?.primaryFilters || intentOverrides?.primaryFilters;
      
      console.log(`🔍 Map view: Using org primary_filters: "${orgPrimaryFilters}"`);
      
      // Get active profile data to include in search payload (same as list view)
      const candidate = getSelectedCandidate();
      let profileData = null;
      
      if (candidate) {
        profileData = {
          id: candidate.id,
          userId: candidate.id,
          type: "personal",
          metadata: {
            name: candidate.name,
            role: candidate.interestedRole,
            age: candidate.age,
            gender: candidate.gender,
            skills: candidate.skills || [],
            whoIAm: {
              name: candidate.name,
              phone: candidate.phone || candidate.whoIAm?.phone,
              age: candidate.age,
              gender: candidate.gender,
              location: candidate.currentLocation,
              locationData: candidate.whoIAm?.locationData,
              ...(candidate.whoIAm || {})
            },
            whatIHave: {
              age: candidate.age,
              ...(candidate.whatIHave || {})
            },
            whatIWant: {
              workHoursPerDay: candidate.workHoursPerDay,
              monthlyInHandPreferred: candidate.monthlySalary,
              ...(candidate.whatIWant || {})
            },
            industry: candidate.interestedIndustry,
            education: candidate.education || [],
            experience: candidate.experience || [],
            certificates: candidate.certificates || [],
            workExperience: candidate.workExperience || [],
            skillCertifications: candidate.skillCertifications || []
          }
        };
        
        console.log(`📋 Map view: Including profile data in search:`, {
          profileId: profileData.id,
          profileName: profileData.metadata.name,
          profileRole: profileData.metadata.role
        });
      } else {
        console.log(`⚠️ Map view: No active profile selected for search`);
      }
      
      let data;
      if (orgPrimaryFilters) {
        // Map view with organization filters - use regular search with primary_filters + profile
        console.log(`➡️ Map view calling regular searchJobs with primary_filters`);
        const intentWithFilters = { primaryFilters: orgPrimaryFilters };
        data = await apiClient.searchJobs(intentWithFilters, page, limit, profileData);
      } else {
        // No filters - regular search with profile
        console.log(`➡️ Map view calling regular searchJobs (no filters)`);
        data = await apiClient.searchJobs(undefined, page, limit, profileData);
      }
      
      const transformedJobs = transformJobData(data);

      // Extract pagination info from v3 API response (page/limit at top level, total inside data)
      const paginationInfo = {
        page: data?.page ?? page,
        limit: data?.limit ?? limit,
        total: data?.data?.total ?? 0
      };

      return {
        jobs: transformedJobs,
        pagination: paginationInfo
      };
    } catch (error) {
      console.error(`Failed to fetch page ${page}:`, error);
      throw error;
    }
  }, [transformJobData, intentOverrides, getSelectedCandidate]);

  // Main function to fetch all jobs from all pages
  const fetchAllJobsForMap = useCallback(async () => {
    if (fetchingRef.current) {
      console.log('Already fetching all jobs for map, skipping...');
      return;
    }

    fetchingRef.current = true;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      loading: true,
      loadingState: 'loading',
      error: null,
      currentPagesFetched: 0,
      fetchProgress: 0
    }));

    try {
      const startTime = Date.now();
      console.log('Starting to fetch all jobs for map view with optimized pagination');
      
      // First, fetch the first page to get total count and pagination info
      const firstPageResult = await fetchSinglePage(1, OPTIMIZED_PAGE_SIZE, intentOverrides || undefined);
      // v3 pagination: total is a number at data.data.total (mapped to pagination.total)
      const totalCount = firstPageResult.pagination.total ?? 0;
      const limit = firstPageResult.pagination.limit;
      const totalPages = Math.ceil(totalCount / limit);

      console.log(`Map view: Total ${totalCount} jobs across ${totalPages} pages (${limit} jobs per page)`);
      console.log(`Performance: Reduced API calls from ${Math.ceil(totalCount / ORIGINAL_PAGE_SIZE)} to ${totalPages} calls (${Math.round(((Math.ceil(totalCount / ORIGINAL_PAGE_SIZE) - totalPages) / Math.ceil(totalCount / ORIGINAL_PAGE_SIZE)) * 100)}% reduction)`);

      if (totalPages === 0) {
        setState(prev => ({
          ...prev,
          allJobs: [],
          loading: false,
          loadingState: 'complete',
          totalJobsCount: 0,
          totalPages: 0,
          currentPagesFetched: 0,
          fetchProgress: 100,
          lastFetchTime: Date.now()
        }));
        fetchingRef.current = false;
        return;
      }

      let allJobs = [...firstPageResult.jobs];
      
      setState(prev => ({
        ...prev,
        totalJobsCount: totalCount,
        totalPages: totalPages,
        currentPagesFetched: 1,
        fetchProgress: Math.round((1 / totalPages) * 100),
        allJobs: allJobs
      }));

      // If there are more pages, fetch them sequentially with progress updates
      if (totalPages > 1) {
        for (let page = 2; page <= totalPages; page++) {
          if (abortControllerRef.current?.signal.aborted) {
            console.log('Fetch aborted');
            break;
          }

          try {
            const pageResult = await fetchSinglePage(page, limit, intentOverrides || undefined);
            allJobs = [...allJobs, ...pageResult.jobs];
            
            setState(prev => ({
              ...prev,
              allJobs: allJobs,
              currentPagesFetched: page,
              fetchProgress: Math.round((page / totalPages) * 100)
            }));

            console.log(`Map view: Fetched page ${page}/${totalPages} - Total jobs so far: ${allJobs.length}`);
            
            // Small delay between requests to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.error(`Failed to fetch page ${page} for map view:`, error);
            // Continue with other pages even if one fails
          }
        }
      }

      // Final state update
      setState(prev => ({
        ...prev,
        allJobs: allJobs,
        loading: false,
        loadingState: 'complete',
        fetchProgress: 100,
        lastFetchTime: Date.now(),
        retryCount: 0
      }));

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      console.log(`Map view: Successfully fetched ${allJobs.length} total jobs from ${totalPages} pages in ${totalTime}ms`);
      console.log(`Performance: Average time per API call: ${Math.round(totalTime / totalPages)}ms`);
      
      return allJobs;

    } catch (error) {
      console.error('Failed to fetch all jobs for map:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch jobs for map';
      
      setState(prev => ({
        ...prev,
        loading: false,
        loadingState: 'error',
        error: errorMessage
      }));

      // Auto retry logic
      const currentRetryCount = state.retryCount + 1;
      if (currentRetryCount < maxRetries) {
        setState(prev => ({
          ...prev,
          retryCount: currentRetryCount,
          isAutoRetrying: true
        }));

        const delay = Math.min(1000 * Math.pow(2, currentRetryCount), 5000);
        setTimeout(() => {
          fetchAllJobsForMap();
        }, delay);
      } else {
        setState(prev => ({
          ...prev,
          isAutoRetrying: false
        }));
      }
    } finally {
      fetchingRef.current = false;
    }
  }, [fetchSinglePage, intentOverrides, state.retryCount]);

  // Keep ref always pointing to latest fetchAllJobsForMap
  fetchAllJobsForMapRef.current = fetchAllJobsForMap;

  // Function to find provider and job IDs (shared with main hook)
  const findProviderAndJobIds = useCallback((jobId: string): { providerId: string; jobId: string } | null => {
    // Since we don't store the original response here, we can extract from the job item itself
    const job = state.allJobs.find(j => j.id === jobId);
    if (job && job.providerId) {
      return {
        providerId: job.providerId,
        jobId: job.id
      };
    }
    return null;
  }, [state.allJobs]);

  // Trigger fetch when intent overrides are ready (only if autoFetch is enabled)
  useEffect(() => {
    if (!authReady) return; // wait until auth session check completes so profile is available
    if (intentOverrides === null) return; // wait until computed
    if (options?.autoFetch !== false) { // Default to true if not specified
      fetchAllJobsForMap();
    }
  }, [intentOverrides, fetchAllJobsForMap, options?.autoFetch, authReady]);

  // Re-fetch map jobs when profile selection changes (e.g., user switches candidate)
  // The initial auth restoration is already handled by the authReady gate above
  useEffect(() => {
    if (!authReady) return;
    if (!user?.selectedCandidateId) return;
    
    // Only trigger if profile actually changed (not the first auth init)
    if (profileChangeCounter > 0 && prevProfileChangeCounterRef.current !== profileChangeCounter) {
      // Skip the first profile change from auth initialization
      if (prevProfileChangeCounterRef.current === -1) {
        prevProfileChangeCounterRef.current = profileChangeCounter;
        return;
      }

      const selectedCand = getSelectedCandidate();
      console.log(`👤 Map view: Profile switched, re-fetching all jobs with new profile:`, {
        profileId: selectedCand?.id,
        profileName: selectedCand?.name,
        changeCounter: profileChangeCounter
      });
      prevProfileChangeCounterRef.current = profileChangeCounter;

      // Abort any in-flight request and force a fresh fetch
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      fetchingRef.current = false;
      fetchAllJobsForMapRef.current?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileChangeCounter, authReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      fetchingRef.current = false;
    };
  }, []);

  // Public interface
  return {
    allJobs: state.allJobs,
    loading: state.loading,
    loadingState: state.loadingState,
    error: state.error,
    totalJobsCount: state.totalJobsCount,
    totalPages: state.totalPages,
    currentPagesFetched: state.currentPagesFetched,
    fetchProgress: state.fetchProgress,
    retryCount: state.retryCount,
    lastFetchTime: state.lastFetchTime,
    scoresLoading: state.scoresLoading,
    isAutoRetrying: state.isAutoRetrying,
    refetch: fetchAllJobsForMap,
    retry: fetchAllJobsForMap,
    fetchScoresForJobs,
    findProviderAndJobIds
  };
};
