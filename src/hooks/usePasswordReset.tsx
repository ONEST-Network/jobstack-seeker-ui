import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export const usePasswordReset = () => {
  const [searchParams] = useSearchParams();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for reset token in URL parameters
    const token = searchParams.get('token');
    const action = searchParams.get('action');
    
    if (token && action === 'reset-password') {
      setResetToken(token);
      setShowResetDialog(true);
      
      // Clean up URL by removing the reset parameters
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('token');
      newSearchParams.delete('action');
      
      // Update URL without causing a page reload
      const newUrl = `${window.location.pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  const handleResetDialogClose = () => {
    setShowResetDialog(false);
    setResetToken(null);
  };

  const handleResetSuccess = () => {
    setShowResetDialog(false);
    setResetToken(null);
    // Stay on current page after successful reset
    // User can now login with their new password
  };

  return {
    showResetDialog,
    resetToken,
    handleResetDialogClose,
    handleResetSuccess
  };
}; 