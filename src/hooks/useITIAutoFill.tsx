import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UseITIAutoFillProps {
  profile: any;
  setProfile: (updater: any) => void;
  role?: string;
}

export const useITIAutoFill = ({ profile, setProfile, role }: UseITIAutoFillProps) => {
  const { user } = useAuth();

  useEffect(() => {
    const autoFillITIInstitute = () => {
      // Check if user has organization data and if the role is ITI-related
      if (user?.organizations && user.organizations.length > 0) {
        const itiRoles = ['Generic ITI', 'Mechanic', 'Machine Operator', 'Fitter', 'Electrician'];
        const currentRole = role || profile.interestedRole;
        
        if (currentRole && itiRoles.includes(currentRole)) {
          // Find the best organization to use for ITI institute
          let selectedOrganization = user.organizations[0]; // Default to first
          
          // Prioritize organizations that are likely ITI institutes
          const itiOrganization = user.organizations.find(org => 
            org.name && (
              org.name.toLowerCase().includes('iti') ||
              org.name.toLowerCase().includes('institute') ||
              org.name.toLowerCase().includes('training') ||
              org.name.toLowerCase().includes('technical')
            )
          );
          
          if (itiOrganization) {
            selectedOrganization = itiOrganization;
          }
          
          // Check if ITI institute is not already filled
          if (!profile.whatIHave?.itiInstitute && selectedOrganization.name) {
            setProfile((prev: any) => ({
              ...prev,
              whatIHave: {
                ...prev.whatIHave,
                itiInstitute: selectedOrganization.name
              }
            }));
          }
        }
      }
    };

    // Run auto-fill when role changes or organization data changes
    autoFillITIInstitute();
  }, [role, profile.interestedRole, user?.organizations, profile.whatIHave?.itiInstitute, setProfile]);

  return null; // This hook doesn't return anything, it just handles side effects
};
