import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Info, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useI18n';

interface AgeVerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (birthYear: number, isMinor: boolean) => void;
}

const AgeVerificationDialog: React.FC<AgeVerificationDialogProps> = ({ 
  isOpen, 
  onClose,
  onContinue 
}) => {
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const t = useTranslation('auth');

  // Generate years from 1945 to 2025
  const years = Array.from({ length: 81 }, (_, i) => 2025 - i);

  // Calculate if user is a minor (less than 18 years old)
  const calculateAge = (year: number): number => {
    return new Date().getFullYear() - year;
  };

  const isMinor = birthYear ? calculateAge(birthYear) < 18 : false;

  const handleContinue = () => {
    if (!birthYear) {
      return;
    }

    onContinue(birthYear, isMinor);
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
          {/* Birth Year Selection */}
          <div className="space-y-2">
            <Label htmlFor="birth-year" className="text-sm font-medium">
              {t('ageVerification.birthYearLabel', 'Select birth year')}
            </Label>
            <Select
              value={birthYear?.toString() || ''}
              onValueChange={(value) => setBirthYear(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('ageVerification.birthYearPlaceholder', 'Select your birth year')} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Continue Button */}
          <Button 
            onClick={handleContinue}
            disabled={!birthYear}
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
