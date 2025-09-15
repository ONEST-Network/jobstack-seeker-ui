import React, { useState, useCallback, useEffect } from 'react';
import { Map, List, Search, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDebounce } from '@/hooks/useDebounce';
import JobMapView from './JobMapView';
import JobListView from './JobListView';
import UnifiedAuthDialog from './auth/UnifiedAuthDialog';
import { useJobSearch } from '@/hooks/useJobSearch';
import { useJobSearchForMap } from '@/hooks/useJobSearchForMap';

interface JobDiscoveryProps {
  onPromptLogin?: () => void;
}

const JobDiscovery: React.FC<JobDiscoveryProps> = ({ onPromptLogin }) => {
  const [activeView, setActiveView] = useState('list');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnifiedAuth, setShowUnifiedAuth] = useState(false);
  const isMobile = useIsMobile();

  // Handle search functionality
  const handleSearch = useCallback(() => {
    // This will trigger the search in JobListView via props
    // The actual API call will be handled by JobListView
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  // Debounce search query to reduce API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  
  // Centralized hooks - these are the ONLY instances that should fetch data
  const listHookData = useJobSearch(debouncedSearchQuery);
  const mapHookData = useJobSearchForMap({ autoFetch: false }); // Only fetch when map is actually viewed
  
  // Determine which loading state to show based on active view
  const loading = activeView === 'list' ? listHookData.loading : mapHookData.loading;
  const loadingState = activeView === 'list' ? listHookData.loadingState : mapHookData.loadingState;

  // Trigger map fetch when map view is first accessed
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

  

  return (
    <div className="bg-background">
      {/* Search and Controls Bar - Single Line */}
      <div className="mb-4 px-4">
        <div className="bg-white border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            {/* Search - Reduced width */}
            <div className="relative flex-1 max-w-sm">
              <Input
                placeholder={loading ? "Loading jobs..." : "Search jobs by role..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
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
                  <span className="hidden sm:inline">List</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="map" 
                  className="flex items-center gap-1 px-2 text-sm"
                >
                  <Map className="h-4 w-4" />
                  <span className="hidden sm:inline">Map</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Filters Toggle removed */}
          </div>
          
          {/* Enhanced loading status message */}
          {loading && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>
                  {/* List view loading states */}
                  {activeView === 'list' && loadingState === 'initial' && 'Loading jobs...'}
                  {activeView === 'list' && loadingState === 'loading' && 'Refreshing jobs...'}
                  {activeView === 'list' && loadingState === 'partial' && 'Taking longer than expected...'}
                  
                  {/* Map view loading states */}
                  {activeView === 'map' && loadingState === 'initial' && 'Initializing map view...'}
                  {activeView === 'map' && loadingState === 'fetching' && (
                    totalPages > 0 
                      ? `Loading all jobs for map: ${currentPagesFetched}/${totalPages} pages`
                      : 'Fetching job data for map...'
                  )}
                  {activeView === 'map' && loadingState === 'processing' && 'Processing job locations...'}
                  
                  {/* Fallback */}
                  {!loadingState && (activeView === 'list' ? 'Loading jobs...' : 'Loading map data...')}
                </span>
              </div>
              
              {/* Map view progress bar */}
              {activeView === 'map' && loadingState === 'fetching' && mapHookData.fetchProgress && mapHookData.totalPages > 0 && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-blue-600 h-1 rounded-full transition-all duration-300 ease-out" 
                      style={{ width: `${Math.round(mapHookData.fetchProgress * 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-center mt-1 text-xs text-muted-foreground">
                    {Math.round(mapHookData.fetchProgress * 100)}% complete
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
              searchQuery={searchQuery} 
              onPromptLogin={handlePromptLogin}
              hookData={listHookData}
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
