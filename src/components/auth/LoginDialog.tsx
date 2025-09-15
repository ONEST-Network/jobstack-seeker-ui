import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'react-router-dom';
import OTPVerificationDialog from './OTPVerificationDialog';
import { useTranslation } from 'react-i18next';

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
  defaultRole: 'individual' | 'organization';
}

const LoginDialog: React.FC<LoginDialogProps> = ({
  isOpen,
  onClose,
  onSwitchToRegister,
  defaultRole
}) => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [step, setStep] = useState<'login' | 'otp-verification'>('login');

  const { requestOTP, isLoading } = useAuth();
  const { toast } = useToast();
  const { orgSlug } = useParams<{ orgSlug?: string }>();
  const { t } = useTranslation('login');

  const formatPhoneNumber = (input: string): string => {
    const digits = input.replace(/\D/g, '');
    if (input.startsWith('+91')) return input;
    if (digits.length === 10) return `+91${digits}`;
    if ((digits.length === 11 || digits.length === 12) && digits.startsWith('91')) {
      return `+${digits}`;
    }
    return input;
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    setFormattedPhone(formatPhoneNumber(value));
  };

  const handleLogin = async () => {
    if (!email && !phone) {
      toast({
        title: t('errors.errorTitle'),
        description: t('errors.emptyFields'),
        variant: 'destructive'
      });
      return;
    }

    if (email && !email.includes('@')) {
      toast({
        title: t('errors.errorTitle'),
        description: t('errors.invalidEmail'),
        variant: 'destructive'
      });
      return;
    }

    if (phone && phone.replace(/\D/g, '').length < 10) {
      toast({
        title: t('errors.errorTitle'),
        description: t('errors.invalidPhone'),
        variant: 'destructive'
      });
      return;
    }

    try {
      const otpData = {
        ...(email && { email }),
        ...(phone && { phoneNumber: formattedPhone || formatPhoneNumber(phone) })
      };

      await requestOTP(otpData);
      setStep('otp-verification');
      toast({
        title: t('messages.otpSentTitle'),
        description: t('messages.otpSentDescription', {
          method: email ? t('form.emailLabel') : t('form.phoneLabel')
        })
      });
    } catch (error: any) {
      toast({
        title: t('errors.errorTitle'),
        description: error.message || t('errors.sendOtpFailed'),
        variant: 'destructive'
      });
    }
  };

  const handleClose = () => {
    setEmail('');
    setPhone('');
    setFormattedPhone('');
    setStep('login');
    onClose();
  };

  const handleOTPVerificationSuccess = () => {
    handleClose();
    toast({
      title: t('messages.welcomeBackTitle'),
      description: t('messages.welcomeBackDescription')
    });
  };

  const canSubmit = () => {
    return email.trim() || phone.trim();
  };

  return (
    <>
      <Dialog open={isOpen && step !== 'otp-verification'} onOpenChange={handleClose}>
        <DialogContent className="w-[95vw] max-w-md mx-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {t('dialog.signIn')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="login-email">{t('form.emailLabel')}</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('form.emailPlaceholder')}
              />
            </div>

            <div>
              <Label htmlFor="login-phone">{t('form.phoneLabel')}</Label>
              <Input
                id="login-phone"
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder={t('form.phonePlaceholder')}
              />
            </div>

            <p className="text-sm text-muted-foreground">
              {t('messages.provideOneMethod')}
            </p>
          </div>

          <div className="space-y-4 mt-4">
            <Button
              onClick={handleLogin}
              disabled={isLoading || !canSubmit()}
              className="w-full"
            >
              {isLoading ? t('buttons.sendingOtp') : t('buttons.sendOtp')}
            </Button>

            <div className="text-center text-sm">
              {t('messages.noAccount')}{' '}
              <Button
                variant="link"
                className="p-0"
                onClick={() => {
                  handleClose();
                  onSwitchToRegister();
                }}
              >
                {t('buttons.createAccount')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <OTPVerificationDialog
        isOpen={step === 'otp-verification'}
        onClose={handleClose}
        onSuccess={handleOTPVerificationSuccess}
        contactMethod={email || phone}
        method={email ? 'email' : 'phone'}
        email={email || undefined}
        phoneNumber={formattedPhone || undefined}
        name={email ? email.split('@')[0] : phone}
      />
    </>
  );
};

export default LoginDialog;
