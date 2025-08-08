import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrgDetails } from '@/hooks/useOrgDetails';
import OrgNotFound from './OrgNotFound';
import Header from './header/Header';
import { Loader2 } from 'lucide-react';

interface OrgWrapperProps {
  children: React.ReactNode;
}

const OrgWrapper: React.FC<OrgWrapperProps> = ({ children }) => {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const navigate = useNavigate();
  const { data: orgDetails, isLoading, error } = useOrgDetails(orgSlug || null);

  // If no orgSlug or orgSlug is '0', render with default header
  if (!orgSlug || orgSlug === '0') {
    return (
      <>
        <Header orgSlug={null} />
        {children}
      </>
    );
  }

  // If loading, show loading state with header
  if (isLoading) {
    return (
      <>
        <Header orgSlug={orgSlug} />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-gray-600">Loading organization details...</p>
          </div>
        </div>
      </>
    );
  }

  // If error (including 404), show not found page
  if (error) {
    return <OrgNotFound orgSlug={orgSlug} />;
  }

  // If org details are available, render with org-specific header
  if (orgDetails?.data) {
    return (
      <>
        <Header orgSlug={orgSlug} />
        {children}
      </>
    );
  }

  // Fallback - should not reach here, but just in case
  return (
    <>
      <Header orgSlug={null} />
      {children}
    </>
  );
};

export default OrgWrapper;
