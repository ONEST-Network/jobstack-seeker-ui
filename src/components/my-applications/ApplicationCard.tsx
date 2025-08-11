
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Send } from 'lucide-react';
import JobMediaCarousel from '@/components/JobMediaCarousel';
import ApplicationStatusBadge from './ApplicationStatusBadge';
import ApplicationDetailDialog from './ApplicationDetailDialog';
import ApplicationViewModal from './ApplicationViewModal';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useJobApplication } from '@/hooks/useJobApplication';
import { useToast } from '@/hooks/use-toast';

interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  salary: string;
  appliedDate: string;

  status: 'applied' | 'viewed' | 'shortlisted' | 'interview' | 'hired' | 'rejected' | 'draft';
  raw?: any;
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
    alt?: string;
    duration?: string;
  }>;
}

interface ApplicationCardProps {
  application: JobApplication;
  isCompleted?: boolean;
  isDraft?: boolean;
  onApplicationSubmitted?: () => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ 
  application, 
  isCompleted = false, 
  isDraft = false,
  onApplicationSubmitted
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewApplicationOpen, setViewApplicationOpen] = useState(false);
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const isMobile = useIsMobile();
  const { applyToJob } = useJobApplication();
  const { toast } = useToast();
  
  const cardStyle = isCompleted 
    ? `hover:shadow-md transition-shadow ${
        application.status === 'shortlisted' 
          ? 'border-green-200 bg-green-50' 
          : application.status === 'deleted'
          ? 'border-gray-300 bg-gray-50 opacity-75'
          : 'border-red-200 bg-red-50'
      }`
    : isDraft
    ? 'hover:shadow-md transition-shadow border-orange-200 bg-orange-50'
    : 'hover:shadow-md transition-shadow';

  const handleSubmitApplication = async () => {
    if (!application.raw) {
      toast({
        title: "Error",
        description: "Unable to submit application. Draft data not found.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingApplication(true);

    try {
      // Extract the transaction ID from the draft application
      const transactionId = application.raw.transaction_id;
      
      if (!transactionId) {
        toast({
          title: "Error",
          description: "Unable to submit application. Transaction ID not found.",
          variant: "destructive",
        });
        return;
      }

      // Extract application data from the draft
      const draftData = application.raw;
      const person = draftData?.metadata?.message?.order?.fulfillments?.[0]?.customer?.person;
      
      if (!person) {
        toast({
          title: "Error",
          description: "Unable to submit application. Application data not found.",
          variant: "destructive",
        });
        return;
      }

      // Prepare the application data for submission
      const applicationData = {
        name: person.name || '',
        age: person.age?.toString() || '',
        gender: person.gender || '',
        skills: person.skills || [],
        languages: person.languages || [],
        expectedSalary: person.tags?.find((tag: any) => tag.descriptor?.code === 'expected-salary')?.value || '1200000',
        totalExperience: person.tags?.find((tag: any) => tag.descriptor?.code === 'total-experience')?.value || '5',
        phone: draftData?.metadata?.message?.order?.fulfillments?.[0]?.customer?.contact?.phone || '',
        email: draftData?.metadata?.message?.order?.fulfillments?.[0]?.customer?.contact?.email || '',
        location: {
          lat: draftData?.metadata?.message?.order?.fulfillments?.[0]?.customer?.location?.gps?.lat || 12.9716,
          lng: draftData?.metadata?.message?.order?.fulfillments?.[0]?.customer?.location?.gps?.lng || 77.5946,
          address: draftData?.metadata?.message?.order?.fulfillments?.[0]?.customer?.location?.address || 'Bangalore',
          city: draftData?.metadata?.message?.order?.fulfillments?.[0]?.customer?.location?.city?.name || 'Bangalore',
          state: draftData?.metadata?.message?.order?.fulfillments?.[0]?.customer?.location?.state?.name || 'Karnataka',
          country: draftData?.metadata?.message?.order?.fulfillments?.[0]?.customer?.location?.country?.name || 'India'
        },
        profileData: person.metadata || {},
        profileId: person.metadata?.profileId || 'default'
      };

      // Get provider and job IDs from the draft
      const providerId = draftData?.metadata?.message?.order?.provider?.id;
      const jobId = draftData?.metadata?.message?.order?.items?.[0]?.id;

      if (!providerId || !jobId) {
        toast({
          title: "Error",
          description: "Unable to submit application. Job details not found.",
          variant: "destructive",
        });
        return;
      }

      // Submit the application using the transaction ID from the draft
      const result = await applyToJob(jobId, providerId, applicationData, transactionId);

      if (result.success) {
        toast({
          title: "Application Submitted!",
          description: "Your draft has been successfully converted to an active application.",
        });
        
        // Call the callback to refresh the applications list
        if (onApplicationSubmitted) {
          onApplicationSubmitted();
        }
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingApplication(false);
    }
  };

  return (
    <Card className={cardStyle}>
      <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
        {isMobile ? (
          // Mobile layout - stacked vertically
          <div className="space-y-4">
            {/* Header with job title and company */}
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-1 truncate">{application.jobTitle}</h3>
                  <p className="text-muted-foreground font-medium truncate">{application.company}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="text-base font-bold text-green-600 mb-1 text-right leading-tight break-words">
                    {application.salary}
                  </div>
                  <div className="text-xs text-muted-foreground">per month</div>
                </div>
              </div>
              
              {/* Status badge */}
              <div className="flex justify-start">
                <ApplicationStatusBadge status={application.status} />
              </div>
            </div>

            {/* Media carousel - smaller on mobile */}
            {application.media && application.media.length > 0 && (
              <div className="w-full">
                <JobMediaCarousel 
                  media={application.media} 
                  title={application.jobTitle}
                  className="w-full"
                />
              </div>
            )}

            {/* Location and date info */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{application.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span>{isDraft ? 'Saved: ' : 'Applied: '}{new Date(application.appliedDate).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Action buttons - full width on mobile */}
            <div className="flex gap-2 pt-2">
              {isDraft ? (
                <>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={handleSubmitApplication}
                    disabled={submittingApplication}
                    className="flex-1 h-10"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submittingApplication ? 'Submitting...' : 'Submit Application'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setDialogOpen(true)}
                    className="flex-1 h-10"
                  >
                    View Details
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setViewApplicationOpen(true)}
                    className="flex-1 h-10"
                  >
                    View Application
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setDialogOpen(true)}
                    className="flex-1 h-10"
                  >
                    View Details
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          // Desktop layout - horizontal
          <div className="flex items-start gap-4">
            <div className="w-32 flex-shrink-0">
              <JobMediaCarousel 
                media={application.media || []} 
                title={application.jobTitle}
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold mb-1">{application.jobTitle}</h3>
                  <p className="text-muted-foreground font-medium">{application.company}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-green-600 mb-1 leading-tight">
                    {application.salary}
                  </div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{application.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{isDraft ? 'Saved: ' : 'Applied: '}{new Date(application.appliedDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <ApplicationStatusBadge status={application.status} />
                <div className="flex gap-2">
                  {isDraft ? (
                    <>
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={handleSubmitApplication}
                        disabled={submittingApplication}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {submittingApplication ? 'Submitting...' : 'Submit Application'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                        View Details
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setViewApplicationOpen(true)}>
                        View Application
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                        View Details
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <ApplicationDetailDialog
        application={application.raw ?? application}
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
      <ApplicationViewModal
        isOpen={viewApplicationOpen}
        onClose={() => setViewApplicationOpen(false)}
        applicationId={application.id}
      />
    </Card>
  );
};

export default ApplicationCard;
