import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Building, Users, Star, Briefcase, ChevronDown, ChevronUp, Info, Briefcase as BriefcaseIcon, User, Settings, AlertTriangle } from 'lucide-react';
import JobMediaCarousel from '@/components/JobMediaCarousel';

interface JobDetailDialogProps {
  job: any;
  isOpen: boolean;
  onClose: () => void;
  onApply: (job: any) => void;
}

interface SubsectionData {
  title: string;
  data: Array<{ key: string; value: string }>;
  icon?: React.ReactNode;
}

const JobDetailDialog: React.FC<JobDetailDialogProps> = ({ job, isOpen, onClose, onApply }) => {
  const [showAllDetails, setShowAllDetails] = useState(false);
  const [expandedSubsections, setExpandedSubsections] = useState<Set<string>>(new Set());
  
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

  // Helper function to get icon for subsection
  const getSubsectionIcon = (subsectionName: string): React.ReactNode => {
    const lowerName = subsectionName.toLowerCase();
    if (lowerName.includes('error') || lowerName.includes('issue')) {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
    if (lowerName.includes('juki')) {
      return <Settings className="h-4 w-4 text-blue-600" />;
    }
    if (lowerName.includes('machine') || lowerName.includes('equipment')) {
      return <Settings className="h-4 w-4 text-purple-600" />;
    }
    if (lowerName.includes('quality') || lowerName.includes('inspection')) {
      return <Star className="h-4 w-4 text-yellow-600" />;
    }
    return <Info className="h-4 w-4 text-gray-600" />;
  };

  // Function to process nested subsections
  const processSubsections = (data: any): SubsectionData[] => {
    const subsections: SubsectionData[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // This is a subsection
        const subsectionData = Object.entries(value)
          .filter(([subKey, subValue]) => shouldDisplayValue(subValue))
          .map(([subKey, subValue]) => ({
            key: formatFieldName(subKey),
            value: formatFieldValue(subValue)
          }));

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

  // Convert objects to displayable arrays (excluding subsections)
  const basicInfoArray = Object.entries(basicInfo)
    .filter(([key, value]) => shouldDisplayValue(value) && typeof value !== 'object')
    .map(([key, value]) => ({
      key: formatFieldName(key),
      value: formatFieldValue(value)
    }));

  const jobDetailsArray = Object.entries(jobDetails)
    .filter(([key, value]) => shouldDisplayValue(value) && typeof value !== 'object')
    .map(([key, value]) => ({
      key: formatFieldName(key),
      value: formatFieldValue(value)
    }));

  const jobNeedsArray = Object.entries(jobNeeds)
    .filter(([key, value]) => shouldDisplayValue(value) && typeof value !== 'object')
    .map(([key, value]) => ({
      key: formatFieldName(key),
      value: formatFieldValue(value)
    }));

  const industrialTailorArray = Object.entries(industrialTailorDetails)
    .filter(([key, value]) => shouldDisplayValue(value) && typeof value !== 'object')
    .map(([key, value]) => ({
      key: formatFieldName(key),
      value: formatFieldValue(value)
    }));

  const hiringManagerArray = Object.entries(hiringManager)
    .filter(([key, value]) => shouldDisplayValue(value))
    .map(([key, value]) => ({
      key: formatFieldName(key),
      value: formatFieldValue(value)
    }));

  // Process subsections
  const basicInfoSubsections = processSubsections(basicInfo);
  const jobDetailsSubsections = processSubsections(jobDetails);
  const jobNeedsSubsections = processSubsections(jobNeeds);
  const industrialTailorSubsections = processSubsections(industrialTailorDetails);

  // Helper component to render a subsection
  const renderSubsection = (subsection: SubsectionData) => {
    const isExpanded = expandedSubsections.has(subsection.title);
    const displayData = isExpanded ? subsection.data : subsection.data.slice(0, 3);
    const hasMore = subsection.data.length > 3;

    return (
      <div key={subsection.title} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div 
          className="flex items-center justify-between cursor-pointer mb-3"
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
            <h4 className="font-semibold text-sm text-gray-800">{subsection.title}</h4>
          </div>
          {hasMore && (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
        
        <div className="space-y-2">
          {displayData.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-2 px-3 bg-white rounded border">
              <span className="text-sm font-medium text-gray-700">{item.key}:</span>
              <span className="text-sm text-gray-600">{item.value}</span>
            </div>
          ))}
        </div>
        
        {hasMore && !isExpanded && (
          <div className="text-center mt-2">
            <span className="text-xs text-gray-500">
              +{subsection.data.length - 3} more items
            </span>
          </div>
        )}
      </div>
    );
  };

  // Helper component to render a section with subsections
  const renderSectionWithSubsections = (
    title: string, 
    data: any[], 
    subsections: SubsectionData[], 
    icon: React.ReactNode, 
    showMore = false
  ) => {
    if (data.length === 0 && subsections.length === 0) return null;

    const displayData = showMore ? data : data.slice(0, 6);
    const hasMore = data.length > 6;

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            {icon}
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          
          {/* Regular data items */}
          {displayData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {displayData.map((item, index) => (
                <div key={index} className="flex flex-col p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-foreground mb-1">
                    {item.value}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.key}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Subsections */}
          {subsections.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-md font-medium text-gray-700 mb-3">Subsections</h4>
              {subsections.map(renderSubsection)}
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center pt-4 border-t mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllDetails(!showAllDetails)}
                className="text-primary hover:text-primary/80"
              >
                {showAllDetails ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    View More ({data.length - 6} more)
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Helper component to render a section (backward compatibility)
  const renderSection = (title: string, data: any[], icon: React.ReactNode, showMore = false) => {
    if (data.length === 0) return null;

    const displayData = showMore ? data : data.slice(0, 6);
    const hasMore = data.length > 6;

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            {icon}
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayData.map((item, index) => (
              <div key={index} className="flex flex-col p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-foreground mb-1">
                  {item.value}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.key}
                </div>
              </div>
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center pt-4 border-t mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllDetails(!showAllDetails)}
                className="text-primary hover:text-primary/80"
              >
                {showAllDetails ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    View More ({data.length - 6} more)
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 border-b pb-4">
          <DialogTitle className="text-2xl">{job.title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-6">
            {/* Job Overview Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-40 flex-shrink-0">
                      <JobMediaCarousel 
                        media={job.media || []} 
                        title={job.title}
                        className="w-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-2xl font-bold text-foreground">{job.title}</h2>
                        {job.verified && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            ✓ Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-3">
                        <Building className="h-5 w-5" />
                        <span className="font-medium text-lg">{job.company}</span>
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
                  </div>
                  
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="bg-green-50 rounded-lg p-4 mb-3 border border-green-200">
                      <div className="text-3xl font-bold text-green-700 mb-1">{jobDetails.salaryCTC || job.salary}</div>
                      <div className="text-sm text-green-600 font-medium">Total Salary</div>
                    </div>
                    <div className="flex gap-2">
                      <div className="bg-blue-50 rounded-md px-3 py-2">
                        <div className="text-xs text-blue-600">Trust</div>
                        <div className="font-bold text-blue-700">{job.trustScore}/10</div>
                      </div>
                      <div className="bg-green-50 rounded-md px-3 py-2">
                        <div className="text-xs text-green-600">Match</div>
                        <div className="font-bold text-green-700">{job.matchScore}/10</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Description */}
            {job.description && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3">Job Description</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {job.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Company Information Section */}
            {renderSectionWithSubsections(
              "Company Information", 
              basicInfoArray, 
              basicInfoSubsections,
              <Building className="h-5 w-5 text-blue-600" />
            )}

            {/* Job Details Section */}
            {renderSectionWithSubsections(
              "Job Details", 
              jobDetailsArray, 
              jobDetailsSubsections,
              <BriefcaseIcon className="h-5 w-5 text-green-600" />
            )}

            {/* Job Requirements Section */}
            {renderSectionWithSubsections(
              "Job Requirements", 
              jobNeedsArray, 
              jobNeedsSubsections,
              <Info className="h-5 w-5 text-purple-600" />
            )}

            {/* Industrial Details Section */}
            {renderSectionWithSubsections(
              "Industrial Details", 
              industrialTailorArray, 
              industrialTailorSubsections,
              <Briefcase className="h-5 w-5 text-orange-600" />
            )}

            {/* Contact Information Section */}
            {hiringManagerArray.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold">Contact Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hiringManagerArray.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{item.value}</div>
                          <div className="text-sm text-muted-foreground">{item.key}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fallback when no details available */}
            {basicInfoArray.length === 0 && jobDetailsArray.length === 0 && jobNeedsArray.length === 0 && 
             basicInfoSubsections.length === 0 && jobDetailsSubsections.length === 0 && jobNeedsSubsections.length === 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3">Job Information</h3>
                  <div className="text-center py-8">
                    <div className="text-muted-foreground text-lg mb-2">
                      Contact job provider
                    </div>
                    <div className="text-sm text-muted-foreground">
                      No additional details available. Please contact the job provider for more information.
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 border-t pt-4">
          <div className="flex gap-3">
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90 h-12 text-base font-medium"
              onClick={() => onApply(job)}
            >
              Apply Now
            </Button>
            <Button variant="outline" className="h-12 px-8 text-base" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailDialog;
