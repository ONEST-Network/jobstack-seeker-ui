
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProfileForm } from '../ProfileFormProvider';

const LocationStep: React.FC = () => {
  const { profile, setProfile } = useProfileForm();
  const { toast } = useToast();

  const handleLocationDetection = () => {
    // Mock GPS detection
    setProfile({ ...profile, currentLocation: 'Mumbai, Maharashtra' });
    toast({ title: "Location detected", description: "Current location updated" });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Location Preferences</h3>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="currentLocation">Current Location</Label>
          <div className="relative">
            <Input
              id="currentLocation"
              value={profile.currentLocation}
              onChange={(e) => setProfile({ ...profile, currentLocation: e.target.value })}
              placeholder="Enter your current location"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1"
              onClick={handleLocationDetection}
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="desiredLocation">Desired Work Location</Label>
          <Input
            id="desiredLocation"
            value={profile.desiredLocation}
            onChange={(e) => setProfile({ ...profile, desiredLocation: e.target.value })}
            placeholder="Where would you like to work?"
          />
        </div>
      </div>
    </div>
  );
};

export default LocationStep;
