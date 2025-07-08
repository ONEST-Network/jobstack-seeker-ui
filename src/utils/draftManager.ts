
import { JobData } from '@/types/jobPost';

const DRAFT_STORAGE_KEY = 'job_drafts';

export interface DraftSummary {
  id: string;
  title: string;
  companyName: string;
  openRole: string;
  status: 'draft' | 'published' | 'archived';
  lastSavedAt: string;
  createdAt: string;
}

export const generateJobId = (): string => {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const saveDraft = (jobData: JobData): void => {
  const now = new Date().toISOString();
  
  if (!jobData.id) {
    jobData.id = generateJobId();
    jobData.createdAt = now;
  }
  
  jobData.updatedAt = now;
  jobData.lastSavedAt = now;
  
  const drafts = getDrafts();
  const existingIndex = drafts.findIndex(draft => draft.id === jobData.id);
  
  if (existingIndex >= 0) {
    drafts[existingIndex] = jobData;
  } else {
    drafts.push(jobData);
  }
  
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
  console.log('Draft saved:', jobData.id);
};

export const getDrafts = (): JobData[] => {
  try {
    const drafts = localStorage.getItem(DRAFT_STORAGE_KEY);
    return drafts ? JSON.parse(drafts) : [];
  } catch (error) {
    console.error('Error loading drafts:', error);
    return [];
  }
};

export const getDraftById = (id: string): JobData | null => {
  const drafts = getDrafts();
  return drafts.find(draft => draft.id === id) || null;
};

export const deleteDraft = (id: string): void => {
  const drafts = getDrafts();
  const filteredDrafts = drafts.filter(draft => draft.id !== id);
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(filteredDrafts));
  console.log('Draft deleted:', id);
};

export const getDraftSummaries = (): DraftSummary[] => {
  const drafts = getDrafts();
  return drafts.map(draft => ({
    id: draft.id!,
    title: draft.title || draft.openRole || 'Untitled Job',
    companyName: draft.companyName || 'Unknown Company',
    openRole: draft.openRole || 'Unknown Role',
    status: draft.status,
    lastSavedAt: draft.lastSavedAt || draft.createdAt || new Date().toISOString(),
    createdAt: draft.createdAt || new Date().toISOString()
  }));
};

export const publishJob = (jobData: JobData): void => {
  const now = new Date().toISOString();
  jobData.status = 'published';
  jobData.publishedAt = now;
  jobData.updatedAt = now;
  
  saveDraft(jobData);
  console.log('Job published:', jobData.id);
};

export const validateJobForPublish = (jobData: JobData): string[] => {
  const errors: string[] = [];
  
  // Required fields validation
  if (!jobData.companyName) errors.push('Company name is required');
  if (!jobData.factoryLocation) errors.push('Factory location is required');
  if (!jobData.openRole) errors.push('Open role is required');
  if (!jobData.numberOfOpenings || jobData.numberOfOpenings <= 0) errors.push('Number of openings must be greater than 0');
  if (!jobData.pocName) errors.push('Point of contact name is required');
  if (!jobData.pocPhone) errors.push('Point of contact phone is required');
  if (!jobData.pocEmail) errors.push('Point of contact email is required');
  if (!jobData.monthlySalary || jobData.monthlySalary <= 0) errors.push('Monthly salary must be greater than 0');
  if (!jobData.basicLiteracy) errors.push('Basic literacy requirement is required');
  if (!jobData.commitmentMonths || jobData.commitmentMonths <= 0) errors.push('Commitment period is required');
  
  return errors;
};
