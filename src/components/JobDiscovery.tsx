import React, { useState, useCallback, useEffect, useRef } from 'react';
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
    
    // Mark as typing to maintain focus during the clear operation
    isTypingRef.current = true;
    lastFocusedRef.current = true;
    cursorPositionRef.current = 0; // Cursor will be at beginning after clear
    
    // Maintain focus on the input after clearing
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(0, 0);
      }
      // Clear typing flag after focus is restored
      setTimeout(() => {
        isTypingRef.current = false;
      }, 100);
    });
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  // Use a ref to maintain focus during re-renders
  const inputRef = useRef<HTMLInputElement>(null);
  const lastFocusedRef = useRef<boolean>(false);
  const cursorPositionRef = useRef<number>(0);
  const isTypingRef = useRef<boolean>(false);

  // Handle input change with proper cursor retention
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursorPosition = input.selectionStart || 0;
    
    setSearchQuery(input.value);
    
    // Track that user is actively typing and store cursor position
    isTypingRef.current = true;
    cursorPositionRef.current = cursorPosition;
    lastFocusedRef.current = true;
    
    // Clear typing flag after a short delay
    setTimeout(() => {
      isTypingRef.current = false;
    }, 100);
  }, []);

  // Reset focus tracking when input loses focus naturally (user clicks elsewhere)
  const handleInputBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // Only clear focus tracking if we're not typing (to prevent clearing during re-renders)
    if (!isTypingRef.current) {
      lastFocusedRef.current = false;
    }
  }, []);

  // Track when input gains focus
  const handleInputFocus = useCallback(() => {
    lastFocusedRef.current = true;
  }, []);

  // Track active typing on keydown
  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Mark as typing for any key that could change the input value
    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
      isTypingRef.current = true;
      lastFocusedRef.current = true;
      
      // Store current cursor position before the keystroke
      if (inputRef.current) {
        cursorPositionRef.current = inputRef.current.selectionStart || 0;
        // For regular characters, cursor will move forward
        if (e.key.length === 1) {
          cursorPositionRef.current += 1;
        }
        // For backspace, cursor moves backward
        if (e.key === 'Backspace' && cursorPositionRef.current > 0) {
          cursorPositionRef.current -= 1;
        }
      }
    }
  }, []);

  // Debounce search query to reduce API calls - require at least 3 characters
  const debouncedSearchQuery = useDebounce(searchQuery, 500, 3);
  
  // Effect to maintain focus during re-renders caused by debouncing
  useEffect(() => {
    if (lastFocusedRef.current && inputRef.current) {
      const input = inputRef.current;
      const shouldRestoreFocus = document.activeElement !== input;
      
      if (shouldRestoreFocus || isTypingRef.current) {
        // Use requestAnimationFrame to ensure DOM updates are complete
        requestAnimationFrame(() => {
          if (inputRef.current && lastFocusedRef.current) {
            inputRef.current.focus();
            
            // Restore cursor position if we were typing, otherwise move to end
            if (isTypingRef.current) {
              inputRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
            } else {
              const length = inputRef.current.value.length;
              inputRef.current.setSelectionRange(length, length);
            }
          }
        });
      }
    }
  }, [debouncedSearchQuery, searchQuery]); // React to both immediate and debounced changes

  // Additional effect to monitor and restore focus if lost during typing
  useEffect(() => {
    if (!lastFocusedRef.current || !inputRef.current) return;
    
    const checkFocus = () => {
      if (isTypingRef.current && document.activeElement !== inputRef.current) {
        // Focus was lost while typing, restore it immediately
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
        }
      }
    };
    
    // Check focus more frequently while typing
    const intervalId = setInterval(checkFocus, 50); // Check every 50ms
    
    return () => clearInterval(intervalId);
  }, [searchQuery]); // Re-run whenever searchQuery changes
  
  // Centralized hooks - these are the ONLY instances that should fetch data
  const listHookData = useJobSearch(debouncedSearchQuery);
  const mapHookData = useJobSearchForMap({ autoFetch: false }); // Only fetch when map is actually viewed
  
  // Determine which loading state to show based on active view
  const loading = activeView === 'list' ? listHookData.loading : mapHookData.loading;
  const loadingState = activeView === 'list' ? listHookData.loadingState : mapHookData.loadingState;
  
  // Extract map-specific variables
  const { totalPages, currentPagesFetched, fetchProgress } = mapHookData;

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
                ref={inputRef}
                placeholder={loading ? "Loading jobs..." : "Search jobs by role..."}
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
                  {activeView === 'map' && loadingState === 'loading' && (
                    totalPages > 0 
                      ? `Loading all jobs for map: ${currentPagesFetched}/${totalPages} pages`
                      : 'Fetching job data for map...'
                  )}
                  {activeView === 'map' && loadingState === 'partial' && 'Processing job locations...'}
                  
                  {/* Fallback */}
                  {!loadingState && (activeView === 'list' ? 'Loading jobs...' : 'Loading map data...')}
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
              searchQuery={debouncedSearchQuery} 
              onPromptLogin={handlePromptLogin}
              onClearSearch={handleClearSearch}
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
