
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';

interface UnauthenticatedViewProps {
  onLogin: () => void;
  onRegister: () => void;
}

const UnauthenticatedView: React.FC<UnauthenticatedViewProps> = ({ onLogin, onRegister }) => {
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="space-y-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
            <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Welcome to Job Provider Portal</h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Post jobs, manage applications, and find the perfect candidates for your organization.
          </p>
        </div>

        <Card className="p-4 sm:p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Get Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-0 pb-0">
            <div className="space-y-3">
              <Button 
                className="w-full h-touch" 
                size="lg"
                onClick={onLogin}
              >
                Login to Your Account
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-touch" 
                size="lg"
                onClick={onRegister}
              >
                Create Provider Account
              </Button>
            </div>
            
            <div className="text-xs sm:text-sm text-muted-foreground">
              New to our platform? Create an account to start managing employers and posting jobs.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UnauthenticatedView;
