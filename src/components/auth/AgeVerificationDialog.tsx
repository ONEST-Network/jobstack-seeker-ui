import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { DateOfBirthPicker } from '@/components/ui/date-picker';
import { Info, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useI18n';

interface AgeVerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (birthYear: number, isMinor: boolean, fullDateOfBirth?: Date) => void;
}

const AgeVerificationDialog: React.FC<AgeVerificationDialogProps> = ({ 
  isOpen, 
  onClose,
  onContinue 
}) => {
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [isMinor, setIsMinor] = useState<boolean>(false);
  const t = useTranslation('auth');

  const handleDateChange = (date: Date | undefined) => {
    setBirthDate(date);
  };

  const handleAgeValidation = (minor: boolean, age: number) => {
    setIsMinor(minor);
  };

  const handleContinue = () => {
    if (!birthDate) {
      return;
    }

    const birthYear = birthDate.getFullYear();
    onContinue(birthYear, isMinor, birthDate);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            {t('ageVerification.title', 'To create an account, please provide')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Birth Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="birth-date" className="text-sm font-medium">
              {t('ageVerification.birthDateLabel', 'Select date of birth')}
            </Label>
            <DateOfBirthPicker
              date={birthDate}
              onDateChange={handleDateChange}
              placeholder={t('ageVerification.birthDatePlaceholder', 'Select your date of birth')}
              maxAge={100}
              minAge={0}
              onAgeValidation={handleAgeValidation}
              className="w-full"
            />
          </div>

          {/* Continue Button */}
          <Button 
            onClick={handleContinue}
            disabled={!birthDate}
            className="w-full"
          >
            {t('ageVerification.continue', 'Continue')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          {/* How It Works Info Card */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {t('ageVerification.howItWorks', 'How it works')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('ageVerification.howItWorksDescription', 'Enter your birth year. If you are over 18, we\'ll take you to the account creation page. If you are a minor, under 18, we\'ll first collect consent from your guardian.')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgeVerificationDialog;
