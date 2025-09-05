import React, { useState } from 'react';
import { Map, List, Search, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
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

  // Get loading states from both job search hooks
  const { loading: listLoading, loadingState: listLoadingState } = useJobSearch();
  const { loading: mapLoading, loadingState: mapLoadingState, fetchProgress, totalPages, currentPagesFetched } = useJobSearchForMap();
  
  // Determine which loading state to show based on active view
  const loading = activeView === 'list' ? listLoading : mapLoading;
  const loadingState = activeView === 'list' ? listLoadingState : mapLoadingState;

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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={loading ? "Loading jobs..." : "Search jobs..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-touch text-base"
                disabled={loading}
              />
              {/* Loading indicator in search bar */}
              {loading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
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
              {activeView === 'map' && loadingState === 'fetching' && fetchProgress && totalPages > 0 && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-blue-600 h-1 rounded-full transition-all duration-300 ease-out" 
                      style={{ width: `${Math.round(fetchProgress * 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-center mt-1 text-xs text-muted-foreground">
                    {Math.round(fetchProgress * 100)}% complete
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
            <JobListView searchQuery={searchQuery} onPromptLogin={handlePromptLogin} />
          </TabsContent>
          <TabsContent value="map" className="mt-0 h-full">
            <JobMapView searchQuery={searchQuery} onPromptLogin={handlePromptLogin} />
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
