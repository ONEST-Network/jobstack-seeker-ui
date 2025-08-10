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
import OTPVerificationDialog from './OTPVerificationDialog';
import RegistrationDialog from './RegistrationDialog';

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
    // Preserve cursor position
    const cursorPosition = inputRef.current?.selectionStart || 0;
    
    setContactInput(value);
    
    // Format phone number if it's a phone input
    if (contactType === 'phone' || value.replace(/\D/g, '').length >= 10) {
      const formatted = formatPhoneNumber(value);
      setFormattedPhoneNumber(formatted);
    } else {
      setFormattedPhoneNumber('');
    }
    
    // Restore cursor position after state update
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
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
        title: "Invalid Input",
        description: contactType === 'email' 
          ? "Please enter a valid email address" 
          : "Please enter a valid phone number",
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
            title: "Error",
            description: "Failed to send OTP. Please try again.",
            variant: "destructive"
          });
          setStep('initial');
        }
      } else {
        // User doesn't exist - show registration
        setUserExists(false);
        setStep('register');
        setShowRegisterDialog(true);
        toast({
          title: "Account Not Found",
          description: `No account found with ${contactType === 'email' ? 'email' : 'phone number'} ${contactInput}. Please create a new account.`,
        });
      }
    } catch (error) {
      console.error('Error checking user:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
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
      title: "Success",
      description: "Successfully signed in!",
    });
  };

  const handleRegisterSuccess = () => {
    setShowRegisterDialog(false);
    onClose();
    toast({
      title: "Success",
      description: "Account created successfully!",
    });
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
      setFormattedPhoneNumber('');
    }
  }, [isOpen]);

  const getContactIcon = () => {
    return contactType === 'email' ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />;
  };

  const getPlaceholder = () => {
    if (contactType === 'phone') {
      return "Enter your phone number";
    }
    return "Enter your phone number or email";
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
              Sign in or create account
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Contact Input */}
            <div className="space-y-2">
              <Label htmlFor="contact" className="text-sm font-medium">
                Enter mobile number or email
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
                    {contactType === 'phone' ? 'Phone Number' : 'Email Address'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {contactType === 'phone' 
                      ? 'We\'ll send you an SMS with a verification code' 
                      : 'We\'ll send you a verification code via email'
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
                  Checking...
                </>
              ) : (
                <>
                  Continue
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
                    <p className="text-sm font-medium">How it works</p>
                    <p className="text-xs text-muted-foreground">
                      Enter your email or phone number. If you have an account, we'll send you a verification code. 
                      If not, we'll help you create a new account.
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

      {/* Registration Dialog */}
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