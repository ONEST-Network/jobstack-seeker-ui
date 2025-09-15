import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MapPin, 
  Clock, 
  Users, 
  Star, 
  Building, 
  Award, 
  Phone, 
  Globe,
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';
import { JobItem } from '@/hooks/useJobSearch';
import { useAuth } from '@/contexts/AuthContext';
import JobMediaCarousel from '../JobMediaCarousel';

interface JobDetailDialogProps {
  job: JobItem;
  isOpen: boolean;
  onClose: () => void;
  onApply: (job: JobItem) => void;
}

interface SubsectionData {
  title: string;
  data: Array<{ key: string; value: string }>;
  icon?: React.ReactNode;
}

const JobDetailDialog: React.FC<JobDetailDialogProps> = ({ job, isOpen, onClose, onApply }) => {
  const { t } = useTranslation("jobdetaildialog");
  const [expandedSubsections, setExpandedSubsections] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  
  if (!job) return null;

  // Extract all tag data from the job object
  const tags = job.tags || {};
  const basicInfo = tags.basicInfo || {};
  const jobDetails = tags.jobDetails || job.jobDetails || {};
  const jobNeeds = tags.jobNeeds || {};
  const industrialTailorDetails = tags.industrialTailorDetails || {};
  const hiringManager = tags.hiringManager || {};

  // Helper function to format field values
  const formatFieldValue = (value: any): string => {
    if (value === null || value === undefined || value === '') {
      return t('jobDetail.notSpecified');
    }
    if (typeof value === 'boolean') {
      return value ? t('common.yes') : t('common.no');
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'object') {
      if (value.city && value.state) {
        return `${value.city}, ${value.state}`;
      }
      if (value.address) {
        return value.address;
      }
      const objValues = Object.values(value).filter(v => v);
      return objValues.length > 0 ? objValues.join(', ') : t('jobDetail.notSpecified');
    }
    return String(value);
  };

  // Get display scores
  const shouldShowRealScores = user && user.profile;
  const displayTrustScore = shouldShowRealScores ? job.trustScore : 0;
  const displayMatchScore = shouldShowRealScores ? job.matchScore : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 sm:p-6">
        <DialogHeader className="p-4 sm:p-6 pb-0">
          <DialogTitle className="text-xl font-bold overflow-hidden text-ellipsis whitespace-nowrap">
            {job.title}
            {job.openings && job.openings > 0 && (
              <span className="text-muted-foreground font-normal"> ({job.openings})</span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 sm:p-6 pt-0 space-y-6">
          {/* Header with basic info */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold">{job.company}</span>
                {job.verified && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    ✓ {t('jobDetail.verified')}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{job.location}</span>
                </div>
                {job.openings && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">
                      {t('jobDetail.openings', { count: job.openings })}
                    </span>
                  </div>
                )}
                {job.workingHours && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{job.workingHours}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {(jobDetails.salaryCTC || job.salary) && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="text-2xl sm:text-3xl font-bold text-green-700 mb-1">
                    {jobDetails.salaryCTC
                      ? `₹${jobDetails.salaryCTC.toLocaleString()}`
                      : job.salary}
                  </div>
                  <div className="text-sm text-green-600 font-medium">
                    {t('jobDetail.totalSalary')}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <div className="bg-blue-50 rounded-md px-3 py-2 flex-1">
                  <div className="text-xs text-blue-600">{t('jobDetail.trust')}</div>
                  <div className="font-bold text-blue-700">
                    {shouldShowRealScores ? `${displayTrustScore}/10` : '0/10'}
                  </div>
                  {!shouldShowRealScores && (
                    <div className="text-xs text-blue-500">{t('auth.loginToSee')}</div>
                  )}
                </div>
                <div className="bg-green-50 rounded-md px-3 py-2 flex-1">
                  <div className="text-xs text-green-600">{t('jobDetail.match')}</div>
                  <div className="font-bold text-green-700">{displayMatchScore}/10</div>
                  {!shouldShowRealScores && (
                    <div className="text-xs text-green-500">{t('auth.loginToSee')}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Media Section */}
          {job.media && job.media.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                <h3 className="text-lg font-semibold">{t('jobDetail.media')}</h3>
              </div>
              <JobMediaCarousel media={job.media} title={job.title} className="w-full" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t mt-6">
            <Button 
              onClick={() => onApply(job)}
              className="flex-1 bg-primary hover:bg-primary/90 h-12 text-base font-medium"
            >
              {t('jobDetail.applyNow')}
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="h-12"
            >
              {t('common.close')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailDialog;
