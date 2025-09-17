import React, { useState, useEffect } from 'react';
import { JobApplicationData } from '@/hooks/useJobApplication';
import ProfileSelectionModal from './job-application/ProfileSelectionModal';
import ConsolidatedJobApplication from './job-application/ConsolidatedJobApplication';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const handleProfileSelected = (profile: any) => {
    setSelectedProfile(profile);
    setShowProfileSelection(false);
    setShowConsolidatedApplication(true);
  };
  
  // Reset state when dialog opens to always start with profile selection
  useEffect(() => {
    if (isOpen) {
      setShowProfileSelection(true);
      setShowConsolidatedApplication(false);
      setSelectedProfile(null);
    }
  }, [isOpen]);

  // Fallback: Check for pending job application after profile creation (in case of unexpected page reload)
  useEffect(() => {
    if (isOpen && user?.managedCandidates && user.managedCandidates.length > 0) {
      console.log('JobApplicationDialog: Checking for pending job application intent');
      const pendingApplication = localStorage.getItem('pendingJobApplication');
      
      if (pendingApplication) {
        console.log('JobApplicationDialog: Found pending application intent:', pendingApplication);
        try {
          const applicationIntent = JSON.parse(pendingApplication);
          
          // Check if this matches the current job and the timestamp is recent (within 5 minutes)
          const isRecentIntent = (Date.now() - applicationIntent.timestamp) < 5 * 60 * 1000; // 5 minutes
          const isMatchingJob = applicationIntent.jobData?.id === job?.id;
          
          console.log('JobApplicationDialog: Intent validation - showAfterReload:', applicationIntent.showApplicationAfterReload, 'isRecent:', isRecentIntent, 'isMatchingJob:', isMatchingJob, 'jobId:', job?.id);
          
          if (applicationIntent.showApplicationAfterReload && isRecentIntent && isMatchingJob) {
            let profileToSelect = null;
            
            // First try to use the specific profile ID if provided
            if (applicationIntent.newProfileId) {
              profileToSelect = user.managedCandidates.find(candidate => 
                candidate.id === applicationIntent.newProfileId
              );
            }
            
            // Fallback: Find the profile that matches the role created for this job
            if (!profileToSelect) {
              const mappedRole = applicationIntent.jobData.mappedRole;
              profileToSelect = user.managedCandidates.find(candidate => 
                candidate.interestedRole === mappedRole
              );
            }
            
            // Last fallback: Most recently created profile
            if (!profileToSelect) {
              profileToSelect = user.managedCandidates.reduce((newest, candidate) => {
                const candidateTime = new Date(candidate.createdAt).getTime();
                const newestTime = new Date(newest.createdAt).getTime();
                return candidateTime > newestTime ? candidate : newest;
              });
            }
            
            if (profileToSelect) {
              console.log('JobApplicationDialog: Profile found for auto-selection:', profileToSelect.id, profileToSelect.name);
              
              // Clear the pending application
              localStorage.removeItem('pendingJobApplication');
              console.log('JobApplicationDialog: Cleared localStorage intent');
              
              // Select the profile and automatically proceed to application
              selectCandidate(profileToSelect.id);
              setSelectedProfile(profileToSelect);
              setShowProfileSelection(false);
              setShowConsolidatedApplication(true);
              
              console.log('JobApplicationDialog: Auto-selected profile and opened application modal');
              
              // Show success message to confirm the profile selection
              toast({
                title: "Ready to Apply!",
                description: `Using profile: ${profileToSelect.nickname || profileToSelect.name}`,
              });
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
    // Clean up any pending application intent when dialog is closed
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
