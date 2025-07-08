
import { UserProfile } from '@/contexts/AuthContext';

export interface ScoreResult {
  trustScore: number;
  matchScore: number;
  trustFactors: string[];
  matchFactors: string[];
}

export const calculateTrustScore = (profile: UserProfile): { score: number; factors: string[] } => {
  let score = 0;
  const factors: string[] = [];

  // Base score for having a profile
  score += 2;

  // Verified name adds 2 points
  if (profile.isNameVerified) {
    score += 2;
    factors.push('Verified name from DigiLocker');
  }

  // Verified age adds 1 point
  if (profile.isAgeVerified) {
    score += 1;
    factors.push('Verified age from documents');
  }

  // Each verified certificate adds 1 point (max 3)
  const verifiedCerts = profile.certificates?.filter(cert => cert.isVerified) || [];
  const certPoints = Math.min(verifiedCerts.length, 3);
  score += certPoints;
  if (certPoints > 0) {
    factors.push(`${verifiedCerts.length} verified certificate(s)`);
  }

  // Having experience adds 1 point
  if (profile.experience && profile.experience.length > 0) {
    score += 1;
    factors.push('Work experience provided');
  }

  // Location verification adds 1 point
  if (profile.currentLocation) {
    score += 1;
    factors.push('Location verified');
  }

  return { score: Math.min(score, 10), factors };
};

export const calculateMatchScore = (profile: UserProfile, jobRequirements?: any): { score: number; factors: string[] } => {
  let score = 0;
  const factors: string[] = [];

  // Base score for having skills
  if (profile.skills && profile.skills.length > 0) {
    score += 2;
    factors.push(`${profile.skills.length} skills listed`);
  }

  // Experience relevance (simplified for demo)
  if (profile.experience && profile.experience.length > 0) {
    score += 3;
    factors.push('Relevant work experience');
  }

  // Assessment scores (mock for now)
  const assessmentResults = profile.certificates?.filter(cert => cert.name.includes('Assessment')) || [];
  if (assessmentResults.length > 0) {
    score += 3;
    factors.push('Completed skill assessments');
  }

  // Location match
  if (profile.desiredLocation && profile.currentLocation) {
    score += 2;
    factors.push('Location preference match');
  }

  return { score: Math.min(score, 10), factors };
};

export const calculateOverallScores = (profile: UserProfile, jobRequirements?: any): ScoreResult => {
  const trustResult = calculateTrustScore(profile);
  const matchResult = calculateMatchScore(profile, jobRequirements);

  return {
    trustScore: trustResult.score,
    matchScore: matchResult.score,
    trustFactors: trustResult.factors,
    matchFactors: matchResult.factors
  };
};
