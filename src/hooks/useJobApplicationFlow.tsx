
import { useState, useEffect } from 'react';
import { useAuth, UserProfile } from '@/contexts/AuthContext';
import { calculateOverallScores, ScoreResult } from '@/utils/scoreCalculation';

export const useJobApplicationFlow = (job: any) => {
  const { user, getSelectedCandidate } = useAuth();
  const selectedCandidate = getSelectedCandidate();
  const [step, setStep] = useState<'consent' | 'scoreCheck' | 'otpVerification' | 'application'>('application');
  const [isRecording, setIsRecording] = useState(false);
  const [scores, setScores] = useState<ScoreResult>({ trustScore: 0, matchScore: 0, trustFactors: [], matchFactors: [] });
  const [showScoreImprovement, setShowScoreImprovement] = useState(false);
  const [showCandidateDialog, setShowCandidateDialog] = useState(false);

  const isUserProfile = (profile: any): profile is UserProfile => {
    return profile && user?.role === 'individual';
  };

  const getProfileForScoring = () => {
    if (user?.profile && isUserProfile(user.profile)) {
      return user.profile;
    }
    
    if (selectedCandidate) {
      return {
        name: selectedCandidate.name,
        age: selectedCandidate.age,
        isNameVerified: selectedCandidate.isNameVerified,
        isAgeVerified: selectedCandidate.isAgeVerified,
        currentLocation: selectedCandidate.currentLocation,
        desiredLocation: selectedCandidate.desiredLocation,
        interestedRole: selectedCandidate.interestedRole,
        interestedIndustry: selectedCandidate.interestedIndustry,
        experience: selectedCandidate.experience,
        skills: selectedCandidate.skills,
        certificates: selectedCandidate.certificates,
        assessmentScores: selectedCandidate.assessmentScores,
        documentVerificationStatus: selectedCandidate.documentVerificationStatus
      } as UserProfile;
    }
    
    return null;
  };

  useEffect(() => {
    if (step === 'scoreCheck' && user?.role === 'individual') {
      const profileForScoring = getProfileForScoring();
      if (profileForScoring) {
        const calculatedScores = calculateOverallScores(profileForScoring, job);
        setScores(calculatedScores);
        
        if (calculatedScores.trustScore < 8 || calculatedScores.matchScore < 8) {
          setShowScoreImprovement(true);
        } else {
          if (selectedCandidate) {
            setStep('otpVerification');
          } else {
            setStep('application');
          }
        }
      } else {
        setStep('application');
      }
    } else if (step === 'scoreCheck') {
      setStep('application');
    }
  }, [step, job, selectedCandidate, user]);

  return {
    step,
    setStep,
    isRecording,
    setIsRecording,
    scores,
    setScores,
    showScoreImprovement,
    setShowScoreImprovement,
    showCandidateDialog,
    setShowCandidateDialog,
    getProfileForScoring
  };
};
