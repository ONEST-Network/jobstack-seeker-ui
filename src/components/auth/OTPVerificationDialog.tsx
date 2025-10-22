
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'react-router-dom';
import { useOrgDetails } from '@/hooks/useOrgDetails';
import { useTranslation } from '@/hooks/useI18n';

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
  const t = useTranslation('auth');

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast({
        title: t('toastMessages.error', 'Error'),
        description: t('toastMessages.completeOTP', 'Please enter the complete 6-digit OTP.'),
        variant: "destructive"
      });
      return;
    }

    try {
      // Prepare the verify payload
      const verifyPayload = {
        name,
        otp,
        rememberMe: true,
        // Include both email and phoneNumber if they are provided, regardless of the primary method
        ...(email ? { email } : {}),
        ...(phoneNumber ? { phoneNumber } : {}),
        ...(orgSlug && orgSlug !== '0' ? {
          joinOrg: {
            join: true,
            orgSlug: orgSlug,
            role: 'seeker'
          }
        } : {})
      };

      await verifyOTP(verifyPayload);
      
      // Clear OTP input
      setOtp('');
      
      // Call success callback
      onSuccess();
      
      // Show success toast
      toast({
        title: t('toastMessages.success', 'Success'),
        description: t('toastMessages.otpVerifiedSuccessfully', 'OTP verified successfully!')
      });
    } catch (error: unknown) {
      toast({
        title: t('toastMessages.error', 'Error'),
        description: error instanceof Error ? error.message : t('toastMessages.invalidOTP', 'Invalid OTP. Please try again.'),
        variant: "destructive"
      });
    }
  };

  const handleResendOTP = async () => {
    try {
      setIsResending(true);
      
      // Prepare the request payload
      const requestPayload = {
        name,
        ...(email ? { email } : {}),
        ...(phoneNumber ? { phoneNumber } : {})
      };

      await requestOTP(requestPayload);

      // Start countdown timer (30 seconds)
      setResendCountdown(30);
      
      toast({
        title: "OTP Sent",
        description: `A new verification code has been sent to ${contactMethod}`,
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to resend OTP. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  // Countdown timer effect
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

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setOtp('');
      setResendCountdown(0);
      setIsResending(false);
    } else {
      // Start initial countdown when dialog opens
      setResendCountdown(30);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('otpVerification.title', 'Verify Your')} {method === 'email' ? t('otpVerification.email', 'Email') : t('otpVerification.phone', 'Phone')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-center">
          <p className="text-muted-foreground">
            {t('otpVerification.subtitle', 'We\'ve sent a 6-digit verification code to')}{' '}
            <span className="font-medium">{contactMethod}</span>
          </p>

          {orgDetails?.data && orgSlug && orgSlug !== '0' && (
            <div className="p-3 bg-muted rounded-lg text-left">
              <h4 className="font-medium text-sm">{t('otpVerification.organization', 'Organization:')}</h4>
              <p className="text-sm font-medium">{orgDetails.data.name}</p>
              <p className="text-xs text-muted-foreground">
                {t('otpVerification.signingUpFor', 'Signing up for')} {orgDetails.data.name}
              </p>
            </div>
          )}

          <div className="flex justify-center">
            <InputOTP value={otp} onChange={setOtp} maxLength={6}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleVerify}
              disabled={isLoading || otp.length !== 6}
              className="w-full"
            >
              {isLoading ? t('otpVerification.verifying', 'Verifying...') : t('otpVerification.verify', 'Verify OTP')}
            </Button>

            <Button 
              variant="ghost" 
              className="w-full"
              onClick={handleResendOTP}
              disabled={resendCountdown > 0 || isResending}
            >
              {isResending 
                ? t('otpVerification.resending', 'Sending...') 
                : resendCountdown > 0 
                  ? t('otpVerification.resendCountdown', 'Resend Code in {{count}}s', { count: resendCountdown })
                  : t('otpVerification.resend', 'Resend Code')
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OTPVerificationDialog;
