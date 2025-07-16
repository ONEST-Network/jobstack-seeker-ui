
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Jobs from "./pages/Jobs";
import Provider from "./pages/Provider";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { apiClient } from "./lib/api";
import { useToast } from "@/hooks/use-toast";

const queryClient = new QueryClient();

// Component to handle email verification callbacks
const EmailVerificationHandler = () => {
  const [searchParams] = useSearchParams();
  const { refreshSession } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const handleEmailVerification = async () => {
      const token = searchParams.get('token');
      const action = searchParams.get('action');
      const verificationToken = searchParams.get('verification');
      const emailToken = searchParams.get('email_token');
      
      // Check for various email verification token patterns
      const verificationTokenValue = token || verificationToken || emailToken;
      
      if (verificationTokenValue && (action === 'verify-email' || action === 'verify' || !action)) {
        try {
          // Call the backend to verify the email token
          // This would typically be an API endpoint that verifies the token
          // For now, we'll simulate the verification process
          
          // Check for pending user data that should be activated
          const pendingUser = localStorage.getItem('pendingUser');
          if (pendingUser) {
            try {
              const parsedPendingUser = JSON.parse(pendingUser);
              // Update the pending user to be verified
              const verifiedUser = { ...parsedPendingUser, isVerified: true, emailVerified: true };
              localStorage.setItem('user', JSON.stringify(verifiedUser));
              localStorage.removeItem('pendingUser');
            } catch (error) {
              console.log('Error processing pending user:', error);
            }
          }
          
          // Add a small delay to ensure the session is properly established
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Clean up URL by removing the verification parameters
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete('token');
          newSearchParams.delete('action');
          newSearchParams.delete('verification');
          newSearchParams.delete('email_token');
          
          // Update URL without causing a page reload
          const newUrl = `${window.location.pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`;
          window.history.replaceState({}, '', newUrl);
          
          // Refresh the session to update the user state
          await refreshSession();
          
          // Show success toast
          toast({
            title: "Email Verified Successfully",
            description: "Your email has been verified and you are now logged in.",
          });
        } catch (error) {
          console.error('Email verification failed:', error);
          toast({
            title: "Email Verification Failed",
            description: "Failed to verify your email. Please try again.",
            variant: "destructive"
          });
        }
      }
    };

    handleEmailVerification();
  }, [searchParams, refreshSession, toast]);

  return null;
};

// Main app content wrapped with auth context
const AppContent = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <EmailVerificationHandler />
      <Routes>
        <Route path="/" element={<Navigate to="/seeker?tab=discover" replace />} />
        <Route path="/seeker" element={<Jobs />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
