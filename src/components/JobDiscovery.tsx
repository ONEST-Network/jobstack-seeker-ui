import React, { useState } from 'react';
import { Map, List, Filter, Search, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import JobMapView from './JobMapView';
import JobListView from './JobListView';
import JobFilters from './JobFilters';
import LoginDialog from './auth/LoginDialog';
import RegistrationDialog from './auth/RegistrationDialog';
import { useJobSearch } from '@/hooks/useJobSearch';

interface JobDiscoveryProps {
  onPromptLogin?: () => void;
}

const JobDiscovery: React.FC<JobDiscoveryProps> = ({ onPromptLogin }) => {
  const [activeView, setActiveView] = useState('list');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const isMobile = useIsMobile();

  // Get loading state from job search hook
  const { loading, loadingState } = useJobSearch();

  const handlePromptLogin = () => {
    if (onPromptLogin) {
      onPromptLogin();
    } else {
      setShowLogin(true);
    }
  };

  const handleSwitchToRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
  };

  const FiltersContent = () => <JobFilters />;

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
                <TabsTrigger value="map" className="flex items-center gap-1 px-2 text-sm">
                  <Map className="h-4 w-4" />
                  <span className="hidden sm:inline">Map</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Filters Toggle */}
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 h-touch px-3 flex-shrink-0"
                  disabled={loading}
                >
                  <Filter className="h-4 w-4" />
                  <span className="text-sm">Filters</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle>Job Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FiltersContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Loading status message */}
          {loading && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>
                  {loadingState === 'initial' && 'Loading jobs...'}
                  {loadingState === 'loading' && 'Refreshing jobs...'}
                  {loadingState === 'partial' && 'Taking longer than expected...'}
                </span>
              </div>
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
            <JobMapView searchQuery={searchQuery} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Login/Register Dialogs */}
      <LoginDialog
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={handleSwitchToRegister}
        defaultRole="individual"
      />
      
      <RegistrationDialog
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        defaultRole="individual"
      />
    </div>
  );
};

export default JobDiscovery;
