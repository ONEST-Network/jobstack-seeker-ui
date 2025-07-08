
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

const Jobs = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('discover');
  const { showResetDialog, resetToken, handleResetDialogClose, handleResetSuccess } = usePasswordReset();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['discover', 'applications', 'profiles'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  // Render different content based on tab parameter, but without visible tabs
  const renderContent = () => {
    if (!user) {
      return <JobDiscovery />;
    }

    switch (activeTab) {
      case 'applications':
        return (
          <div className="container mx-auto px-4 py-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">My Applications</h1>
              <p className="text-muted-foreground">Track and manage your job applications</p>
            </div>
            <MyApplications />
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
