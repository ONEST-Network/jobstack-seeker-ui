import React from 'react';
import { Settings, Map, List, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useViewPreference, ViewType } from '@/hooks/useViewPreference';
import { useIsMobile } from '@/hooks/use-mobile';

interface ViewPreferenceDialogProps {
  children?: React.ReactNode;
}

const ViewPreferenceDialog: React.FC<ViewPreferenceDialogProps> = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const {
    preferences,
    setDefaultView,
    setRememberPreference,
    resetPreferences
  } = useViewPreference();

  const handleViewChange = (value: string) => {
    setDefaultView(value as ViewType);
  };

  const handleRememberToggle = (checked: boolean) => {
    setRememberPreference(checked);
  };

  const handleReset = () => {
    resetPreferences();
  };

  const triggerButton = children || (
    <Button
      variant="outline"
      size="sm"
      className="h-touch flex items-center gap-2"
    >
      <Settings className="h-4 w-4" />
      <span className="hidden sm:inline">Settings</span>
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className={`${isMobile ? 'w-[95vw] max-w-[95vw]' : 'w-[90vw] max-w-md'} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            View Preferences
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Default View Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Default View</CardTitle>
              <CardDescription className="text-sm">
                Choose which view to show when you first visit the jobs page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={preferences.defaultView}
                onValueChange={handleViewChange}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="map" id="map" />
                  <Label htmlFor="map" className="flex items-center gap-2 flex-1 cursor-pointer">
                    <Map className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium">Map View</div>
                      <div className="text-sm text-muted-foreground">
                        See jobs on an interactive map
                      </div>
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="list" id="list" />
                  <Label htmlFor="list" className="flex items-center gap-2 flex-1 cursor-pointer">
                    <List className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium">List View</div>
                      <div className="text-sm text-muted-foreground">
                        Browse jobs in a detailed list
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Remember Preference Toggle */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Remember Preference</CardTitle>
              <CardDescription className="text-sm">
                Save your view preference for future visits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="remember-preference" className="text-sm font-medium">
                    Remember my choice
                  </Label>
                  <div className="text-xs text-muted-foreground">
                    Your preference will be saved locally
                  </div>
                </div>
                <Switch
                  id="remember-preference"
                  checked={preferences.rememberPreference}
                  onCheckedChange={handleRememberToggle}
                />
              </div>
            </CardContent>
          </Card>

          {/* Reset Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Default
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewPreferenceDialog;
