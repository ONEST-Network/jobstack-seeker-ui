import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface LoginStepProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

const LoginStep: React.FC<LoginStepProps> = ({ isOpen, onClose, onLogin }) => {
  const { t } = useTranslation('loginStep');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('loginStep.title')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              {t('loginStep.subtitle')}
            </p>
          </div>

          <div className="space-y-3">
            <Button className="w-full" onClick={onLogin}>
              {t('loginStep.loginEmail')}
            </Button>
            <Button variant="outline" className="w-full" onClick={onLogin}>
              {t('loginStep.loginPhone')}
            </Button>
            <Button variant="outline" className="w-full" onClick={onLogin}>
              {t('loginStep.createAccount')}
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            {t('loginStep.agreement')}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginStep;
