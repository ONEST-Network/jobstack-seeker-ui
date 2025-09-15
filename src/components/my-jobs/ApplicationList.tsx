import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

interface ApplicationListProps {
  applications: any[];
  onViewCandidate: (candidate: any) => void;
  getApplicationStatusColor: (status: string) => string;
}

const ApplicationList: React.FC<ApplicationListProps> = ({ 
  applications, 
  onViewCandidate, 
  getApplicationStatusColor 
}) => {
  const { t } = useTranslation("applicationlist");

  if (applications.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('applications.noApplications')} 
        {/* Example key: "applications.noApplications": "No applications received yet" */}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map(application => (
        <div 
          key={application.id} 
          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar with initials */}
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                {application.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>

              {/* Candidate Info */}
              <div>
                <h4 className="font-medium">{application.name}</h4>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{application.location}</span>
                  <span>
                    {application.experience} {t('applications.experience')}
                    {/* "applications.experience": "experience" */}
                  </span>
                  <span>
                    {t('applications.appliedOn')} {new Date(application.applicationDate).toLocaleDateString()}
                    {/* "applications.appliedOn": "Applied on" */}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs">
                    {t('applications.trust')}: {application.trustScore || 0}%
                    {/* "applications.trust": "Trust" */}
                  </span>
                  <span className="text-xs">
                    {t('applications.match')}: {application.matchScore}%
                    {/* "applications.match": "Match" */}
                  </span>
                </div>
              </div>
            </div>

            {/* Status + Actions */}
            <div className="flex items-center gap-3">
              <Badge className={getApplicationStatusColor(application.status)}>
                {t(`applications.status.${application.status}`)}
                {/* Example keys:
                  "applications.status.pending": "Pending"
                  "applications.status.reviewed": "Reviewed"
                  "applications.status.accepted": "Accepted"
                */}
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onViewCandidate(application)}
              >
                {t('applications.viewDetails')}
                {/* "applications.viewDetails": "View Details" */}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ApplicationList;
