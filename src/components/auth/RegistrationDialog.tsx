
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';
import OTPVerificationDialog from './OTPVerificationDialog';
import UserProfileDialog from '@/components/profile/UserProfileDialog';

interface RegistrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole: 'individual' | 'organization';
}

const RegistrationDialog: React.FC<RegistrationDialogProps> = ({ isOpen, onClose, defaultRole }) => {
  const [step, setStep] = useState<'register' | 'otp-verification'>('register');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'individual' | 'organization'>('individual');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  
  const { requestOTP, isLoading } = useAuth();
  const { toast } = useToast();
  const location = useLocation();

  // Always set role to individual - organization registration is disabled
  useEffect(() => {
    setRole('individual');
  }, [defaultRole]);

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
    if (phone && phone.length < 10) {
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
        ...(phone && { phoneNumber: phone })
      };

      await requestOTP(otpData);
      setStep('otp-verification');
      toast({
        title: "OTP Sent",
        description: `A 6-digit OTP has been sent to your ${email ? 'email' : 'phone'}.`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    setStep('register');
    setEmail('');
    setPhone('');
    setName('');
    setRole(defaultRole);
    setTermsAccepted(false);
    setPrivacyAccepted(false);
    setShowProfileDialog(false);
    onClose();
  };

  const handleOTPVerificationSuccess = () => {
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
      <Dialog open={isOpen && step !== 'otp-verification'} onOpenChange={handleClose}>
        <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Create Account</DialogTitle>
          </DialogHeader>

          {step === 'register' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  * Please provide at least one contact method (email or phone)
                </p>
              </div>

              <div className="space-y-4">
                <Label>Account Type</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    variant={role === 'individual' ? 'default' : 'outline'}
                    onClick={() => setRole('individual')}
                    className="h-16 sm:h-20 flex flex-col"
                  >
                    <span className="font-medium text-sm sm:text-base">Individual</span>
                    <span className="text-xs text-muted-foreground">Job seeker</span>
                  </Button>
                  <Button
                    variant="outline"
                    disabled={true}
                    className="h-16 sm:h-20 flex flex-col opacity-50 cursor-not-allowed"
                  >
                    <span className="font-medium text-sm sm:text-base">Organization</span>
                    <span className="text-xs text-muted-foreground">Coming soon</span>
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
                    I accept the <span className="text-primary cursor-pointer underline">Terms and Conditions</span>
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
                    I consent to <span className="text-primary cursor-pointer underline">Data Privacy Policy</span>
                  </Label>
                </div>
              </div>

              <Button
                onClick={handleRegister}
                disabled={isLoading || !canSubmit()}
                className="w-full"
              >
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
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
        phoneNumber={phone || undefined}
      />

      <UserProfileDialog
        isOpen={showProfileDialog}
        onClose={() => {
          setShowProfileDialog(false);
          handleClose();
          toast({
            title: "Profile Created",
            description: "Welcome! Your profile has been created successfully."
          });
        }}
        mode="user"
      />
    </>
  );
};

export default RegistrationDialog;
