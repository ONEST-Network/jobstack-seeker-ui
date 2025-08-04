
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ProfileFormProvider, useProfileForm } from './ProfileFormProvider';
import VoiceProfileDialog from './VoiceProfileDialog';
import RoleSelectionStep from './steps/RoleSelectionStep';
import WhoIAmStep from './steps/WhoIAmStep';
import WhatIHaveStep from './steps/WhatIHaveStep';
import WhatIWantStep from './steps/WhatIWantStep';
import DynamicFormStep from './DynamicFormStep';
import { getUnifiedSchema } from '@/schemas';
import { apiClient, transformProfileForAPI, ProfilesResponse } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface UserProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (profile: Record<string, unknown>) => void;
  mode?: 'user' | 'candidate';
  initialProfile?: Record<string, unknown>;
  isUpdate?: boolean;
  profileId?: string;
  preSelectedRole?: string;
}

const UserProfileDialogContent: React.FC<UserProfileDialogProps> = ({ 
  isOpen, 
  onClose, 
  onComplete,
  mode = 'user',
  initialProfile,
  isUpdate,
  profileId,
  preSelectedRole
}) => {
  const { updateProfile, user, getSelectedCandidate, refreshProfileData } = useAuth();
  const { toast } = useToast();
  const { profile, setProfile } = useProfileForm();
  
  const [step, setStep] = useState(0); // Start with role selection
  const [showVoiceDialog, setShowVoiceDialog] = useState(false);
  const [previousRole, setPreviousRole] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize profile with existing data when editing
  useEffect(() => {
    if (isOpen) {
      if (initialProfile) {
        // Use the provided initialProfile (for editing existing profiles)
        // Merge initial profile with current profile state to preserve any changes made during this session
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setProfile((prevProfile: any) => {
          // If we have existing data in the current session, merge it with the initial profile
          const mergedProfile = { ...initialProfile };
          
          // Preserve any step data that has been modified in the current session
          Object.keys(prevProfile).forEach(stepKey => {
            if (stepKey !== 'candidateId' && prevProfile[stepKey] && 
                typeof prevProfile[stepKey] === 'object' && 
                Object.keys(prevProfile[stepKey] as Record<string, unknown>).length > 0) {
              
              // Merge step data, keeping current session values for fields that have been set
              const currentStepData = prevProfile[stepKey] as Record<string, unknown>;
              const initialStepData = (mergedProfile as Record<string, unknown>)[stepKey] as Record<string, unknown> || {};
              
              (mergedProfile as Record<string, unknown>)[stepKey] = {
                ...initialStepData,
                ...currentStepData  // Current session data takes precedence
              };
            }
          });
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return mergedProfile as any;
        });
      } else {
        // For new profiles, start with completely fresh data
        const freshProfile = {
          // Who I Am data - start empty
          name: '',
          dateOfBirth: '',
          age: undefined,
          gender: undefined,
          hometown: '',
          aadharNumber: '',
          phone: '',
          currentLocation: '',
          desiredLocation: '',
          isNameVerified: false,
          isAgeVerified: false,
          
          // What I Have data - start empty
          basicLiteracy: undefined,
          skillProofVideo: '',
          qualityProofImage: '',
          hasWorkExperience: undefined,
          previousCompany: '',
          previousLocation: '',
          experienceMonths: undefined,
          machinesOperated: [],
          
          // What I Want data - start empty
          salaryFrequency: undefined,
          advanceMonthsAvailable: undefined,
          advanceFrequency: undefined,
          monthlySalary: undefined,
          pfDeduction: undefined,
          esicDeduction: undefined,
          inHandSalary: undefined,
          housingFacility: undefined,
          foodFacility: undefined,
          workHoursPerDay: undefined,
          overtimeAvailable: undefined,
          overtimePayMultiplier: undefined,
          gradeUpgradation: undefined,
          factoryTrustScore: undefined,
          
          // Role and industry - start empty or use pre-selected role
          interestedRole: preSelectedRole || '',
          interestedIndustry: '',
          
          // Legacy fields - start empty
          experience: [],
          skills: [],
          certificates: [],
          
          // Education and certifications - start empty
          education: [],
          skillCertifications: [],
          workExperience: [],
          
          // Assessment and verification - start empty
          assessmentScores: [],
          documentVerificationStatus: [],
          
          // Unified schema data - start empty
          whoIAm: {
            name: '',
            location: '',
            phone: '',
            dateOfBirth: '',
            age: undefined,
            gender: undefined,
            hometown: '',
            aadharNumber: '',
            currentLocation: '',
            desiredLocation: '',
            isNameVerified: false,
            isAgeVerified: false,
            isPhoneVerified: false,
            isLocationVerified: false,
          },
          whatIHave: {
            age: undefined,
            basicLiteracy: undefined,
            skillProofVideo: '',
            qualityProofImage: '',
            hasWorkExperience: undefined,
            previousCompany: '',
            previousLocation: '',
            experienceMonths: undefined,
            machinesOperated: [],
            isAgeVerified: false,
          },
          whatIWant: {
            salaryFrequency: undefined,
            advanceMonthsAvailable: undefined,
            advanceFrequency: undefined,
            monthlySalary: undefined,
            pfDeduction: undefined,
            esicDeduction: undefined,
            inHandSalary: undefined,
            housingFacility: undefined,
            foodFacility: undefined,
            workHoursPerDay: undefined,
            overtimeAvailable: undefined,
            overtimePayMultiplier: undefined,
            gradeUpgradation: undefined,
            factoryTrustScore: undefined,
          },
        };
        
        setProfile(freshProfile);
      }
    } else {
      // Reset state when dialog closes
      setStep(0);
      setPreviousRole('');
      setShowVoiceDialog(false);
      setIsSaving(false);
    }
  }, [isOpen, initialProfile, setProfile, preSelectedRole]);



  // Handle role change - don't auto-advance
  useEffect(() => {
    if (profile.interestedRole && profile.interestedRole !== previousRole) {
      setPreviousRole(profile.interestedRole);
      // Don't auto-advance - let user click Next
    }
  }, [profile.interestedRole, previousRole]);

  // Automatically set the role and skip to the first form step if a pre-selected role is provided
  // This effect should run after the profile is initialized
  useEffect(() => {
    if (isOpen && preSelectedRole && !isUpdate && mode === 'candidate' && profile.interestedRole === preSelectedRole) {
      // Only set step to 1 if the profile has been properly initialized with the preSelectedRole
      setStep(1);
    }
  }, [isOpen, preSelectedRole, isUpdate, mode, profile.interestedRole]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Check if user is authenticated
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to save your profile.",
          variant: "destructive"
        });
        return;
      }

      // Validate required fields
      if (!profile.interestedRole) {
        toast({
          title: "Missing Required Field",
          description: "Please select a job role before saving your profile.",
          variant: "destructive"
        });
        return;
      }

      // Check for name in both legacy and unified schema structures
      const name = profile.name || profile.whoIAm?.name;
      if (!name?.trim()) {
        toast({
          title: "Missing Required Field",
          description: "Please enter your name before saving your profile.",
          variant: "destructive"
        });
        return;
      }

      // Check for location in both legacy and unified schema structures
      const location = profile.currentLocation || profile.whoIAm?.location;
      if (!location?.trim()) {
        toast({
          title: "Missing Required Field",
          description: "Please enter your location before saving your profile.",
          variant: "destructive"
        });
        return;
      }

      // Check for phone number in both legacy and unified schema structures
      const phone = profile.phone || profile.whoIAm?.phone;
      if (!phone?.trim()) {
        toast({
          title: "Missing Required Field",
          description: "Please enter your phone number before saving your profile.",
          variant: "destructive"
        });
        return;
      }

      // Calculate derived fields
      const finalProfile = {
        ...profile,
        age: profile.dateOfBirth ? new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear() : profile.age,
        inHandSalary: profile.monthlySalary ? profile.monthlySalary - (profile.pfDeduction || 0) - (profile.esicDeduction || 0) : undefined
      };

      // Generate unique location tag for new profiles
      let locationTag = "home";
      let contactTag = "personal";
      if (!isUpdate) {
        try {
          // Fetch existing profiles to count them
          const profilesResponse = await apiClient.getProfiles() as ProfilesResponse;
          const existingProfiles = profilesResponse?.data || [];
          const profileCount = existingProfiles.length;
          
          // Generate unique location tag: "home" for first profile, "home1", "home2", etc. for subsequent profiles
          locationTag = profileCount === 0 ? "home" : `home${profileCount}`;
          // Generate unique contact tag: "personal" for first profile, "personal1", "personal2", etc. for subsequent profiles
          contactTag = profileCount === 0 ? "personal" : `personal${profileCount}`;
        } catch (error) {
          console.log('Error fetching existing profiles, using default tags:', error);
          locationTag = "home";
          contactTag = "personal";
        }
      }

      // Transform profile for API
      const apiPayload = transformProfileForAPI(finalProfile, user?.email, locationTag, contactTag);

      // Call the profile creation API
      if (isUpdate && profileId) {
        await apiClient.updateProfile(profileId, apiPayload);
      } else {
        await apiClient.createProfile(apiPayload);
      }

      // Flatten the profile for local storage
      const flattenedProfile = {
        name: finalProfile.name || finalProfile.whoIAm?.name || '',
        dateOfBirth: finalProfile.dateOfBirth || finalProfile.whoIAm?.dateOfBirth,
        age: finalProfile.age || finalProfile.whatIHave?.age,
        gender: (finalProfile.gender || finalProfile.whoIAm?.gender) as 'male' | 'female' | 'other' | undefined,
        hometown: finalProfile.hometown || finalProfile.whoIAm?.hometown,
        aadharNumber: finalProfile.aadharNumber || finalProfile.whoIAm?.aadharNumber,
        phone: finalProfile.phone || finalProfile.whoIAm?.phone || '',
        currentLocation: finalProfile.currentLocation || finalProfile.whoIAm?.currentLocation || '',
        desiredLocation: finalProfile.desiredLocation || finalProfile.whoIAm?.desiredLocation || '',
        isNameVerified: finalProfile.isNameVerified || finalProfile.whoIAm?.isNameVerified || false,
        isAgeVerified: finalProfile.isAgeVerified || finalProfile.whoIAm?.isAgeVerified || false,
        interestedRole: finalProfile.interestedRole,
        interestedIndustry: finalProfile.interestedIndustry,
        basicLiteracy: (finalProfile.basicLiteracy || finalProfile.whatIHave?.basicLiteracy) as 'below-8th' | '8th-pass' | '10th-pass' | '12th-pass' | 'graduate' | undefined,
        skillProofVideo: finalProfile.skillProofVideo || finalProfile.whatIHave?.skillProofVideo,
        qualityProofImage: finalProfile.qualityProofImage || finalProfile.whatIHave?.qualityProofImage,
        hasWorkExperience: finalProfile.hasWorkExperience || finalProfile.whatIHave?.hasWorkExperience,
        previousCompany: finalProfile.previousCompany || finalProfile.whatIHave?.previousCompany,
        previousLocation: finalProfile.previousLocation || finalProfile.whatIHave?.previousLocation,
        experienceMonths: finalProfile.experienceMonths || finalProfile.whatIHave?.experienceMonths,
        machinesOperated: finalProfile.machinesOperated || finalProfile.whatIHave?.machinesOperated,
        salaryFrequency: (finalProfile.salaryFrequency || finalProfile.whatIWant?.salaryFrequency) as 'weekly' | 'monthly' | undefined,
        advanceMonthsAvailable: finalProfile.advanceMonthsAvailable || finalProfile.whatIWant?.advanceMonthsAvailable,
        advanceFrequency: (finalProfile.advanceFrequency || finalProfile.whatIWant?.advanceFrequency) as 'monthly' | 'quarterly' | 'half-yearly' | undefined,
        monthlySalary: finalProfile.monthlySalary || finalProfile.whatIWant?.monthlySalary,
        pfDeduction: finalProfile.pfDeduction || finalProfile.whatIWant?.pfDeduction,
        esicDeduction: finalProfile.esicDeduction || finalProfile.whatIWant?.esicDeduction,
        inHandSalary: finalProfile.inHandSalary || finalProfile.whatIWant?.inHandSalary,
        housingFacility: finalProfile.housingFacility || finalProfile.whatIWant?.housingFacility,
        foodFacility: finalProfile.foodFacility || finalProfile.whatIWant?.foodFacility,
        workHoursPerDay: finalProfile.workHoursPerDay || finalProfile.whatIWant?.workHoursPerDay,
        overtimeAvailable: finalProfile.overtimeAvailable || finalProfile.whatIWant?.overtimeAvailable,
        overtimePayMultiplier: finalProfile.overtimePayMultiplier || finalProfile.whatIWant?.overtimePayMultiplier,
        gradeUpgradation: finalProfile.gradeUpgradation || finalProfile.whatIWant?.gradeUpgradation,
        factoryTrustScore: finalProfile.factoryTrustScore || finalProfile.whatIWant?.factoryTrustScore,
        experience: finalProfile.experience || [],
        skills: finalProfile.skills || [],
        certificates: finalProfile.certificates || [],
        assessmentScores: finalProfile.assessmentScores || [],
        documentVerificationStatus: finalProfile.documentVerificationStatus || [],
      };

      if (onComplete) {
        onComplete(flattenedProfile);
      } else {
        updateProfile(flattenedProfile);
      }

      // Refresh profile data from API after both create and update operations
      try {
        await refreshProfileData();
      } catch (error) {
        console.log('Error refreshing profile data after save:', error);
      }

      toast({
        title: isUpdate ? "Profile Updated Successfully" : "Profile Created Successfully",
        description: isUpdate 
          ? "Your profile has been successfully updated and saved."
          : "Your profile has been successfully created and saved."
      });

      // Refresh the page after successful profile creation or update to update the UI
      setTimeout(() => {
        window.location.reload();
      }, 1000); // Small delay to show the success toast

      onClose();
    } catch (error: unknown) {
      console.error('Profile creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: isUpdate ? "Profile Update Failed" : "Profile Creation Failed",
        description: errorMessage || (isUpdate ? "Failed to update profile. Please try again." : "Failed to create profile. Please try again."),
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleVoiceComplete = async () => {
    setShowVoiceDialog(false);
    await handleSave();
  };

  const renderStep = () => {
    // If we have a pre-selected role and we're not in update mode, skip role selection
    const shouldSkipRoleSelection = preSelectedRole && !isUpdate && mode === 'candidate';
    
    // Step 0 is role selection (unless skipped)
    if (step === 0 && !shouldSkipRoleSelection) {
      return <RoleSelectionStep onVoiceStart={() => setShowVoiceDialog(true)} isUpdate={isUpdate} />;
    }
    
    // For steps 1+, check if we have a unified schema for the selected role
    const unifiedSchema = getUnifiedSchema(profile.interestedRole);
    
    if (unifiedSchema && profile.interestedRole) {
      // Use unified schema steps (but offset by 1 since step 0 is role selection)
      const steps = unifiedSchema.ui?.steps || [];
      const unifiedStepIndex = step - 1; // Offset by 1 since step 0 is role selection
      
      if (unifiedStepIndex >= 0 && unifiedStepIndex < steps.length) {
        const currentStep = steps[unifiedStepIndex];
        return (
          <DynamicFormStep 
            stepName={currentStep.id} 
            role={profile.interestedRole}
          />
        );
      }
    } else {
      // Use legacy steps
      switch (step) {
        case 1:
          return <WhoIAmStep onVoiceStart={() => setShowVoiceDialog(true)} />;
        case 2:
          return <WhatIHaveStep />;
        case 3:
          return <WhatIWantStep />;
        default:
          return null;
      }
    }
    return null;
  };

  const getStepTitle = () => {
    const profileType = mode === 'candidate' ? 'Candidate Profile' : 'Your Profile';
    
    // If we have a pre-selected role and we're not in update mode, skip role selection
    const shouldSkipRoleSelection = preSelectedRole && !isUpdate && mode === 'candidate';
    
    // Step 0 is always role selection (unless skipped)
    if (step === 0 && !shouldSkipRoleSelection) {
      const title = isUpdate ? `${profileType} - Role Selection (Read Only) (1 of ${getTotalSteps()})` : `${profileType} - Role Selection (1 of ${getTotalSteps()})`;
      return title;
    }
    
    // For steps 1+, check if we have a unified schema for the selected role
    const unifiedSchema = getUnifiedSchema(profile.interestedRole);
    
    if (unifiedSchema && profile.interestedRole) {
      const steps = unifiedSchema.ui?.steps || [];
      const unifiedStepIndex = step - 1; // Offset by 1 since step 0 is role selection
      
      if (unifiedStepIndex >= 0 && unifiedStepIndex < steps.length) {
        const currentStep = steps[unifiedStepIndex];
        // When role selection is skipped, step 1 should show as "2 of 4", step 2 as "3 of 4", step 3 as "4 of 4"
        const displayStep = shouldSkipRoleSelection ? step + 1 : step + 1;
        const totalSteps = getTotalSteps();
        const title = `${profileType} - ${currentStep.title} (${displayStep} of ${totalSteps})`;
        return title;
      }
    } else {
      // Legacy step titles (offset by 1)
      const stepTitles = ['Basic Personal Information', 'Education, Skills, and Work Experience', 'Job Preferences'];
      const legacyStepIndex = step - 1;
      if (legacyStepIndex >= 0 && legacyStepIndex < stepTitles.length) {
        // When role selection is skipped, step 1 should show as "2 of 4", step 2 as "3 of 4", step 3 as "4 of 4"
        const displayStep = shouldSkipRoleSelection ? step + 1 : step + 1;
        const totalSteps = getTotalSteps();
        const title = `${profileType} - ${stepTitles[legacyStepIndex]} (${displayStep} of ${totalSteps})`;
        return title;
      }
    }
    
    return `${profileType} - Step ${step + 1}`;
  };

  const getTotalSteps = () => {
    // If we have a pre-selected role and we're not in update mode, skip role selection
    const shouldSkipRoleSelection = preSelectedRole && !isUpdate && mode === 'candidate';
    
    const unifiedSchema = getUnifiedSchema(profile.interestedRole);
    if (unifiedSchema && profile.interestedRole) {
      const steps = unifiedSchema.ui?.steps || [];
      // Always return 4 steps total (role selection + 3 form steps) for proper step numbering
      // Even when role selection is skipped, we want to show "2 out of 4", "3 out of 4", "4 out of 4"
      return 4; // Role selection + whoIAm + whatIHave + whatIWant
    } else {
      return 4; // Role selection + 3 legacy steps
    }
  };

  const canProceed = () => {
    // Check if user is authenticated
    if (!user) {
      return false;
    }
    
    // If we have a pre-selected role and we're not in update mode, skip role selection
    const shouldSkipRoleSelection = preSelectedRole && !isUpdate && mode === 'candidate';
    
    // Step 0 is always role selection - require a role to be selected (unless skipped)
    if (step === 0 && !shouldSkipRoleSelection) {
      // In update mode, we already have a role, so we can proceed
      if (isUpdate) {
        return true;
      }
      const hasRole = profile.interestedRole?.trim() !== '';
      return hasRole;
    }
    
    // For steps 1+, check if we have a unified schema for the selected role
    const unifiedSchema = getUnifiedSchema(profile.interestedRole);
    
    if (unifiedSchema && profile.interestedRole) {
      const steps = unifiedSchema.ui?.steps || [];
      const unifiedStepIndex = step - 1; // Offset by 1 since step 0 is role selection
      
      if (unifiedStepIndex >= 0 && unifiedStepIndex < steps.length) {
        const currentStep = steps[unifiedStepIndex];
        const stepData = (profile[currentStep.id as keyof typeof profile] as Record<string, unknown>) || {};
        
        // Check required fields for the current step
        const stepSchema = unifiedSchema.properties?.[currentStep.id];
        if (stepSchema?.required) {
          const canProceedResult = stepSchema.required.every((field: string) => {
            const value = stepData[field];
            // Check for non-empty string values (not just truthy)
            const hasValue = value !== undefined && value !== null && 
                           (typeof value === 'string' ? value.trim() !== '' : value !== '');
            return hasValue;
          });
          return canProceedResult;
        }
        return true; // If no required fields, can always proceed
      }
    } else {
      // Legacy validation (offset by 1)
      switch (step) {
        case 1: {// Basic Personal Information - require name, location, and phone
          const hasName = (profile.name?.trim() !== '') || (profile.whoIAm?.name?.trim() !== '');
          const hasLocation = (profile.currentLocation?.trim() !== '') || (profile.whoIAm?.location?.trim() !== '');
          const hasPhone = (profile.phone?.trim() !== '') || (profile.whoIAm?.phone?.trim() !== '');
          return hasName && hasLocation && hasPhone;
        }
        case 2: // Education, Skills, and Work Experience - optional
          return true;
        case 3: // Job Preferences - optional
          return true;
        default:
          return false;
      }
    }
    
    return false;
  };

  const handleNext = () => {
    // If we have a pre-selected role and we're not in update mode, skip role selection
    const shouldSkipRoleSelection = preSelectedRole && !isUpdate && mode === 'candidate';
    
    if (step === 0 && shouldSkipRoleSelection) {
      // Skip to step 1 (first form step) when role selection is skipped
      setStep(1);
    } else {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    // If we have a pre-selected role and we're not in update mode, skip role selection
    const shouldSkipRoleSelection = preSelectedRole && !isUpdate && mode === 'candidate';
    
    if (step === 1 && shouldSkipRoleSelection) {
      // Go back to step 0 (role selection) when role selection is skipped
      setStep(0);
    } else {
      setStep(Math.max(0, step - 1));
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0 border-b pb-4">
            <DialogTitle>{getStepTitle()}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {renderStep()}
          </div>

          <div className="flex-shrink-0 flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={step === 0}
            >
              Previous
            </Button>
            
            {!user && (
              <div className="text-sm text-muted-foreground flex items-center">
                Please log in to save your profile
              </div>
            )}
            
            {(() => {
              // Check if we're at the last step
              const maxSteps = getTotalSteps();
              
              if (step < maxSteps - 1) {
                return (
                  <Button 
                    onClick={handleNext}
                    disabled={!canProceed()}
                  >
                    Next
                  </Button>
                );
              } else {
                return (
                  <Button onClick={handleSave} disabled={!canProceed() || isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSaving ? 'Saving...' : (isUpdate ? 'Update Profile' : 'Save Profile')}
                  </Button>
                );
              }
            })()}
          </div>
        </DialogContent>
      </Dialog>

      <VoiceProfileDialog
        isOpen={showVoiceDialog}
        onClose={() => setShowVoiceDialog(false)}
        onComplete={handleVoiceComplete}
      />
    </>
  );
};

const UserProfileDialog: React.FC<UserProfileDialogProps> = ({ 
  isOpen, 
  onClose, 
  onComplete, 
  mode,
  initialProfile,
  isUpdate,
  profileId,
  preSelectedRole
}) => {
  // Create a unique key to force ProfileFormProvider reset when dialog opens
  const dialogKey = `${isOpen ? 'open' : 'closed'}-${preSelectedRole || 'no-role'}-${isUpdate ? 'edit' : 'add'}`;
  
  return (
    <ProfileFormProvider key={dialogKey} initialProfile={initialProfile as unknown as Parameters<typeof ProfileFormProvider>[0]['initialProfile']}>
      <UserProfileDialogContent 
        isOpen={isOpen} 
        onClose={onClose} 
        onComplete={onComplete} 
        mode={mode}
        initialProfile={initialProfile}
        isUpdate={isUpdate}
        profileId={profileId}
        preSelectedRole={preSelectedRole}
      />
    </ProfileFormProvider>
  );
};

export default UserProfileDialog;
