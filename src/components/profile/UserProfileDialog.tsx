
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
import { apiClient, transformProfileForAPI } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface UserProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (profile: any) => void;
  mode?: 'user' | 'candidate';
  initialProfile?: any;
  isUpdate?: boolean;
  profileId?: string;
}

const UserProfileDialogContent: React.FC<UserProfileDialogProps> = ({ 
  isOpen, 
  onClose, 
  onComplete,
  mode = 'user',
  initialProfile,
  isUpdate,
  profileId
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
        // Use the provided initialProfile
        setProfile(initialProfile);
      } else {
        // If no initialProfile provided, try to get from selected candidate
        const selectedCandidate = getSelectedCandidate();
        if (selectedCandidate) {
          const transformedProfile = {
            // Who I Am data
            name: selectedCandidate.name,
            dateOfBirth: selectedCandidate.dateOfBirth,
            age: selectedCandidate.age,
            gender: selectedCandidate.gender,
            hometown: selectedCandidate.hometown,
            aadharNumber: selectedCandidate.aadharNumber,
            phone: selectedCandidate.phone,
            currentLocation: selectedCandidate.currentLocation,
            desiredLocation: selectedCandidate.desiredLocation,
            isNameVerified: selectedCandidate.isNameVerified,
            isAgeVerified: selectedCandidate.isAgeVerified,
            isGenderVerified: selectedCandidate.isGenderVerified,
            isAadharVerified: selectedCandidate.isAadharVerified,
            isHometownVerified: selectedCandidate.isHometownVerified,
            
            // What I Have data
            basicLiteracy: selectedCandidate.basicLiteracy,
            skillProofVideo: selectedCandidate.skillProofVideo,
            qualityProofImage: selectedCandidate.qualityProofImage,
            hasWorkExperience: selectedCandidate.hasWorkExperience,
            previousCompany: selectedCandidate.previousCompany,
            previousLocation: selectedCandidate.previousLocation,
            experienceMonths: selectedCandidate.experienceMonths,
            machinesOperated: selectedCandidate.machinesOperated,
            
            // What I Want data
            salaryFrequency: selectedCandidate.salaryFrequency,
            advanceMonthsAvailable: selectedCandidate.advanceMonthsAvailable,
            advanceFrequency: selectedCandidate.advanceFrequency,
            monthlySalary: selectedCandidate.monthlySalary,
            pfDeduction: selectedCandidate.pfDeduction,
            esicDeduction: selectedCandidate.esicDeduction,
            inHandSalary: selectedCandidate.inHandSalary,
            housingFacility: selectedCandidate.housingFacility,
            foodFacility: selectedCandidate.foodFacility,
            workHoursPerDay: selectedCandidate.workHoursPerDay,
            overtimeAvailable: selectedCandidate.overtimeAvailable,
            overtimePayMultiplier: selectedCandidate.overtimePayMultiplier,
            gradeUpgradation: selectedCandidate.gradeUpgradation,
            factoryTrustScore: selectedCandidate.factoryTrustScore,
            
            // Role and industry
            interestedRole: selectedCandidate.interestedRole,
            interestedIndustry: selectedCandidate.interestedIndustry,
            
            // Legacy fields
            experience: selectedCandidate.experience,
            skills: selectedCandidate.skills,
            certificates: selectedCandidate.certificates,
            
            // Education and certifications
            education: selectedCandidate.education,
            skillCertifications: selectedCandidate.skillCertifications,
            workExperience: selectedCandidate.workExperience,
            
            // Assessment and verification
            assessmentScores: selectedCandidate.assessmentScores,
            documentVerificationStatus: selectedCandidate.documentVerificationStatus,
            
            // Unified schema data
            whoIAm: selectedCandidate.whoIAm,
            whatIHave: selectedCandidate.whatIHave,
            whatIWant: selectedCandidate.whatIWant,
          };
          
          setProfile(transformedProfile);
        }
      }
    }
  }, [isOpen, initialProfile, getSelectedCandidate, setProfile]);

  // Reset step when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setPreviousRole('');
    }
  }, [isOpen]);

  // Handle role change - don't auto-advance
  useEffect(() => {
    if (profile.interestedRole && profile.interestedRole !== previousRole) {
      setPreviousRole(profile.interestedRole);
      // Don't auto-advance - let user click Next
    }
  }, [profile.interestedRole, previousRole]);

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

      // Calculate derived fields
      const finalProfile = {
        ...profile,
        age: profile.dateOfBirth ? new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear() : profile.age,
        inHandSalary: profile.monthlySalary ? profile.monthlySalary - (profile.pfDeduction || 0) - (profile.esicDeduction || 0) : undefined
      };

      // Transform profile for API
      const apiPayload = transformProfileForAPI(finalProfile, user?.email);

      // Call the profile creation API
      console.log('🔍 Debug - isUpdate:', isUpdate, 'profileId:', profileId);
      if (isUpdate && profileId) {
        console.log('🔄 Updating profile with ID:', profileId);
        console.log('📦 Update payload:', apiPayload);
        await apiClient.updateProfile(profileId, apiPayload);
      } else {
        console.log('🆕 Creating new profile');
        console.log('📦 Create payload:', apiPayload);
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

      onClose();
    } catch (error: any) {
      console.error('Profile creation error:', error);
      toast({
        title: isUpdate ? "Profile Update Failed" : "Profile Creation Failed",
        description: error.message || (isUpdate ? "Failed to update profile. Please try again." : "Failed to create profile. Please try again."),
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
    // Step 0 is ALWAYS role selection, regardless of unified schema
    if (step === 0) {
      return <RoleSelectionStep onVoiceStart={() => setShowVoiceDialog(true)} />;
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
    
    // Step 0 is always role selection
    if (step === 0) {
      return `${profileType} - Role Selection (1 of ${getTotalSteps()})`;
    }
    
    // For steps 1+, check if we have a unified schema for the selected role
    const unifiedSchema = getUnifiedSchema(profile.interestedRole);
    
    if (unifiedSchema && profile.interestedRole) {
      const steps = unifiedSchema.ui?.steps || [];
      const unifiedStepIndex = step - 1; // Offset by 1 since step 0 is role selection
      
      if (unifiedStepIndex >= 0 && unifiedStepIndex < steps.length) {
        const currentStep = steps[unifiedStepIndex];
        return `${profileType} - ${currentStep.title} (${step + 1} of ${getTotalSteps()})`;
      }
    } else {
      // Legacy step titles (offset by 1)
      const stepTitles = ['Basic Personal Information', 'Education, Skills, and Work Experience', 'Job Preferences'];
      const legacyStepIndex = step - 1;
      if (legacyStepIndex >= 0 && legacyStepIndex < stepTitles.length) {
        return `${profileType} - ${stepTitles[legacyStepIndex]} (${step + 1} of ${getTotalSteps()})`;
      }
    }
    
    return `${profileType} - Step ${step + 1}`;
  };

  const getTotalSteps = () => {
    const unifiedSchema = getUnifiedSchema(profile.interestedRole);
    if (unifiedSchema && profile.interestedRole) {
      const steps = unifiedSchema.ui?.steps || [];
      return steps.length + 1; // +1 for role selection step
    } else {
      return 4; // Role selection + 3 legacy steps
    }
  };

  const canProceed = () => {
    // Check if user is authenticated
    if (!user) {
      return false;
    }
    
    // Step 0 is always role selection - require a role to be selected
    if (step === 0) {
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
        const stepData = (profile[currentStep.id as keyof typeof profile] as Record<string, any>) || {};
        
        // Check required fields for the current step
        const stepSchema = unifiedSchema.properties?.[currentStep.id];
        if (stepSchema?.required) {
          const canProceedResult = stepSchema.required.every((field: string) => {
            const value = stepData[field];
            const hasValue = value !== undefined && value !== null && value !== '';
            return hasValue;
          });
          return canProceedResult;
        }
        return true; // If no required fields, can always proceed
      }
    } else {
      // Legacy validation (offset by 1)
      switch (step) {
        case 1: // Basic Personal Information - require name
          const hasName = (profile.name?.trim() !== '') || (profile.whoIAm?.name?.trim() !== '');
          return hasName;
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
    setStep(step + 1);
  };

  const handlePrevious = () => {
    setStep(Math.max(0, step - 1));
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
  profileId
}) => {
  return (
    <ProfileFormProvider initialProfile={initialProfile}>
      <UserProfileDialogContent 
        isOpen={isOpen} 
        onClose={onClose} 
        onComplete={onComplete} 
        mode={mode}
        initialProfile={initialProfile}
        isUpdate={isUpdate}
        profileId={profileId}
      />
    </ProfileFormProvider>
  );
};

export default UserProfileDialog;
