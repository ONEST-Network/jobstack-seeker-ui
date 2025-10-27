import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, RequestOTPResponse } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'react-router-dom';
import { useTranslation } from '@/hooks/useI18n';
import OTPVerificationDialog from './OTPVerificationDialog';
import RegistrationDialog from './RegistrationDialog';
import AgeVerificationDialog from './AgeVerificationDialog';

interface UnifiedAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'individual' | 'organization';
}

const UnifiedAuthDialog: React.FC<UnifiedAuthDialogProps> = ({ 
  isOpen, 
  onClose, 
  defaultRole = 'individual' 
}) => {
  const [step, setStep] = useState<'initial' | 'checking' | 'otp' | 'age-verification' | 'register'>('initial');
  const [contactInput, setContactInput] = useState('');
  const [contactType, setContactType] = useState<'email' | 'phone'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showAgeVerificationDialog, setShowAgeVerificationDialog] = useState(false);
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [isMinor, setIsMinor] = useState(false);
  const [formattedPhoneNumber, setFormattedPhoneNumber] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const { verifyOTP } = useAuth();
  const { toast } = useToast();
  const { orgSlug } = useParams<{ orgSlug?: string }>();
  const t = useTranslation('auth');

  // Debounced contact type detection
  useEffect(() => {
    if (!contactInput) {
      setContactType('email');
      return;
    }

    const timer = setTimeout(() => {
      if (contactInput.includes('@')) {
        setContactType('email');
      } else {
        const phoneDigits = contactInput.replace(/\D/g, '');
        if (phoneDigits.length >= 3) {
          setContactType('phone');
        }
      }
    }, 300); // 300ms delay to prevent rapid changes

    return () => clearTimeout(timer);
  }, [contactInput]);

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

  const handleContactInputChange = (value: string) => {
    const currentCursorPosition = inputRef.current?.selectionStart || 0;
    
    setContactInput(value);
    
    // Format phone number if it's a phone input
    if (contactType === 'phone' || value.replace(/\D/g, '').length >= 10) {
      const formatted = formatPhoneNumber(value);
      setFormattedPhoneNumber(formatted);
      
      // Handle cursor position after formatting
      requestAnimationFrame(() => {
        if (inputRef.current) {
          let newCursorPosition = currentCursorPosition;
          
          // If the formatted value has +91 prefix and the original input didn't start with it
          if (formatted.startsWith('+91') && !value.startsWith('+91')) {
            // Position cursor after the +91 prefix
            newCursorPosition = Math.max(currentCursorPosition + 3, 3);
          }
          
          // Ensure cursor is within the input bounds
          const maxPosition = formatted.length;
          newCursorPosition = Math.min(newCursorPosition, maxPosition);
          
          inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
        }
      });
    } else {
      setFormattedPhoneNumber('');
    }
  };

  const validateInput = () => {
    if (contactType === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(contactInput);
    } else {
      // Phone validation - should have at least 10 digits
      const phoneDigits = contactInput.replace(/\D/g, '');
      return phoneDigits.length >= 10;
    }
  };

  const handleContinue = async () => {
    if (!validateInput()) {
      toast({
        title: t('toastMessages.error', 'Error'),
        description: contactType === 'email' 
          ? t('toastMessages.invalidEmail', 'Please enter a valid email address')
          : t('toastMessages.invalidPhone', 'Please enter a valid phone number'),
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setStep('checking');

    try {
      // Prepare payload based on contact type
      const checkPayload = contactType === 'email' 
        ? { email: contactInput }
        : { phoneNumber: formattedPhoneNumber || formatPhoneNumber(contactInput) };

      // First, check if user exists
      const checkResponse = await apiClient.checkUser(checkPayload);
      
      if (checkResponse.userExists) {
        // User exists - request OTP and show verification
        setUserExists(true);
        setStep('otp');
        
        // Request OTP for existing user
        const otpResponse = await apiClient.requestOTP(checkPayload);
        
        if (otpResponse.ok) {
          setShowOTPDialog(true);
        } else {
          toast({
            title: t('toastMessages.error', 'Error'),
            description: t('toastMessages.otpSendFailed', 'Failed to send OTP. Please try again.'),
            variant: "destructive"
          });
          setStep('initial');
        }
      } else {
        // User doesn't exist - show age verification first
        setUserExists(false);
        setStep('age-verification');
        
        // Show toast first
        const contactValue = contactType === 'phone' ? formattedPhoneNumber || formatPhoneNumber(contactInput) : contactInput;
        toast({
          title: t('toastMessages.accountNotFound', 'Account Not Found'),
          description: contactType === 'email' 
            ? `No account found with email ${contactValue}. Please create a new account.`
            : `No account found with phone number ${contactValue}. Please create a new account.`,
        });
        
        // Small delay before showing age verification dialog to ensure toast is properly established
        setTimeout(() => {
          setShowAgeVerificationDialog(true);
        }, 100);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      toast({
        title: t('toastMessages.error', 'Error'),
        description: t('toastMessages.genericError', 'Something went wrong. Please try again.'),
        variant: "destructive"
      });
      setStep('initial');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSuccess = () => {
    setShowOTPDialog(false);
    onClose();
    toast({
      title: t('toastMessages.success', 'Success'),
      description: t('toastMessages.signInSuccess', 'Successfully signed in!'),
    });
  };

  const handleRegisterSuccess = () => {
    setShowRegisterDialog(false);
    onClose();
    toast({
      title: t('toastMessages.success', 'Success'),
      description: t('toastMessages.accountCreatedSuccess', 'Account created successfully!'),
    });
  };

  const handleAgeVerificationContinue = (year: number, minor: boolean) => {
    setBirthYear(year);
    setIsMinor(minor);
    setShowAgeVerificationDialog(false);
    setStep('register');
    
    // Small delay before showing registration dialog
    setTimeout(() => {
      setShowRegisterDialog(true);
    }, 100);
  };

  const handleClose = () => {
    // Reset all state
    setStep('initial');
    setContactInput('');
    setContactType('email');
    setIsLoading(false);
    setUserExists(false);
    setShowOTPDialog(false);
    setShowRegisterDialog(false);
    setShowAgeVerificationDialog(false);
    setBirthYear(null);
    setIsMinor(false);
    setFormattedPhoneNumber('');
    
    // Close the modal
    onClose();
  };

  // Handle modal open/close changes
  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal is closed
      setStep('initial');
      setContactInput('');
      setContactType('email');
      setIsLoading(false);
      setUserExists(false);
      setShowOTPDialog(false);
      setShowRegisterDialog(false);
      setShowAgeVerificationDialog(false);
      setBirthYear(null);
      setIsMinor(false);
      setFormattedPhoneNumber('');
    } else {
      // Reset state when modal is opened
      setStep('initial');
      setContactInput('');
      setContactType('email');
      setIsLoading(false);
      setUserExists(false);
      setShowOTPDialog(false);
      setShowRegisterDialog(false);
      setShowAgeVerificationDialog(false);
      setBirthYear(null);
      setIsMinor(false);
      setFormattedPhoneNumber('');
    }
  }, [isOpen]);

  const getContactIcon = () => {
    return contactType === 'email' ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />;
  };

  const getPlaceholder = () => {
    if (contactType === 'phone') {
      return t('unifiedAuth.placeholders.phone', 'Enter your phone number');
    }
    return t('unifiedAuth.placeholders.emailOrPhone', 'Enter your phone number or email');
  };

  const getDisplayValue = () => {
    if (contactType === 'phone' && formattedPhoneNumber) {
      return formattedPhoneNumber;
    }
    return contactInput;
  };

  return (
    <>
      <Dialog 
        open={isOpen && step === 'initial'} 
        onOpenChange={(open) => {
          // Only allow closing if no sub-dialogs are open
          if (!open && !showOTPDialog && !showAgeVerificationDialog && !showRegisterDialog) {
            handleClose();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-semibold">
              {t('unifiedAuth.title', 'Sign in or create account')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Contact Input */}
            <div className="space-y-2">
              <Label htmlFor="contact" className="text-sm font-medium">
                {t('unifiedAuth.labels.contact', 'Enter mobile number or email')}
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  {getContactIcon()}
                </div>
                <Input
                  ref={inputRef}
                  id="contact"
                  type="text"
                  placeholder={getPlaceholder()}
                  value={getDisplayValue()}
                  onChange={(e) => handleContactInputChange(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
              {contactInput && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {contactType === 'phone' 
                      ? t('unifiedAuth.badges.phoneNumber', 'Phone Number') 
                      : t('unifiedAuth.badges.emailAddress', 'Email Address')
                    }
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {contactType === 'phone' 
                      ? t('unifiedAuth.descriptions.smsCode', 'We\'ll send you an SMS with a verification code')
                      : t('unifiedAuth.descriptions.emailCode', 'We\'ll send you a verification code via email')
                    }
                  </span>
                </div>
              )}
            </div>

            {/* Continue Button */}
            <Button 
              onClick={handleContinue}
              disabled={!validateInput() || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('unifiedAuth.buttons.checking', 'Checking...')}
                </>
              ) : (
                <>
                  {t('unifiedAuth.buttons.continue', 'Continue')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            {/* Info Card */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('unifiedAuth.infoCard.title', 'How it works')}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('unifiedAuth.infoCard.description', 'Enter your email or phone number. If you have an account, we\'ll send you a verification code. If not, we\'ll help you create a new account.')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* OTP Verification Dialog */}
      {showOTPDialog && (
        <OTPVerificationDialog
          isOpen={showOTPDialog}
          onClose={() => setShowOTPDialog(false)}
          onSuccess={handleOTPSuccess}
          contactMethod={contactInput}
          method={contactType}
          phoneNumber={contactType === 'phone' ? formattedPhoneNumber || formatPhoneNumber(contactInput) : undefined}
          email={contactType === 'email' ? contactInput : undefined}
          name={contactInput.split('@')[0]} // Use the part before @ for email, or full input for phone
        />
      )}

      {/* Age Verification Dialog */}
      {showAgeVerificationDialog && (
        <AgeVerificationDialog
          isOpen={showAgeVerificationDialog}
          onClose={() => setShowAgeVerificationDialog(false)}
          onContinue={handleAgeVerificationContinue}
        />
      )}

      {/* Registration Dialog */}
      {showRegisterDialog && (
        <RegistrationDialog
          isOpen={showRegisterDialog}
          onClose={() => setShowRegisterDialog(false)}
          defaultRole={defaultRole}
          preFilledEmail={contactType === 'email' ? contactInput : undefined}
          preFilledPhone={contactType === 'phone' ? contactInput : undefined}
          birthYear={birthYear || undefined}
          isMinor={isMinor}
        />
      )}
    </>
  );
};

export default UnifiedAuthDialog; 