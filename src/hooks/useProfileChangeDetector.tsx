import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Custom hook to detect profile changes and data updates
 * Returns a change counter that increments whenever the active profile changes or its data is updated
 */
export const useProfileChangeDetector = () => {
  const { user, getSelectedCandidate } = useAuth();
  const [changeCounter, setChangeCounter] = useState(0);
  const previousProfileDataRef = useRef<string | null>(null);
  const isInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    const selectedCandidate = getSelectedCandidate();
    
    // Create a signature of the current profile data
    const currentProfileSignature = selectedCandidate ? JSON.stringify({
      id: selectedCandidate.id,
      name: selectedCandidate.name,
      interestedRole: selectedCandidate.interestedRole,
      age: selectedCandidate.age,
      gender: selectedCandidate.gender,
      currentLocation: selectedCandidate.currentLocation,
      skills: selectedCandidate.skills,
      whoIAm: selectedCandidate.whoIAm,
      whatIHave: selectedCandidate.whatIHave,
      whatIWant: selectedCandidate.whatIWant,
      // Include other relevant fields that would affect search results
      interestedIndustry: selectedCandidate.interestedIndustry,
      workHoursPerDay: selectedCandidate.workHoursPerDay,
      monthlySalary: selectedCandidate.monthlySalary,
      education: selectedCandidate.education,
      experience: selectedCandidate.experience,
      workExperience: selectedCandidate.workExperience,
      skillCertifications: selectedCandidate.skillCertifications
    }) : null;

    // Skip the first initialization to prevent triggering on mount
    if (!isInitializedRef.current) {
      previousProfileDataRef.current = currentProfileSignature;
      isInitializedRef.current = true;
      console.log('🔄 Profile change detector initialized:', {
        profileName: selectedCandidate?.name,
        profileId: selectedCandidate?.id
      });
      return;
    }

    // Check if profile data has actually changed (not just first load)
    if (currentProfileSignature !== previousProfileDataRef.current) {
      console.log('🔄 Profile data change detected:', {
        previousSignature: previousProfileDataRef.current ? 'exists' : 'null',
        currentSignature: currentProfileSignature ? 'exists' : 'null',
        profileName: selectedCandidate?.name,
        profileId: selectedCandidate?.id
      });
      
      previousProfileDataRef.current = currentProfileSignature;
      setChangeCounter(prev => prev + 1);
    }
  }, [
    user?.selectedCandidateId, 
    getSelectedCandidate,
    // Reduce dependency on managedCandidates to only when the array length changes
    // This prevents triggering when individual candidate data changes internally
    user?.managedCandidates?.length
  ]);

  return changeCounter;
};

