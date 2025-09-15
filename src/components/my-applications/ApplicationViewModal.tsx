import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, User, Briefcase, Target, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

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
  const { user, getSelectedCandidate } = useAuth();
  const { t } = useTranslation("applicationviewmodal");
  const selectedCandidate = getSelectedCandidate();
  const [applicationDetails, setApplicationDetails] = useState<ApplicationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    whoIAm: false,
    whatIHave: false,
    whatIWant: false
  });

  useEffect(() => {
    if (isOpen && applicationId && user?.id) {
      fetchApplicationDetails();
    }
  }, [isOpen, applicationId, user?.id, selectedCandidate?.id]);

  const fetchApplicationDetails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const profileIdForApi = selectedCandidate?.id || user?.id;
      const response = await fetch(
        `${import.meta.env.VITE_BAP_URL}/api/v1/job-applications?user_id=${profileIdForApi}`
      );
      const data = await response.json();
      
      const applications = data?.applications || [];
      const application = applications.find((app: any) => {
        const appId = app.order_id ?? app.transaction_id ?? app.job_id;
        return (
          appId === applicationId ||
          app.order_id === applicationId ||
          app.transaction_id === applicationId
        );
      });
      
      if (application) {
        setApplicationDetails(application);
      } else {
        setError(t('applicationView.notFound'));
      }
    } catch (err) {
      console.error('Failed to fetch application details:', err);
      setError(t('applicationView.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const isObject = (val: any) => val && typeof val === 'object' && !Array.isArray(val);

  const renderKeyValueList = (obj: Record<string, any>) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(obj).map(([key, value]) => {
          if (
            key.startsWith('is') ||
            value === undefined ||
            value === null ||
            value === '' ||
            key === 'gps' ||
            key === 'tag'
          )
            return null;

          if (Array.isArray(value) && value.length === 0) return null;

          if (isObject(value)) {
            return (
              <div key={key} className="col-span-full space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground mb-1">
                  {t(`applicationView.fields.${key}`, key)}
                </h4>
                {renderKeyValueList(value as Record<string, any>)}
              </div>
            );
          }
          return (
            <div key={key} className="p-3 rounded-lg bg-gray-50">
              <div className="text-sm font-medium text-muted-foreground">
                {t(`applicationView.fields.${key}`, key)}
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
    titleKey: string, 
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
              <h3 className="text-lg font-semibold">{t(titleKey)}</h3>
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
          <DialogTitle className="text-xl">{t('applicationView.title')}</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">{t('applicationView.loading')}</span>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchApplicationDetails} className="mt-4">
              {t('applicationView.retry')}
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
                    <h3 className="text-lg font-semibold">{t('applicationView.interestedRole')}</h3>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <div className="text-sm font-medium text-muted-foreground">
                      {t('applicationView.role')}
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
              'applicationView.whoIAm',
              applicationDetails.metadata?.message?.order?.fulfillments?.[0]?.customer?.person?.metadata?.whoIAm,
              'whoIAm',
              <User className="h-5 w-5" />
            )}

            {renderExpandableSection(
              'applicationView.whatIHave',
              applicationDetails.metadata?.message?.order?.fulfillments?.[0]?.customer?.person?.metadata?.whatIHave,
              'whatIHave',
              <Briefcase className="h-5 w-5" />
            )}

            {renderExpandableSection(
              'applicationView.whatIWant',
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
