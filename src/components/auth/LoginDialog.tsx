
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'react-router-dom';
import OTPVerificationDialog from './OTPVerificationDialog';

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
  defaultRole: 'individual' | 'organization';
}

const LoginDialog: React.FC<LoginDialogProps> = ({ isOpen, onClose, onSwitchToRegister, defaultRole }) => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [step, setStep] = useState<'login' | 'otp-verification'>('login');
  
  const { requestOTP, isLoading } = useAuth();
  const { toast } = useToast();
  const { orgSlug } = useParams<{ orgSlug?: string }>();

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

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    const formatted = formatPhoneNumber(value);
    setFormattedPhone(formatted);
  };

  const handleLogin = async () => {
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
        ...(email && { email }),
        ...(phone && { phoneNumber: formattedPhone || formatPhoneNumber(phone) })
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
    setEmail('');
    setPhone('');
    setFormattedPhone('');
    setStep('login');
    onClose();
  };

  const handleOTPVerificationSuccess = () => {
    // Close the dialog and show success message
    handleClose();
    toast({
      title: "Welcome back!",
      description: "You have successfully logged in."
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
            <DialogTitle className="text-lg sm:text-xl">Sign In</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="login-email">Email Address</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>

            <div>
              <Label htmlFor="login-phone">Phone Number</Label>
              <Input
                id="login-phone"
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="+91 9876543210"
              />
            </div>

            <p className="text-sm text-muted-foreground">
              Please provide at least one contact method (email or phone)
            </p>
          </div>

          <div className="space-y-4 mt-4">
            <Button
              onClick={handleLogin}
              disabled={isLoading || !canSubmit()}
              className="w-full"
            >
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </Button>

            <div className="text-center text-sm">
              Don't have an account?{' '}
              <Button
                variant="link"
                className="p-0"
                onClick={() => {
                  handleClose();
                  onSwitchToRegister();
                }}
              >
                Create Account
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
