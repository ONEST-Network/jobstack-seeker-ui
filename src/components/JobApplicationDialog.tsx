import React, { useState } from 'react';
import { JobApplicationData } from '@/hooks/useJobApplication';
import ProfileSelectionModal from './job-application/ProfileSelectionModal';
import ConsolidatedJobApplication from './job-application/ConsolidatedJobApplication';

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
  const [showProfileSelection, setShowProfileSelection] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [showConsolidatedApplication, setShowConsolidatedApplication] = useState(false);

  const handleProfileSelected = (profile: any) => {
    setSelectedProfile(profile);
    setShowProfileSelection(false);
    setShowConsolidatedApplication(true);
  };

  const handleApplicationSubmit = async (applicationData: JobApplicationData) => {
    if (onSubmit) {
      await onSubmit(applicationData);
    }
    handleClose();
  };

  const handleClose = () => {
    setShowProfileSelection(true);
    setShowConsolidatedApplication(false);
    setSelectedProfile(null);
    onClose();
  };

  return (
    <>
      <ProfileSelectionModal
        isOpen={isOpen && showProfileSelection}
        onClose={handleClose}
        onProfileSelected={handleProfileSelected}
        job={job}
      />
      
      <ConsolidatedJobApplication
        isOpen={showConsolidatedApplication}
        onClose={handleClose}
        onSubmit={handleApplicationSubmit}
        job={job}
        selectedProfile={selectedProfile}
        applying={applying}
      />
    </>
  );
};

export default JobApplicationDialog;
