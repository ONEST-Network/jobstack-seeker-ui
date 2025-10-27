import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Map, List, Search, X, Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDebounce } from '@/hooks/useDebounce';
import JobMapView from './JobMapView';
import JobListView from './JobListView';
import UnifiedAuthDialog from './auth/UnifiedAuthDialog';
import ViewPreferenceDialog from './ViewPreferenceDialog';
import { useJobSearch } from '@/hooks/useJobSearch';
import { useJobSearchForMap } from '@/hooks/useJobSearchForMap';
import { useViewPreference } from '@/hooks/useViewPreference';
import { useTranslation } from '@/hooks/useI18n';

interface JobDiscoveryProps {
  onPromptLogin?: () => void;
}

const JobDiscovery: React.FC<JobDiscoveryProps> = ({ onPromptLogin }) => {
  const [activeView, setActiveView] = useState('list');
  const t = useTranslation('jobs');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnifiedAuth, setShowUnifiedAuth] = useState(false);
  const isMobile = useIsMobile();
  
  // View preference management
  const { getDefaultView, shouldApplyDefaultView, markInitialViewApplied, isLoaded } = useViewPreference();

  // Handle search functionality
  const handleSearch = useCallback(() => {
    // This will trigger the search in JobListView via props
    // The actual API call will be handled by JobListView
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    
    // Mark that focus should be maintained and set cursor to beginning
    shouldMaintainFocusRef.current = true;
    savedSelectionRef.current = { start: 0, end: 0 };
    
    // Maintain focus on the input after clearing
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(0, 0);
      }
    });
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  // Use a ref to maintain focus during re-renders
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldMaintainFocusRef = useRef<boolean>(false);
  const savedSelectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  const preventBlurRef = useRef<boolean>(false);
  const lastTypingTimeRef = useRef<number>(0);
  const preventBlurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle input change with proper cursor retention
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const now = Date.now();
    
    // Save current selection before state update
    if (input.selectionStart !== null && input.selectionEnd !== null) {
      savedSelectionRef.current = {
        start: input.selectionStart,
        end: input.selectionEnd
      };
    }
    
    // Mark that we should maintain focus through re-renders
    shouldMaintainFocusRef.current = true;
    preventBlurRef.current = true;
    lastTypingTimeRef.current = now;
    
    // Clear any existing timeout
    if (preventBlurTimeoutRef.current) {
      clearTimeout(preventBlurTimeoutRef.current);
    }
    
    setSearchQuery(input.value);
    
    // Clear the prevent blur flag after 2 seconds of no typing
    preventBlurTimeoutRef.current = setTimeout(() => {
      // Only clear if no recent typing activity
      if (Date.now() - lastTypingTimeRef.current >= 2000) {
        preventBlurRef.current = false;
        shouldMaintainFocusRef.current = false;
      }
    }, 2000);
  }, []);

  // Handle focus events
  const handleInputFocus = useCallback(() => {
    shouldMaintainFocusRef.current = true;
  }, []);

  // Handle keydown to track all typing activities
  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Update typing time for any key that could affect input
    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete' || 
        e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') {
      lastTypingTimeRef.current = Date.now();
      shouldMaintainFocusRef.current = true;
      preventBlurRef.current = true;
      
      // Save current selection before the key action
      if (inputRef.current) {
        const input = inputRef.current;
        if (input.selectionStart !== null && input.selectionEnd !== null) {
          savedSelectionRef.current = {
            start: input.selectionStart,
            end: input.selectionEnd
          };
        }
      }
      
      // Extend the focus retention period
      if (preventBlurTimeoutRef.current) {
        clearTimeout(preventBlurTimeoutRef.current);
      }
      
      preventBlurTimeoutRef.current = setTimeout(() => {
        if (Date.now() - lastTypingTimeRef.current >= 2000) {
          preventBlurRef.current = false;
          shouldMaintainFocusRef.current = false;
        }
      }, 2000);
    }
  }, []);

  // Handle blur events - prevent blur during typing
  const handleInputBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (preventBlurRef.current) {
      // Prevent blur and refocus immediately
      e.preventDefault();
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(
            savedSelectionRef.current.start,
            savedSelectionRef.current.end
          );
        }
      });
    } else {
      shouldMaintainFocusRef.current = false;
    }
  }, []);

  // Debounce search query to reduce API calls - require at least 3 characters
  const debouncedSearchQuery = useDebounce(searchQuery, 500, 3);
  
  // Effect to restore focus and selection after re-renders
  useEffect(() => {
    if (shouldMaintainFocusRef.current && inputRef.current) {
      const input = inputRef.current;
      
      // If input is not focused, restore focus and selection
      if (document.activeElement !== input) {
        requestAnimationFrame(() => {
          if (inputRef.current && shouldMaintainFocusRef.current) {
            inputRef.current.focus();
            inputRef.current.setSelectionRange(
              savedSelectionRef.current.start,
              savedSelectionRef.current.end
            );
          }
        });
      }
    }
  }, [searchQuery]); // Restore focus after each character typed

  // Additional effect to handle focus loss when debounced query triggers
  useEffect(() => {
    if (shouldMaintainFocusRef.current && inputRef.current) {
      // Check if focus was lost due to debounced search triggering other effects
      const checkAndRestoreFocus = () => {
        if (inputRef.current && document.activeElement !== inputRef.current && shouldMaintainFocusRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(
            savedSelectionRef.current.start,
            savedSelectionRef.current.end
          );
        }
      };
      
      // Check immediately and after a small delay to catch async focus loss
      checkAndRestoreFocus();
      const timeoutId = setTimeout(checkAndRestoreFocus, 50);
      const timeoutId2 = setTimeout(checkAndRestoreFocus, 200);
      const timeoutId3 = setTimeout(checkAndRestoreFocus, 500);
      
      return () => {
        clearTimeout(timeoutId);
        clearTimeout(timeoutId2);
        clearTimeout(timeoutId3);
      };
    }
  }, [debouncedSearchQuery]); // Monitor debounced changes that might cause focus loss

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (preventBlurTimeoutRef.current) {
        clearTimeout(preventBlurTimeoutRef.current);
      }
    };
  }, []);
  
  // Centralized hooks - these are the ONLY instances that should fetch data
  const listHookData = useJobSearch(debouncedSearchQuery);
  const mapHookData = useJobSearchForMap({ autoFetch: false }); // Only fetch when map is actually viewed
  
  // Determine which loading state to show based on active view
  const loading = activeView === 'list' ? listHookData.loading : mapHookData.loading;
  const loadingState = activeView === 'list' ? listHookData.loadingState : mapHookData.loadingState;
  
  // Extract map-specific variables
  const { totalPages, currentPagesFetched, fetchProgress } = mapHookData;

  // Set initial view based on user preference (only once on mount)
  useEffect(() => {
    if (shouldApplyDefaultView()) {
      const defaultView = getDefaultView();
      setActiveView(defaultView);
      markInitialViewApplied(); // Mark that we've applied the initial view
    }
  }, [shouldApplyDefaultView, getDefaultView, markInitialViewApplied]);

  // Trigger map fetch in background on mount to get all jobs data for both views
  useEffect(() => {
    if (!mapHookData.loading && mapHookData.loadingState === 'idle' && mapHookData.allJobs.length === 0) {
      console.log('Background: Fetching all jobs for total openings count...');
      mapHookData.refetch();
    }
  }, [mapHookData.loading, mapHookData.loadingState, mapHookData.allJobs.length, mapHookData]);

  // Trigger map fetch when map view is first accessed (fallback)
  useEffect(() => {
    if (activeView === 'map' && !mapHookData.loading && mapHookData.loadingState === 'idle') {
      mapHookData.refetch();
    }
  }, [activeView, mapHookData]);

  const handlePromptLogin = () => {
    if (onPromptLogin) {
      onPromptLogin();
    } else {
      setShowUnifiedAuth(true);
    }
  };

  const handleViewPreferenceApply = (view: 'list' | 'map') => {
    setActiveView(view);
    // Trigger refresh of the selected view
    if (view === 'list') {
      listHookData.refetch();
    } else {
      mapHookData.refetch();
    }
  };

  

  return (
    <div className="bg-background">
      {/* Search and Controls Bar - Single Line */}
      <div className="mb-4 px-4">
        <div className="bg-white border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            {/* Search - Reduced width */}
            <div className="relative flex-1 max-w-sm">
              <Input
                ref={inputRef}
                placeholder={loading ? t('jobListView.pleaseWait', 'Loading jobs...') : t('search.searchJobsByRole', 'Search jobs by role...')}
                value={searchQuery}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                onKeyPress={handleKeyPress}
                onBlur={handleInputBlur}
                onFocus={handleInputFocus}
                className="pl-3 pr-20 h-touch text-base"
                disabled={loading}
              />
              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                {/* Clear button */}
                {searchQuery && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                    onClick={handleClearSearch}
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {/* Loading indicator or search button */}
                {loading ? (
                  <div className="p-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                    onClick={handleSearch}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* View Toggle */}
            <Tabs value={activeView} onValueChange={setActiveView} className="flex-shrink-0">
              <TabsList className="grid grid-cols-2 h-touch">
                <TabsTrigger value="list" className="flex items-center gap-1 px-2 text-sm">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('jobDiscovery.listView', 'List')}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="map" 
                  className="flex items-center gap-1 px-2 text-sm"
                >
                  <Map className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('jobDiscovery.mapView', 'Map')}</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* View Preferences Settings */}
            <ViewPreferenceDialog onApply={handleViewPreferenceApply}>
              <Button
                variant="outline"
                size="sm"
                className="h-touch flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">{t('jobDiscovery.settings', 'Settings')}</span>
              </Button>
            </ViewPreferenceDialog>
          </div>
          
          {/* Enhanced loading status message */}
          {loading && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>
                  {/* List view loading states */}
                  {activeView === 'list' && loadingState === 'initial' && t('jobMapView.initializingSearch', 'Loading jobs...')}
                  {activeView === 'list' && loadingState === 'loading' && t('jobMapView.loadingJobs', 'Refreshing jobs...')}
                  {activeView === 'list' && loadingState === 'partial' && t('jobMapView.pleaseWait', 'Taking longer than expected...')}
                  
                  {/* Map view loading states */}
                  {activeView === 'map' && loadingState === 'initial' && t('jobMapView.initializingSearch', 'Initializing map view...')}
                  {activeView === 'map' && loadingState === 'loading' && (
                    totalPages > 0 
                      ? t('jobMapView.loadingAllJobs', 'Loading all jobs for map: {{currentPages}}/{{totalPages}} pages', { currentPages: currentPagesFetched, totalPages })
                      : t('jobMapView.preparingData', 'Fetching job data for map...')
                  )}
                  {activeView === 'map' && loadingState === 'partial' && t('jobMapView.processingLocations', 'Processing job locations...')}
                  
                  {/* Fallback */}
                  {!loadingState && (activeView === 'list' ? t('jobMapView.loadingJobs', 'Loading jobs...') : t('jobMapView.preparingData', 'Loading map data...'))}
                </span>
              </div>
              
              {/* Map view progress bar */}
              {activeView === 'map' && loadingState === 'loading' && mapHookData.fetchProgress && mapHookData.totalPages > 0 && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-blue-600 h-1 rounded-full transition-all duration-300 ease-out" 
                      style={{ width: `${Math.round(mapHookData.fetchProgress * 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-center mt-1 text-xs text-muted-foreground">
                    {Math.round(mapHookData.fetchProgress * 100)}% {t('jobMapView.complete', 'complete')}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-[60vh]">
        <Tabs value={activeView} className="h-full">
          <TabsContent value="list" className="mt-0 h-full">
            <JobListView 
              searchQuery={debouncedSearchQuery} 
              onPromptLogin={handlePromptLogin}
              onClearSearch={handleClearSearch}
              hookData={listHookData}
              mapHookData={mapHookData}
            />
          </TabsContent>
          <TabsContent value="map" className="mt-0 h-full">
            <JobMapView 
              searchQuery={searchQuery} 
              onPromptLogin={handlePromptLogin}
              hookData={mapHookData}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Login/Register Dialogs */}
      <UnifiedAuthDialog
        isOpen={showUnifiedAuth}
        onClose={() => {
          setShowUnifiedAuth(false);
        }}
        defaultRole="individual"
      />
    </div>
  );
};

export default JobDiscovery;
