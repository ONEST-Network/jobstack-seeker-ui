
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useParams } from 'react-router-dom';
import OTPVerificationDialog from './OTPVerificationDialog';
import UserProfileDialog from '@/components/profile/UserProfileDialog';
import { useOrgDetails } from '@/hooks/useOrgDetails';
import { useTranslation } from '@/hooks/useI18n';
import { apiClient } from '@/lib/api';
import TermsPrivacyDialog from '@/components/ui/TermsPrivacyDialog';

interface RegistrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole: 'individual' | 'organization';
  preFilledEmail?: string;
  preFilledPhone?: string;
  dateOfBirth?: string;
  isMinor?: boolean;
}

const RegistrationDialog: React.FC<RegistrationDialogProps> = ({ 
  isOpen, 
  onClose, 
  defaultRole,
  preFilledEmail,
  preFilledPhone,
  dateOfBirth,
  isMinor
}) => {
  const [step, setStep] = useState<'register' | 'guardian-otp-verification' | 'minor-register' | 'minor-otp-verification' | 'otp-verification'>('register');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'individual' | 'organization'>('individual');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
  
  // State for minor's own details (after guardian verification)
  const [minorName, setMinorName] = useState('');
  const [minorEmail, setMinorEmail] = useState('');
  const [minorPhone, setMinorPhone] = useState('');
  const [minorFormattedPhone, setMinorFormattedPhone] = useState('');
  const [guardianVerified, setGuardianVerified] = useState(false);
  const [guardianConsentId, setGuardianConsentId] = useState<string | null>(null);
  const [guardianOTP, setGuardianOTP] = useState<string>('');
  
  // Store prefilled minor contact info from signin modal
  const [minorUserEmail, setMinorUserEmail] = useState<string | undefined>(preFilledEmail);
  const [minorUserPhone, setMinorUserPhone] = useState<string | undefined>(preFilledPhone);
  
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const { requestOTP, isLoading } = useAuth();
  const [isGuardianVerifying, setIsGuardianVerifying] = useState(false);
  const [isCreatingGuardianConsent, setIsCreatingGuardianConsent] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const { orgSlug } = useParams<{ orgSlug?: string }>();
  const { data: orgDetails } = useOrgDetails(orgSlug || null);
  const t = useTranslation('auth');

  // Always set role to individual - organization registration is disabled
  useEffect(() => {
    setRole('individual');
  }, [defaultRole]);

  // Format phone number with country code
  const formatPhoneNumber = (input: string): string => {
    const digits = input.replace(/\D/g, '');
    
    // If it already starts with +91, return as is
    if (input.startsWith('+91')) {
      return input;
    }
    
    // If it's a 10-digit number, add +91
    if (digits.length === 10) {
      return `+91${digits}`;
    }
    
    // If it's an 11-digit number starting with 91, add +
    if (digits.length === 11 && digits.startsWith('91')) {
      return `+${digits}`;
    }
    
    // If it's a 12-digit number starting with 91, add +
    if (digits.length === 12 && digits.startsWith('91')) {
      return `+${digits}`;
    }
    
    // For other cases, just add +91 if it's a 10-digit number
    if (digits.length === 10) {
      return `+91${digits}`;
    }
    
    return input;
  };

  // Handle pre-filled contact information
  useEffect(() => {
    if (preFilledEmail) {
      if (isMinor) {
        // For minors, store for minor registration only, don't set guardian email
        setMinorUserEmail(preFilledEmail);
        setEmail('');
        setPhone('');
        setFormattedPhone('');
      } else {
        // For non-minor users, prefill the email field
        setEmail(preFilledEmail);
      }
    } else if (preFilledPhone) {
      if (isMinor) {
        // For minors, store for minor registration only, don't set guardian phone
        setMinorUserPhone(preFilledPhone);
        setEmail('');
        setPhone('');
        setFormattedPhone('');
      } else {
        // For non-minor users, prefill the phone field
        const formatted = formatPhoneNumber(preFilledPhone);
        setPhone(preFilledPhone);
        setFormattedPhone(formatted);
      }
    }
  }, [preFilledEmail, preFilledPhone, isMinor]);
  
  // Prefill minor registration form when guardian is verified
  useEffect(() => {
    if (guardianVerified && (minorUserEmail || minorUserPhone)) {
      if (minorUserEmail) {
        setMinorEmail(minorUserEmail);
      }
      if (minorUserPhone) {
        setMinorPhone(minorUserPhone);
        setMinorFormattedPhone(formatPhoneNumber(minorUserPhone));
      }
    }
  }, [guardianVerified, minorUserEmail, minorUserPhone]);

  const handlePhoneChange = (value: string) => {
    const currentCursorPosition = phoneInputRef.current?.selectionStart || 0;
    
    setPhone(value);
    const formatted = formatPhoneNumber(value);
    setFormattedPhone(formatted);
    
    // Handle cursor position after formatting
    requestAnimationFrame(() => {
      if (phoneInputRef.current) {
        let newCursorPosition = currentCursorPosition;
        
        // If the formatted value has +91 prefix and the original input didn't start with it
        if (formatted.startsWith('+91') && !value.startsWith('+91')) {
          // Position cursor after the +91 prefix
          newCursorPosition = Math.max(currentCursorPosition + 3, 3);
        }
        
        // Ensure cursor is within the input bounds
        const maxPosition = formatted.length;
        newCursorPosition = Math.min(newCursorPosition, maxPosition);
        
        phoneInputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    });
  };

  const handleTermsChange = (checked: boolean | "indeterminate") => {
    setTermsAccepted(checked === true);
  };

  const handlePrivacyChange = (checked: boolean | "indeterminate") => {
    setPrivacyAccepted(checked === true);
  };

  const handleRegister = async () => {
    if (!termsAccepted || !privacyAccepted) {
      toast({
        title: "Error",
        description: "Please accept the terms and conditions and privacy policy.",
        variant: "destructive"
      });
      return;
    }

    if (!name) {
      toast({
        title: "Error",
        description: "Please enter your name.",
        variant: "destructive"
      });
      return;
    }

    if (!email && !phone) {
      toast({
        title: "Error",
        description: "Please enter either your email address or phone number.",
        variant: "destructive"
      });
      return;
    }
    // Phone registration validation commented out - phone registration not implemented
    // if (method === 'phone' && !phone) {
    //   toast({
    //     title: "Error",
    //     description: "Please enter your phone number.",
    //     variant: "destructive"
    //   });
    //   return;
    // }


    // Validate email if provided
    if (email && !email.includes('@')) {
      toast({
        title: "Error",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    // Validate phone if provided
    if (phone && phone.replace(/\D/g, '').length < 10) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number.",
        variant: "destructive"
      });
      return;
    }

    try {
      // For minors, don't call requestOTP. Instead, create guardian consent first
      if (isMinor) {
        setIsCreatingGuardianConsent(true);
        try {
          // Create guardian consent with minor's email/phone from prefilled values
          const guardianConsentResponse = await apiClient.createGuardianConsent({
            userEmail: minorUserEmail,
            userPhone: minorUserPhone ? (minorUserPhone.startsWith('+') ? minorUserPhone : formatPhoneNumber(minorUserPhone)) : undefined,
            guardianName: name,
            guardianEmail: email || undefined,
            guardianPhone: formattedPhone || undefined
          });
          
          // Store the consent ID
          const consentId = guardianConsentResponse.consent.id;
          setGuardianConsentId(consentId);
          
          // The guardian consent API should send an OTP to the guardian
          // Move to OTP verification step
          setStep('guardian-otp-verification');
          
          toast({
            title: "OTP Sent",
            description: `A 6-digit OTP has been sent to guardian's ${email ? 'email' : 'phone'}.`
          });
        } catch (guardianError) {
          throw guardianError; // Re-throw to be caught by outer catch
        } finally {
          setIsCreatingGuardianConsent(false);
        }
      } else {
        // For regular users, proceed with normal OTP flow
        const otpData = {
          name,
          ...(email && { email }),
          ...(phone && { phoneNumber: formattedPhone || formatPhoneNumber(phone) })
        };

        await requestOTP(otpData);
        setStep('otp-verification');
        
        toast({
          title: "OTP Sent",
          description: `A 6-digit OTP has been sent to your ${email ? 'email' : 'phone'}.`
        });
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send OTP. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    setStep('register');
    setEmail('');
    setPhone('');
    setFormattedPhone('');
    setName('');
    setRole(defaultRole);
    setTermsAccepted(false);
    setPrivacyAccepted(false);
    setShowProfileDialog(false);
    onClose();
  };

  const handleGuardianOTPVerify = async (otp: string) => {
    if (!guardianConsentId) {
      toast({
        title: "Error",
        description: "Guardian consent not found. Please try again.",
        variant: "destructive"
      });
      return;
    }

    setIsGuardianVerifying(true);
    try {
      // Verify guardian consent with the OTP
      await apiClient.verifyGuardianConsent({
        id: guardianConsentId,
        otp: otp,
        termsAccepted: termsAccepted,
        privacyAccepted: privacyAccepted
      });
      
      setGuardianVerified(true);
      setStep('minor-register');
      
      toast({
        title: "Success",
        description: "Guardian consent verified successfully!"
      });
    } catch (error) {
      console.error('Error verifying guardian consent:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to verify guardian consent. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGuardianVerifying(false);
    }
  };

  const handleOTPVerificationSuccess = async (response?: any) => {
    // Check if user is on seeker path and role is individual
    const isSeeker = location.pathname.startsWith('/seeker');
    
    if (isSeeker && role === 'individual') {
      // Show profile dialog for new seekers
      setShowProfileDialog(true);
    } else {
      // Standard flow for other cases
      handleClose();
      toast({
        title: "Registration Complete",
        description: "Your account has been created successfully!"
      });
    }
  };

  const canSubmit = () => {
    return name.trim() && (email.trim() || phone.trim()) && termsAccepted && privacyAccepted;
  };

  return (
    <>
      <Dialog open={isOpen && step !== 'guardian-otp-verification' && step !== 'minor-otp-verification' && step !== 'otp-verification'} onOpenChange={handleClose}>
        <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto p-4 sm:p-6" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{t('register.title', 'Create Account')}</DialogTitle>
          </DialogHeader>

          {step === 'register' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">
                  {isMinor 
                    ? t('register.guardianNameLabel', 'My parent\'s or Guardian Name')
                    : t('register.nameLabel', 'Full Name')
                  } *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isMinor 
                    ? t('register.guardianNamePlaceholder', 'Enter guardian name')
                    : t('register.namePlaceholder', 'Enter your full name')
                  }
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">
                    {isMinor 
                      ? t('register.guardianEmailLabel', 'Parent\'s or Guardian Email')
                      : t('register.emailLabel', 'Email Address')
                    }
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('register.emailPlaceholder', 'your@email.com')}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">
                    {isMinor 
                      ? t('register.guardianPhoneLabel', 'Parent\'s or Guardian Phone Number')
                      : t('register.phoneLabel', 'Phone Number')
                    }
                  </Label>
                  <Input
                    ref={phoneInputRef}
                    id="phone"
                    type="tel"
                    value={formattedPhone || phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder={t('register.phonePlaceholder', '+91 98765 43210')}
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  * {t('register.contactMethodNote', 'Please provide at least one contact method (email or phone)')}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={handleTermsChange}
                    className="mt-0.5"
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed">
                    {isMinor 
                      ? (
                        <>
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
                        </>
                      )
                      : (
                        <>
                          I accept the{' '}
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
                        </>
                      )
                    }
                  </Label>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="privacy"
                    checked={privacyAccepted}
                    onCheckedChange={handlePrivacyChange}
                    className="mt-0.5"
                  />
                  <Label htmlFor="privacy" className="text-sm leading-relaxed">
                    {isMinor 
                      ? (
                        <>
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
                        </>
                      )
                      : (
                        <>
                          I consent to Data{' '}
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
                        </>
                      )
                    }
                  </Label>
                </div>
              </div>

              <Button
                onClick={handleRegister}
                disabled={isLoading || isCreatingGuardianConsent || !canSubmit()}
                className="w-full"
              >
                {isLoading || isCreatingGuardianConsent ? t('register.sendingOTP', 'Sending OTP...') : t('register.sendOTP', 'Send OTP')}
              </Button>
            </div>
          )}

          {/* Minor Registration Form (shows after guardian verification) */}
          {step === 'minor-register' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Now let's create an account for you. Please provide your details:
              </p>
              
              <div>
                <Label htmlFor="minor-name">{t('register.nameLabel', 'Full Name')} *</Label>
                <Input
                  id="minor-name"
                  type="text"
                  value={minorName}
                  onChange={(e) => setMinorName(e.target.value)}
                  placeholder={t('register.namePlaceholder', 'Enter your full name')}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="minor-email">{t('register.emailLabel', 'Email Address')}</Label>
                  <Input
                    id="minor-email"
                    type="email"
                    value={minorEmail}
                    onChange={(e) => setMinorEmail(e.target.value)}
                    placeholder={t('register.emailPlaceholder', 'your@email.com')}
                  />
                </div>

                <div>
                  <Label htmlFor="minor-phone">{t('register.phoneLabel', 'Phone Number')}</Label>
                  <Input
                    id="minor-phone"
                    type="tel"
                    value={minorFormattedPhone || minorPhone}
                    onChange={(e) => {
                      const value = e.target.value;
                      setMinorPhone(value);
                      setMinorFormattedPhone(formatPhoneNumber(value));
                    }}
                    placeholder={t('register.phonePlaceholder', '+91 98765 43210')}
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  * {t('register.contactMethodNote', 'Please provide at least one contact method (email or phone)')}
                </p>
              </div>

              <Button
                onClick={async () => {
                  // Validate minor details
                  if (!minorName) {
                    toast({
                      title: "Error",
                      description: "Please enter your full name.",
                      variant: "destructive"
                    });
                    return;
                  }

                  if (!minorEmail && !minorPhone) {
                    toast({
                      title: "Error",
                      description: "Please enter either your email address or phone number.",
                      variant: "destructive"
                    });
                    return;
                  }

                  try {
                    const otpData = {
                      name: minorName,
                      ...(minorEmail && { email: minorEmail }),
                      ...(minorPhone && { phoneNumber: minorFormattedPhone || formatPhoneNumber(minorPhone) })
                    };

                    await requestOTP(otpData);
                    setStep('minor-otp-verification');
                    toast({
                      title: "OTP Sent",
                      description: `A 6-digit OTP has been sent to your ${minorEmail ? 'email' : 'phone'}.`
                    });
                  } catch (error: unknown) {
                    toast({
                      title: "Error",
                      description: error instanceof Error ? error.message : "Failed to send OTP. Please try again.",
                      variant: "destructive"
                    });
                  }
                }}
                disabled={isLoading || !minorName.trim() || (!minorEmail.trim() && !minorPhone.trim())}
                className="w-full"
              >
                {isLoading ? t('register.sendingOTP', 'Sending OTP...') : t('register.sendOTP', 'Send OTP')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Guardian OTP Verification Dialog - Custom inline for guardian consent verification */}
      <Dialog open={isOpen && step === 'guardian-otp-verification'} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{t('otpVerification.title', 'Verify Guardian')} {email ? t('otpVerification.email', 'Email') : t('otpVerification.phone', 'Phone')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-center">
            <p className="text-muted-foreground">
              {t('otpVerification.subtitle', 'We\'ve sent a 6-digit verification code to')}{' '}
              <span className="font-medium">{email || phone}</span>
            </p>

            <div className="flex justify-center">
              <InputOTP value={guardianOTP} onChange={setGuardianOTP} maxLength={6}>
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
                onClick={() => handleGuardianOTPVerify(guardianOTP)}
                disabled={isGuardianVerifying || guardianOTP.length !== 6}
                className="w-full"
              >
                {isGuardianVerifying ? t('otpVerification.verifying', 'Verifying...') : t('otpVerification.verify', 'Verify OTP')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Minor OTP Verification Dialog */}
      <OTPVerificationDialog
        isOpen={step === 'minor-otp-verification'}
        onClose={handleClose}
        onSuccess={handleOTPVerificationSuccess}
        contactMethod={minorEmail || minorPhone}
        method={minorEmail ? 'email' : 'phone'}
        email={minorEmail || undefined}
        phoneNumber={minorFormattedPhone || undefined}
        name={minorName}
        dateOfBirth={dateOfBirth}
      />

      <OTPVerificationDialog
        isOpen={step === 'otp-verification'}
        onClose={handleClose}
        onSuccess={handleOTPVerificationSuccess}
        contactMethod={email || phone}
        method={email ? 'email' : 'phone'}
        email={email || undefined}
        phoneNumber={formattedPhone || undefined}
        name={name}
        dateOfBirth={dateOfBirth}
      />

      <UserProfileDialog
        isOpen={showProfileDialog}
        onClose={() => {
          setShowProfileDialog(false);
          handleClose();
          toast({
            title: t('register.success.profileCreated', 'Profile Created'),
            description: t('register.success.profileCreatedDesc', 'Welcome! Your profile has been created successfully.')
          });
        }}
        mode="individual"
        initialProfile={undefined}
      />

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

export default RegistrationDialog;
