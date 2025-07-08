
import React, { useState } from 'react';
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
    switch (step) {
      case 0:
        return <RoleSelectionStep onVoiceStart={() => setShowVoiceDialog(true)} />;
      case 1:
        return <WhoIAmStep onVoiceStart={() => setShowVoiceDialog(true)} />;
      case 2:
        return <WhatIHaveStep />;
      case 3:
        return <WhatIWantStep />;
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    const profileType = mode === 'candidate' ? 'Candidate Profile' : 'Your Profile';
    const stepTitles = ['Role Selection', 'Basic Personal Information', 'Education, Skills, and Work Experience', 'Job Preferences'];
    return `${profileType} - ${stepTitles[step]} (${step + 1} of 4)`;
  };

  const canProceed = () => {
    switch (step) {
      case 0: // Role selection - optional, can always proceed
        return true;
      case 1: // Basic Personal Information - require name
        return profile.name?.trim() !== '';
      case 2: // Education, Skills, and Work Experience - optional
        return true;
      case 3: // Job Preferences - optional
        return true;
      default:
        return false;
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
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
            >
              Previous
            </Button>
            
            {step < 3 ? (
              <Button 
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
              >
                Next
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={!canProceed()}>
                Save Profile
              </Button>
            )}
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
        initialProfile={initialProfile}
      />
    </ProfileFormProvider>
  );
};

export default UserProfileDialog;
