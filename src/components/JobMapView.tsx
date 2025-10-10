
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ZoomIn, ZoomOut, Navigation, Search, CheckCircle, XCircle, AlertCircle, X, MapPin, Filter, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SimpleLeafletMap from './map/SimpleLeafletMap';

import JobApplicationDialog from './JobApplicationDialog';
import JobDetailDialog from './job-search/JobDetailDialog';
import { useJobSearch, JobItem } from '@/hooks/useJobSearch';
import { useJobSearchForMap } from '@/hooks/useJobSearchForMap';
import { useJobApplication, JobApplicationData } from '@/hooks/useJobApplication';
import { useAuth } from '@/contexts/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';

interface JobMapViewProps {
  searchQuery: string;
  onPromptLogin?: () => void;
  hookData?: {
    allJobs: JobItem[];
    loading: boolean;
    loadingState: any;
    error: string | null;
    totalJobsCount: number;
    totalPages: number;
    currentPagesFetched: number;
    fetchProgress: number;
    findProviderAndJobIds: (jobId: string) => { providerId: string; jobId: string } | null;
    fetchScoresForJobs: (jobs: JobItem[]) => Promise<JobItem[]>;
    scoresLoading: boolean;
    retryCount: number;
  }; // Pass hook data from parent to avoid duplicate calls
}

interface JobLocation {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  jobs: JobItem[];
  jobCount: number;
  density: 'high' | 'medium' | 'low';
}

// Add types for map center and user location
interface LatLng {
  lat: number;
  lng: number;
}

// Custom Toast Interface
interface MapToast {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

const DEFAULT_CENTER: LatLng = { lat: 20.5937, lng: 78.9629 }; // Center of India

const JobMapView: React.FC<JobMapViewProps> = ({ searchQuery, onPromptLogin, hookData }) => {
  const [selectedLocation, setSelectedLocation] = useState<JobLocation | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<JobItem | null>(null);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState<LatLng>(DEFAULT_CENTER);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [zoom, setZoom] = useState(5);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [showIndividualJobs, setShowIndividualJobs] = useState(true);
  
  // Custom map toast state
  const [mapToasts, setMapToasts] = useState<MapToast[]>([]);

  const { user } = useAuth();
  // Use hookData if provided (from parent), otherwise call local hook (for standalone usage)
  const localHookData = useJobSearchForMap({ autoFetch: !hookData });
  const { 
    allJobs: jobs, 
    loading, 
    loadingState, 
    error, 
    totalJobsCount,
    totalPages,
    currentPagesFetched,
    fetchProgress,
    findProviderAndJobIds, 
    fetchScoresForJobs, 
    scoresLoading,
    retryCount
  } = hookData || localHookData;
  const { applyToJob, applying } = useJobApplication();

  // Auto-request user location for better default map centering
  const {
    latitude,
    longitude,
    error: locationError,
    loading: locationLoading,
    permissionStatus,
    getCurrentPosition
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000, // 5 minutes
    autoRequest: true // Automatically request location on mount
  });

  // Custom toast function for map container
  const showMapToast = (type: 'success' | 'error' | 'info', title: string, description?: string, duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: MapToast = { id, type, title, description, duration };
    
    setMapToasts(prev => [...prev, newToast]);
    
    // Auto remove after duration
    setTimeout(() => {
      setMapToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  };

  // Remove toast manually
  const removeMapToast = (id: string) => {
    setMapToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Auto-center map on user location when available
  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      const userLocation = { lat: latitude, lng: longitude };
      setUserLocation(userLocation);
      setMapCenter(userLocation);
      setZoom(12); // Zoom to a good level for viewing local jobs
      
      // Optional: Show a subtle toast that location was detected
      showMapToast('success', 'Location Detected', 'Map centered on your location', 2000);
    }
  }, [latitude, longitude]);

  // Geocoding function to convert location name to coordinates
  const geocodeLocation = async (locationName: string): Promise<LatLng | null> => {
    try {
      // Use the map service abstraction
      const { mapService } = await import('@/services/mapService');
      return await mapService.geocodeLocation(locationName);
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  // Handle location search
  const handleLocationSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      // If user location is available, return to user location, otherwise default to India view
      if (userLocation) {
        setMapCenter(userLocation);
        setZoom(12);
      } else {
        setMapCenter(DEFAULT_CENTER);
        setZoom(5);
      }
      return;
    }

    setSearchingLocation(true);
    
    try {
      const coordinates = await geocodeLocation(searchQuery);
      
      if (coordinates) {
        setMapCenter(coordinates);
        setZoom(12); // Zoom in to the searched location
        showMapToast('success', 'Location Found!', `Zoomed to ${searchQuery}`);
        
        // Check if there are jobs in this location
        const jobsInLocation = jobLocations.filter(location => 
          location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          location.state.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        if (jobsInLocation.length > 0) {
          showMapToast('info', 'Jobs Found!', `${jobsInLocation.length} location(s) with jobs found`);
        } else {
          showMapToast('info', 'No Jobs Found', 'No jobs available in this location');
        }
      } else {
        showMapToast('error', 'Location Not Found', `Could not find coordinates for "${searchQuery}"`);
      }
    } catch (error) {
      showMapToast('error', 'Search Error', 'Failed to search for location');
    } finally {
      setSearchingLocation(false);
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setMapSearchQuery('');
    
    // If user location is available, return to user location, otherwise default to India view
    if (userLocation) {
      setMapCenter(userLocation);
      setZoom(12);
      showMapToast('info', 'Search Cleared', 'Returned to your location');
    } else {
      setMapCenter(DEFAULT_CENTER);
      setZoom(5);
      showMapToast('info', 'Search Cleared', 'Reset to default view');
    }
  };

  // Optimized job filtering with memoization
  const filteredJobs = useMemo(() => {
    if (!jobs || jobs.length === 0) return [];
    
    if (!searchQuery.trim()) return jobs;
    
    const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(term => term.length > 0);
    if (searchTerms.length === 0) return jobs;

    return jobs.filter(job => {
      const searchableFields = [
        job.title || '',
        job.company || '',
        job.location || '',
        job.salary || '',
        job.industry || '',
        job.description || '',
        job.jobDetails?.skills?.join(' ') || '',
        ((job.tags as Record<string, unknown>)?.jobNeeds as Record<string, unknown>)?.hrWorkExperienceOther as string || ''
      ].map(field => field.toLowerCase());

      // Check if all search terms are found in any of the searchable fields
      return searchTerms.every(term => 
        searchableFields.some(field => field.includes(term))
      );
    });
  }, [jobs, searchQuery]);

  // Optimized location processing with memoization
  const jobLocations = useMemo(() => {
    if (!filteredJobs || filteredJobs.length === 0) return [];

    // Group jobs by location
    const locationMap = new Map<string, {
      jobs: JobItem[];
      lat: number;
      lng: number;
      city: string;
      state: string;
    }>();

    filteredJobs.forEach(job => {
      // Extract GPS coordinates from job data
      const gps = job.jobProviderLocation?.gps || job.tags?.basicInfo?.jobProviderLocation?.gps;
      
      if (!gps || !gps.lat || !gps.lng) {
        return; // Skip jobs without GPS coordinates
      }

      const city = job.jobProviderLocation?.city || job.tags?.basicInfo?.jobProviderLocation?.city || 'Unknown City';
      const state = job.jobProviderLocation?.state || job.tags?.basicInfo?.jobProviderLocation?.state || 'Unknown State';
      const locationKey = `${city}, ${state}`;

      if (!locationMap.has(locationKey)) {
        locationMap.set(locationKey, {
          jobs: [],
          lat: gps.lat,
          lng: gps.lng,
          city,
          state
        });
      }

      locationMap.get(locationKey)!.jobs.push(job);
    });

    // Convert to JobLocation array
    return Array.from(locationMap.entries()).map(([locationKey, data], index) => {
      const jobCount = data.jobs.length;
      let density: 'high' | 'medium' | 'low' = 'low';
      
      if (jobCount >= 10) density = 'high';
      else if (jobCount >= 3) density = 'medium';

      return {
        id: `location-${index}`,
        name: data.city,
        state: data.state,
        lat: data.lat,
        lng: data.lng,
        jobs: data.jobs,
        jobCount,
        density
      };
    });
  }, [filteredJobs]);

  // Filter locations based on map search query
  const filteredJobLocations = jobLocations.filter(location =>
    mapSearchQuery === '' ||
    location.name.toLowerCase().includes(mapSearchQuery.toLowerCase()) ||
    location.state.toLowerCase().includes(mapSearchQuery.toLowerCase())
  );

  // Memoized event handlers for better performance
  const handleLocationClick = useCallback((location: JobLocation) => {
    setSelectedLocation(location);
  }, []);

  const handleViewJobs = useCallback((location: JobLocation, specificJob?: JobItem) => {
    if (specificJob) {
      // Show job details for the specific job
      setSelectedJobForDetails(specificJob);
      
      // Fetch scores for the specific job if user is logged in
      if (user) {
        fetchScoresForJobs([specificJob]).then(jobsWithScores => {
          if (jobsWithScores.length > 0) {
            setSelectedJobForDetails(jobsWithScores[0]);
          }
        });
      }
    } else {
      // Show the first job application flow (fallback for "more jobs" click)
      if (location.jobs.length > 0) {
        setSelectedJob(location.jobs[0]);
      }
    }
  }, [user, fetchScoresForJobs]);

  const handleJobApplication = useCallback((job: JobItem) => {
    if (!user) {
      onPromptLogin?.();
      return;
    }
    setSelectedJob(job);
  }, [user, onPromptLogin]);

  const handleApplyFromDetails = useCallback((job: JobItem) => {
    if (!user) {
      onPromptLogin?.();
      return;
    }
    // Close the job details dialog and open application dialog
    setSelectedJobForDetails(null);
    setSelectedJob(job);
  }, [user, onPromptLogin]);

  const handleToggleIndividualJobs = useCallback(() => {
    setShowIndividualJobs(prev => {
      const newValue = !prev;
      showMapToast(
        'info', 
        newValue ? 'Individual Mode' : 'Clustered Mode',
        newValue ? 'Showing exact job locations' : 'Showing grouped job locations',
        2000
      );
      return newValue;
    });
  }, []);

  const handleJobClick = useCallback((jobOrJobs: JobItem | JobItem[]) => {
    if (!user) {
      onPromptLogin?.();
      return;
    }

    // Check if it's an array of jobs (multiple jobs at same location)
    if (Array.isArray(jobOrJobs)) {
      // Create a JobLocation object from the jobs array to use existing location card modal
      const firstJob = jobOrJobs[0];
      const gps = firstJob.jobProviderLocation?.gps || 
                 firstJob.tags?.basicInfo?.jobProviderLocation?.gps;
      
      if (gps && gps.lat && gps.lng) {
        const jobLocation: JobLocation = {
          id: `individual-${gps.lat}-${gps.lng}`,
          name: firstJob.jobProviderLocation?.city || 
                firstJob.tags?.basicInfo?.jobProviderLocation?.city || 'Unknown City',
          state: firstJob.jobProviderLocation?.state || 
                 firstJob.tags?.basicInfo?.jobProviderLocation?.state || 'Unknown State',
          lat: gps.lat,
          lng: gps.lng,
          jobs: jobOrJobs,
          jobCount: jobOrJobs.length,
          density: jobOrJobs.length >= 10 ? 'high' : jobOrJobs.length >= 3 ? 'medium' : 'low'
        };
        
        setSelectedLocation(jobLocation);
      }
    } else {
      // Single job - show job details directly
      setSelectedJobForDetails(jobOrJobs);
      
      // Fetch scores for the job if user is logged in
      if (user) {
        fetchScoresForJobs([jobOrJobs]).then(jobsWithScores => {
          if (jobsWithScores.length > 0) {
            setSelectedJobForDetails(jobsWithScores[0]);
          }
        });
      }
    }
  }, [user, onPromptLogin, fetchScoresForJobs]);
  const handleJobApplicationSubmit = async (applicationData: JobApplicationData) => {
    if (!selectedJob) return;

    try {
      // Find provider and job IDs from the original API response
      const ids = findProviderAndJobIds(selectedJob.id);
      if (!ids) {
        console.error('Could not find provider and job IDs for job:', selectedJob.id);
        showMapToast('error', 'Application Failed', 'Failed to submit job application. Please try again.');
        return;
      }

      // Pass the job details from the BAP search API response
      const result = await applyToJob(ids.jobId, ids.providerId, applicationData, undefined, selectedJob);
      
      if (result.success) {
        showMapToast('success', 'Application Submitted!', 'Your job application has been successfully submitted!');
        // Close the application dialog on success
        setSelectedJob(null);
      } else {
        // Check if it's an already applied error
        const errorMessage = result.error || (result.data?.message) || 'Failed to submit job application';
        if (errorMessage.toLowerCase().includes('already applied')) {
          showMapToast('info', 'Already Applied', 'You have already applied for this job with this profile.');
        } else {
          showMapToast('error', 'Application Failed', errorMessage);
        }
      }
    } catch (error) {
      console.error('Job application error:', error);
      showMapToast('error', 'Application Failed', 'Failed to submit job application. Please try again.');
    }
  };

  // const handleSaveDraft = async (applicationData: JobApplicationData) => {
  //   if (!selectedJob) return;

  //   try {
  //     // Find provider and job IDs from the original API response
  //     const ids = findProviderAndJobIds(selectedJob.id);
  //     if (!ids) {
  //       console.error('Could not find provider and job IDs for job:', selectedJob.id);
  //       showMapToast('error', 'Draft Save Failed', 'Failed to save job application draft. Please try again.');
  //       return;
  //     }

  //     // Pass the job details from the BAP search API response
  //     const result = await saveDraft(ids.jobId, ids.providerId, applicationData, selectedJob);
      
  //     if (result.success) {
  //       showMapToast('success', 'Draft Saved!', 'Your job application draft has been successfully saved.');
  //       // Don't close the dialog when saving draft, let user continue editing
  //     } else {
  //       const errorMessage = result.error || 'Failed to save draft';
  //       showMapToast('error', 'Draft Save Failed', errorMessage);
  //     }
  //   } catch (error) {
  //     console.error('Job draft save error:', error);
  //       showMapToast('error', 'Draft Save Failed', 'Failed to save job application draft. Please try again.');
  //   }
  // };

  

  // Find My Location handler
  const handleFindMyLocation = async () => {
    if (!navigator.geolocation) {
      showMapToast('error', 'Location Error', 'Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    try {
      await getCurrentPosition();
      // The useEffect above will handle centering the map
    } catch (error) {
      showMapToast('error', 'Location Error', 'Unable to retrieve your location.');
    } finally {
      setLocating(false);
    }
  };

  // Custom Toast Component
  const MapToastContainer = () => (
    <div className="fixed top-4 right-4 z-[9999999] space-y-2 max-w-sm">
      {mapToasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            p-4 rounded-lg shadow-lg border animate-fade-in
            ${toast.type === 'success' ? 'bg-green-50 border-green-200' : ''}
            ${toast.type === 'error' ? 'bg-red-50 border-red-200' : ''}
            ${toast.type === 'info' ? 'bg-blue-50 border-blue-200' : ''}
          `}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
              {toast.type === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
              {toast.type === 'info' && <AlertCircle className="h-5 w-5 text-blue-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                toast.type === 'success' ? 'text-green-800' : 
                toast.type === 'error' ? 'text-red-800' : 'text-blue-800'
              }`}>
                {toast.title}
              </p>
              {toast.description && (
                <p className={`text-xs mt-1 ${
                  toast.type === 'success' ? 'text-green-600' : 
                  toast.type === 'error' ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {toast.description}
                </p>
              )}
            </div>
            <button
              onClick={() => removeMapToast(toast.id)}
              className={`flex-shrink-0 ${
                toast.type === 'success' ? 'text-green-400 hover:text-green-600' : 
                toast.type === 'error' ? 'text-red-400 hover:text-red-600' : 'text-blue-400 hover:text-blue-600'
              }`}
              aria-label="Close notification"
              title="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  // Show loading state with progress information
  if (loading) {
    const progressPercentage = fetchProgress ? Math.round(fetchProgress * 100) : 0;
    
    return (
      <div className="relative h-[calc(100vh-140px)] bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-6"></div>
          
          {/* Enhanced loading messages based on loading state */}
          {loadingState === 'initial' && (
            <>
              <p className="text-gray-700 font-medium mb-2">Initializing job search...</p>
              <p className="text-gray-500 text-sm">Preparing to fetch job data</p>
            </>
          )}
          
          {loadingState === 'fetching' && totalPages > 0 && (
            <>
              <p className="text-gray-700 font-medium mb-2">
                Loading all jobs for map view...
              </p>
              <p className="text-gray-600 text-sm mb-3">
                Fetched {currentPagesFetched} of {totalPages} pages
              </p>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              
              <p className="text-gray-500 text-xs">
                {totalJobsCount ? `${totalJobsCount} jobs found` : 'Counting jobs...'}
                {progressPercentage > 0 && ` • ${progressPercentage}% complete`}
              </p>
              
              {retryCount > 0 && (
                <p className="text-amber-600 text-xs mt-2">
                  Retrying... (Attempt {retryCount})
                </p>
              )}
            </>
          )}
          
          {loadingState === 'processing' && (
            <>
              <p className="text-gray-700 font-medium mb-2">Processing job locations...</p>
              <p className="text-gray-500 text-sm">
                Organizing {totalJobsCount} jobs by location
              </p>
            </>
          )}
          
          {/* Fallback for any other loading state */}
          {!loadingState && (
            <>
              <p className="text-gray-700 font-medium mb-2">Loading jobs...</p>
              <p className="text-gray-500 text-sm">Please wait while we fetch job data</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="relative h-[calc(100vh-140px)] bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️ Error Loading Jobs</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative h-[calc(100vh-140px)] bg-gradient-to-br from-slate-50 to-blue-50">
        {/* OpenStreetMap with Job Locations */}
        <SimpleLeafletMap
          jobLocations={filteredJobLocations}
          onLocationClick={handleLocationClick}
          selectedLocation={selectedLocation}
          className="w-full h-full"
          mapCenter={mapCenter}
          userLocation={userLocation}
          zoom={zoom}
          showLocationCard={!!selectedLocation}
          locationCardData={selectedLocation}
          onCloseLocationCard={() => setSelectedLocation(null)}
          onViewJobsFromCard={handleViewJobs}
          mapSearchQuery={mapSearchQuery}
          onMapSearchChange={setMapSearchQuery}
          filteredJobLocations={filteredJobLocations}
          onZoomIn={() => {
            if (selectedLocation) {
              // If a location is selected, zoom into that location
              setMapCenter({ lat: selectedLocation.lat, lng: selectedLocation.lng });
              setZoom(prev => Math.min(18, prev + 1));
            } else {
              // Otherwise just zoom in at current center
              setZoom(prev => Math.min(18, prev + 1));
            }
          }}
          onZoomOut={() => {
            if (selectedLocation) {
              // If a location is selected, zoom out from that location
              setMapCenter({ lat: selectedLocation.lat, lng: selectedLocation.lng });
              setZoom(prev => Math.max(2, prev - 1));
            } else {
              // Otherwise just zoom out at current center
              setZoom(prev => Math.max(2, prev - 1));
            }
          }}
          onFindMyLocation={handleFindMyLocation}
          locating={locating}
          loading={loading}
          onLocationSearch={handleLocationSearch}
          searchingLocation={searchingLocation}
          onClearSearch={handleClearSearch}
          showIndividualJobs={showIndividualJobs}
          onToggleIndividualJobs={handleToggleIndividualJobs}
          allJobs={filteredJobs}
          onJobClick={handleJobClick}
        />

        {/* Custom Toast Container - Inside Map Container */}
        <MapToastContainer />
      </div>

      {/* Job Detail Dialog - Rendered outside map container with highest z-index */}
      {selectedJobForDetails && (
        <JobDetailDialog
          job={selectedJobForDetails}
          isOpen={true}
          onClose={() => setSelectedJobForDetails(null)}
          onApply={handleApplyFromDetails}
        />
      )}

      {/* Job Application Dialog - Rendered outside map container with highest z-index */}
      {selectedJob && (
        <JobApplicationDialog 
          job={selectedJob}
          isOpen={true}
          onClose={() => setSelectedJob(null)}
          onSubmit={handleJobApplicationSubmit}
          // onSaveDraft={handleSaveDraft} // Disabled save draft functionality
          applying={applying}
          // savingDraft={savingDraft} // Disabled save draft functionality
        />
      )}


    </>
  );
};

export default JobMapView;
