import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { JobItem } from '@/hooks/useJobSearch';
import JobMediaCarousel from '../JobMediaCarousel';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'react-router-dom';

interface JobCardProps {
  job: JobItem;
  onApply: (job: JobItem) => void;
  onViewDetails: (job: JobItem) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onApply, onViewDetails }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { orgSlug } = useParams<{ orgSlug?: string }>();
  const { t } = useTranslation("jobcard");
  const [showAllDetails, setShowAllDetails] = useState(false);

  const getShareableLink = () => {
    const providerId = job.providerId;
    const jobId = job.id;
    if (providerId && jobId) {
      return `${window.location.origin}/${orgSlug || '0'}/${providerId}/${jobId}`;
    }
    return null;
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = getShareableLink();
    if (!shareUrl) {
      toast({
        title: t('jobCard.shareUnavailableTitle'),
        description: t('jobCard.shareUnavailableDesc'),
        variant: 'destructive',
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: t('jobCard.shareCopiedTitle'),
        description: t('jobCard.shareCopiedDesc'),
      });

      if (navigator.share) {
        try {
          await navigator.share({
            title: job.title,
            text: t('jobCard.shareText', { title: job.title }),
            url: shareUrl,
          });
        } catch {
          console.log('Native sharing cancelled or failed, but link was copied to clipboard');
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: t('jobCard.shareFailedTitle'),
        description: t('jobCard.shareFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const formatLocation = (location: string | { city?: string; state?: string } | null | undefined): string => {
    if (!location) return t('jobCard.locationNotSpecified');

    if (typeof location === 'object' && location.city && location.state) {
      return `${location.city}, ${location.state}`;
    }

    if (typeof location === 'string') {
      if (location === t('jobCard.locationNotSpecified')) {
        return t('jobCard.locationNotSpecified');
      }
      if (location.includes(',')) {
        const parts = location.split(',').map(part => part.trim());
        if (parts.length >= 2) {
          return `${parts[1]}, ${parts[2] || ''}`.trim();
        }
      }
      return location;
    }
    return t('jobCard.locationNotSpecified');
  };

  const formatFieldValue = (value: string | number | boolean | null | undefined): string => {
    if (value === null || value === undefined || value === '') {
      return t('jobCard.notSpecified');
    }
    if (typeof value === 'boolean') return value ? t('common.yes') : t('common.no');
    if (typeof value === 'number') return value.toLocaleString();
    return String(value);
  };

  const renderJobDetailsTable = () => {
    const getSalaryRange = () => {
      const minSalary = job.tags?.jobDetails?.minMonthlyInHand || job.jobDetails?.minMonthlyInHand;
      const maxSalary = job.tags?.jobDetails?.maxMonthlyInHand || job.jobDetails?.maxMonthlyInHand;
      if (minSalary && maxSalary) return `₹${minSalary.toLocaleString()} - ₹${maxSalary.toLocaleString()}`;
      if (maxSalary) return t('jobCard.salaryUpTo', { value: `₹${maxSalary.toLocaleString()}` });
      if (minSalary) return t('jobCard.salaryFrom', { value: `₹${minSalary.toLocaleString()}` });
      return t('jobCard.notSpecified');
    };

    const getJobLocation = () => {
      const location = job.tags?.basicInfo?.jobProviderLocation;
      if (location && location.city && location.state) return `${location.city}, ${location.state}`;
      return formatLocation(job.jobProviderLocation || job.location);
    };

    const structuredDetails = [
      { label: t('jobCard.roleName'), value: job.title, key: 'roleName' },
      { label: t('jobCard.openings'), value: job.tags?.jobDetails?.positions || job.positions || job.openings || 1, key: 'openings' },
      { label: t('jobCard.roleDetails'), value: '', key: 'roleDetails' },
      { label: t('jobCard.location'), value: getJobLocation(), key: 'location' },
      { label: t('jobCard.workTimings'), value: job.tags?.jobDetails?.workingHoursPerDay || job.jobDetails?.workingHoursPerDay || t('jobCard.notSpecified'), key: 'workTimings' },
      { label: t('jobCard.salaryRange'), value: getSalaryRange(), key: 'salaryRange' },
      { label: t('jobCard.pfEsic'), value: job.tags?.jobDetails?.monthlyPfEsicBenefits || job.jobDetails?.monthlyPfEsicBenefits || t('jobCard.notSpecified'), key: 'pfEsic' },
      { label: t('jobCard.overtime'), value: job.tags?.jobDetails?.monthlyAverageOT || job.jobDetails?.monthlyAverageOT || t('jobCard.notSpecified'), key: 'overtime' },
      { label: t('jobCard.stayProvided'), value: job.tags?.jobDetails?.stayProvided || job.jobDetails?.stayProvided || t('jobCard.notSpecified'), key: 'stayProvided' },
      { label: t('jobCard.minimumAge'), value: job.tags?.jobNeeds?.ageAllowedLowerLimit || job.jobDetails?.ageAllowedLowerLimit || t('jobCard.notSpecified'), key: 'minimumAge' },
    ];

    const displayDetails = structuredDetails.filter(d => !(d.key === 'roleDetails' && !d.value));

    const maxItems = 8;
    const visibleDetails = showAllDetails ? displayDetails : displayDetails.slice(0, maxItems);
    const hasMoreDetails = displayDetails.length > maxItems;

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">{t('jobCard.jobDetails')}</h4>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <tbody>
              {visibleDetails.map((detail, idx) => (
                <tr key={idx} className="border-b last:border-b-0">
                  <td className="p-2 sm:p-3 text-xs sm:text-sm">
                    <div className="font-medium text-muted-foreground">{detail.label}</div>
                    <div className="text-foreground font-semibold">{formatFieldValue(detail.value)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hasMoreDetails && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowAllDetails(!showAllDetails);
            }}
            className="w-full text-xs text-muted-foreground hover:text-foreground"
          >
            {showAllDetails ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                {t('jobCard.showLess')}
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                {t('jobCard.viewMore', { count: displayDetails.length - maxItems })}
              </>
            )}
          </Button>
        )}
      </div>
    );
  };

  const shouldShowRealScores = user && user.profile;
  const displayTrustScore = shouldShowRealScores ? job.trustScore : 0;
  const displayMatchScore = shouldShowRealScores ? job.matchScore : 0;

  const jobLocation = job.tags?.basicInfo?.jobProviderLocation || job.jobProviderLocation || job.location;
  const formattedLocation = formatLocation(jobLocation);

  const positions = job.tags?.jobDetails?.positions || job.positions || job.openings || 1;

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onViewDetails(job)}>
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Job Title */}
        <div className="space-y-2">
          <h3 className="text-lg sm:text-xl font-semibold text-foreground line-clamp-2">
            {job.title}
            {positions && positions > 0 && (
              <span className="text-muted-foreground font-normal"> ({positions})</span>
            )}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {formattedLocation}
          </div>
        </div>

        {/* Company Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            <Building className="h-4 w-4 sm:h-6 sm:w-6 text-gray-600" />
          </div>
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
            <span className="font-medium text-sm sm:text-base text-foreground truncate">
              {job.tags?.basicInfo?.jobProviderName || job.company}
            </span>
            {job.verified && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs flex-shrink-0">
                ✓
              </Badge>
            )}
          </div>
        </div>

        {/* Media */}
        <div className="w-full" onClick={(e) => e.stopPropagation()}>
          <JobMediaCarousel media={job.media || []} title={job.title} className="w-full" />
        </div>

        {/* Job Details */}
        {renderJobDetailsTable()}

        {/* Scores */}
        <div className="flex gap-2 sm:gap-4">
          <div className="bg-blue-50 rounded-lg p-2 sm:p-3 flex-1 text-center">
            <div className="text-xs text-blue-600">{t('jobCard.trustScore')}</div>
            <div className="text-sm sm:text-base font-bold text-blue-700">
              {shouldShowRealScores ? `${displayTrustScore}/10` : '0/10'}
            </div>
            {!shouldShowRealScores && (
              <div className="text-xs text-blue-500 mt-1">{t('jobCard.loginToSee')}</div>
            )}
          </div>
          <div className="bg-green-50 rounded-lg p-2 sm:p-3 flex-1 text-center">
            <div className="text-xs text-green-600">{t('jobCard.matchScore')}</div>
            <div className="text-sm sm:text-base font-bold text-green-700">{displayMatchScore}/10</div>
            {!shouldShowRealScores && (
              <div className="text-xs text-green-500 mt-1">{t('jobCard.loginToSee')}</div>
            )}
          </div>
        </div>

        {/* Apply Now */}
        <Button
          className="w-full bg-primary hover:bg-primary/90 h-10 sm:h-12 text-sm sm:text-base font-medium"
          onClick={(e) => {
            e.stopPropagation();
            onApply(job);
          }}
        >
          {t('jobCard.applyNow')}
        </Button>

        {/* Share */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="w-full text-xs text-muted-foreground hover:text-foreground"
        >
          <Copy className="h-3 w-3 mr-1" />
          {t('jobCard.shareJob')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default JobCard;
