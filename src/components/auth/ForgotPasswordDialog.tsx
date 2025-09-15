import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePasswordReset } from '@/hooks/usePasswordReset';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('forgotPassword');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: t('errors.errorTitle'),
        description: t('errors.emptyEmail'),
        variant: 'destructive'
      });
      return;
    }

    if (!email.includes('@')) {
      toast({
        title: t('errors.errorTitle'),
        description: t('errors.invalidEmail'),
        variant: 'destructive'
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
        title: t('errors.errorTitle'),
        description: error.message || t('errors.sendFailed'),
        variant: 'destructive'
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
    setEmail('');
    setIsLoading(false);
    setEmailSent(false);
    setSentToEmail('');
    onClose();
    onBackToLogin();
  };

  const handleOpenEmail = () => {
    const domain = sentToEmail.split('@')[1]?.toLowerCase();
    let url = 'https://mail.google.com';
    
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
            <DialogTitle className="text-2xl font-bold">
              {t('dialog.resetLinkSent')}
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              {t('dialog.checkEmail')}
            </p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {t('messages.sentTo', { email: sentToEmail })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('messages.linkExpiry')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={handleBackToLogin} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('buttons.backToLogin')}
              </Button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                <strong>{t('messages.cantFindEmailTitle')}</strong>{' '}
                {t('messages.cantFindEmail')}
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
          <DialogTitle className="text-2xl font-bold">
            {t('dialog.resetPassword')}
          </DialogTitle>
          <p className="text-muted-foreground text-sm">
            {t('dialog.enterEmail')}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="forgot-email">{t('form.emailLabel')}</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder={t('form.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('buttons.sending') : t('buttons.sendLink')}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                className="p-0"
                onClick={handleBackToLogin}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('buttons.backToLogin')}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
