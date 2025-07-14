
import React, { useState, useEffect } from 'react';
import Header from '@/components/header/Header';
import JobDiscovery from '@/components/JobDiscovery';
import MyApplications from '@/components/MyApplications';
import CandidateManagement from '@/components/candidates/CandidateManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import ResetPasswordDialog from '@/components/auth/ResetPasswordDialog';
import { usePasswordReset } from '@/hooks/usePasswordReset';
import { useIsMobile } from '@/hooks/use-mobile';

const Jobs = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('discover');
  const [refreshKey, setRefreshKey] = useState(0);
  const { showResetDialog, resetToken, handleResetDialogClose, handleResetSuccess } = usePasswordReset();
  const isMobile = useIsMobile();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['discover', 'applications', 'profiles'].includes(tab)) {
      setActiveTab(tab);
      // Force refresh when applications tab is accessed
      if (tab === 'applications') {
        setRefreshKey(prev => prev + 1);
      }
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
    // Force refresh when switching to applications tab
    if (value === 'applications') {
      setRefreshKey(prev => prev + 1);
    }
  };

  // Render different content based on tab parameter, but without visible tabs
  const renderContent = () => {
    if (!user) {
      return <JobDiscovery />;
    }

    switch (activeTab) {
      case 'applications':
        return (
          <div className={`${isMobile ? 'px-4 py-4' : 'container mx-auto px-4 py-6'}`}>
            <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
              <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>My Applications</h1>
              <p className={`${isMobile ? 'text-sm' : 'text-base'} text-muted-foreground`}>Track and manage your job applications</p>
            </div>
            <MyApplications key={refreshKey} />
          </div>
        );
      case 'profiles':
        return <CandidateManagement />;
      default:
        return <JobDiscovery />;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <Header />
        {renderContent()}
      </div>

      {/* Password Reset Dialog */}
      {showResetDialog && resetToken && (
        <ResetPasswordDialog
          isOpen={showResetDialog}
          onClose={handleResetDialogClose}
          onSuccess={handleResetSuccess}
          token={resetToken}
        />
      )}
    </>
  );
};

export default Jobs;
