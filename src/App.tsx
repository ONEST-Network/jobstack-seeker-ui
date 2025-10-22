
import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { I18nProvider } from "@/hooks/useI18n";
import Jobs from "./pages/Jobs";
import Provider from "./pages/Provider";
import NotFound from "./pages/NotFound";
import EmailVerification from "./pages/EmailVerification";
import SharedJob from "./pages/SharedJob";
import { useSearchParams } from "react-router-dom";
import { apiClient } from "./lib/api";
import { useToast } from "@/hooks/use-toast";
import ResetPasswordDialog from "@/components/auth/ResetPasswordDialog";
import OrgWrapper from "@/components/OrgWrapper";
import Admin from "./pages/Admin";

const queryClient = new QueryClient();

// Component to handle email verification callbacks - now handled by dedicated page
const EmailVerificationHandler = () => {
  return null;
};

// Component to handle password reset routes
const PasswordResetRoute = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { orgSlug } = useParams();
  const { toast } = useToast();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const isValidToken = token && token.length > 0;
    
    if (isValidToken) {
      setResetToken(token);
      setShowResetDialog(true);
      
      // Clean up URL by removing the token parameter
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('token');
      const newUrl = `${window.location.pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    } else {
      toast({
        title: "Invalid Reset Link",
        description: "The password reset link is invalid or has expired.",
        variant: "destructive"
      });
      navigate(`/${orgSlug || '0'}/seeker?tab=discover`);
    }
  }, [searchParams, navigate, toast]);

  const handleResetDialogClose = () => {
    setShowResetDialog(false);
    setResetToken(null);
    navigate(`/${orgSlug || '0'}/seeker?tab=discover`);
  };

  const handleResetSuccess = () => {
    setShowResetDialog(false);
    setResetToken(null);
    toast({
      title: "Password Reset Successful",
      description: "Your password has been updated. You can now sign in with your new password.",
    });
    navigate(`/${orgSlug || '0'}/seeker?tab=discover`);
  };

  return (
    <>
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
// Main app content wrapped with auth context
const AppContent = () => (
  <TooltipProvider>
    <Toaster />
    <BrowserRouter>
      <EmailVerificationHandler />
      <Routes>
        <Route path="/" element={<Navigate to="/0/seeker?tab=discover" replace />} />
        
        {/* Organization-specific routes - must come before provider/job routes */}
        <Route path="/:orgSlug/seeker" element={
          <OrgWrapper>
            <Jobs />
          </OrgWrapper>
        } />
        
        {/* Default routes (when orgSlug is '0' or not provided) */}
        <Route path="/seeker" element={<Navigate to="/0/seeker?tab=discover" replace />} />
        <Route path="/0/seeker" element={
          <OrgWrapper>
            <Jobs />
          </OrgWrapper>
        } />
        
        {/* Other routes */}
        <Route path="/verify/email" element={<EmailVerification />} />
        <Route path="/auth/reset-password" element={<PasswordResetRoute />} />
        
        {/* Provider/job routes - must come after organization routes */}
        <Route path="/:orgSlug/:providerId/:jobId" element={<SharedJob />} />
        
        {/* Provider route */}
        {/* <Route path="/:orgSlug/provider" element={<Provider />} /> */}
        
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
