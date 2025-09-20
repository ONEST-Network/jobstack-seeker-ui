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
  const [retryCount, setRetryCount] = useState(0);
  const [hasCheckedPendingApplication, setHasCheckedPendingApplication] = useState(false);
  const { user, getSelectedCandidate, selectCandidate } = useAuth();
  const { toast } = useToast();

  const handleProfileSelected = (profile: any) => {
    console.log('JobApplicationDialog: handleProfileSelected called with profile:', profile?.name, profile?.id);
    setSelectedProfile(profile);
    setShowProfileSelection(false);
    setShowConsolidatedApplication(true);
    console.log('JobApplicationDialog: State updated - showProfileSelection: false, showConsolidatedApplication: true');
  };
  
  // Reset state when dialog opens to always start with profile selection
  useEffect(() => {
    if (isOpen) {
      console.log('JobApplicationDialog: Dialog opened, resetting to profile selection');
      setShowProfileSelection(true);
      setShowConsolidatedApplication(false);
      setSelectedProfile(null);
      setRetryCount(0);
      setHasCheckedPendingApplication(false);
      
      // If user has a selected candidate and this is a simple apply (not profile creation flow),
      // we can pre-populate but still show profile selection first
      const currentlySelected = getSelectedCandidate();
      if (currentlySelected && !localStorage.getItem('pendingJobApplication')) {
        console.log('JobApplicationDialog: Pre-populating with currently selected profile:', currentlySelected.name);
      }
    }
  }, [isOpen, getSelectedCandidate]);

  // Enhanced: Check for pending job application after profile creation with better detection
  useEffect(() => {
    // ONLY run this if we have a pending application and haven't checked it yet
    // This prevents interference with normal apply flow
    if (isOpen && user && !hasCheckedPendingApplication) {
      const pendingApplication = localStorage.getItem('pendingJobApplication');
      
      if (!pendingApplication) {
        setHasCheckedPendingApplication(true);
        return;
      }
      
      console.log('JobApplicationDialog: Checking pending job application intent - managedCandidates count:', user.managedCandidates?.length || 0);
      console.log('JobApplicationDialog: Current showProfileSelection:', showProfileSelection, 'showConsolidatedApplication:', showConsolidatedApplication);
      console.log('JobApplicationDialog: Found pending application intent:', pendingApplication);
      
      try {
        const applicationIntent = JSON.parse(pendingApplication);
          
          // Check if this matches the current job and the timestamp is recent (within 5 minutes)
          const isRecentIntent = (Date.now() - applicationIntent.timestamp) < 5 * 60 * 1000; // 5 minutes
          const isMatchingJobById = applicationIntent.jobData?.id === job?.id;
          const isMatchingJobByTitle = applicationIntent.jobData?.title === (job?.title || job?.descriptor?.name);
          const isMatchingJob = isMatchingJobById || isMatchingJobByTitle;
          
          console.log('JobApplicationDialog: Intent validation:');
          console.log('  - showAfterReload:', applicationIntent.showApplicationAfterReload);
          console.log('  - isRecent:', isRecentIntent, '(intent timestamp:', new Date(applicationIntent.timestamp).toISOString(), ')');
          console.log('  - isMatchingJobById:', isMatchingJobById);
          console.log('  - isMatchingJobByTitle:', isMatchingJobByTitle);
          console.log('  - isMatchingJob (overall):', isMatchingJob);
          console.log('  - stored jobId:', applicationIntent.jobData?.id);
          console.log('  - current jobId:', job?.id);
          console.log('  - stored job title:', applicationIntent.jobData?.title);
          console.log('  - current job title:', job?.title || job?.descriptor?.name);
          
          if (applicationIntent.showApplicationAfterReload && isRecentIntent && isMatchingJob) {
            // Wait a bit for profiles to load if they're not ready yet
            const candidates = user.managedCandidates || [];
            
            if (candidates.length === 0 && retryCount < 3) {
              console.log('JobApplicationDialog: No profiles loaded yet, retrying in 1 second... (attempt', retryCount + 1, '/ 3)');
              
              // Set a timeout to retry after a short delay (in case profiles are still being fetched)
              setTimeout(() => {
                setRetryCount(prev => prev + 1);
              }, 1000); // Wait 1 second for profiles to load
              
              // Don't clear the intent yet, let it retry when profiles are loaded
              return;
            } else if (candidates.length === 0) {
              console.log('JobApplicationDialog: No profiles found after 3 retries, clearing intent');
              localStorage.removeItem('pendingJobApplication');
              return;
            }
            
            let profileToSelect = null;
            
            // First priority: Use the specific profile ID if provided and exists
            if (applicationIntent.newProfileId) {
              profileToSelect = candidates.find(candidate => 
                candidate.id === applicationIntent.newProfileId
              );
              console.log('JobApplicationDialog: Looking for specific profile ID:', applicationIntent.newProfileId, 'Found:', !!profileToSelect);
            }
            
            // Second priority: Use currently selected candidate if it exists and matches the role
            if (!profileToSelect) {
              const currentlySelected = getSelectedCandidate();
              if (currentlySelected && currentlySelected.interestedRole === applicationIntent.jobData.mappedRole) {
                profileToSelect = currentlySelected;
                console.log('JobApplicationDialog: Using currently selected profile that matches role:', profileToSelect.name);
              }
            }
            
            // Third priority: Find the profile that matches the role created for this job
            if (!profileToSelect) {
              const mappedRole = applicationIntent.jobData.mappedRole;
              profileToSelect = candidates.find(candidate => 
                candidate.interestedRole === mappedRole
              );
              console.log('JobApplicationDialog: Looking for profile with role:', mappedRole, 'Found:', !!profileToSelect);
            }
            
            // Fourth priority: Find the most recently created profile (since API returns newest first)
            if (!profileToSelect && candidates.length > 0) {
              // Since our updated AuthContext now ensures newest profiles are first, use the first one
              profileToSelect = candidates[0];
              console.log('JobApplicationDialog: Using newest profile (first in list):', profileToSelect.name, 'ID:', profileToSelect.id);
            }
            
            if (profileToSelect) {
              console.log('JobApplicationDialog: Profile found for auto-selection:', profileToSelect.id, profileToSelect.name);
              
              // Clear the pending application
              localStorage.removeItem('pendingJobApplication');
              console.log('JobApplicationDialog: Cleared localStorage intent');
              
              // Mark that we've checked and processed the pending application
              setHasCheckedPendingApplication(true);
              
              // Select the profile and automatically proceed to application
              selectCandidate(profileToSelect.id);
              setSelectedProfile(profileToSelect);
              setShowProfileSelection(false);
              setShowConsolidatedApplication(true);
              
              console.log('JobApplicationDialog: Auto-selected profile and opened application modal');
              
              // Show success message to confirm the profile selection and flow
              toast({
                title: "Profile Activated & Ready!",
                description: `Your new profile "${profileToSelect.nickname || profileToSelect.name}" is now active and ready for job applications.`,
                duration: 3000,
              });
            } else {
              console.log('JobApplicationDialog: No suitable profile found for auto-selection');
              // Clear the intent since we can't fulfill it
              localStorage.removeItem('pendingJobApplication');
              setHasCheckedPendingApplication(true);
            }
          } else if (!isRecentIntent) {
            // Clean up old intents
            console.log('JobApplicationDialog: Cleaning up old application intent');
            localStorage.removeItem('pendingJobApplication');
          }
        } catch (error) {
          console.log('JobApplicationDialog: Error parsing application intent:', error);
          // Invalid JSON or other error, clean up
          localStorage.removeItem('pendingJobApplication');
          setHasCheckedPendingApplication(true);
        }
    }
  }, [isOpen, user?.managedCandidates, job?.id, selectCandidate, getSelectedCandidate, toast, retryCount, hasCheckedPendingApplication]);

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
    setHasCheckedPendingApplication(false);
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
