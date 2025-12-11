
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Map } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProfileForm } from '../ProfileFormProvider';
import { getCurrentLocation, formatLocationForDisplay, type LocationData } from '@/lib/utils';
import MapLocationSelector from '../MapLocationSelector';

const LocationStep: React.FC = () => {
  const { profile, setProfile } = useProfileForm();
  const { toast } = useToast();
  const [showCurrentLocationMap, setShowCurrentLocationMap] = useState(false);
  const [showDesiredLocationMap, setShowDesiredLocationMap] = useState(false);

  const handleLocationDetection = async () => {
    try {
      const locationData = await getCurrentLocation();
      const displayLocation = formatLocationForDisplay(locationData);
      
      setProfile({ 
        ...profile, 
        currentLocation: displayLocation,
        locationData: locationData // Store full location data for API
      });
      
      toast({ 
        title: "Location detected", 
        description: `Current location: ${displayLocation}` 
      });
    } catch (error) {
      console.error('Location detection failed:', error);
      toast({
        title: "Location detection failed",
        description: "Please enter your location manually",
        variant: "destructive"
      });
    }
  };

  const handleCurrentLocationSelect = (locationData: LocationData) => {
    const displayLocation = formatLocationForDisplay(locationData);
    setProfile({ 
      ...profile, 
      currentLocation: displayLocation,
      locationData: locationData // Store full location data for API
    });
    toast({ 
      title: "Location selected", 
      description: `Current location: ${displayLocation}` 
    });
  };

  const handleDesiredLocationSelect = (locationData: LocationData) => {
    const displayLocation = formatLocationForDisplay(locationData);
    setProfile({ 
      ...profile, 
      desiredLocation: displayLocation,
      desiredLocationData: locationData // Store full location data for API
    });
    toast({ 
      title: "Location selected", 
      description: `Desired location: ${displayLocation}` 
    });
  };

  // Get initial location data for map selector
  const getInitialLocationData = (field: 'current' | 'desired'): LocationData | null => {
    if (field === 'current' && profile.locationData) {
      return profile.locationData as LocationData;
    }
    if (field === 'desired' && (profile as any).desiredLocationData) {
      return (profile as any).desiredLocationData as LocationData;
    }
    return null;
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
              value={profile.currentLocation || ''}
              onChange={(e) => setProfile({ ...profile, currentLocation: e.target.value })}
              placeholder="Enter your current location"
            />
            <div className="absolute right-1 top-1 flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCurrentLocationMap(true)}
                title="Select location on map"
              >
                <Map className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleLocationDetection}
                title="Get current location"
              >
                <MapPin className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="desiredLocation">Desired Work Location</Label>
          <div className="relative">
            <Input
              id="desiredLocation"
              value={profile.desiredLocation || ''}
              onChange={(e) => setProfile({ ...profile, desiredLocation: e.target.value })}
              placeholder="Where would you like to work?"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1"
              onClick={() => setShowDesiredLocationMap(true)}
              title="Select location on map"
            >
              <Map className="h-4 w-4 text-green-600" />
            </Button>
          </div>
        </div>
      </div>

      {/* Map Selector Dialogs */}
      <MapLocationSelector
        isOpen={showCurrentLocationMap}
        onClose={() => setShowCurrentLocationMap(false)}
        onLocationSelect={handleCurrentLocationSelect}
        initialLocation={getInitialLocationData('current')}
        title="Select Current Location"
      />

      <MapLocationSelector
        isOpen={showDesiredLocationMap}
        onClose={() => setShowDesiredLocationMap(false)}
        onLocationSelect={handleDesiredLocationSelect}
        initialLocation={getInitialLocationData('desired')}
        title="Select Desired Work Location"
      />
    </div>
  );
};

export default LocationStep;
