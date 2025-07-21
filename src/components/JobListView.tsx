import React, { useState, useEffect } from 'react';
import JobApplicationDialog from './JobApplicationDialog';
import JobDetailDialog from './job-search/JobDetailDialog';
import JobCard from './job-search/JobCard';
import JobCardSkeleton from '@/components/ui/job-card-skeleton';
import { LoadingMessage, EmptyState } from '@/components/ui/loading-states';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useJobSearch, JobItem, LoadingState } from '@/hooks/useJobSearch';
import { useJobApplication, JobApplicationData } from '@/hooks/useJobApplication';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface JobListViewProps {
  searchQuery: string;
  onPromptLogin?: () => void;
}

const JobListView: React.FC<JobListViewProps> = ({
  searchQuery,
  onPromptLogin
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [detailJob, setDetailJob] = useState<JobItem | null>(null);
  const [jobsWithScores, setJobsWithScores] = useState<JobItem[]>([]);
  const [scoredJobIds, setScoredJobIds] = useState<Set<string>>(new Set());
  const { user, getSelectedCandidate } = useAuth();
  const selectedCandidate = getSelectedCandidate();
  const { toast } = useToast();

  // Prevent unauthenticated users from opening the job detail dialog
  const handleViewDetails = (job: JobItem) => {
    if (!user) {
      onPromptLogin?.();
      return;
    }
    setDetailJob(job);
  };
  
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
    isAutoRetrying
  } = useJobSearch();
  const { applyToJob, applying } = useJobApplication();

  // Filter jobs based on search query
  const filteredJobs = (jobs || []).filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const jobsPerPage = 5;
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + jobsPerPage);

  // Function to fetch trust and match scores for current page
  const fetchScoresForCurrentPage = async () => {
    if (!user || !user.profile || paginatedJobs.length === 0) {
      return;
    }

    // Check if we already have scores for all jobs on this page
    const jobsNeedingScores = paginatedJobs.filter(job => !scoredJobIds.has(job.id));
    
    if (jobsNeedingScores.length === 0) {
      return;
    }

    try {
      const jobsWithScores = await fetchScoresForJobs(jobsNeedingScores);
      
      // Update the jobs with scores
      setJobsWithScores(prev => {
        const updated = [...prev];
        jobsWithScores.forEach(jobWithScore => {
          const index = updated.findIndex(j => j.id === jobWithScore.id);
          if (index !== -1) {
            updated[index] = jobWithScore;
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
      console.error('Failed to fetch trust and match scores for current page:', error);
    }
  };

  // Fetch trust and match scores when page changes or user logs in
  useEffect(() => {
    if (user && user.profile && paginatedJobs.length > 0) {
      fetchScoresForCurrentPage();
    }
  }, [currentPage, user?.profile, paginatedJobs, selectedCandidate]);

  // Reset scored jobs when selected candidate changes (to recalculate scores with new profile)
  useEffect(() => {
    if (selectedCandidate) {
      console.log('Selected candidate changed, resetting scored jobs to recalculate scores');
      setScoredJobIds(new Set());
      setJobsWithScores(jobs);
      toast({
        title: 'Selected candidate changed. Trust and match scores will be recalculated.',
        description: `Your profile for ${selectedCandidate.name} has been updated.`,
      });
    }
  }, [selectedCandidate?.id]);

  // Update jobsWithScores when jobs change
  useEffect(() => {
    setJobsWithScores(jobs);
    setScoredJobIds(new Set()); // Reset scored jobs when jobs change
  }, [jobs]);

  // Get jobs to display (use scored jobs if available, otherwise use original jobs)
  const displayJobs = paginatedJobs.map(job => {
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

  const handleJobApplicationSubmit = async (applicationData: JobApplicationData) => {
    if (!selectedJob) return;

    // Find provider and job IDs from the original API response
    const ids = findProviderAndJobIds(selectedJob.id);
    if (!ids) {
      console.error('Could not find provider and job IDs for job:', selectedJob.id);
      return;
    }

    const result = await applyToJob(ids.jobId, ids.providerId, applicationData);
    
    if (result.success) {
      // Close the application dialog on success
      setSelectedJob(null);
    }
  };

  const handleRetry = () => {
    refetch(); // Force refresh
  };

  const handleRefresh = () => {
    refetch(); // Force refresh
  };

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
            <h2 className="text-2xl font-bold text-foreground">Jobs for You</h2>
            {!loading && jobs.length > 0 && (
              <div className="flex items-center gap-2">
                {scoresLoading && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Calculating trust & match scores...
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
                {lastFetchTime && (
                  <span className="text-xs text-muted-foreground">
                    Last updated: {formatLastFetchTime()}
                  </span>
                )}
              </div>
            )}
          </div>
          {!loading && (
            <p className="text-sm text-muted-foreground">
              {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
              {searchQuery && ` for "${searchQuery}"`}
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
                  Retry
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            <LoadingMessage 
              loadingState={loadingState}
              retryCount={retryCount}
              onRetry={handleRetry}
              isAutoRetrying={isAutoRetrying}
            />

            {/* Show existing jobs if available during refresh */}
            {!isInitialLoad && jobs.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Showing cached results while refreshing...
                </p>
                <div className="space-y-4">
                  {displayJobs.map(job => (
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

            {/* Loading skeletons */}
            {isInitialLoad && (
              <div className="space-y-4">
                {Array.from({ length: 3 }, (_, i) => (
                  <JobCardSkeleton key={i} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Jobs List */}
        {!loading && !error && (
          <>
            <div className="space-y-4">
              {displayJobs.length > 0 ? (
                displayJobs.map(job => (
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
                    searchQuery 
                      ? `No jobs found for "${searchQuery}"`
                      : jobs.length === 0 
                        ? error 
                          ? retryCount >= 3
                            ? 'No jobs available currently'
                            : 'Unable to load jobs'
                          : 'No jobs available'
                        : 'No matching jobs'
                  }
                  description={
                    searchQuery 
                      ? 'Try adjusting your search terms or browse all available jobs.'
                      : jobs.length === 0 
                        ? error
                          ? retryCount >= 3
                            ? 'We tried to fetch jobs but none are currently available. Please check back later.'
                            : 'There was an issue connecting to the job database. Please try again.'
                          : 'No jobs are currently available. Please check back later.'
                        : 'No jobs match your current search criteria.'
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
                      label: 'Try again',
                      onClick: handleRetry
                    } : searchQuery ? {
                      label: 'Clear search',
                      onClick: () => window.location.reload()
                    } : undefined
                  }
                />
              )}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center pt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} 
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <PaginationItem key={page}>
                        <PaginationLink 
                          onClick={() => setCurrentPage(page)} 
                          isActive={currentPage === page} 
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} 
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} 
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