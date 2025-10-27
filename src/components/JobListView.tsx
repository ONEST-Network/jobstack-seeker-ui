import React, { useState, useEffect, useRef } from 'react';
import JobApplicationDialog from './JobApplicationDialog';
import JobDetailDialog from './job-search/JobDetailDialog';
import JobCard from './job-search/JobCard';
import JobCardSkeleton from '@/components/ui/job-card-skeleton';
import { LoadingMessage, EmptyState } from '@/components/ui/loading-states';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useJobSearch, JobItem, LoadingState } from '@/hooks/useJobSearch';
import { useJobApplication, JobApplicationData } from '@/hooks/useJobApplication';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { useTranslation } from '@/hooks/useI18n';
import { calculateTotalOpenings } from '@/utils/jobUtils';

interface JobListViewProps {
  searchQuery: string;
  onPromptLogin?: () => void;
  onClearSearch?: () => void; // Callback to clear search from parent component
  hookData?: any; // Pass hook data from parent to avoid duplicate calls
  mapHookData?: any; // Pass map hook data to get total openings across all jobs
}

const JobListView: React.FC<JobListViewProps> = ({
  searchQuery,
  onPromptLogin,
  onClearSearch,
  hookData,
  mapHookData
}) => {
  const t = useTranslation('jobs');
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [detailJob, setDetailJob] = useState<JobItem | null>(null);
  const [jobsWithScores, setJobsWithScores] = useState<JobItem[]>([]);
  const [scoredJobIds, setScoredJobIds] = useState<Set<string>>(new Set());
  const [isPageChanging, setIsPageChanging] = useState(false);
  const [pendingScrollPage, setPendingScrollPage] = useState<number | null>(null);
  const [isFetchingScores, setIsFetchingScores] = useState(false); // Prevent concurrent fetching
  const jobsListRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true); // Track if component is mounted
  const { user, getSelectedCandidate } = useAuth();
  const selectedCandidate = getSelectedCandidate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Debounce search query to reduce API calls - require at least 3 characters
  const debouncedSearchQuery = useDebounce(searchQuery, 500, 3);

  // Prevent unauthenticated users from opening the job detail dialog
  const handleViewDetails = (job: JobItem) => {
    if (!user) {
      onPromptLogin?.();
      return;
    }
    setDetailJob(job);
  };
  
  // Use hookData if provided (from parent), otherwise call local hook (for standalone usage)
  const localHookData = useJobSearch(debouncedSearchQuery, { autoFetch: !!hookData ? false : true });
  const { 
    jobs, 
    loading, 
    loadingState,
    error, 
    pagination, 
    refetch, 
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
  } = hookData || localHookData;
  const { applyToJob, applying } = useJobApplication();

  // Update search query when debounced search query changes (only if using local hook)
  useEffect(() => {
    if (!hookData && updateSearchQuery) {
      updateSearchQuery(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, updateSearchQuery, hookData]);

  // Use jobs directly from API (no client-side filtering)
  const displayJobs = jobs || [];

  // Cleanup effect to handle component unmounting
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Function to fetch trust scores for current jobs (match scores now come from search API)
  // UPDATED: Only fetching trust scores - match scores come from search API response
  const fetchScoresForCurrentJobs = async () => {
    // Prevent concurrent calls
    if (isFetchingScores || !isMountedRef.current) {
      console.log('🚫 Skipping score fetch - already in progress or component unmounted');
      return;
    }
    
    if (!user || displayJobs.length === 0) {
      return;
    }

    // KEY FIX: Check if we already have trust scores for all jobs on this page
    const jobsNeedingScores = displayJobs.filter(job => !scoredJobIds.has(job.id));
    
    if (jobsNeedingScores.length === 0) {
      console.log('💡 All jobs on current page already have trust scores - skipping API calls');
      return;
    }

    console.log(`🎯 KEY FIX: Only fetching trust scores for ${jobsNeedingScores.length} jobs that need scores (out of ${displayJobs.length} visible jobs)`);
    
    setIsFetchingScores(true); // Set flag to prevent concurrent calls
    
    try {
      // Fetch trust scores (match scores already come from search API)
      const jobsWithScores = await fetchScoresForJobs(jobsNeedingScores);
      
      // Only update state if component is still mounted
      if (!isMountedRef.current) {
        console.log('🚨 Component unmounted during score fetch, skipping state update');
        return;
      }
      
      // Update the jobs with trust scores (preserve match scores from search API)
      setJobsWithScores(prev => {
        const updated = [...prev];
        jobsWithScores.forEach(jobWithScore => {
          const index = updated.findIndex(j => j.id === jobWithScore.id);
          if (index !== -1) {
            // Preserve match score from search API, only update trust score
            updated[index] = {
              ...updated[index],
              trustScore: jobWithScore.trustScore,
              // Keep match score from search API response, don't overwrite it
            };
          } else {
            updated.push(jobWithScore);
          }
        });
        return updated;
      });
      
      // Mark these jobs as scored
      setScoredJobIds(prev => {
        const newSet = new Set(prev);
        jobsWithScores.forEach(job => newSet.add(job.id));
        return newSet;
      });
    } catch (error) {
      console.error('Error fetching trust scores:', error);
    } finally {
      // Only clear flag if component is still mounted
      if (isMountedRef.current) {
        setIsFetchingScores(false);
      }
    }
  };

  // Reset scored jobs when selected candidate changes (to recalculate trust scores with new profile)
  useEffect(() => {
    if (selectedCandidate) {
      console.log('Selected candidate changed, resetting scored jobs to recalculate trust scores');
      setScoredJobIds(new Set()); // Clear the scored jobs set - this will cause trust scores to be refetched
      setJobsWithScores(jobs); // Reset to original jobs temporarily
      toast({
        title: 'Selected candidate changed. Trust scores will be recalculated.',
        description: `Your profile for ${selectedCandidate.name} has been updated. Match scores are already updated.`,
      });
    }
  }, [selectedCandidate?.id]);

  // CONSOLIDATED: Handle jobs change - reset cache and fetch trust scores (match scores from API)
  useEffect(() => {
    if (jobs.length === 0) {
      console.log('🔍 No jobs to process, clearing state');
      setJobsWithScores([]);
      setScoredJobIds(new Set());
      return;
    }

    console.log(`📄 Jobs changed - Page ${pagination.page} with ${jobs.length} jobs`);
    
    // Step 1: SMART update of jobsWithScores - preserve existing trust scores, keep match scores from API
    setJobsWithScores(prev => {
      const newJobsWithScores = jobs.map(job => {
        // Check if we already have a scored version of this job
        const existingScoredJob = prev.find(scoredJob => scoredJob.id === job.id);
        // If we have existing trust scores, preserve them; match scores come from API
        if (existingScoredJob && existingScoredJob.trustScore !== undefined) {
          return {
            ...job, // Use new job data (includes match score from API)
            trustScore: existingScoredJob.trustScore, // Preserve trust score
          };
        }
        return job; // Use new job data (includes match score from API)
      });
      
      console.log(`🔄 Smart update: Preserved trust scores for ${newJobsWithScores.filter(job => job.trustScore !== undefined).length} jobs, match scores from API`);
      return newJobsWithScores;
    });
    
    // Step 2: SMART cache reset - only clear trust scores for jobs that are no longer present
    // Preserve trust scores for jobs that are still in the new jobs array
    setScoredJobIds(prev => {
      const newJobIds = new Set(jobs.map(job => job.id));
      const preservedScoredIds = new Set<string>();
      
      // Only keep scored job IDs that are still in the current jobs list
      prev.forEach(jobId => {
        if (newJobIds.has(jobId)) {
          preservedScoredIds.add(jobId);
        }
      });
      
      console.log(`🧠 Smart cache: Preserved trust scores for ${preservedScoredIds.size} jobs, cleared ${prev.size - preservedScoredIds.size} jobs`);
      return preservedScoredIds;
    });
    
    // Step 3: Fetch trust scores for the new jobs (match scores come from search API)
    // Use setTimeout to ensure state updates have been applied
    const timeoutId = setTimeout(() => {
      fetchScoresForCurrentJobs();
    }, 10); // Small delay to ensure state is updated
    
    return () => clearTimeout(timeoutId);
  }, [jobs]); // Single useEffect for jobs changes

  // Get jobs to display (use scored jobs if available, otherwise use original jobs)
  const finalDisplayJobs = displayJobs.map(job => {
    const scoredJob = jobsWithScores.find(s => s.id === job.id);
    return scoredJob || job;
  });

  const handleApply = (job: JobItem) => {
    if (!user) {
      onPromptLogin?.();
      return;
    }
    setSelectedJob(job);
  };

  // Function to scroll to top of jobs list
  const scrollToJobsList = () => {
    if (jobsListRef.current) {
      jobsListRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  // Enhanced page change function with API-based pagination + scroll behavior
  const handlePageChange = async (newPage: number) => {
    if (newPage === currentPage || isPageChanging) return;
    
    setIsPageChanging(true);
    setPendingScrollPage(newPage);
    
    try {
      await fetchJobsForPage(newPage, pagination.limit, currentSearchQuery);
    } catch (error) {
      console.error('Failed to fetch page:', error);
    } finally {
      setIsPageChanging(false);
    }
  };

  // Handle auto-scroll after jobs are loaded and rendered
  useEffect(() => {
    if (pendingScrollPage !== null && !loading && !isPageChanging && jobs.length > 0) {
      // Use requestAnimationFrame to ensure DOM has been updated
      requestAnimationFrame(() => {
        setTimeout(() => {
          scrollToJobsList();
          setPendingScrollPage(null);
        }, 150); // Slightly longer delay to ensure scores are loading
      });
    }
  }, [jobs, loading, isPageChanging, pendingScrollPage]);

  const currentPage = pagination.page || 1;
  const totalPages = pagination.totalPages || (pagination.limit ? Math.ceil((pagination.totalCount || 0) / pagination.limit) : 1) || 1;

  // Smart pagination for mobile and desktop
  const getVisiblePages = () => {
    const maxVisible = isMobile ? 3 : 7; // Show fewer pages on mobile
    const pages: (number | 'ellipsis')[] = [];
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    const sidePages = Math.floor((maxVisible - 3) / 2); // Pages on each side of current (excluding first, last, current)
    
    // Always show first page
    pages.push(1);
    
    if (currentPage > sidePages + 2) {
      pages.push('ellipsis');
    }
    
    // Show pages around current page
    const start = Math.max(2, currentPage - sidePages);
    const end = Math.min(totalPages - 1, currentPage + sidePages);
    
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }
    
    if (currentPage < totalPages - sidePages - 1) {
      pages.push('ellipsis');
    }
    
    // Always show last page if more than 1 page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  const handleJobApplicationSubmit = async (applicationData: JobApplicationData) => {
    if (!selectedJob) return;

    // Find provider and job IDs from the original API response
    const ids = findProviderAndJobIds(selectedJob.id);
    if (!ids) {
      console.error('Could not find provider and job IDs for job:', selectedJob.id);
      return;
    }

    // Pass the job details from the BAP search API response
    const result = await applyToJob(ids.jobId, ids.providerId, applicationData, undefined, selectedJob);
    
    if (result.success) {
      // Close the application dialog on success
      setSelectedJob(null);
    }
  };

  // const handleSaveDraft = async (applicationData: JobApplicationData) => {
  //   if (!selectedJob) return;

  //   // Find provider and job IDs from the original API response
  //   const ids = findProviderAndJobIds(selectedJob.id);
  //   if (!ids) {
  //     console.error('Could not find provider and job IDs for job:', selectedJob.id);
  //     return;
  //   }

  //   // Pass the job details from the BAP search API response
  //   const result = await saveDraft(ids.jobId, ids.providerId, applicationData, selectedJob);
    
  //   // Don't close the dialog when saving draft, let user continue editing
  //   // The success/error message is handled by the saveDraft function
  // };

  const handleRetry = () => {
    refetch(); // Force refresh
  };

  const handleRefresh = () => {
    refetch(); // Force refresh
  };


  // Helper function to format last fetch time
  const formatLastFetchTime = () => {
    if (!lastFetchTime) return null;
    const now = Date.now();
    const diff = now - lastFetchTime;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  return (
    <div className="p-6 space-y-8 bg-background min-h-screen">
      <div className="space-y-4">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-foreground">{t('jobListView.title', 'Jobs for You')}</h2>
            {!loading && jobs.length > 0 && (
              <div className="flex items-center gap-2">
                {scoresLoading && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    {t('jobListView.calculatingScores', 'Calculating trust & match scores...')}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  {t('jobListView.refresh', 'Refresh')}
                </Button>
                {lastFetchTime && (
                  <span className="text-xs text-muted-foreground">
                    {t('jobListView.lastUpdated', 'Last updated: {{time}}', { time: formatLastFetchTime() })}
                  </span>
                )}
              </div>
            )}
          </div>
          {!loading && (
            <p className="text-sm text-muted-foreground">
              {(() => {
                // Determine actual job count - if jobs array is empty but pagination shows count, trust the jobs array
                const actualJobCount = jobs.length === 0 ? 0 : (pagination.totalCount || jobs.length);
                
                // Calculate total openings from map hook data if available (all jobs), otherwise calculate from current page
                const totalOpenings = mapHookData?.allJobs ? calculateTotalOpenings(mapHookData.allJobs) : calculateTotalOpenings(jobs);
                
                const searchQueryText = currentSearchQuery && currentSearchQuery.trim() ? ` for "${currentSearchQuery.trim()}"` : '';
                
                // Only show openings count if we have map data or if we're showing all jobs on current page
                const showOpenings = mapHookData?.allJobs || jobs.length === actualJobCount;
                const openingsText = showOpenings ? ` (${totalOpenings} ${t('jobListView.openings', 'openings')})` : '';
                
                return t('jobListView.jobsFound', '{{count}} job{{plural}} found{{query}}{{openingsText}}', { 
                  count: actualJobCount, 
                  plural: actualJobCount !== 1 ? 's' : '',
                  query: searchQueryText,
                  openingsText
                });
              })()}
            </p>
          )}
        </div>

        {/* Error State */}
        {error && !isAutoRetrying && (
          <Alert variant={retryCount >= 3 ? "default" : "destructive"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <span>{error}</span>
                {retryCount > 0 && (
                  <p className="text-xs mt-1">
                    {retryCount >= 3 
                      ? 'All retry attempts completed'
                      : `Retried ${retryCount} time${retryCount !== 1 ? 's' : ''}`
                    }
                  </p>
                )}
              </div>
              {retryCount < 3 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRetry}
                  className="ml-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('jobListView.retry', 'Retry')}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Page Change Loading State - Complete Overlay */}
        {isPageChanging && (
          <div className="space-y-4 min-h-[600px]">
            <div className="text-center py-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <p className="text-lg font-medium text-foreground">
                  {t('jobListView.loadingPage', 'Loading page {{page}}...', { page: pendingScrollPage || currentPage })}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('jobListView.pleaseWait', 'Please wait while we fetch the jobs')}
              </p>
            </div>
            
            {/* Loading skeletons */}
            <div className="space-y-4 px-4">
              {Array.from({ length: 5 }, (_, i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          </div>
        )}

        {/* Initial Loading State */}
        {loading && !isPageChanging && (
          <div className="space-y-4">
            <LoadingMessage 
              loadingState={loadingState}
              retryCount={retryCount}
              onRetry={handleRetry}
              isAutoRetrying={isAutoRetrying}
            />

            {/* Show existing jobs if available during refresh (not page change) */}
            {!isInitialLoad && jobs.length > 0 && (
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-3">
                  Showing cached results while refreshing...
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {finalDisplayJobs.map(job => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      onApply={handleApply} 
                      onViewDetails={setDetailJob} 
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Loading skeletons for initial load */}
            {isInitialLoad && (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }, (_, i) => (
                  <JobCardSkeleton key={i} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Jobs List - Only show when not loading and not changing pages */}
        {!loading && !isPageChanging && !error && (
          <>
            <div ref={jobsListRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {finalDisplayJobs.length > 0 ? (
                finalDisplayJobs.map(job => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onApply={handleApply} 
                    onViewDetails={handleViewDetails} 
                  />
                ))
              ) : (
                <EmptyState
                  title={
                    currentSearchQuery 
                      ? t('jobListView.noJobsFoundForQuery', 'No jobs found for "{{query}}"', { query: currentSearchQuery })
                      : jobs.length === 0 
                        ? error 
                          ? retryCount >= 3
                            ? t('jobListView.noJobsAvailableCurrently', 'No jobs available currently')
                            : t('jobListView.unableToLoadJobs', 'Unable to load jobs')
                          : t('jobListView.noJobsAvailable', 'No jobs available')
                        : t('jobListView.noMatchingJobs', 'No matching jobs')
                  }
                  description={
                    currentSearchQuery 
                      ? t('jobListView.tryAdjustingSearch', 'Try adjusting your search terms or browse all available jobs.')
                      : jobs.length === 0 
                        ? error
                          ? retryCount >= 3
                            ? t('jobListView.triedToFetchJobs', 'We tried to fetch jobs but none are currently available. Please check back later.')
                            : t('jobListView.issueConnecting', 'There was an issue connecting to the job database. Please try again.')
                          : t('jobListView.noJobsCurrentlyAvailable', 'No jobs are currently available. Please check back later.')
                        : t('jobListView.noJobsMatchCriteria', 'No jobs match your current search criteria.')
                  }
                  icon={
                    jobs.length === 0 ? (
                      error ? (
                        retryCount >= 3 ? (
                          <Wifi className="h-12 w-12 text-muted-foreground" />
                        ) : (
                          <WifiOff className="h-12 w-12 text-muted-foreground" />
                        )
                      ) : (
                        <Wifi className="h-12 w-12 text-muted-foreground" />
                      )
                    ) : (
                      <Wifi className="h-12 w-12 text-muted-foreground" />
                    )
                  }
                  action={
                    jobs.length === 0 && error && retryCount < 3 ? {
                      label: t('jobListView.tryAgain', 'Try again'),
                      onClick: handleRetry
                    } : currentSearchQuery && onClearSearch ? {
                      label: t('jobListView.clearSearch', 'Clear search'),
                      onClick: onClearSearch
                    } : undefined
                  }
                />
              )}
            </div>
            
            {/* Pagination - Only show when content is ready */}
            {totalPages > 1 && (
              <div className="flex justify-center pt-8">
                <Pagination>
                  <PaginationContent className="gap-1 sm:gap-2">
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))} 
                        className={cn(
                          (currentPage === 1 || isPageChanging) ? "pointer-events-none opacity-50" : "cursor-pointer"
                        )}
                        previousText={t('pagination.previous', 'Previous')}
                        previousPageText={t('pagination.previousPage', 'Previous page')}
                      />
                    </PaginationItem>
                    
                    {getVisiblePages().map((page, index) => (
                      <PaginationItem key={`${page}-${index}`}>
                        {page === 'ellipsis' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink 
                            onClick={() => handlePageChange(page as number)} 
                            isActive={currentPage === page || (isPageChanging && pendingScrollPage === page)} 
                            className={cn(
                              "min-w-[2.25rem] h-9",
                              isMobile && "min-w-[2rem] h-8 text-sm",
                              isPageChanging ? "pointer-events-none opacity-70" : "cursor-pointer"
                            )}
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} 
                        className={cn(
                          (currentPage === totalPages || isPageChanging) ? "pointer-events-none opacity-50" : "cursor-pointer"
                        )}
                        nextText={t('pagination.next', 'Next')}
                        nextPageText={t('pagination.nextPage', 'Next page')}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>

      {/* Job Application Dialog */}
      {selectedJob && (
        <JobApplicationDialog 
          job={selectedJob} 
          isOpen={!!selectedJob} 
          onClose={() => setSelectedJob(null)}
          onSubmit={handleJobApplicationSubmit}
          // onSaveDraft prop removed to disable save draft functionality
          applying={applying}
        />
      )}

      {/* Job Detail Dialog */}
      {detailJob && (
        <JobDetailDialog 
          job={detailJob} 
          isOpen={!!detailJob} 
          onClose={() => setDetailJob(null)} 
          onApply={job => {
            setDetailJob(null);
            setSelectedJob(job);
          }} 
        />
      )}
    </div>
  );
};

export default JobListView;