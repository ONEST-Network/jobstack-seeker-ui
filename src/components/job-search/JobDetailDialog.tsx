import React, { useState } from 'react';
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
  Calendar, 
  DollarSign, 
  Home, 
  BedDouble, 
  Award, 
  Phone, 
  Mail, 
  Globe,
  ChevronDown,
  ChevronRight,
  Play,
  Image as ImageIcon,
  Video as VideoIcon,
  Copy,
  Share2
} from 'lucide-react';
import { JobItem } from '@/hooks/useJobSearch';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'react-router-dom';
import JobMediaCarousel from '../JobMediaCarousel';
import { useTranslation } from '@/hooks/useI18n';

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
  const [expandedSubsections, setExpandedSubsections] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();
  const t = useTranslation('jobs');
  const { orgSlug } = useParams<{ orgSlug?: string }>();
  
  if (!job) return null;

  // Extract all tag data from the job object
  const tags = job.tags || {};
  const basicInfo = tags.basicInfo || {};
  const jobDetails = tags.jobDetails || job.jobDetails || {};
  const jobNeeds = tags.jobNeeds || {};
  const industrialTailorDetails = tags.industrialTailorDetails || {};
  const hiringManager = tags.hiringManager || {};

  // Helper function to format field names
  const formatFieldName = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  // Helper function to format field values and handle objects
  const formatFieldValue = (value: any): string => {
    if (value === null || value === undefined || value === '') {
      return 'Not specified';
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'object') {
      // Handle nested objects
      if (value.city && value.state) {
        return `${value.city}, ${value.state}`;
      }
      if (value.address) {
        return value.address;
      }
      // For other objects, try to extract meaningful information
      const objValues = Object.values(value).filter(v => v !== null && v !== undefined && v !== '');
      return objValues.length > 0 ? objValues.join(', ') : 'Not specified';
    }
    return String(value);
  };

  // Helper function to check if a value should be displayed
  const shouldDisplayValue = (value: any): boolean => {
    if (value === null || value === undefined || value === '') {
      return false;
    }
    if (typeof value === 'object' && Object.keys(value).length === 0) {
      return false;
    }
    return true;
  };

  // Helper function to get subsection icon
  const getSubsectionIcon = (subsectionName: string): React.ReactNode => {
    const iconMap: Record<string, React.ReactNode> = {
      'basicInfo': <Building className="h-4 w-4" />,
      'jobDetails': <Award className="h-4 w-4" />,
      'jobNeeds': <Users className="h-4 w-4" />,
      'industrialTailorDetails': <Star className="h-4 w-4" />,
      'hiringManager': <Phone className="h-4 w-4" />,
      'jobProviderLocation': <MapPin className="h-4 w-4" />,
      'jobDescription': <Globe className="h-4 w-4" />
    };
    return iconMap[subsectionName] || <Star className="h-4 w-4" />;
  };

  // Process subsections from tags
  const processSubsections = (data: any): SubsectionData[] => {
    const subsections: SubsectionData[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const subsectionData: Array<{ key: string; value: string }> = [];
        
        Object.entries(value).forEach(([subKey, subValue]) => {
          if (shouldDisplayValue(subValue)) {
            subsectionData.push({
              key: formatFieldName(subKey),
              value: formatFieldValue(subValue)
            });
          }
        });
        
        if (subsectionData.length > 0) {
          subsections.push({
            title: formatFieldName(key),
            data: subsectionData,
            icon: getSubsectionIcon(key)
          });
        }
      }
    });
    
    return subsections;
  };

  // Render subsection
  const renderSubsection = (subsection: SubsectionData) => {
    const isExpanded = expandedSubsections.has(subsection.title);
    
    return (
      <Card key={subsection.title} className="border">
        <CardContent className="p-0">
          <div 
            className="flex items-center justify-between cursor-pointer p-4 hover:bg-gray-50 transition-colors"
            onClick={() => {
              const newExpanded = new Set(expandedSubsections);
              if (isExpanded) {
                newExpanded.delete(subsection.title);
              } else {
                newExpanded.add(subsection.title);
              }
              setExpandedSubsections(newExpanded);
            }}
          >
            <div className="flex items-center gap-2">
              {subsection.icon}
              <h4 className="font-semibold text-sm">{subsection.title}</h4>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          
          {isExpanded && (
            <div className="px-4 pb-4 space-y-3 border-t">
              {subsection.data.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-sm text-muted-foreground font-medium">{item.key}:</span>
                  <span className="text-sm font-semibold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render section with subsections
  const renderSectionWithSubsections = (
    title: string, 
    data: any[], 
    subsections: SubsectionData[], 
    icon: React.ReactNode
  ) => {
    return (
      <div key={title} className="space-y-4">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        
        {subsections.length > 0 && (
          <div className="space-y-3">
            {subsections.map(renderSubsection)}
          </div>
        )}
      </div>
    );
  };

  // Determine if we should show real trust scores
  const shouldShowRealScores = user && user.profile;
  
  // Get display scores - show 0 if user not logged in, real scores if logged in
  const displayTrustScore = shouldShowRealScores ? job.trustScore : 0;
  const displayMatchScore = shouldShowRealScores ? job.matchScore : 0;

  // Helper function to get provider and job IDs for sharing
  const getShareableLink = () => {
    // Try to find provider and job IDs from the job data
    // This assumes the job data contains the necessary IDs from the search API
    const providerId = job.providerId;
    const jobId = job.id;
    
    if (providerId && jobId) {
      // Use the new route structure with organization slug
      return `${window.location.origin}/${orgSlug || '0'}/${providerId}/${jobId}`;
    }
    
    return null;
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const shareUrl = getShareableLink();
    
    if (!shareUrl) {
      toast({
        title: "Share Unavailable",
        description: "This job cannot be shared at the moment.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Always copy to clipboard first
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied!",
        description: "Job link has been copied to clipboard. You can now share it manually.",
      });

      // Then try native sharing if available (mobile devices)
      if (navigator.share) {
        try {
          await navigator.share({
            title: job.title,
            text: `Check out this job opportunity: ${job.title}`,
            url: shareUrl
          });
        } catch (shareError) {
          // If native sharing fails, that's okay - we already copied to clipboard
          console.log('Native sharing cancelled or failed, but link was copied to clipboard');
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Share Failed",
        description: "Failed to copy job link. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Render job details that were shown on the card
  const renderJobDetails = () => {
    const details = [];

    if (job.monthlyInHand && job.monthlyInHand !== 'Not specified') {
      details.push({
        label: 'Monthly In-Hand',
        value: job.monthlyInHand,
        icon: <Star className="h-4 w-4" />
      });
    }


    if (job.monthlyOvertime && job.monthlyOvertime !== 'Not specified') {
      details.push({
        label: 'Overtime',
        value: job.monthlyOvertime,
        icon: <Clock className="h-4 w-4" />
      });
    }

    if (job.travelProvided) {
      details.push({
        label: 'Travel Provided',
        value: 'Yes',
        icon: <Building className="h-4 w-4" />
      });
    }

    if (job.costPerSharingBed && job.costPerSharingBed !== 'Not specified') {
      details.push({
        label: 'Cost per Bed',
        value: job.costPerSharingBed,
        icon: <MapPin className="h-4 w-4" />
      });
    }

    if (details.length === 0) return null;

    return (
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold mb-3">Job Benefits</h4>
          <div className="space-y-2">
            {details.map((detail, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                {detail.icon}
                <span className="text-muted-foreground">{detail.label}:</span>
                <span className="font-semibold">{detail.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render job details table
  const renderJobDetailsTable = () => {
    if (!job.jobDetails || Object.keys(job.jobDetails).length === 0) {
      return null;
    }

    // Convert jobDetails object to array of key-value pairs
    // Filter out video and photo URLs that should be handled by media carousel
    const detailsArray = Object.entries(job.jobDetails).filter(([key, value]) => {
      // Skip if value is null, undefined, or empty
      if (value === null || value === undefined || value === '') {
        return false;
      }
      
      // Skip video and photo related fields that should be in media carousel
      const skipFields = [
        'jobDetailsVideo',
        'jobLocationPhotos',
        'factoryWalkthroughVideo',
        'workerTestimonialVideo',
        'skillProofVideo',
        'qualityProofImage',
        'sampleTaskVideo',
        'sampleTaskImage',
        'uploadSpeedProof',
        'uploadSpeedSampleMedia',
        'jobProviderLogo',
        'video',
        'photo',
        'image',
        'thumbnail',
        'media',
        'url'
      ];
      
      const keyLower = key.toLowerCase();
      return !skipFields.some(field => keyLower.includes(field));
    });

    if (detailsArray.length === 0) {
      return null;
    }

    // Format field names for better display
    const formatFieldName = (key: string) => {
      return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace(/([A-Z])/g, ' $1')
        .trim();
    };

    // Format field values for better display
    const formatFieldValue = (value: any) => {
      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
      }
      if (typeof value === 'number') {
        return value.toLocaleString();
      }
      return String(value);
    };

    return (
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold mb-3">Job Details</h4>
          <div className="space-y-3">
            {detailsArray.map(([key, value], index) => (
              <div key={index} className="flex justify-between">
                <span className="text-sm text-muted-foreground">{formatFieldName(key)}:</span>
                <span className="text-sm font-semibold">{formatFieldValue(value)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0 sm:p-6 w-[95vw] sm:w-full">
        <DialogHeader className="p-4 sm:p-6 pb-0 sticky top-0 bg-background z-10 border-b">
          <DialogTitle className="text-lg sm:text-xl font-bold overflow-hidden text-ellipsis whitespace-nowrap">
            {job.title}
            {job.openings && job.openings > 0 && (
              <span className="text-muted-foreground font-normal"> ({job.openings})</span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 sm:p-6 pt-0 space-y-6">
          {/* Header with basic info */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold">{job.company}</span>
                  {job.verified && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      ✓ Verified
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
                      <span className="text-sm">{job.openings} openings</span>
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
                {(jobDetails.salaryCTC || (job.salary && job.salary !== 'Salary not specified' && job.salary !== 'Not specified')) && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="text-2xl sm:text-3xl font-bold text-green-700 mb-1">
                      {jobDetails.salaryCTC 
                        ? `₹${jobDetails.salaryCTC.toLocaleString()}`
                        : job.salary && job.salary !== 'Salary not specified' && job.salary !== 'Not specified'
                          ? job.salary
                          : 'N/A'
                      }
                    </div>
                    <div className="text-sm text-green-600 font-medium">Total Salary</div>
                  </div>
                )}
                <div className="flex gap-2">
                  <div className="bg-blue-50 rounded-md px-3 py-2 flex-1">
                    <div className="text-xs text-blue-600">Trust</div>
                    <div className="font-bold text-blue-700">
                      {shouldShowRealScores ? `${displayTrustScore}/10` : '0/10'}
                    </div>
                    {!shouldShowRealScores && (
                      <div className="text-xs text-blue-500">Login to see</div>
                    )}
                  </div>
                  <div className="bg-green-50 rounded-md px-3 py-2 flex-1">
                    <div className="text-xs text-green-600">Match</div>
                    <div className="font-bold text-green-700">{displayMatchScore}/10</div>
                    {!shouldShowRealScores && (
                      <div className="text-xs text-green-500">Login to see</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Job Benefits (from card) */}
            {renderJobDetails()}

            {/* Job Details Table (from card) */}
            {renderJobDetailsTable()}
          </div>

          {/* Media Section */}
          {job.media && job.media.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Media & Photos</h3>
              </div>
              <div className="w-full">
                <JobMediaCarousel 
                  media={job.media} 
                  title={job.title}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Job Details Sections */}
          <div className="space-y-6">
            {/* Basic Info */}
            {Object.keys(basicInfo).length > 0 && renderSectionWithSubsections(
              'Basic Information',
              [],
              processSubsections(basicInfo),
              <Building className="h-5 w-5" />
            )}

            {/* Job Details */}
            {Object.keys(jobDetails).length > 0 && renderSectionWithSubsections(
              'Job Details',
              [],
              processSubsections(jobDetails),
              <Award className="h-5 w-5" />
            )}

            {/* Job Needs */}
            {Object.keys(jobNeeds).length > 0 && renderSectionWithSubsections(
              'Job Requirements',
              [],
              processSubsections(jobNeeds),
              <Users className="h-5 w-5" />
            )}

            {/* Industrial Tailor Details */}
            {Object.keys(industrialTailorDetails).length > 0 && renderSectionWithSubsections(
              'Industrial Tailor Details',
              [],
              processSubsections(industrialTailorDetails),
              <Star className="h-5 w-5" />
            )}

            {/* Hiring Manager */}
            {Object.keys(hiringManager).length > 0 && renderSectionWithSubsections(
              'Contact Information',
              [],
              processSubsections(hiringManager),
              <Phone className="h-5 w-5" />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t mt-6 sticky bottom-0 bg-background pb-4">
            <Button 
              onClick={() => onApply(job)}
              className="flex-1 bg-primary hover:bg-primary/90 h-12 text-base font-medium"
            >
              {t('actions.applyNow', 'Apply Now')}
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              className="h-12 px-4"
            >
              <Copy className="h-4 w-4 mr-2" />
              {t('actions.shareJob', 'Share Job')}
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="h-12"
            >
              {t('actions.close', 'Close')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailDialog;
