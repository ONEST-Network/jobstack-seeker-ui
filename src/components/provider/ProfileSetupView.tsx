
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

interface ProfileSetupViewProps {
  userEmail: string;
  onCreateProfile: () => void;
}

const ProfileSetupView: React.FC<ProfileSetupViewProps> = ({ userEmail, onCreateProfile }) => {
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="space-y-4">
          <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-500 mx-auto" />
          <h1 className="text-2xl sm:text-3xl font-bold">Welcome, {userEmail}!</h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Let's set up your provider profile to start managing employers.
          </p>
        </div>

        <Card className="p-4 sm:p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Complete Your Provider Profile</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Button 
              className="w-full h-touch" 
              size="lg"
              onClick={onCreateProfile}
            >
              Create Provider Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetupView;
