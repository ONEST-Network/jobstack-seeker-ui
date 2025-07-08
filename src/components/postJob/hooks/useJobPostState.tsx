
import { useState, useEffect } from 'react';
import { JobPostStep as StepType, JobData, OrgData } from '@/types/jobPost';
import { getDraftById, saveDraft } from '@/utils/draftManager';
import { useToast } from '@/components/ui/use-toast';

interface UseJobPostStateProps {
  skipAuthSteps?: boolean;
  draftId?: string;
  isOpen: boolean;
}

export const useJobPostState = ({ skipAuthSteps = false, draftId, isOpen }: UseJobPostStateProps) => {
  const [step, setStep] = useState<StepType>(
    skipAuthSteps ? 'roleSelection' : 'login'
  );
  const [selectedJobRole, setSelectedJobRole] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const { toast } = useToast();
  
  const [jobData, setJobData] = useState<JobData>({
    // Metadata
    status: 'draft',
    
    // Who I Am
    companyName: '',
    cin: '',
    gst: '',
    factoryLocation: '',
    openRole: '',
    numberOfOpenings: 0,
    pocName: '',
    pocPhone: '',
    pocEmail: '',
    
    // What I Have
    salaryFrequency: 'monthly',
    advanceMonths: 0,
    advanceFrequency: 'monthly',
    monthlySalary: 0,
    pfDeduction: 0,
    esicDeduction: 0,
    inHandSalary: 0,
    housingFacility: false,
    foodFacility: false,
    regularHoursPerDay: 8,
    overtime: false,
    overtimePay: '1x',
    gradeUpgradation: false,
    factoryTrustScore: 0,
    
    // What I Want
    basicLiteracy: '8th-pass',
    skillProofRequired: false,
    machineControlSpeed: false,
    machineControlCorners: false,
    proofOfIntent: false,
    commitmentMonths: 12,
    
    // Legacy fields for backward compatibility
    title: '',
    location: '',
    jobType: '',
    salary: '',
    payFrequency: '',
    workTimings: '',
    experience: '',
    description: '',
    requirements: [''],
    benefits: [''],
    documentsRequired: [],
    questions: [''],
    positions: 1,
    lastDate: '',
    workDays: ''
  });

  const [orgData, setOrgData] = useState<OrgData>({
    name: '',
    address: '',
    gst: '',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    description: ''
  });

  useEffect(() => {
    if (draftId && isOpen) {
      const draft = getDraftById(draftId);
      if (draft) {
        setJobData(draft);
        setSelectedJobRole(draft.openRole || '');
        setSelectedIndustry('');
        setStep('whoIAm');
        toast({
          title: "Draft loaded",
          description: "Your job draft has been loaded successfully.",
        });
      }
    }
  }, [draftId, isOpen, toast]);

  useEffect(() => {
    if (!isOpen) return;

    const autoSave = () => {
      if (jobData.companyName || jobData.openRole || jobData.factoryLocation) {
        saveDraft(jobData);
      }
    };

    const interval = setInterval(autoSave, 30000);
    return () => clearInterval(interval);
  }, [jobData, isOpen]);

  const handleSaveDraft = () => {
    saveDraft(jobData);
    toast({
      title: "Draft saved",
      description: "Your job draft has been saved successfully.",
    });
  };

  return {
    step,
    setStep,
    selectedJobRole,
    setSelectedJobRole,
    selectedIndustry,
    setSelectedIndustry,
    jobData,
    setJobData,
    orgData,
    setOrgData,
    handleSaveDraft,
    toast
  };
};
