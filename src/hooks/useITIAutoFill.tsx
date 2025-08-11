import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'react-router-dom';
import { useOrgDetails } from '@/hooks/useOrgDetails';

interface UseITIAutoFillProps {
  profile: any;
  setProfile: (updater: any) => void;
  role?: string;
}

export const useITIAutoFill = ({ profile, setProfile, role }: UseITIAutoFillProps) => {
  const { user } = useAuth();
  const { orgSlug } = useParams<{ orgSlug?: string }>();
  const { data: orgDetails } = useOrgDetails(orgSlug || null);

  useEffect(() => {
    // Disable auto-fill functionality
    // Users should manually select their ITI institute from the dropdown
    // This hook is kept for future use if auto-fill is needed again
    return;
  }, [
    role, 
    profile.interestedRole, 
    profile.whatIHave,
    user?.organizations, 
    setProfile, 
    orgSlug, 
    orgDetails?.data?.name,
    orgDetails?.data?.slug
  ]);

  return null; // This hook doesn't return anything, it just handles side effects
};
