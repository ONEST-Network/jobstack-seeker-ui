
import React from 'react';
import { useAuth, CandidateProfile } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useJobApplication, JobApplicationData } from '@/hooks/useJobApplication';

import UserProfileDialog from '@/components/profile/UserProfileDialog';
import { apiClient, ProfilesResponse, transformProfileForAPI } from '@/lib/api';

interface CandidateProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  candidateId?: string;
  isUpdate?: boolean;
  profileId?: string;
  preSelectedRole?: string;
  onProfileCreated?: (profile: CandidateProfile) => void; // Callback when profile is successfully created
  preventReload?: boolean; // Prevent page reload after profile creation (for apply now flow)
  applyFlow?: boolean; // Indicates we're in the apply now flow (affects UI and automatic job application)
  jobForApplication?: any; // Job details for automatic application after profile creation
  forceBackendSync?: boolean; // Force backend profile creation even when not in apply flow
}

const CandidateProfileDialog: React.FC<CandidateProfileDialogProps> = ({
  isOpen,
  onClose,
  mode,
  candidateId,
  isUpdate,
  profileId,
  preSelectedRole,
  onProfileCreated,
  preventReload = false,
  applyFlow = false,
  jobForApplication,
  forceBackendSync = false
}) => {
  
  // DEBUG: Log component props on every render
  console.log('🚀 CandidateProfileDialog: Component rendered with props:', {
    isOpen,
    mode,
    applyFlow,
    'jobForApplication exists': !!jobForApplication,
    'jobForApplication.id': jobForApplication?.id,
    preventReload,
    isUpdate,
    'Component will handle apply flow?': !!(applyFlow && jobForApplication)
  });
  const { user, addCandidate, updateCandidate, getSelectedCandidate, refreshProfileData, selectCandidate } = useAuth();
  const { toast } = useToast();
  const { applyToJob } = useJobApplication();


  const existingCandidate = candidateId 
    ? user?.managedCandidates.find(c => c.id === candidateId)
    : mode === 'edit' ? getSelectedCandidate() : null;

  // Helper function to convert profile data to job application data
  const convertProfileToApplicationData = (profile: CandidateProfile): JobApplicationData => {
    console.log('🔄 CandidateProfileDialog: convertProfileToApplicationData called with profile:', {
      'profile.id': profile.id,
      'profile.name': profile.name,
      'profile.phone': profile.phone,
      'profile.whoIAm?.phone': profile.whoIAm?.phone,
      'profile.currentLocation': profile.currentLocation,
      'user?.phone': user?.phone
    });
    
    // Extract location data from profile
    const locationData = profile.whoIAm?.locationData || {};
    
    // Extract phone number from multiple possible sources
    const phoneNumber = profile.whoIAm?.phone || 
                       user?.phone || 
                       profile.phone || 
                       ''; // Leave empty if not found - validation will catch this
    
    console.log('🔄 CandidateProfileDialog: convertProfileToApplicationData phone extraction:', {
      'profile.whoIAm?.phone': profile.whoIAm?.phone,
      'user?.phone': user?.phone,
      'profile.phone': profile.phone,
      'finalPhoneNumber': phoneNumber
    });
    
    const applicationData = {
      name: profile.name,
      age: profile.age?.toString() || '',
      gender: profile.whoIAm?.gender || '',
      phone: phoneNumber,
      email: user?.email || '',
      location: {
        lat: locationData.lat || 0,
        lng: locationData.lng || 0,
        address: locationData.address || profile.currentLocation || '',
        city: locationData.city || '',
        state: locationData.state || '',
        country: locationData.country || 'India'
      },
      profileData: {
        whoIAm: profile.whoIAm,
        whatIHave: profile.whatIHave,
        whatIWant: profile.whatIWant
      },
      profileId: profile.id
    };
    
    console.log('🔄 CandidateProfileDialog: Final application data created:', {
      'applicationData.profileId': applicationData.profileId,
      'applicationData.name': applicationData.name,
      'applicationData.phone': applicationData.phone,
      'applicationData.location.address': applicationData.location.address,
      'CRITICAL CHECK: profileId matches input profile.id?': applicationData.profileId === profile.id,
      'profileId length (should be >20 for UUID)': applicationData.profileId?.length,
      'profileId is numeric (bad if true)': !!applicationData.profileId?.match(/^\d+$/),
    });
    
    // CRITICAL VALIDATION: Ensure we have a valid profile ID
    if (!applicationData.profileId) {
      console.error('🚨 CandidateProfileDialog: CRITICAL ERROR - Missing profileId in application data!');
      throw new Error('Profile ID is required for application submission');
    }
    
    // CRITICAL VALIDATION: Ensure we're not using timestamp-based IDs
    if (applicationData.profileId.length < 20 || applicationData.profileId.match(/^\d+$/)) {
      console.error('🚨 CandidateProfileDialog: CRITICAL ERROR - Using timestamp-based profile ID in application data!', {
        'profileId': applicationData.profileId,
        'length': applicationData.profileId.length,
        'isNumeric': !!applicationData.profileId.match(/^\d+$/),
        'originalProfile.id': profile.id
      });
      throw new Error('Cannot use timestamp-based profile ID for application submission');
    }
    
    console.log('✅ CandidateProfileDialog: Application data validation passed - valid backend UUID detected');
    
    // Additional validation for other critical fields
    if (!applicationData.name) {
      console.error('🚨 CandidateProfileDialog: CRITICAL ERROR - Missing name in application data!');
    }
    if (!applicationData.phone) {
      console.error('🚨 CandidateProfileDialog: CRITICAL ERROR - Missing phone in application data!');
    }
    
    console.log('CandidateProfileDialog: Application data validation check:', {
      hasProfileId: !!applicationData.profileId,
      hasName: !!applicationData.name,
      hasPhone: !!applicationData.phone,
      hasEmail: !!applicationData.email,
      profileId: applicationData.profileId
    });
    
    return applicationData;
  };

  const handleProfileComplete = async (profileData: Record<string, unknown>) => {
    console.log('🔄 CandidateProfileDialog: handleProfileComplete called', {
      'mode': mode,
      'preventReload': preventReload,
      'applyFlow': applyFlow,
      'jobForApplication exists': !!jobForApplication,
      'profileData.id': (profileData as any).id,
      'profileData.id length': ((profileData as any).id)?.length,
      'profileData.id is timestamp': ((profileData as any).id)?.match(/^\d+$/),
      'Called from': 'UserProfileDialog delegation'
    });
    console.log('CandidateProfileDialog: Received profileData:', JSON.stringify(profileData, null, 2));
    
    // Validate that we have the minimum required data before creating a profile
    // The profileData is already flattened by UserProfileDialog, so check flat fields
    
    // Extract phone from multiple possible sources
    const whoIAmData = profileData.whoIAm as Record<string, any> || {};
    const phoneNumber = profileData.phone?.toString()?.trim() || 
                       whoIAmData.phone?.toString()?.trim() || 
                       user?.phone?.toString()?.trim() || 
                       '';
    
    // Check each required field and collect validation errors
    const validationErrors: string[] = [];
    
    // Check flat fields (already extracted from nested structure by UserProfileDialog)
    if (!profileData.name?.toString()?.trim()) {
      validationErrors.push("Full name");
    }
    
    if (!profileData.interestedRole?.toString()?.trim()) {
      validationErrors.push("Job role");
    }
    
    if (!phoneNumber) {
      validationErrors.push("Phone number");
    }
    
    // FIX: Check BOTH currentLocation AND whoIAm.location for location data
    const locationValue = profileData.currentLocation?.toString()?.trim() || 
                         whoIAmData.location?.toString()?.trim() || '';
    
    if (!locationValue) {
      validationErrors.push("Location");
    }
    
    console.log('CandidateProfileDialog: Validation check results:', {
      name: profileData.name,
      interestedRole: profileData.interestedRole,
      phone: phoneNumber,
      currentLocation: profileData.currentLocation,
      'whoIAm.location': whoIAmData.location,
      'finalLocationValue': locationValue,
      validationErrors
    });
    
    // If there are validation errors, show them and stop
    if (validationErrors.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please complete the following fields: ${validationErrors.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    const candidateData: Omit<CandidateProfile, 'id' | 'createdAt'> = {
      name: (profileData.name as string) || 'New Profile',
      age: profileData.age as number,
      phone: phoneNumber, // Add phone field explicitly
      isNameVerified: (profileData.isNameVerified as boolean) || false,
      isAgeVerified: (profileData.isAgeVerified as boolean) || false,
      currentLocation: locationValue, // Use validated location that checks both sources
      desiredLocation: (profileData.desiredLocation as string) || '',
      interestedRole: profileData.interestedRole as string,
      interestedIndustry: profileData.interestedIndustry as string,
      experience: (Array.isArray(profileData.experience) ? profileData.experience : []) as CandidateProfile['experience'],
      skills: (profileData.skills as string[]) || [],
      certificates: (Array.isArray(profileData.certificates) ? profileData.certificates : []) as CandidateProfile['certificates'],
      assessmentScores: (Array.isArray(profileData.assessmentScores) ? profileData.assessmentScores : []) as CandidateProfile['assessmentScores'],
      documentVerificationStatus: (Array.isArray(profileData.documentVerificationStatus) ? profileData.documentVerificationStatus : []) as CandidateProfile['documentVerificationStatus'],
      isActive: true,
      nickname: (profileData.nickname as string) || `${(profileData.interestedRole as string) || 'Profile'} - ${new Date().toLocaleDateString()}`,
      // Unified schema data - ensure phone is included in whoIAm
      whoIAm: {
        ...(profileData.whoIAm as Record<string, unknown> || {}),
        phone: phoneNumber // Ensure phone is available in whoIAm section
      },
      whatIHave: profileData.whatIHave as Record<string, unknown>,
      whatIWant: profileData.whatIWant as Record<string, unknown>,
      // Verification status
      isGenderVerified: (profileData.isGenderVerified as boolean) || false,
      isAadharVerified: (profileData.isAadharVerified as boolean) || false,
      isHometownVerified: (profileData.isHometownVerified as boolean) || false,
      // Education and certifications
      education: (Array.isArray(profileData.education) ? profileData.education : []) as CandidateProfile['education'],
      skillCertifications: (Array.isArray(profileData.skillCertifications) ? profileData.skillCertifications : []) as CandidateProfile['skillCertifications'],
      workExperience: (Array.isArray(profileData.workExperience) ? profileData.workExperience : []) as CandidateProfile['workExperience'],
    };

    console.log('CandidateProfileDialog: Final candidateData to be saved:', {
      name: candidateData.name,
      phone: candidateData.phone,
      interestedRole: candidateData.interestedRole,
      currentLocation: candidateData.currentLocation,
      whoIAmPhone: candidateData.whoIAm?.phone
    });

    if (mode === 'add') {
      console.log('🔄 CandidateProfileDialog: Creating new profile - checking apply flow conditions:', {
        'mode': mode,
        'applyFlow': applyFlow,
        'applyFlow type': typeof applyFlow,
        'jobForApplication exists': !!jobForApplication,
        'Will take backend path?': !!(applyFlow && jobForApplication)
      });
      
      // In apply flow, we need to save to backend as well as local state
      let newProfile: CandidateProfile | null = null;
      
      console.log('🔄 CandidateProfileDialog: About to check if (applyFlow) condition:', {
        'applyFlow value': applyFlow,
        'applyFlow type': typeof applyFlow,
        'applyFlow === true': applyFlow === true,
        'if (applyFlow) will be': !!applyFlow
      });
      
      // Create profile on backend when in apply flow OR when forced via forceBackendSync
      // This ensures proper UUID and activation for all profile creation methods
      if (applyFlow || forceBackendSync) {
        console.log('✅ CandidateProfileDialog: BACKEND PATH TAKEN - backend sync enabled!');
        console.log('🎯 CandidateProfileDialog: ENTERING BACKEND PROFILE CREATION PATH!');
        console.log('🔍 CandidateProfileDialog: Sync reason:', {
          applyFlow,
          forceBackendSync,
          reason: applyFlow ? 'Apply flow active' : forceBackendSync ? 'Forced backend sync' : 'Unknown'
        });
        console.log('✅ CandidateProfileDialog: Will create backend profile FIRST to get proper UUID');
        console.log('🚨 CandidateProfileDialog: IMPORTANT - Will ignore any timestamp ID from UserProfileDialog and use backend ID only');
        
        try {
          // Use the same transformProfileForAPI function that UserProfileDialog uses to ensure consistency
          const timestamp = Date.now();
          const locationTag = `home${timestamp}`;
          const contactTag = `personal${timestamp}`;
          
          // Transform using the standard function (this returns type: "personal")
          const apiPayload = transformProfileForAPI(candidateData, user?.email, locationTag, contactTag);
          
          console.log('🚀 CandidateProfileDialog: Sending profile to backend with payload:', JSON.stringify(apiPayload, null, 2));
          
          let backendResponse;
          try {
            backendResponse = await Promise.race([
              apiClient.createProfile(apiPayload),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Backend profile creation timeout')), 10000)
              )
            ]);
            console.log('✅ CandidateProfileDialog: Backend API call completed successfully!');
            console.log('🔍 CandidateProfileDialog: Raw backend response:', JSON.stringify(backendResponse, null, 2));
          } catch (apiError) {
            console.error('🚨 CandidateProfileDialog: Backend API call failed:', apiError);
            console.error('🚨 CandidateProfileDialog: API Error details:', {
              'error message': apiError instanceof Error ? apiError.message : 'Unknown error',
              'error type': typeof apiError,
              'error object': apiError
            });
            throw apiError; // Re-throw to trigger the catch block below
          }
          
          // Create the candidate profile and add to local context with backend ID if available
          const backendData = backendResponse as { 
            statusCode?: number;
            message?: string;
            data?: { 
              id?: string;
              profileId?: string;
              locationId?: string;
              contactId?: string;
            } 
          };
          
          // Try both possible ID field names based on API response format
      const backendProfileId = backendData?.data?.profileId || backendData?.data?.id;
      
      console.log('🔍 CandidateProfileDialog: Backend response analysis:', {
        'statusCode': backendData?.statusCode,
        'message': backendData?.message,
        'data exists': !!backendData?.data,
        'data.profileId': backendData?.data?.profileId,
        'data.id': backendData?.data?.id,
        'data.locationId': backendData?.data?.locationId,
        'data.contactId': backendData?.data?.contactId,
        'extracted backendProfileId': backendProfileId,
        'backendProfileId type': typeof backendProfileId,
        'backendProfileId length': backendProfileId?.length,
        'backendProfileId is UUID format': backendProfileId && backendProfileId.length > 20 && !backendProfileId.match(/^\d+$/),
        'raw data object': backendData?.data
      });
          
          // CRITICAL FIX: Ensure we have a valid backend profile ID before proceeding
          if (!backendProfileId) {
            throw new Error('Backend profile creation failed - no profile ID returned. Cannot proceed with application submission.');
          }
          
          console.log('🎯 CandidateProfileDialog: ✅ Valid backend profile ID received:', backendProfileId);
          
          // VERIFICATION: Ensure backend ID is a proper UUID format
          if (backendProfileId.length < 20 || backendProfileId.match(/^\d+$/)) {
            console.error('🚨 CandidateProfileDialog: CRITICAL ERROR - Backend returned invalid ID format:', {
              'backendProfileId': backendProfileId,
              'length': backendProfileId.length,
              'isNumeric': !!backendProfileId.match(/^\d+$/)
            });
            throw new Error('Backend returned invalid profile ID format - cannot proceed with application submission');
          }
          
      // CRITICAL: Create profile data using backend ID, explicitly ignoring any ID from UserProfileDialog
      const candidateWithBackendId = {
        ...candidateData,
        id: backendProfileId // Use ONLY backend ID - this overwrites any timestamp ID from profileData
      };
      
      console.log('🎯 CandidateProfileDialog: Profile creation - ID source verification:', {
        'candidateData has no ID (correct)': !('id' in candidateData),
        'backendProfileId (will be used)': backendProfileId,
        'candidateWithBackendId.id': candidateWithBackendId.id,
        'Successfully used backend UUID': candidateWithBackendId.id === backendProfileId,
        'ID is valid UUID format': candidateWithBackendId.id && candidateWithBackendId.id.length > 20 && !candidateWithBackendId.id.match(/^\d+$/)
      });
      
      console.log('🚀 CandidateProfileDialog: About to call addCandidate with backend UUID:', candidateWithBackendId.id);
      console.log('🔍 CandidateProfileDialog: Complete candidateWithBackendId object:', JSON.stringify(candidateWithBackendId, null, 2));
      
      newProfile = addCandidate(candidateWithBackendId, true);
      
      console.log('✅ CandidateProfileDialog: addCandidate() call completed!');
      console.log('🔍 CandidateProfileDialog: Returned newProfile object:', {
        'newProfile exists': !!newProfile,
        'newProfile.id': newProfile?.id,
        'newProfile.name': newProfile?.name,
        'ID matches backend UUID': newProfile?.id === backendProfileId,
        'ID is still valid UUID': newProfile?.id && newProfile.id.length > 20 && !newProfile.id.match(/^\d+$/)
      });
          
          if (!newProfile) {
            console.error('🚨 CandidateProfileDialog: CRITICAL FAILURE - addCandidate returned null!');
            throw new Error('Failed to create local candidate profile after backend save');
          }
          
          console.log('🎯 CandidateProfileDialog: ✅ Successfully created local profile with backend UUID:', newProfile.id);
          
          console.log('🔍 CandidateProfileDialog: FINAL VERIFICATION - Profile creation complete:', {
            'Expected backend UUID': backendProfileId,
            'Actual newProfile.id': newProfile.id,
            'IDs match': newProfile.id === backendProfileId,
            'newProfile.id is valid UUID': newProfile.id && newProfile.id.length > 20 && !newProfile.id.match(/^\d+$/),
            'Backend path was successful': true
          });
          
          // FINAL VERIFICATION: Ensure the profile ID is a proper UUID, not a timestamp
          if (newProfile.id !== backendProfileId) {
            console.error('🚨 CandidateProfileDialog: CRITICAL ERROR - Profile ID mismatch after creation:', {
              'expected': backendProfileId,
              'actual': newProfile.id
            });
            throw new Error('Profile ID mismatch after creation - AuthContext may have modified the ID');
          }
          
          // Verify that the newly created profile is now selected
          const currentlySelected = getSelectedCandidate();
          console.log('CandidateProfileDialog: Currently selected profile after creation:', currentlySelected?.id, currentlySelected?.name);
          
        } catch (backendError) {
          console.error('🚨 CandidateProfileDialog: Backend profile creation failed:', backendError);
          console.log('⚠️ CandidateProfileDialog: THIS WILL PREVENT APPLY FLOW - falling back to local-only profile creation');
          
          // Fall back to local-only creation if backend fails
          newProfile = addCandidate(candidateData, true);
          
          console.log('❌ CandidateProfileDialog: Local fallback profile created, but APPLY FLOW WILL BE SKIPPED due to missing backend ID');
          
          // Show error to user about apply flow issue
          if (applyFlow) {
            toast({
              title: "Profile Created with Warning",
              description: "Profile was created locally, but automatic application submission failed. Please apply manually.",
              variant: "destructive"
            });
          }
        }
      } else {
        // Local-only profile creation (when neither applyFlow nor forceBackendSync is true)
        // This is used for simple profile creation without backend sync requirements
        console.log('📝 CandidateProfileDialog: LOCAL PATH - creating local-only profile');
        console.log('🔍 CandidateProfileDialog: Local creation reason:', {
          applyFlow,
          forceBackendSync,
          reason: 'Neither apply flow nor forced backend sync enabled'
        });
        
        newProfile = addCandidate(candidateData, true);
        
        console.log('📋 CandidateProfileDialog: Local profile created:', {
          'profileId': newProfile?.id,
          'profileId length': newProfile?.id?.length,
          'will have timestamp ID': true
        });
      }
      
      if (newProfile) {
        toast({
          title: "Profile Created",
          description: "New candidate profile has been created successfully."
        });
        
        // Refresh profile data to sync with API, but ensure our new profile stays selected
        try {
          await refreshProfileData();
          
          // After refresh, re-select our newly created profile to ensure it remains active
          // This handles the case where API might not yet have the new profile or returns different order
          selectCandidate(newProfile.id);
          console.log('CandidateProfileDialog: Profile data refreshed and new profile re-selected:', newProfile.id);
        } catch (error) {
          console.log('CandidateProfileDialog: Profile refresh error (non-critical):', error);
        }
        
        // Handle apply flow - delegate to parent component to show consent UI
        console.log('🔍 CandidateProfileDialog: Apply flow conditions check:', {
          'applyFlow': applyFlow,
          'jobForApplication exists': !!jobForApplication,
          'newProfile exists': !!newProfile,
          'newProfile.id': newProfile?.id,
        });
        
        // In apply flow, delegate to parent component (ProfileSelectionModal) to handle consent UI
        // The parent will navigate to ConsolidatedJobApplication which shows consent checkbox for majors
        // and guardian verification modal for minors before submitting the application
        if (applyFlow && jobForApplication) {
          console.log('✅ CandidateProfileDialog: Apply flow detected - delegating to parent for consent UI');
          
          // Ensure the new profile is selected
          selectCandidate(newProfile.id);
          console.log('CandidateProfileDialog: Selected new profile:', newProfile.id);
          
          // Call the callback to let parent component handle navigation to consent UI
          if (onProfileCreated) {
            console.log('CandidateProfileDialog: Calling onProfileCreated callback - parent will show consent UI');
            onProfileCreated(newProfile);
          }
          
          // Close the dialog - parent will handle showing ConsolidatedJobApplication
          onClose();
          return;
        }
        
        console.log('🔄 CandidateProfileDialog: Continuing with standard profile completion flow...');
        
        // Call the callback if provided (for non-apply flow)
        if (onProfileCreated) {
          console.log('CandidateProfileDialog: Calling onProfileCreated callback');
          onProfileCreated(newProfile);
        }
        
        // Close the dialog after callback
        onClose();
        
        // The profile is already activated and refreshed
        console.log('CandidateProfileDialog: Profile created, activated, and refreshed successfully - Name:', newProfile.name, 'ID:', newProfile.id);
        
        if (!preventReload) {
          console.log('CandidateProfileDialog: Initiating automated page reload in 300ms for immediate profile activation');
          // Faster reload for better user experience - profile becomes active immediately
          setTimeout(() => {
            console.log('CandidateProfileDialog: Executing automated page reload - new profile will be active after reload');
            window.location.reload();
          }, 300); // Faster reload for better UX
        } else {
          console.log('CandidateProfileDialog: Automated reload disabled (preventReload=true)');
        }
        
        return;
      } else {
        toast({
          title: "Profile Creation Failed",
          description: "Failed to create profile. Please check all required fields.",
          variant: "destructive"
        });
        return;
      }
    } else if (mode === 'edit') {
      const candidateToUpdate = candidateId || existingCandidate?.id;
      if (candidateToUpdate) {
        updateCandidate(candidateToUpdate, candidateData);
        
        // Auto sync disabled - users can manually sync drafts using the sync button
        
        toast({
          title: "Profile Updated",
          description: "Candidate profile has been updated successfully."
        });
        
        // Conditionally refresh the page after successful profile update
        if (!preventReload) {
          setTimeout(() => {
            window.location.reload();
          }, 1000); // Small delay to show the success toast
        }
      }
    }

    // Refresh profile data to ensure UI updates
    console.log('🔄 CandidateProfileDialog: Refreshing profile data before closing...');
    refreshProfileData();

    console.log('🔚 CandidateProfileDialog: handleProfileComplete ending - calling onClose()');
    onClose();
  };

  // Convert candidate profile to user profile format for the dialog
  const getInitialProfile = () => {
    // Only return initial profile data for edit mode
    if (mode === 'edit' && existingCandidate) {
      // Ensure we preserve all file URLs and other data properly
      const initialProfile = {
        name: existingCandidate.name,
        age: existingCandidate.age,
        isNameVerified: existingCandidate.isNameVerified,
        isAgeVerified: existingCandidate.isAgeVerified,
        currentLocation: existingCandidate.currentLocation,
        desiredLocation: existingCandidate.desiredLocation,
        interestedRole: existingCandidate.interestedRole,
        interestedIndustry: existingCandidate.interestedIndustry,
        experience: existingCandidate.experience,
        skills: existingCandidate.skills,
        certificates: existingCandidate.certificates,
        assessmentScores: existingCandidate.assessmentScores,
        documentVerificationStatus: existingCandidate.documentVerificationStatus,
        nickname: existingCandidate.nickname,
        // Unified schema data - preserve all nested data including file URLs
        whoIAm: existingCandidate.whoIAm || {},
        whatIHave: existingCandidate.whatIHave || {},
        whatIWant: existingCandidate.whatIWant || {},
        // Verification status
        isGenderVerified: existingCandidate.isGenderVerified,
        isAadharVerified: existingCandidate.isAadharVerified,
        isHometownVerified: existingCandidate.isHometownVerified,
        // Education and certifications
        education: existingCandidate.education,
        skillCertifications: existingCandidate.skillCertifications,
        workExperience: existingCandidate.workExperience,
      };

      return initialProfile;
    }
    
    // For new profiles (mode === 'add'), return undefined to start fresh
    return undefined;
  };

  // Get the current user to access the profileId
  const { user: currentUser } = useAuth();
  
  // For update mode, we need to get the profile ID from the API
  const [currentProfileId, setCurrentProfileId] = React.useState<string | undefined>(profileId);
  
  React.useEffect(() => {
    const getProfileId = async () => {
      if (isUpdate && !profileId) {
        try {
          const profilesResponse = await apiClient.getProfiles() as ProfilesResponse;
          if (profilesResponse?.data && profilesResponse.data.length > 0) {
            const mostRecentProfile = profilesResponse.data[0];
            setCurrentProfileId(mostRecentProfile.id);
          }
        } catch (error) {
          // Silently handle profile ID errors
        }
      } else {
        // For edit mode with a specific candidate, use the candidateId as the profileId
        // since the candidate ID is actually the profile ID from the backend
        const effectiveProfileId = mode === 'edit' && candidateId ? candidateId : (profileId || currentUser?.profileId);
        setCurrentProfileId(effectiveProfileId);
      }
    };
    
    getProfileId();
  }, [isUpdate, profileId, currentUser?.profileId, mode, candidateId]);
  
  return (
    <UserProfileDialog
      isOpen={isOpen}
      onClose={onClose}
      onComplete={isUpdate ? undefined : handleProfileComplete} // Don't use onComplete for updates, let UserProfileDialog handle API call
      mode="candidate"
      initialProfile={getInitialProfile()}
      isUpdate={isUpdate}
      profileId={currentProfileId}
      preSelectedRole={preSelectedRole}
      preventReload={preventReload} // Only prevent reload when explicitly requested
      applyFlow={applyFlow} // Pass apply flow context to change button text
      forceBackendSync={forceBackendSync} // Pass backend sync preference
    />
  );
};

export default CandidateProfileDialog;
