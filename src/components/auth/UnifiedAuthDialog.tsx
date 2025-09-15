import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'react-router-dom';
import OTPVerificationDialog from './OTPVerificationDialog';
import RegistrationDialog from './RegistrationDialog';
import { useTranslation } from 'react-i18next';

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
  const [step, setStep] = useState<'initial' | 'checking' | 'otp' | 'register'>('initial');
  const [contactInput, setContactInput] = useState('');
  const [contactType, setContactType] = useState<'email' | 'phone'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [formattedPhoneNumber, setFormattedPhoneNumber] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const { verifyOTP } = useAuth();
  const { toast } = useToast();
  const { orgSlug } = useParams<{ orgSlug?: string }>();
  const { t } = useTranslation('unifiedAuth.json');

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
    }, 300);
    return () => clearTimeout(timer);
  }, [contactInput]);

  // Format phone number with country code
  const formatPhoneNumber = (input: string): string => {
    const digits = input.replace(/\D/g, '');
    if (input.startsWith('+91')) return input;
    if (digits.length === 10) return `+91${digits}`;
    if ((digits.length === 11 || digits.length === 12) && digits.startsWith('91')) {
      return `+${digits}`;
    }
    return input;
  };

  const handleContactInputChange = (value: string) => {
    const currentCursorPosition = inputRef.current?.selectionStart || 0;
    setContactInput(value);
    if (contactType === 'phone' || value.replace(/\D/g, '').length >= 10) {
      const formatted = formatPhoneNumber(value);
      setFormattedPhoneNumber(formatted);
      requestAnimationFrame(() => {
        if (inputRef.current) {
          let newCursorPosition = currentCursorPosition;
          if (formatted.startsWith('+91') && !value.startsWith('+91')) {
            newCursorPosition = Math.max(currentCursorPosition + 3, 3);
          }
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
      const phoneDigits = contactInput.replace(/\D/g, '');
      return phoneDigits.length >= 10;
    }
  };

  const handleContinue = async () => {
    if (!validateInput()) {
      toast({
        title: t('errors.invalidInputTitle'),
        description: contactType === 'email' 
          ? t('errors.invalidEmail')
          : t('errors.invalidPhone'),
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setStep('checking');

    try {
      const checkPayload = contactType === 'email' 
        ? { email: contactInput }
        : { phoneNumber: formattedPhoneNumber || formatPhoneNumber(contactInput) };

      const checkResponse = await apiClient.checkUser(checkPayload);

      if (checkResponse.userExists) {
        setUserExists(true);
        setStep('otp');
        const otpResponse = await apiClient.requestOTP(checkPayload);
        if (otpResponse.ok) {
          setShowOTPDialog(true);
        } else {
          toast({
            title: t('errors.errorTitle'),
            description: t('errors.sendOtpFailed'),
            variant: "destructive"
          });
          setStep('initial');
        }
      } else {
        setUserExists(false);
        setStep('register');
        toast({
          title: t('errors.accountNotFoundTitle'),
          description: t('errors.accountNotFoundDescription', {
            type: contactType === 'email' ? t('form.emailLabel') : t('form.phoneLabel'),
            value: contactInput
          })
        });
        setTimeout(() => {
          setShowRegisterDialog(true);
        }, 100);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      toast({
        title: t('errors.errorTitle'),
        description: t('errors.genericError'),
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
      title: t('messages.successTitle'),
      description: t('messages.signedIn')
    });
  };

  const handleRegisterSuccess = () => {
    setShowRegisterDialog(false);
    onClose();
    toast({
      title: t('messages.successTitle'),
      description: t('messages.accountCreated')
    });
  };

  const handleClose = () => {
    setStep('initial');
    setContactInput('');
    setContactType('email');
    setIsLoading(false);
    setUserExists(false);
    setShowOTPDialog(false);
    setShowRegisterDialog(false);
    setFormattedPhoneNumber('');
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      handleClose();
    } else {
      handleClose();
    }
  }, [isOpen]);

  const getContactIcon = () => {
    return contactType === 'email' ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />;
  };

  const getPlaceholder = () => {
    if (contactType === 'phone') {
      return t('form.phonePlaceholder');
    }
    return t('form.contactPlaceholder');
  };

  const getDisplayValue = () => {
    if (contactType === 'phone' && formattedPhoneNumber) {
      return formattedPhoneNumber;
    }
    return contactInput;
  };

  return (
    <>
      <Dialog open={isOpen && step === 'initial'} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-semibold">
              {t('dialog.title')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Contact Input */}
            <div className="space-y-2">
              <Label htmlFor="contact" className="text-sm font-medium">
                {t('form.contactLabel')}
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
                    {contactType === 'phone' ? t('form.phoneLabel') : t('form.emailLabel')}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {contactType === 'phone' 
                      ? t('messages.phoneInfo') 
                      : t('messages.emailInfo')}
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
                  {t('buttons.checking')}
                </>
              ) : (
                <>
                  {t('buttons.continue')}
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
                    <p className="text-sm font-medium">{t('info.title')}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('info.description')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {showOTPDialog && (
        <OTPVerificationDialog
          isOpen={showOTPDialog}
          onClose={() => setShowOTPDialog(false)}
          onSuccess={handleOTPSuccess}
          contactMethod={contactInput}
          method={contactType}
          phoneNumber={contactType === 'phone' ? formattedPhoneNumber || formatPhoneNumber(contactInput) : undefined}
          email={contactType === 'email' ? contactInput : undefined}
          name={contactInput.split('@')[0]}
        />
      )}

      {showRegisterDialog && (
        <RegistrationDialog
          isOpen={showRegisterDialog}
          onClose={() => setShowRegisterDialog(false)}
          defaultRole={defaultRole}
          preFilledEmail={contactType === 'email' ? contactInput : undefined}
          preFilledPhone={contactType === 'phone' ? contactInput : undefined}
        />
      )}
    </>
  );
};

export default UnifiedAuthDialog;
