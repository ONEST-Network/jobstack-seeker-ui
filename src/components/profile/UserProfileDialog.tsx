
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

interface UserProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (profile: any) => void;
  mode?: 'user' | 'candidate';
  initialProfile?: any;
}

const UserProfileDialogContent: React.FC<UserProfileDialogProps> = ({ 
  isOpen, 
  onClose, 
  onComplete,
  mode = 'user' 
}) => {
  const { updateProfile } = useAuth();
  const { toast } = useToast();
  const { profile } = useProfileForm();
  
  const [step, setStep] = useState(0); // Start with role selection
  const [showVoiceDialog, setShowVoiceDialog] = useState(false);
  const [previousRole, setPreviousRole] = useState<string>('');

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

  const handleSave = () => {
    // Calculate derived fields
    const finalProfile = {
      ...profile,
      age: profile.dateOfBirth ? new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear() : profile.age,
      inHandSalary: profile.monthlySalary ? profile.monthlySalary - (profile.pfDeduction || 0) - (profile.esicDeduction || 0) : undefined
    };

    if (onComplete) {
      onComplete(finalProfile);
    } else {
      updateProfile(finalProfile);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated."
      });
    }
    onClose();
  };

  const handleVoiceComplete = () => {
    setShowVoiceDialog(false);
    handleSave();
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
          const hasName = profile.name?.trim() !== '';
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
                  <Button onClick={handleSave} disabled={!canProceed()}>
                    Save Profile
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
  initialProfile 
}) => {
  return (
    <ProfileFormProvider initialProfile={initialProfile}>
      <UserProfileDialogContent 
        isOpen={isOpen} 
        onClose={onClose} 
        onComplete={onComplete} 
        mode={mode}
      />
    </ProfileFormProvider>
  );
};

export default UserProfileDialog;
