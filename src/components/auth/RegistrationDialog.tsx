
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useParams } from 'react-router-dom';
import OTPVerificationDialog from './OTPVerificationDialog';
import UserProfileDialog from '@/components/profile/UserProfileDialog';
import { useOrgDetails } from '@/hooks/useOrgDetails';
import { useTranslation } from '@/hooks/useI18n';

interface RegistrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole: 'individual' | 'organization';
  preFilledEmail?: string;
  preFilledPhone?: string;
  birthYear?: number;
  isMinor?: boolean;
}

const RegistrationDialog: React.FC<RegistrationDialogProps> = ({ 
  isOpen, 
  onClose, 
  defaultRole,
  preFilledEmail,
  preFilledPhone,
  birthYear,
  isMinor
}) => {
  const [step, setStep] = useState<'register' | 'guardian-otp-verification' | 'minor-register' | 'minor-otp-verification'>('register');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'individual' | 'organization'>('individual');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  
  // State for minor's own details (after guardian verification)
  const [minorName, setMinorName] = useState('');
  const [minorEmail, setMinorEmail] = useState('');
  const [minorPhone, setMinorPhone] = useState('');
  const [minorFormattedPhone, setMinorFormattedPhone] = useState('');
  const [guardianVerified, setGuardianVerified] = useState(false);
  
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const { requestOTP, isLoading } = useAuth();
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
      setEmail(preFilledEmail);
      setPhone('');
      setFormattedPhone('');
    } else if (preFilledPhone) {
      setPhone(preFilledPhone);
      setEmail('');
      const formatted = formatPhoneNumber(preFilledPhone);
      setFormattedPhone(formatted);
    }
  }, [preFilledEmail, preFilledPhone]);

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
      const otpData = {
        name,
        ...(email && { email }),
        ...(phone && { phoneNumber: formattedPhone || formatPhoneNumber(phone) }),
        ...(birthYear && { birthYear })
      };

      await requestOTP(otpData);
      
      // For minors, go to guardian-otp-verification; for adults, go to regular otp-verification
      if (isMinor) {
        setStep('guardian-otp-verification');
      } else {
        setStep('otp-verification');
      }
      
      toast({
        title: "OTP Sent",
        description: `A 6-digit OTP has been sent to ${isMinor ? 'guardian\'s' : 'your'} ${email ? 'email' : 'phone'}.`
      });
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

  const handleOTPVerificationSuccess = () => {
    // If we're in guardian-otp-verification step and guardian is verified, move to minor-register
    if (step === 'guardian-otp-verification') {
      setGuardianVerified(true);
      setStep('minor-register');
      return;
    }
    
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
      <Dialog open={isOpen && step !== 'guardian-otp-verification' && step !== 'minor-otp-verification'} onOpenChange={handleClose}>
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
                      ? t('register.guardianTermsAndConditions', 'On behalf of my ward, I accept the Terms and Conditions')
                      : t('register.termsAndConditions', 'I accept the Terms and Conditions')
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
                      ? t('register.guardianPrivacyPolicy', 'On behalf of my ward, I consent to Data Privacy Policy')
                      : t('register.privacyPolicy', 'I consent to Data Privacy Policy')
                    }
                  </Label>
                </div>
              </div>

              <Button
                onClick={handleRegister}
                disabled={isLoading || !canSubmit()}
                className="w-full"
              >
                {isLoading ? t('register.sendingOTP', 'Sending OTP...') : t('register.sendOTP', 'Send OTP')}
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
                      ...(minorPhone && { phoneNumber: minorFormattedPhone || formatPhoneNumber(minorPhone) }),
                      ...(birthYear && { birthYear })
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

      {/* Guardian OTP Verification Dialog */}
      <OTPVerificationDialog
        isOpen={step === 'guardian-otp-verification'}
        onClose={handleClose}
        onSuccess={handleOTPVerificationSuccess}
        contactMethod={email || phone}
        method={email ? 'email' : 'phone'}
        email={email || undefined}
        phoneNumber={formattedPhone || undefined}
        name={name}
      />

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
        mode="user"
        initialProfile={undefined}
      />
    </>
  );
};

export default RegistrationDialog;
