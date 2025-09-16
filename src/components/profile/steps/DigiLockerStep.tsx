
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProfileForm } from '../ProfileFormProvider';

const DigiLockerStep: React.FC = () => {
  const { profile, setProfile } = useProfileForm();
  const { toast } = useToast();

  const handleDigiLockerImport = () => {
    // Mock DigiLocker import
    setProfile({
      ...profile,
      name: 'John Doe',
      age: 28,
      isNameVerified: true,
      isAgeVerified: true
    });
    toast({
      title: "DigiLocker Import Successful",
      description: "Your verified details have been imported from DigiLocker."
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-medium">Import from DigiLocker</h3>
        <p className="text-sm text-muted-foreground">
          Import verified documents to auto-populate your profile
        </p>
      </div>
      
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <Button onClick={handleDigiLockerImport} className="mb-2">
            Import from DigiLocker
          </Button>
          <p className="text-xs text-muted-foreground">
            This will import your AADHAAR, PAN, and other verified documents
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DigiLockerStep;
