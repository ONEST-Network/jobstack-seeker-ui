
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'react-router-dom';
import { Organization } from '@/hooks/useOrganizationSelection';

interface OTPVerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contactMethod: string;
  method: 'email' | 'phone';
  phoneNumber?: string;
  email?: string;
  name?: string;
  selectedOrganization?: Organization | null;
}

const OTPVerificationDialog: React.FC<OTPVerificationDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  contactMethod,
  method,
  phoneNumber,
  email,
  name,
  selectedOrganization
}) => {
  const [otp, setOtp] = useState('');
  const { verifyOTP, isLoading } = useAuth();
  const { toast } = useToast();
  const { orgSlug } = useParams<{ orgSlug?: string }>();

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter the complete 6-digit OTP.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Prepare the verify payload
      const verifyPayload: any = {
        name,
        otp,
        rememberMe: true
      };

      // Add email or phone based on method
      if (method === 'email' && email) {
        verifyPayload.email = email;
      } else if (method === 'phone' && phoneNumber) {
        verifyPayload.phoneNumber = phoneNumber;
      }

      // Add organization data if selected
      if (selectedOrganization) {
        verifyPayload.joinOrg = {
          join: true,
          orgSlug: selectedOrganization.slug,
          role: 'viewer'
        };
        verifyPayload.createAdmin = true;
      }

      // Add orgSlug and createAdmin if we're on an organization route (existing logic)
      if (orgSlug && orgSlug !== '0') {
        verifyPayload.joinOrg = {
          join: true,
          orgSlug: orgSlug,
          role: 'viewer'
        };
        verifyPayload.createAdmin = true;
      }

      await verifyOTP(verifyPayload);
      
      // Clear OTP input
      setOtp('');
      
      // Call success callback
      onSuccess();
      
      // Show success toast
      toast({
        title: "Success",
        description: "OTP verified successfully!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Invalid OTP. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Reset OTP when dialog opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setOtp('');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify Your {method === 'email' ? 'Email' : 'Phone'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-center">
          <p className="text-muted-foreground">
            We've sent a 6-digit verification code to{' '}
            <span className="font-medium">{contactMethod}</span>
          </p>

          {selectedOrganization && (
            <div className="p-3 bg-muted rounded-lg text-left">
              <h4 className="font-medium text-sm">Selected Organization:</h4>
              <p className="text-sm font-medium">{selectedOrganization.name}</p>
              <p className="text-xs text-muted-foreground">
                {selectedOrganization.type} • {selectedOrganization.location} • {selectedOrganization.district}
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
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </Button>

            {/* <Button variant="ghost" className="w-full">
              Resend Code
            </Button> */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OTPVerificationDialog;
