
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
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
  const [step, setStep] = useState<'login' | 'otp-verification'>('login');
  
  const { requestOTP, isLoading } = useAuth();
  const { toast } = useToast();

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
    setEmail('');
    setPhone('');
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
                onChange={(e) => setPhone(e.target.value)}
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
        phoneNumber={phone || undefined}
      />
    </>
  );
};

export default LoginDialog;
