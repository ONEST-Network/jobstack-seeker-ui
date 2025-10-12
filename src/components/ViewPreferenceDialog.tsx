import React from 'react';
import { Settings, Map, List, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useViewPreference, ViewType } from '@/hooks/useViewPreference';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from '@/hooks/useI18n';

interface ViewPreferenceDialogProps {
  children?: React.ReactNode;
  onApply?: (view: ViewType) => void;
}

const ViewPreferenceDialog: React.FC<ViewPreferenceDialogProps> = ({ children, onApply }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedView, setSelectedView] = React.useState<ViewType>('map');
  const isMobile = useIsMobile();
  const t = useTranslation('settings');
  const {
    preferences,
    setDefaultView,
    resetPreferences
  } = useViewPreference();

  // Initialize selected view when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedView(preferences.defaultView);
    }
  }, [isOpen, preferences.defaultView]);

  const handleViewChange = (value: string) => {
    setSelectedView(value as ViewType);
  };

  const handleApply = () => {
    setDefaultView(selectedView);
    onApply?.(selectedView);
    setIsOpen(false);
  };

  const handleReset = () => {
    resetPreferences();
    setSelectedView('map'); // Reset to default
  };

  const triggerButton = children || (
    <Button
      variant="outline"
      size="sm"
      className="h-touch flex items-center gap-2"
    >
      <Settings className="h-4 w-4" />
      <span className="hidden sm:inline">{t('viewPreferences.settings', 'Settings')}</span>
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
{t('viewPreferences.title', 'View Preferences')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Default View Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('viewPreferences.defaultView', 'Default View')}</CardTitle>
              <CardDescription className="text-sm">
                {t('viewPreferences.defaultViewDescription', 'Choose which view to show when you first visit the jobs page')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selectedView}
                onValueChange={handleViewChange}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="map" id="map" />
                  <Label htmlFor="map" className="flex items-center gap-2 flex-1 cursor-pointer">
                    <Map className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium">{t('viewPreferences.mapView', 'Map View')}</div>
                      <div className="text-sm text-muted-foreground">
                        {t('viewPreferences.mapViewDescription', 'See jobs on an interactive map')}
                      </div>
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="list" id="list" />
                  <Label htmlFor="list" className="flex items-center gap-2 flex-1 cursor-pointer">
                    <List className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium">{t('viewPreferences.listView', 'List View')}</div>
                      <div className="text-sm text-muted-foreground">
                        {t('viewPreferences.listViewDescription', 'Browse jobs in a detailed list')}
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {t('viewPreferences.resetToDefault', 'Reset to Default')}
            </Button>
            <Button
              onClick={handleApply}
              className="flex items-center gap-2"
            >
{t('viewPreferences.apply', 'Apply')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewPreferenceDialog;
