
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Lock } from 'lucide-react';
import { useProfileForm } from '../ProfileFormProvider';

const BasicInfoStep: React.FC = () => {
  const { profile, setProfile } = useProfileForm();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Basic Information</h3>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <Input
              id="name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              disabled={profile.isNameVerified}
              placeholder="Enter your full name"
            />
            {profile.isNameVerified && (
              <div className="absolute right-2 top-2 flex items-center gap-1">
                <Shield className="h-4 w-4 text-green-600" />
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
          {profile.isNameVerified && (
            <p className="text-xs text-green-600 mt-1">✓ Verified from DigiLocker</p>
          )}
        </div>

        <div>
          <Label htmlFor="age">Age</Label>
          <div className="relative">
            <Input
              id="age"
              type="number"
              value={profile.age || ''}
              onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) })}
              disabled={profile.isAgeVerified}
              placeholder="Enter your age"
            />
            {profile.isAgeVerified && (
              <div className="absolute right-2 top-2 flex items-center gap-1">
                <Shield className="h-4 w-4 text-green-600" />
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
          {profile.isAgeVerified && (
            <p className="text-xs text-green-600 mt-1">✓ Calculated from verified DOB</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BasicInfoStep;
