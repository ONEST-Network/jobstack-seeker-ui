
import React from 'react';
import Header from '@/components/header/Header';
import ProviderDashboard from '@/components/ProviderDashboard';
import ResetPasswordDialog from '@/components/auth/ResetPasswordDialog';
import { usePasswordReset } from '@/hooks/usePasswordReset';

const Provider = () => {
  const { showResetDialog, resetToken, handleResetDialogClose, handleResetSuccess } = usePasswordReset();

  return (
    <>
      <div className="min-h-screen bg-background">
        <Header />
        <ProviderDashboard />
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

export default Provider;
