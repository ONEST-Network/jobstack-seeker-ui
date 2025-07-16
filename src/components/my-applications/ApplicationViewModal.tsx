import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Briefcase, Target, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ApplicationViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
}

interface ApplicationDetails {
  order_id: string;
  transaction_id: string;
  metadata: {
    context: any;
    message: {
      order: {
        fulfillments: Array<{
          customer: {
            person: {
              name: string;
              interestedRole?: string;
              whoIAm?: Record<string, any>;
              whatIHave?: Record<string, any>;
              whatIWant?: Record<string, any>;
              [key: string]: any;
            };
            [key: string]: any;
          };
          [key: string]: any;
        }>;
        [key: string]: any;
      };
    };
  };
}

const ApplicationViewModal: React.FC<ApplicationViewModalProps> = ({
  isOpen,
  onClose,
  applicationId
}) => {
  const { user } = useAuth();
  const [applicationDetails, setApplicationDetails] = useState<ApplicationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{
    whoIAm: boolean;
    whatIHave: boolean;
    whatIWant: boolean;
  }>({
    whoIAm: false,
    whatIHave: false,
    whatIWant: false
  });

  useEffect(() => {
    if (isOpen && applicationId && user?.id) {
      fetchApplicationDetails();
    }
  }, [isOpen, applicationId, user?.id]);

  const fetchApplicationDetails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the same API call as MyApplications component
      const response = await fetch(`${import.meta.env.VITE_BAP_URL}/api/v1/job-applications?user_id=${user?.id}`);
      const data = await response.json();
      
      const applications = data?.applications || [];
      const application = applications.find((app: any) => {
        // Match using the same logic as MyApplications component
        const appId = app.order_id ?? app.transaction_id ?? app.job_id;
        return appId === applicationId || 
               app.order_id === applicationId || 
               app.transaction_id === applicationId;
      });
      
      if (application) {
        setApplicationDetails(application);
      } else {
        setError('Application details not found');
      }
    } catch (err) {
      console.error('Failed to fetch application details:', err);
      setError('Failed to load application details');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to convert camelCase / snake to Title Case
  const formatKey = (key: string) => {
    const formatted = key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
    
    // Custom field name mappings for better readability
    const fieldMappings: Record<string, string> = {
      'jukiMachineExperience': 'Juki Machine Experience',
      'stitchingSpeed': 'Stitching Speed (SPM)',
      'maxCostPerSharingBed': 'Max Cost Per Sharing Bed',
      'monthlyInHandPreferred': 'Monthly In-Hand Preferred',
      'monthlyOTExpectation': 'Monthly OT Expectation',
      'monthlyPFESIC': 'Monthly PF/ESIC',
      'readyToMigrate': 'Ready To Migrate',
      'stayPreferences': 'Stay Preferences',
      'workHoursPerDay': 'Work Hours Per Day',
      'currentLocation': 'Current Location',
      'desiredLocation': 'Desired Location',
      'isAgeVerified': 'Age Verified',
      'isNameVerified': 'Name Verified',
      'machinesOperated': 'Machines Operated'
    };
    
    return fieldMappings[formatted] || formatted;
  };

  const isObject = (val: any) => val && typeof val === 'object' && !Array.isArray(val);

  const renderKeyValueList = (obj: Record<string, any>) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(obj).map(([key, value]) => {
          if (value === undefined || value === null || value === '' || key === 'gps' || key === 'tag') return null;

          // Skip empty arrays
          if (Array.isArray(value) && value.length === 0) return null;

          if (isObject(value)) {
            // Flatten one level deep
            return (
              <div key={key} className="col-span-full space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground mb-1">
                  {formatKey(key)}
                </h4>
                {renderKeyValueList(value as Record<string, any>)}
              </div>
            );
          }
          return (
            <div key={key} className="p-3 rounded-lg bg-gray-50">
              <div className="text-sm font-medium text-muted-foreground">
                {formatKey(key)}
              </div>
              <div className="text-base font-semibold break-words">
                {Array.isArray(value) ? value.join(', ') : String(value)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const toggleSection = (section: 'whoIAm' | 'whatIHave' | 'whatIWant') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderExpandableSection = (
    title: string, 
    data: Record<string, any> | undefined, 
    sectionKey: 'whoIAm' | 'whatIHave' | 'whatIWant',
    icon: React.ReactNode
  ) => {
    if (!data || Object.keys(data).length === 0) return null;

    const isExpanded = expandedSections[sectionKey];

    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection(sectionKey)}
          >
            <div className="flex items-center gap-2">
              {icon}
              <h3 className="text-lg font-semibold">{title}</h3>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          
          {isExpanded && (
            <div className="pt-2">
              {renderKeyValueList(data)}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto w-full max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Application Details</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading application details...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchApplicationDetails} className="mt-4">
              Retry
            </Button>
          </div>
        )}

        {!isLoading && !error && applicationDetails && (
          <div className="space-y-6">
            {/* Interested Role - Always visible */}
            {applicationDetails.metadata?.message?.order?.fulfillments?.[0]?.customer?.person?.metadata?.interestedRole && (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Interested Role</h3>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <div className="text-sm font-medium text-muted-foreground">
                      Role
                    </div>
                    <div className="text-base font-semibold break-words">
                      {applicationDetails.metadata.message.order.fulfillments[0].customer.person.metadata.interestedRole}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Expandable Sections */}
            {renderExpandableSection(
              "Who I Am",
              applicationDetails.metadata?.message?.order?.fulfillments?.[0]?.customer?.person?.metadata?.whoIAm,
              'whoIAm',
              <User className="h-5 w-5" />
            )}

            {renderExpandableSection(
              "What I Have",
              applicationDetails.metadata?.message?.order?.fulfillments?.[0]?.customer?.person?.metadata?.whatIHave,
              'whatIHave',
              <Briefcase className="h-5 w-5" />
            )}

            {renderExpandableSection(
              "What I Want",
              applicationDetails.metadata?.message?.order?.fulfillments?.[0]?.customer?.person?.metadata?.whatIWant,
              'whatIWant',
              <Target className="h-5 w-5" />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationViewModal; 