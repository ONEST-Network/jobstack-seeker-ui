import React, { useState, useEffect } from 'react';
import { JobApplicationData } from '@/hooks/useJobApplication';
import ProfileSelectionModal from './job-application/ProfileSelectionModal';
import ConsolidatedJobApplication from './job-application/ConsolidatedJobApplication';
import { useAuth } from '@/contexts/AuthContext';

interface JobApplicationDialogProps {
  job: any;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (applicationData: JobApplicationData) => Promise<void>;
  onSaveDraft?: (applicationData: JobApplicationData) => Promise<void>;
  applying?: boolean;
  savingDraft?: boolean;
}

const JobApplicationDialog: React.FC<JobApplicationDialogProps> = ({ 
  job, 
  isOpen, 
  onClose, 
  onSubmit,
  onSaveDraft,
  applying = false,
  savingDraft = false
}) => {
  const [showProfileSelection, setShowProfileSelection] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [showConsolidatedApplication, setShowConsolidatedApplication] = useState(false);
  const { user, getSelectedCandidate, selectCandidate } = useAuth();

  const handleProfileSelected = (profile: any) => {
    setSelectedProfile(profile);
    setShowProfileSelection(false);
    setShowConsolidatedApplication(true);
  };
  
  // Check for pending job application after page reload (from profile creation)
  useEffect(() => {
    if (isOpen && user?.managedCandidates && user.managedCandidates.length > 0) {
      const pendingApplication = localStorage.getItem('pendingJobApplication');
      
      if (pendingApplication) {
        try {
          const applicationIntent = JSON.parse(pendingApplication);
          
          // Check if this matches the current job and the timestamp is recent (within 5 minutes)
          const isRecentIntent = (Date.now() - applicationIntent.timestamp) < 5 * 60 * 1000; // 5 minutes
          const isMatchingJob = applicationIntent.jobData?.id === job?.id;
          
          if (applicationIntent.showApplicationAfterReload && isRecentIntent && isMatchingJob) {
            // Find the profile that matches the role created for this job
            const mappedRole = applicationIntent.jobData.mappedRole;
            const newProfile = user.managedCandidates.find(candidate => 
              candidate.interestedRole === mappedRole
            ) || user.managedCandidates[user.managedCandidates.length - 1]; // Fallback to most recent
            
            if (newProfile) {
              // Clear the pending application
              localStorage.removeItem('pendingJobApplication');
              
              // Select the profile and automatically proceed to application
              selectCandidate(newProfile.id);
              setSelectedProfile(newProfile);
              setShowProfileSelection(false);
              setShowConsolidatedApplication(true);
            }
          } else if (!isRecentIntent) {
            // Clean up old intents
            localStorage.removeItem('pendingJobApplication');
          }
        } catch (error) {
          // Invalid JSON or other error, clean up
          localStorage.removeItem('pendingJobApplication');
        }
      }
    }
  }, [isOpen, user?.managedCandidates, job?.id, selectCandidate]);

  const handleApplicationSubmit = async (applicationData: JobApplicationData) => {
    if (onSubmit) {
      await onSubmit(applicationData);
    }
    handleClose();
  };

  const handleSaveDraft = async (applicationData: JobApplicationData) => {
    if (onSaveDraft) {
      await onSaveDraft(applicationData);
    }
    // Don't close the dialog when saving draft, let user continue editing
  };

  const handleClose = () => {
    // Clean up any pending application when dialog is closed
    localStorage.removeItem('pendingJobApplication');
    
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
        onSaveDraft={onSaveDraft ? handleSaveDraft : undefined}
        job={job}
        selectedProfile={selectedProfile}
        applying={applying}
        savingDraft={savingDraft}
      />
    </>
  );
};

export default JobApplicationDialog;
