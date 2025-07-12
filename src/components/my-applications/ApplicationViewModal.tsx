import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, User, Briefcase, Target, MapPin, Calendar, Phone, Mail } from 'lucide-react';
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

  useEffect(() => {
    if (isOpen && applicationId && user?.id) {
      fetchApplicationDetails();
    }
  }, [isOpen, applicationId, user?.id]);

  const fetchApplicationDetails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BAP_URL}/api/v1/job-applications?user_id=${user?.id}`);
      const data = await response.json();
      
      const application = data?.applications?.find((app: any) => 
        app.order_id === applicationId || app.transaction_id === applicationId
      );
      
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

  const formatFieldName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/([A-Z])/g, ' $1')
      .trim();
  };

  const formatFieldValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const renderSection = (title: string, data: Record<string, any>, icon: React.ReactNode) => {
    if (!data || Object.keys(data).length === 0) return null;

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  {formatFieldName(key)}
                </dt>
                <dd className="text-sm">
                  {formatFieldValue(value)}
                </dd>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCustomerInfo = () => {
    if (!applicationDetails?.metadata?.message?.order?.fulfillments?.[0]?.customer?.person) {
      return null;
    }

    const customer = applicationDetails.metadata.message.order.fulfillments[0].customer.person;
    
    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Candidate Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(customer).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  {formatFieldName(key)}
                </dt>
                <dd className="text-sm">
                  {formatFieldValue(value)}
                </dd>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Application Details</DialogTitle>
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
          <div className="space-y-4">
            {renderCustomerInfo()}
            
            {applicationDetails.metadata?.message?.order?.fulfillments?.[0]?.customer?.person?.whoIAm && 
              renderSection(
                "Who I Am", 
                applicationDetails.metadata.message.order.fulfillments[0].customer.person.whoIAm,
                <User className="h-5 w-5" />
              )
            }
            
            {applicationDetails.metadata?.message?.order?.fulfillments?.[0]?.customer?.person?.whatIHave && 
              renderSection(
                "What I Have", 
                applicationDetails.metadata.message.order.fulfillments[0].customer.person.whatIHave,
                <Briefcase className="h-5 w-5" />
              )
            }
            
            {applicationDetails.metadata?.message?.order?.fulfillments?.[0]?.customer?.person?.whatIWant && 
              renderSection(
                "What I Want", 
                applicationDetails.metadata.message.order.fulfillments[0].customer.person.whatIWant,
                <Target className="h-5 w-5" />
              )
            }
            
            {applicationDetails.metadata?.message?.order?.fulfillments?.[0]?.customer?.person?.interestedRole && (
              <Card className="mb-4">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5" />
                    Interested Role
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="text-sm">
                    {applicationDetails.metadata.message.order.fulfillments[0].customer.person.interestedRole}
                  </Badge>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationViewModal; 