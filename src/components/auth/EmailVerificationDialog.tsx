import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailVerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  userName?: string;
}

const EmailVerificationDialog: React.FC<EmailVerificationDialogProps> = ({
  isOpen,
  onClose,
  email,
  userName
}) => {
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      // In a real implementation, you would call your API to resend the verification email
      // For now, we'll just simulate the action
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Email Sent",
        description: "Verification email has been resent to your inbox.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend verification email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Mail className="h-5 w-5 text-blue-500" />
            Check Your Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
            <Mail className="h-8 w-8 text-blue-500" />
          </div>

          <div className="space-y-2">
            <p className="text-lg font-medium">
              {userName ? `Hi ${userName}!` : 'Verification Email Sent'}
            </p>
            <p className="text-muted-foreground">
              We've sent a verification link to
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
              <li>2. Click the verification link in the email</li>
              <li>3. You'll be automatically signed in and redirected</li>
            </ol>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleOpenEmail}
              className="w-full"
              variant="default"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Email App
            </Button>

            <div className="text-sm text-muted-foreground">
              Didn't receive the email?
            </div>

            <Button
              onClick={handleResendEmail}
              disabled={isResending}
              variant="outline"
              className="w-full"
            >
              {isResending ? 'Sending...' : 'Resend Verification Email'}
            </Button>

            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full"
            >
              I'll verify later
            </Button>
          </div>

          <div className="text-xs text-muted-foreground border-t pt-3">
            <p>The verification link will expire in 5 minutes.</p>
            <p>Make sure to check your spam/junk folder if you don't see the email.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailVerificationDialog; 