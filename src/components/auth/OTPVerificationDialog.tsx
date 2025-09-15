import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'react-router-dom';
import { useOrgDetails } from '@/hooks/useOrgDetails';
import { useTranslation } from 'react-i18next';

interface OTPVerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contactMethod: string;
  method: 'email' | 'phone';
  phoneNumber?: string;
  email?: string;
  name?: string;
}

const OTPVerificationDialog: React.FC<OTPVerificationDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  contactMethod,
  method,
  phoneNumber,
  email,
  name
}) => {
  const [otp, setOtp] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const { verifyOTP, requestOTP, isLoading } = useAuth();
  const { toast } = useToast();
  const { orgSlug } = useParams<{ orgSlug?: string }>();
  const { data: orgDetails } = useOrgDetails(orgSlug || null);

  const { t } = useTranslation('otpVerification');

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast({
        title: t('toast.errorTitle'),
        description: t('verification.incompleteOtp'),
        variant: 'destructive'
      });
      return;
    }

    try {
      const verifyPayload = {
        name,
        otp,
        rememberMe: true,
        ...(email ? { email } : {}),
        ...(phoneNumber ? { phoneNumber } : {}),
        ...(orgSlug && orgSlug !== '0'
          ? {
              joinOrg: {
                join: true,
                orgSlug: orgSlug,
                role: 'seeker'
              }
            }
          : {})
      };

      await verifyOTP(verifyPayload);

      setOtp('');
      onSuccess();

      toast({
        title: t('toast.successTitle'),
        description: t('verification.verificationSuccess')
      });
    } catch (error: unknown) {
      toast({
        title: t('toast.errorTitle'),
        description:
          error instanceof Error
            ? error.message
            : t('verification.verificationFailed'),
        variant: 'destructive'
      });
    }
  };

  const handleResendOTP = async () => {
    try {
      setIsResending(true);

      const requestPayload = {
        name,
        ...(email ? { email } : {}),
        ...(phoneNumber ? { phoneNumber } : {})
      };

      await requestOTP(requestPayload);
      setResendCountdown(30);

      toast({
        title: t('resend.resentTitle'),
        description: t('resend.resentMessage', { contact: contactMethod })
      });
    } catch (error: unknown) {
      toast({
        title: t('toast.errorTitle'),
        description:
          error instanceof Error
            ? error.message
            : t('resend.resendFailed'),
        variant: 'destructive'
      });
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resendCountdown]);

  useEffect(() => {
    if (!isOpen) {
      setOtp('');
      setResendCountdown(0);
      setIsResending(false);
    } else {
      setResendCountdown(30);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('dialog.title', { method: method === 'email' ? 'Email' : 'Phone' })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-center">
          <p className="text-muted-foreground">
            {t('dialog.instruction', { contact: contactMethod })}
          </p>

          {orgDetails?.data && orgSlug && orgSlug !== '0' && (
            <div className="p-3 bg-muted rounded-lg text-left">
              <h4 className="font-medium text-sm">{t('organization.title')}</h4>
              <p className="text-sm font-medium">{orgDetails.data.name}</p>
              <p className="text-xs text-muted-foreground">
                {t('organization.signingUp', { org: orgDetails.data.name })}
              </p>
            </div>
          )}

          <div className="flex justify-center">
            <InputOTP value={otp} onChange={setOtp} maxLength={6}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <InputOTPSlot key={index} index={index} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleVerify}
              disabled={isLoading || otp.length !== 6}
              className="w-full"
            >
              {isLoading ? t('buttons.verifying') : t('buttons.verify')}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={handleResendOTP}
              disabled={resendCountdown > 0 || isResending}
            >
              {isResending
                ? t('buttons.sending')
                : resendCountdown > 0
                ? t('buttons.resendCountdown', { count: resendCountdown })
                : t('buttons.resend')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OTPVerificationDialog;
