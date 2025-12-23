import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useI18n';
import TermsPrivacyDialog from '@/components/ui/TermsPrivacyDialog';

interface GuardianDetails {
  id: string;
  userId: string;
  userEmail: string | null;
  userPhone: string | null;
  guardianName: string;
  guardianEmail: string | null;
  guardianPhone: string | null;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GuardianVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  guardianDetails: GuardianDetails;
  profileId: string;
}

const GuardianVerificationModal: React.FC<GuardianVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  guardianDetails,
  profileId
}) => {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRequestingOTP, setIsRequestingOTP] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [consentId, setConsentId] = useState<string | null>(null);
  const [consentResponse, setConsentResponse] = useState<any>(null);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
  const hasRequestedOTPRef = useRef(false);
  const { toast } = useToast();
  const t = useTranslation('auth');

  const requestOTP = useCallback(async () => {
    if (!profileId || !guardianDetails.id || hasRequestedOTPRef.current) return;

    hasRequestedOTPRef.current = true;
    setIsRequestingOTP(true);
    try {
      const response = await apiClient.requestMinorJobApplicationConsent({
        profileId: profileId,
        guardianId: guardianDetails.id
      });
      
      // Extract consent ID from response.consent.id
      const responseId = (response as any)?.consent?.id;
      
      if (response && responseId) {
        setConsentId(responseId);
        setConsentResponse(response);
        setResendCountdown(60); // 60 second countdown before resend is allowed
        
        toast({
          title: t('toastMessages.success', 'Success'),
          description: `OTP sent to ${guardianDetails.guardianEmail || guardianDetails.guardianPhone}`
        });
      } else {
        throw new Error('Invalid response: consent ID not found');
      }
    } catch (error: unknown) {
      hasRequestedOTPRef.current = false; // Reset on error so user can retry
      toast({
        title: t('toastMessages.error', 'Error'),
        description: error instanceof Error ? error.message : 'Failed to send OTP. Please try again.',
        variant: "destructive"
      });
    } finally {
      setIsRequestingOTP(false);
    }
  }, [profileId, guardianDetails.id, guardianDetails.guardianEmail, guardianDetails.guardianPhone, toast, t]);

  // Request OTP when modal opens (only once per modal session)
  useEffect(() => {
    if (isOpen && profileId && guardianDetails.id && !hasRequestedOTPRef.current) {
      requestOTP();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, profileId, guardianDetails.id]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setOtp('');
      setTermsAccepted(false);
      setPrivacyAccepted(false);
      setResendCountdown(0);
      setConsentId(null);
      setConsentResponse(null);
      hasRequestedOTPRef.current = false;
    }
  }, [isOpen]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast({
        title: t('toastMessages.error', 'Error'),
        description: t('toastMessages.completeOTP', 'Please enter the complete 6-digit OTP.'),
        variant: "destructive"
      });
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      toast({
        title: t('toastMessages.error', 'Error'),
        description: 'Please accept both Terms and Conditions and Privacy Policy.',
        variant: "destructive"
      });
      return;
    }

    // Get consent ID from state or extract from stored response
    let verificationId = consentId;
    if (!verificationId && consentResponse) {
      verificationId = consentResponse?.consent?.id;
    }
    
    if (!verificationId) {
      toast({
        title: t('toastMessages.error', 'Error'),
        description: 'OTP request not found. Please close and try again.',
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);
    try {
      // Verify minor job application consent with OTP
      await apiClient.verifyMinorJobApplicationConsent({
        id: verificationId,
        otp: otp,
        termsAccepted: termsAccepted,
        privacyAccepted: privacyAccepted
      });

      // Clear OTP input
      setOtp('');
      
      // Call success callback
      onSuccess();
      
      // Show success toast
      toast({
        title: t('toastMessages.success', 'Success'),
        description: 'Guardian consent verified successfully!'
      });
    } catch (error: unknown) {
      toast({
        title: t('toastMessages.error', 'Error'),
        description: error instanceof Error ? error.message : 'Invalid OTP. Please try again.',
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCountdown > 0 || !profileId || !guardianDetails.id) return;

    setIsResending(true);
    hasRequestedOTPRef.current = false; // Reset flag to allow resend
    try {
      await requestOTP();
    } catch (error: unknown) {
      toast({
        title: t('toastMessages.error', 'Error'),
        description: error instanceof Error ? error.message : 'Failed to resend OTP. Please try again.',
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  const contactMethod = guardianDetails.guardianEmail || guardianDetails.guardianPhone || '';
  const method = guardianDetails.guardianEmail ? 'email' : 'phone';

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Guardian Verification</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Guardian Information Display */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <p className="text-sm font-medium">Guardian Details:</p>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Name:</span> {guardianDetails.guardianName}</p>
              {guardianDetails.guardianEmail && (
                <p><span className="font-medium">Email:</span> {guardianDetails.guardianEmail}</p>
              )}
              {guardianDetails.guardianPhone && (
                <p><span className="font-medium">Phone:</span> {guardianDetails.guardianPhone}</p>
              )}
            </div>
          </div>

          {/* OTP Input */}
          <div className="space-y-4 text-center">
            {isRequestingOTP ? (
              <p className="text-muted-foreground">
                Sending OTP...
              </p>
            ) : (
              <>
                <p className="text-muted-foreground">
                  {t('otpVerification.subtitle', 'We\'ve sent a 6-digit verification code to')}{' '}
                  <span className="font-medium">{contactMethod}</span>
                </p>

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

                {/* Resend OTP */}
                <div className="text-sm">
                  {resendCountdown > 0 ? (
                    <p className="text-muted-foreground">
                      Resend OTP in {resendCountdown} seconds
                    </p>
                  ) : (
                    <button
                      onClick={handleResendOTP}
                      disabled={isResending}
                      className="text-primary hover:underline disabled:opacity-50"
                    >
                      {isResending ? 'Resending...' : 'Resend OTP'}
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Terms and Privacy Checkboxes */}
            <div className="space-y-3 text-left">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="guardian-terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="guardian-terms" className="text-sm leading-relaxed cursor-pointer">
                  On behalf of my ward, I accept the{' '}
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setTermsDialogOpen(true);
                    }}
                    className="text-primary underline cursor-pointer hover:text-primary/80"
                  >
                    Terms and Conditions
                  </span>
                </Label>
              </div>
              
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="guardian-privacy"
                  checked={privacyAccepted}
                  onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="guardian-privacy" className="text-sm leading-relaxed cursor-pointer">
                  On behalf of my ward, I consent to Data{' '}
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setPrivacyDialogOpen(true);
                    }}
                    className="text-primary underline cursor-pointer hover:text-primary/80"
                  >
                    Privacy Policy
                  </span>
                </Label>
              </div>
              
              {(!termsAccepted || !privacyAccepted) && otp.length === 6 && (
                <p className="text-xs text-amber-600 mt-1">
                  Please accept both Terms and Conditions and Privacy Policy to proceed
                </p>
              )}
            </div>

            {/* Verify Button */}
            <div className="space-y-2">
              {!consentId && !consentResponse && !isRequestingOTP && (
                <div className="text-xs text-red-600 p-2 bg-red-50 rounded">
                  OTP request failed. Please close and try again or use Resend OTP.
                </div>
              )}
              
              <Button
                onClick={handleVerify}
                disabled={isVerifying || isRequestingOTP || otp.length !== 6 || !termsAccepted || !privacyAccepted || (!consentId && !consentResponse)}
                className="w-full"
              >
                {isVerifying ? t('otpVerification.verifying', 'Verifying...') : t('otpVerification.verify', 'Verify OTP')}
              </Button>
              
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full"
                disabled={isVerifying || isRequestingOTP}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <TermsPrivacyDialog
      isOpen={termsDialogOpen}
      onClose={() => setTermsDialogOpen(false)}
      url="https://onest.network/terms-of-use"
      title="Terms and Conditions"
    />

    <TermsPrivacyDialog
      isOpen={privacyDialogOpen}
      onClose={() => setPrivacyDialogOpen(false)}
      url="https://onest.network/privacy-policy"
      title="Privacy Policy"
    />
  </>
  );
};

export default GuardianVerificationModal;

