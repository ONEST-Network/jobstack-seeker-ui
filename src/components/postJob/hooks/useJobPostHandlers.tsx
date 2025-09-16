
import { validateJobForPublish, publishJob } from '@/utils/draftManager';
import { JobData, JobPostStep as StepType } from '@/types/jobPost';

interface UseJobPostHandlersProps {
  jobData: JobData;
  selectedJobRole: string;
  setJobData: React.Dispatch<React.SetStateAction<JobData>>;
  setStep: React.Dispatch<React.SetStateAction<StepType>>;
  handleSaveDraft: () => void;
  onClose: () => void;
  skipAuthSteps: boolean;
  toast: any;
}

export const useJobPostHandlers = ({
  jobData,
  selectedJobRole,
  setJobData,
  setStep,
  handleSaveDraft,
  onClose,
  skipAuthSteps,
  toast
}: UseJobPostHandlersProps) => {
  const handleRoleSelection = (role: string, industry: string) => {
    setJobData(prev => ({ ...prev, openRole: role, title: role }));
    setStep('whoIAm');
  };

  const handleLogin = () => {
    setStep('orgProfile');
  };

  const handleOrgProfileSubmit = () => {
    setStep('roleSelection');
  };

  const handlePublishJob = () => {
    const validationErrors = validateJobForPublish(jobData);
    
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fix the following errors: ${validationErrors.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    publishJob(jobData);
    toast({
      title: "Job published",
      description: "Your job has been published successfully!",
    });
    onClose();
  };

  const handleJobSubmit = () => {
    handlePublishJob();
  };

  const handleClose = () => {
    if (jobData.companyName || jobData.openRole || jobData.factoryLocation) {
      handleSaveDraft();
    }
    onClose();
  };

  return {
    handleRoleSelection,
    handleLogin,
    handleOrgProfileSubmit,
    handlePublishJob,
    handleJobSubmit,
    handleClose
  };
};
