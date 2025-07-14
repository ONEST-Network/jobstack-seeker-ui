
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
  const { updateProfile, user, getSelectedCandidate } = useAuth();
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

      // Transform the profile data for the auth context (flatten nested structure)
      const flattenedProfile = {
        // Who I Am data
        name: profile.name || profile.whoIAm?.name || '',
        dateOfBirth: profile.dateOfBirth || profile.whoIAm?.dateOfBirth,
        age: profile.age || profile.whoIAm?.age,
        gender: profile.gender || profile.whoIAm?.gender,
        hometown: profile.hometown || profile.whoIAm?.hometown,
        aadharNumber: profile.aadharNumber || profile.whoIAm?.aadharNumber,
        phone: profile.phone || profile.whoIAm?.phone,
        currentLocation: profile.currentLocation || profile.whoIAm?.location || '',
        desiredLocation: profile.desiredLocation || profile.whoIAm?.desiredLocation || '',
        isNameVerified: profile.isNameVerified || profile.whoIAm?.isNameVerified || false,
        isAgeVerified: profile.isAgeVerified || profile.whoIAm?.isAgeVerified || false,
        isGenderVerified: profile.isGenderVerified || profile.whoIAm?.isGenderVerified || false,
        isAadharVerified: profile.isAadharVerified || profile.whoIAm?.isAadharVerified || false,
        isHometownVerified: profile.isHometownVerified || profile.whoIAm?.isHometownVerified || false,
        
        // What I Have data
        basicLiteracy: profile.basicLiteracy || profile.whatIHave?.basicLiteracy,
        skillProofVideo: profile.skillProofVideo || profile.whatIHave?.skillProofVideo,
        qualityProofImage: profile.qualityProofImage || profile.whatIHave?.qualityProofImage,
        hasWorkExperience: profile.hasWorkExperience || profile.whatIHave?.hasWorkExperience,
        previousCompany: profile.previousCompany || profile.whatIHave?.previousCompany,
        previousLocation: profile.previousLocation || profile.whatIHave?.previousLocation,
        experienceMonths: profile.experienceMonths || profile.whatIHave?.experienceMonths,
        machinesOperated: profile.machinesOperated || profile.whatIHave?.machinesOperated,
        
        // What I Want data
        salaryFrequency: profile.salaryFrequency || profile.whatIWant?.salaryFrequency,
        advanceMonthsAvailable: profile.advanceMonthsAvailable || profile.whatIWant?.advanceMonthsAvailable,
        advanceFrequency: profile.advanceFrequency || profile.whatIWant?.advanceFrequency,
        monthlySalary: profile.monthlySalary || profile.whatIWant?.monthlySalary,
        pfDeduction: profile.pfDeduction || profile.whatIWant?.pfDeduction,
        esicDeduction: profile.esicDeduction || profile.whatIWant?.esicDeduction,
        inHandSalary: profile.inHandSalary || profile.whatIWant?.inHandSalary,
        housingFacility: profile.housingFacility || profile.whatIWant?.housingFacility,
        foodFacility: profile.foodFacility || profile.whatIWant?.foodFacility,
        workHoursPerDay: profile.workHoursPerDay || profile.whatIWant?.workHoursPerDay,
        overtimeAvailable: profile.overtimeAvailable || profile.whatIWant?.overtimeAvailable,
        overtimePayMultiplier: profile.overtimePayMultiplier || profile.whatIWant?.overtimePayMultiplier,
        gradeUpgradation: profile.gradeUpgradation || profile.whatIWant?.gradeUpgradation,
        factoryTrustScore: profile.factoryTrustScore || profile.whatIWant?.factoryTrustScore,
        
        // Role and industry
        interestedRole: profile.interestedRole,
        interestedIndustry: profile.interestedIndustry,
        
        // Legacy fields
        experience: profile.experience || [],
        skills: profile.skills || [],
        certificates: profile.certificates || [],
        
        // Education and certifications
        education: profile.education || [],
        skillCertifications: profile.skillCertifications || [],
        workExperience: profile.workExperience || [],
        
        // Assessment and verification
        assessmentScores: profile.assessmentScores || [],
        documentVerificationStatus: profile.documentVerificationStatus || [],
      };

      if (onComplete) {
        onComplete(flattenedProfile);
      } else {
        updateProfile(flattenedProfile);
      }

      // If this is an update, refresh profile data from API
      if (isUpdate) {
        try {
          await apiClient.getProfile();
        } catch (error) {
          console.log('Error refreshing profile data after update:', error);
        }
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
