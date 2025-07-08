import React from 'react';
import { JobApplicationData } from '@/hooks/useJobApplication';
import CandidateProfileApplication from './job-application/CandidateProfileApplication';

interface JobApplicationDialogProps {
  job: any;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (applicationData: JobApplicationData) => Promise<void>;
  applying?: boolean;
}

const JobApplicationDialog: React.FC<JobApplicationDialogProps> = ({ 
  job, 
  isOpen, 
  onClose, 
  onSubmit,
  applying = false 
}) => {





  // Show the candidate profile application directly
  return (
    <CandidateProfileApplication
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit || (async () => onClose())}
      job={job}
      applying={applying}
    />
  );
};

export default JobApplicationDialog;
