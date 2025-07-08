
import React, { useState } from 'react';
import Header from '@/components/header/Header';
import HeroSection from '@/components/HeroSection';
import JobRolesCarousel from '@/components/JobRolesCarousel';
import TopEmployers from '@/components/TopEmployers';
import JobDiscovery from '@/components/JobDiscovery';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import ResetPasswordDialog from '@/components/auth/ResetPasswordDialog';
import { usePasswordReset } from '@/hooks/usePasswordReset';

const Index = () => {
  const [showJobDiscovery, setShowJobDiscovery] = useState(false);
  const { showResetDialog, resetToken, handleResetDialogClose, handleResetSuccess } = usePasswordReset();

  if (showJobDiscovery) {
    return (
      <>
        <div className="min-h-screen bg-background">
          <Header />
          <JobDiscovery />
        </div>

        {/* Password Reset Dialog for Job Discovery view */}
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
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Landing Page Content */}
        <main>
          <HeroSection />
          
          <JobRolesCarousel />
          
          {/* Quick Access to Job Discovery */}
          <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Find Your Perfect Job?
              </h2>
              <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
                Explore thousands of opportunities on our interactive map and list views
              </p>
              <Button 
                onClick={() => setShowJobDiscovery(true)}
                className="bg-white text-primary hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
              >
                Explore Jobs Now
              </Button>
            </div>
          </section>
          
          <TopEmployers />
        </main>
        
        <Footer />
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

export default Index;
