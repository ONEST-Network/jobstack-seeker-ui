
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Jobs from "./pages/Jobs";
import Provider from "./pages/Provider";
import NotFound from "./pages/NotFound";
import EmailVerification from "./pages/EmailVerification";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { apiClient } from "./lib/api";
import { useToast } from "@/hooks/use-toast";

const queryClient = new QueryClient();

// Component to handle email verification callbacks - now handled by dedicated page
const EmailVerificationHandler = () => {
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
        <Route path="/verify/email" element={<EmailVerification />} />
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
