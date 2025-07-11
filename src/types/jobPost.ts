
export type JobPostStep = 'login' | 'orgProfile' | 'roleSelection' | 'whoIAm' | 'whatIHave' | 'whatIWant';

export interface JobData {
  // Metadata
  id?: string;
  status: 'draft' | 'published' | 'archived';
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  lastSavedAt?: string;
  
  // Who I Am
  companyName: string;
  cin: string;
  gst: string;
  factoryLocation: string;
  openRole: string;
  numberOfOpenings: number;
  pocName: string;
  pocPhone: string;
  pocEmail: string;
  
  // What I Have
  salaryFrequency: 'weekly' | 'monthly';
  advanceMonths: number;
  advanceFrequency: 'monthly' | 'quarterly' | 'half-yearly';
  monthlySalary: number;
  pfDeduction: number;
  esicDeduction: number;
  inHandSalary: number; // computed
  housingFacility: boolean;
  housingType?: 'dormitory' | 'shared-room' | 'individual-room';
  foodFacility: boolean;
  foodType?: 'meals-provided' | 'subsidized-canteen' | 'food-allowance';
  regularHoursPerDay: number;
  overtime: boolean;
  overtimePay: '1x' | '1.5x' | '2x';
  gradeUpgradation: boolean;
  factoryTrustScore: number; // computed
  factoryWalkthroughVideo?: File | string;
  workerTestimonialVideo?: File | string;
  
  // What I Want
  basicLiteracy: '8th-pass' | '10th-pass' | '12th-pass' | 'graduate';
  skillProofRequired: boolean;
  machineControlSpeed: boolean;
  machineControlCorners: boolean;
  proofOfIntent: boolean;
  commitmentMonths: number;
  
  // Legacy fields for backward compatibility
  title: string;
  location: string;
  jobType: string;
  salary: string;
  payFrequency: string;
  workTimings: string;
  experience: string;
  description: string;
  requirements: string[];
  benefits: string[];
  documentsRequired: string[];
  questions: string[];
  positions: number;
  lastDate: string;
  workDays: string;
}

export interface OrgData {
  name: string;
  address: string;
  gst: string;
  contactPerson: string;
  email: string;
  phone: string;
  website: string;
  description: string;
}

export interface PostJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  skipAuthSteps?: boolean;
  draftId?: string;
}
