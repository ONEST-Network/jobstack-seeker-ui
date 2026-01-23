// Profile status type for soft delete functionality
export type ProfileStatus = 'active' | 'archived';

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate?: string; // Month & Year format YYYY-MM
  endDate?: string; // Month & Year format YYYY-MM
  startYear: number; // Keep for backward compatibility
  endYear?: number; // Keep for backward compatibility
  percentage?: number;
  grade?: string;
  isVerified: boolean;
  certificateUrl?: string;
  qrCodeData?: string;
}

export interface SkillCertification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  isVerified: boolean;
  certificateUrl?: string;
  qrCodeData?: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate?: string;
  description: string;
  isVerified: boolean;
  certificateUrl?: string;
  qrCodeData?: string;
}
