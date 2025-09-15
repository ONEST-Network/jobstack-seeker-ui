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
import { useTranslation } from 'react-i18next';

interface RegistrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole: 'individual' | 'organization';
  preFilledEmail?: string;
  preFilledPhone?: string;
}

const RegistrationDialog: React.FC<RegistrationDialogProps> = ({ 
  isOpen, 
  onClose, 
  defaultRole,
  preFilledEmail,
  preFilledPhone
}) => {
  const [step, setStep] = useState<'register' | 'otp-verification'>('register');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'individual' | 'organization'>('individual');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const { requestOTP, isLoading } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const { orgSlug } = useParams<{ orgSlug?: string }>();
  const { data: orgDetails } = useOrgDetails(orgSlug || null);

  const { t } = useTranslation();

  // Always set role to individual - organization registration is disabled
  useEffect(() => {
    setRole('individual');
  }, [defaultRole]);

  // Format phone number with country code
  const formatPhoneNumber = (input: string): string => {
    const digits = input.replace(/\D/g, '');
    if (input.startsWith('+91')) return input;
    if (digits.length === 10) return `+91${digits}`;
    if ((digits.length === 11 || digits.length === 12) && digits.startsWith('91')) return `+${digits}`;
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
    requestAnimationFrame(() => {
      if (phoneInputRef.current) {
        let newCursorPosition = currentCursorPosition;
        if (formatted.startsWith('+91') && !value.startsWith('+91')) {
          newCursorPosition = Math.max(currentCursorPosition + 3, 3);
        }
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
        title: t("registration.errors.accept"),
        variant: "destructive"
      });
      return;
    }
    if (!name) {
      toast({
        title: t("registration.errors.name"),
        variant: "destructive"
      });
      return;
    }
    if (!email && !phone) {
      toast({
        title: t("registration.errors.contact"),
        variant: "destructive"
      });
      return;
    }
    if (email && !email.includes('@')) {
      toast({
        title: t("registration.errors.email"),
        variant: "destructive"
      });
      return;
    }
    if (phone && phone.replace(/\D/g, '').length < 10) {
      toast({
        title: t("registration.errors.phone"),
        variant: "destructive"
      });
      return;
    }

    try {
      const otpData = {
        name,
        ...(email && { email }),
        ...(phone && { phoneNumber: formattedPhone || formatPhoneNumber(phone) })
      };
      await requestOTP(otpData);
      setStep('otp-verification');
      toast({
        title: t("registration.otpSentTitle"),
        description: t("registration.otpSentDescription", { method: email ? "email" : "phone" })
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : t("registration.errors.otp"),
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
    const isSeeker = location.pathname.startsWith('/seeker');
    if (isSeeker && role === 'individual') {
      setShowProfileDialog(true);
    } else {
      handleClose();
      toast({
        title: t("registration.registrationComplete"),
        description: t("registration.registrationCompleteDescription")
      });
    }
  };

  const canSubmit = () => {
    return name.trim() && (email.trim() || phone.trim()) && termsAccepted && privacyAccepted;
  };

  return (
    <>
      <Dialog open={isOpen && step !== 'otp-verification'} onOpenChange={handleClose}>
        <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{t("registration.title")}</DialogTitle>
          </DialogHeader>

          {step === 'register' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">{t("registration.fullName")}</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("registration.fullNamePlaceholder")}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">{t("registration.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("registration.emailPlaceholder")}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">{t("registration.phone")}</Label>
                  <Input
                    ref={phoneInputRef}
                    id="phone"
                    type="tel"
                    value={formattedPhone || phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder={t("registration.phonePlaceholder")}
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  {t("registration.contactHint")}
                </p>
              </div>

              <div className="space-y-4">
                <Label>{t("registration.accountType")}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    variant={role === 'individual' ? 'default' : 'outline'}
                    onClick={() => setRole('individual')}
                    className="h-16 sm:h-20 flex flex-col"
                  >
                    <span className="font-medium text-sm sm:text-base">{t("registration.individual")}</span>
                    <span className="text-xs text-muted-foreground">{t("registration.individualHint")}</span>
                  </Button>
                  <Button
                    variant="outline"
                    disabled={true}
                    className="h-16 sm:h-20 flex flex-col opacity-50 cursor-not-allowed"
                  >
                    <span className="font-medium text-sm sm:text-base">{t("registration.organization")}</span>
                    <span className="text-xs text-muted-foreground">{t("registration.organizationHint")}</span>
                  </Button>
                </div>
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
                    {t("registration.terms", { interpolation: { escapeValue: false } })}
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
                    {t("registration.privacy", { interpolation: { escapeValue: false } })}
                  </Label>
                </div>
              </div>

              <Button
                onClick={handleRegister}
                disabled={isLoading || !canSubmit()}
                className="w-full"
              >
                {isLoading ? t("registration.sendingOtp") : t("registration.sendOtp")}
              </Button>
            </div>
          )}
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
        name={name}
      />

      <UserProfileDialog
        isOpen={showProfileDialog}
        onClose={() => {
          setShowProfileDialog(false);
          handleClose();
          toast({
            title: t("registration.profileCreated"),
            description: t("registration.profileCreatedDescription")
          });
        }}
        mode="user"
        initialProfile={undefined}
      />
    </>
  );
};

export default RegistrationDialog;
