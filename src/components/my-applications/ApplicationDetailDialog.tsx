import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

interface ApplicationDetailDialogProps {
  application: any; // raw application object from API
  isOpen: boolean;
  onClose: () => void;
}

// Helper to convert camelCase / snake_case to Title Case
const formatKey = (key: string) =>
  key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());

const isObject = (val: any) => val && typeof val === 'object' && !Array.isArray(val);

const renderKeyValueList = (obj: Record<string, any>) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Object.entries(obj).map(([key, value]) => {
        if (
          value === undefined ||
          value === null ||
          value === '' ||
          key === 'gps' ||
          key === 'tag'
        )
          return null;

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
              {String(value)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ApplicationDetailDialog: React.FC<ApplicationDetailDialogProps> = ({
  application,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation("applicationdetaildialog");

  if (!application) return null;

  const item =
    application?.metadata?.message?.order?.items?.[0] || ({} as Record<string, any>);
  const tag = item?.tag || {};
  const basicInfo = tag.basicInfo || {};
  const jobDetails = tag.jobDetails || {};
  const jobNeeds = tag.jobNeeds || {};
  const jobProviderLocation = tag.jobProviderLocation || {};
  const status = application.status;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto w-full max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {t('applicationDetails.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div>
            <span className="text-sm font-medium mr-2">
              {t('applicationDetails.status')}:
            </span>
            <Badge variant="outline" className="capitalize">
              {status}
            </Badge>
          </div>

          {/* Basic Info */}
          {Object.keys(basicInfo).length > 0 && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">
                  {t('applicationDetails.basicInfo')}
                </h3>
                {renderKeyValueList(basicInfo)}
              </CardContent>
            </Card>
          )}

          {/* Job Details */}
          {Object.keys(jobDetails).length > 0 && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">
                  {t('applicationDetails.jobDetails')}
                </h3>
                {renderKeyValueList(jobDetails)}
              </CardContent>
            </Card>
          )}

          {/* Job Needs */}
          {Object.keys(jobNeeds).length > 0 && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">
                  {t('applicationDetails.jobNeeds')}
                </h3>
                {renderKeyValueList(jobNeeds)}
              </CardContent>
            </Card>
          )}

          {/* Provider Location */}
          {Object.keys(jobProviderLocation).length > 0 && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">
                  {t('applicationDetails.providerLocation')}
                </h3>
                {renderKeyValueList(jobProviderLocation)}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationDetailDialog;
