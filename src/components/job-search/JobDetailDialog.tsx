import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Users, Star, Building, Calendar, DollarSign, Home, BedDouble, Award, Phone, Mail, Globe } from 'lucide-react';
import { JobItem } from '@/hooks/useJobSearch';
import { useAuth } from '@/contexts/AuthContext';

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
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
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

  // Helper function to render media field
  const renderMediaField = (label: string, mediaUrl: string, type: 'video' | 'image', icon?: React.ReactNode) => {
    return (
      <div key={label} className="flex items-center gap-2 text-sm">
        {icon || <Star className="h-4 w-4" />}
        <span className="font-medium">{label}:</span>
        <a 
          href={mediaUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          View {type}
        </a>
      </div>
    );
  };

  // Helper function to render media array
  const renderMediaArray = (label: string, mediaUrls: string[], type: 'video' | 'image', icon?: React.ReactNode) => {
    return (
      <div key={label} className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          {icon || <Star className="h-4 w-4" />}
          <span className="font-medium">{label}:</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {mediaUrls.map((url, index) => (
            <a 
              key={index}
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline text-xs"
            >
              {type} {index + 1}
            </a>
          ))}
        </div>
      </div>
    );
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
      <div key={subsection.title} className="border rounded-lg p-4">
        <div 
          className="flex items-center justify-between cursor-pointer"
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
            <h4 className="font-semibold">{subsection.title}</h4>
          </div>
          <Button variant="ghost" size="sm">
            {isExpanded ? '▼' : '▶'}
          </Button>
        </div>
        
        {isExpanded && (
          <div className="mt-4 space-y-2">
            {subsection.data.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.key}:</span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
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
        
        {data.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {data.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.key}:</span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        )}
        
        {subsections.length > 0 && (
          <div className="space-y-3">
            {subsections.map(renderSubsection)}
          </div>
        )}
      </div>
    );
  };

  // Render section
  const renderSection = (title: string, data: any[], icon: React.ReactNode, showMore = false) => {
    return (
      <div key={title} className="space-y-4">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {data.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.key}:</span>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Determine if we should show real trust scores
  const shouldShowRealScores = user && user.profile;
  
  // Get display scores - show 0 if user not logged in, real scores if logged in
  const displayTrustScore = shouldShowRealScores ? job.trustScore : 0;
  const displayMatchScore = shouldShowRealScores ? job.matchScore : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{job.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header with basic info */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold">{job.company}</span>
                {job.verified && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    ✓ Verified
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{job.location}</span>
                </div>
                {job.openings && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{job.openings} openings</span>
                  </div>
                )}
                {job.workingHours && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{job.workingHours}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-right flex-shrink-0 ml-4">
              <div className="bg-green-50 rounded-lg p-4 mb-3 border border-green-200">
                <div className="text-3xl font-bold text-green-700 mb-1">{jobDetails.salaryCTC || job.salary}</div>
                <div className="text-sm text-green-600 font-medium">Total Salary</div>
              </div>
              <div className="flex gap-2">
                <div className="bg-blue-50 rounded-md px-3 py-2">
                  <div className="text-xs text-blue-600">Trust</div>
                  <div className="font-bold text-blue-700">{displayTrustScore}/10</div>
                  {!shouldShowRealScores && (
                    <div className="text-xs text-blue-500">Login to see</div>
                  )}
                </div>
                <div className="bg-green-50 rounded-md px-3 py-2">
                  <div className="text-xs text-green-600">Match</div>
                  <div className="font-bold text-green-700">{displayMatchScore}/10</div>
                  {!shouldShowRealScores && (
                    <div className="text-xs text-green-500">Login to see</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Job Details */}
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
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              onClick={() => onApply(job)}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Apply Now
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailDialog;
