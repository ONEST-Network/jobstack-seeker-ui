import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePasswordReset } from '@/hooks/usePasswordReset';

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
  const [emailSent, setEmailSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');
  const { toast } = useToast();
  const { sendPasswordResetEmail } = usePasswordReset();

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
      const result = await sendPasswordResetEmail(email);
      if (result.success) {
        setSentToEmail(email);
        setEmailSent(true);
      }
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
    setEmailSent(false);
    setSentToEmail('');
    onClose();
  };

  const handleBackToLogin = () => {
    // Clear all state before closing
    setEmail('');
    setIsLoading(false);
    setEmailSent(false);
    setSentToEmail('');
    onClose();
    // Call the callback to switch to login
    onBackToLogin();
  };

  const handleOpenEmail = () => {
    // Detect email provider and open appropriate webmail
    const domain = sentToEmail.split('@')[1]?.toLowerCase();
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

  if (emailSent) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold">Reset Link Sent</DialogTitle>
            <p className="text-muted-foreground text-sm">
              Check your email for password reset instructions
            </p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Email sent to {sentToEmail}</p>
                  <p className="text-xs text-muted-foreground">
                    Click the link in your email to reset your password. The link will expire in 1 hour.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={handleBackToLogin} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                <strong>Can't find the email?</strong> Check your spam folder or contact support if you continue to have issues.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl font-bold">Reset Password</DialogTitle>
          <p className="text-muted-foreground text-sm">
            Enter your email to receive a password reset link
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="forgot-email">Email Address</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                className="p-0"
                onClick={handleBackToLogin}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog; 