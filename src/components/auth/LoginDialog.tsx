
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import ForgotPasswordDialog from './ForgotPasswordDialog';

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
  defaultRole: 'individual' | 'organization';
}

const LoginDialog: React.FC<LoginDialogProps> = ({ isOpen, onClose, onSwitchToRegister, defaultRole }) => {
  const [email, setEmail] = useState('');
  // const [phone, setPhone] = useState(''); // Commented out - phone login not implemented
  const [password, setPassword] = useState('');
  // const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email'); // Commented out - phone login not implemented
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  const handleLogin = async () => {
    // const identifier = loginMethod === 'email' ? email : phone; // Commented out - phone login not implemented
    const identifier = email; // Only email login is supported
    
    if (!identifier || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password.",
        variant: "destructive"
      });
      return;
    }

    // Basic validation
    if (!identifier.includes('@')) {
      toast({
        title: "Error",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    // Phone validation commented out - phone login not implemented
    // if (loginMethod === 'phone' && identifier.length < 10) {
    //   toast({
    //     title: "Error",
    //     description: "Please enter a valid phone number.",
    //     variant: "destructive"
    //   });
    //   return;
    // }

    try {
      await login(identifier, password, defaultRole);
      onClose();
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Login failed. Please check your credentials.",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    setEmail('');
    // setPhone(''); // Commented out - phone login not implemented
    setPassword('');
    // setLoginMethod('email'); // Commented out - phone login not implemented
    setShowForgotPassword(false);
    onClose();
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
  };

  const handleForgotPasswordClose = () => {
    setShowForgotPassword(false);
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
  };

  return (
    <>
      <Dialog open={isOpen && !showForgotPassword} onOpenChange={handleClose}>
        <DialogContent className="w-[95vw] max-w-md mx-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Sign In</DialogTitle>
          </DialogHeader>

          {/* Phone login tabs commented out - phone login not implemented */}
          {/* <Tabs value={loginMethod} onValueChange={(value) => setLoginMethod(value as 'email' | 'phone')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-10">
              <TabsTrigger value="email" className="text-sm font-medium">Email</TabsTrigger>
              <TabsTrigger value="phone" className="text-sm font-medium">Phone</TabsTrigger>
            </TabsList> */}

            {/* Email login content - always visible since phone is disabled */}
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
                <Label htmlFor="login-password-email">Password</Label>
                <Input
                  id="login-password-email"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Phone login content commented out - phone login not implemented */}
            {/* <TabsContent value="phone" className="space-y-4 mt-4">
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

              <div>
                <Label htmlFor="login-password-phone">Password</Label>
                <Input
                  id="login-password-phone"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>
            </TabsContent> */}
          {/* </Tabs> */}

          <div className="space-y-4 mt-4">
            <Button 
              variant="ghost" 
              className="text-sm text-primary"
              onClick={handleForgotPassword}
            >
              Forgot Password?
            </Button>

            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
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

      <ForgotPasswordDialog
        isOpen={showForgotPassword}
        onClose={handleForgotPasswordClose}
        onBackToLogin={handleBackToLogin}
      />
    </>
  );
};

export default LoginDialog;
