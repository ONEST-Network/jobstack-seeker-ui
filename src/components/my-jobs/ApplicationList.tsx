
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  if (applications.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No applications received yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map(application => (
        <div key={application.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                {application.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div>
                <h4 className="font-medium">{application.name}</h4>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{application.location}</span>
                  <span>{application.experience} experience</span>
                  <span>Applied on {new Date(application.applicationDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs">Trust: {application.trustScore}%</span>
                  <span className="text-xs">Match: {application.matchScore}%</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={getApplicationStatusColor(application.status)}>
                {application.status}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => onViewCandidate(application)}>
                View Details
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ApplicationList;
