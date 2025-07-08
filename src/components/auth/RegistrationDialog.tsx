
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';
// import OTPVerificationDialog from './OTPVerificationDialog'; // Commented out for magic link verification
import EmailVerificationDialog from './EmailVerificationDialog';
import UserProfileDialog from '@/components/profile/UserProfileDialog';

interface RegistrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole: 'individual' | 'organization';
}

const RegistrationDialog: React.FC<RegistrationDialogProps> = ({ isOpen, onClose, defaultRole }) => {
  const [step, setStep] = useState<'register' | 'role' | 'email-verification'>('register');
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'individual' | 'organization'>(defaultRole);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  
  const { register, isLoading } = useAuth();
  const { toast } = useToast();
  const location = useLocation();

  // Update role when defaultRole changes
  useEffect(() => {
    setRole(defaultRole);
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

    if (method === 'email' && (!email || !name || !password)) {
      toast({
        title: "Error",
        description: "Please enter your name, email address, and password.",
        variant: "destructive"
      });
      return;
    }

    if (method === 'phone' && !phone) {
      toast({
        title: "Error",
        description: "Please enter your phone number.",
        variant: "destructive"
      });
      return;
    }

    try {
      await register({
        email: method === 'email' ? email : undefined,
        phone: method === 'phone' ? phone : undefined,
        name: method === 'email' ? name : undefined,
        password: method === 'email' ? password : undefined,
        role,
        callbackURL: `${window.location.origin}/seeker`
      });
      setStep('email-verification');
      toast({
        title: "Registration Successful",
        description: "Please check your email to verify your account."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Registration failed. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    setStep('register');
    setEmail('');
    setPhone('');
    setName('');
    setPassword('');
    setRole(defaultRole);
    setTermsAccepted(false);
    setPrivacyAccepted(false);
    setShowProfileDialog(false);
    onClose();
  };

  const handleEmailVerificationClose = () => {
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
        description: "Please verify your email to complete the process."
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen && step !== 'email-verification'} onOpenChange={handleClose}>
        <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Create Account</DialogTitle>
          </DialogHeader>

          {step === 'register' && (
            <div className="space-y-4">
              <Tabs value={method} onValueChange={(value) => setMethod(value as 'email' | 'phone')}>
                <TabsList className="grid w-full grid-cols-2 h-10">
                  <TabsTrigger value="email" className="text-sm">Email</TabsTrigger>
                  <TabsTrigger value="phone" className="text-sm">Phone</TabsTrigger>
                </TabsList>
                
                <TabsContent value="email" className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
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
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a secure password"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="phone" className="space-y-4">
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
                </TabsContent>
              </Tabs>

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
                    variant={role === 'organization' ? 'default' : 'outline'}
                    onClick={() => setRole('organization')}
                    className="h-16 sm:h-20 flex flex-col"
                  >
                    <span className="font-medium text-sm sm:text-base">Organization</span>
                    <span className="text-xs text-muted-foreground">Job posting</span>
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
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <EmailVerificationDialog
        isOpen={step === 'email-verification'}
        onClose={handleEmailVerificationClose}
        email={email}
        userName={name}
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
