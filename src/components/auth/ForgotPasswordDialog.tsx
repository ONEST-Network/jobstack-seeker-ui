import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

interface ForgotPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({
  isOpen,
  onClose,
  onBackToLogin
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }

    if (!email.includes('@')) {
      toast({
        title: "Error",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.forgotPassword({
        email,
        callbackURL: `${window.location.origin}/seeker`
      });
      setIsEmailSent(true);
      toast({
        title: "Reset Link Sent",
        description: "Check your email for password reset instructions."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setIsLoading(false);
    setIsEmailSent(false);
    onClose();
  };

  const handleOpenEmail = () => {
    // Detect email provider and open appropriate webmail
    const domain = email.split('@')[1]?.toLowerCase();
    let url = 'https://mail.google.com'; // Default to Gmail
    
    if (domain?.includes('outlook') || domain?.includes('hotmail') || domain?.includes('live')) {
      url = 'https://outlook.live.com';
    } else if (domain?.includes('yahoo')) {
      url = 'https://mail.yahoo.com';
    } else if (domain?.includes('icloud')) {
      url = 'https://www.icloud.com/mail';
    }
    
    window.open(url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            {!isEmailSent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToLogin}
                className="p-1 h-auto mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Mail className="h-5 w-5 text-blue-500" />
            {isEmailSent ? 'Check Your Email' : 'Reset Password'}
          </DialogTitle>
        </DialogHeader>

        {!isEmailSent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reset-email">Email Address</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={onBackToLogin}
                className="w-full"
              >
                Back to Sign In
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>

            <div className="space-y-2">
              <p className="text-lg font-medium">Reset Link Sent!</p>
              <p className="text-muted-foreground">
                We've sent a password reset link to
              </p>
              <p className="font-medium text-foreground break-all">
                {email}
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-center gap-2 text-blue-700">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">What's next?</span>
              </div>
              <ol className="text-sm text-blue-600 space-y-1 text-left">
                <li>1. Check your email inbox (and spam/junk folder)</li>
                <li>2. Click the reset link in the email</li>
                <li>3. You'll be redirected to create your new password</li>
                <li>4. Sign in with your new password</li>
              </ol>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleOpenEmail}
                className="w-full"
                variant="default"
              >
                <Mail className="h-4 w-4 mr-2" />
                Open Email App
              </Button>

              <Button
                onClick={onBackToLogin}
                variant="outline"
                className="w-full"
              >
                Back to Sign In
              </Button>
            </div>

            <div className="text-xs text-muted-foreground border-t pt-3">
              <p>The reset link will expire in 15 minutes.</p>
              <p>Didn't receive the email? Check your spam folder or try again.</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog; 