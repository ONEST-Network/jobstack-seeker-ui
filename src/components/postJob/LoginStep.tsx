
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface LoginStepProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

const LoginStep: React.FC<LoginStepProps> = ({ isOpen, onClose, onLogin }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Post a Job</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Please login or sign up to post a job
            </p>
          </div>

          <div className="space-y-3">
            <Button className="w-full" onClick={onLogin}>
              Login with Email
            </Button>
            <Button variant="outline" className="w-full" onClick={onLogin}>
              Login with Phone
            </Button>
            <Button variant="outline" className="w-full" onClick={onLogin}>
              Create New Account
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            By proceeding, you agree to our Terms & Conditions
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginStep;
