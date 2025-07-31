import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin, Clock, Users, Star, ArrowLeft, Share2, Copy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import JobMediaCarousel from '@/components/JobMediaCarousel';
import JobApplicationDialog from '@/components/JobApplicationDialog';
import UnifiedAuthDialog from '@/components/auth/UnifiedAuthDialog';
import { apiClient } from '@/lib/api';

interface SharedJobData {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  workingHours?: string;
  monthlyInHand?: string;
  monthlyPfEsic?: string;
  monthlyOvertime?: string;
  costPerSharingBed?: string;
  stayProvided?: boolean;
  trustScore?: number;
  matchScore?: number;
  verified?: boolean;
  openings?: number;
  description?: string;
  industry?: string;
  experience?: string;
  positions?: number;
  status?: string;
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
    alt?: string;
    duration?: string;
  }>;
  contactPerson?: {
    name: string;
    email: string;
    phone: string;
  };
  jobProviderName?: string;
  jobProviderLocation?: {
    address: string;
    city: string;
    state: string;
    country: string;
    gps?: {
      lat: number;
      lng: number;
    };
  };
  jobDetails?: Record<string, any>;
  tags?: {
    basicInfo?: {
      jobProviderName?: string;
      jobProviderLocation?: {
        address: string;
        city: string;
        state: string;
        country: string;
        gps?: {
          lat: number;
          lng: number;
        };
      };
      jobProviderLogo?: string;
      jobProviderRegistration?: string;
    };
    industry?: string;
    jobDetails?: Record<string, any>;
    jobNeeds?: Record<string, any>;
    status?: string;
    role?: string;
    assessment?: {
      trustScore?: number;
      matchScore?: number;
    };
    contactPerson?: {
      name: string;
      email: string;
      phone: string;
    };
    [key: string]: any;
  };
}

const SharedJob: React.FC = () => {
  const { providerId, jobId } = useParams<{ providerId: string; jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [jobData, setJobData] = useState<SharedJobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [applying, setApplying] = useState(false);

  // Helper function to format location display
  const formatLocation = (location: any): string => {
    if (!location) {
      return 'Location not specified';
    }

    if (typeof location === 'object' && location.city && location.state) {
      return `${location.city}, ${location.state}`;
    }

    if (typeof location === 'string') {
      if (location === 'Location not specified') {
        return 'Location not specified';
      }
      
      if (location.includes(',')) {
        const parts = location.split(',').map(part => part.trim());
        if (parts.length >= 2) {
          return `${parts[1]}, ${parts[2] || ''}`.trim();
        }
      }
      
      return location;
    }

    return 'Location not specified';
  };

  // Helper function to format field names for better display
  const formatFieldName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/\s+/g, ' ');
  };

  // Helper function to format field values for better display
  const formatFieldValue = (value: any): string => {
    if (value === null || value === undefined || value === '') {
      return 'Not specified';
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    
    if (typeof value === 'string') {
      if (value.includes('INR') || value.includes('₹')) {
        return value;
      }
      
      if (value.includes('AM') || value.includes('PM') || value.includes(':')) {
        return value;
      }
      
      return value;
    }
    
    return String(value);
  };

  // Helper function to check if a field should be skipped
  const shouldSkipField = (key: string, value: any): boolean => {
    if (value === null || value === undefined || value === '') {
      return true;
    }

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
      'url',
      'jobDetailsParagraph',
      'paragraph',
      'description'
    ];
    
    const keyLower = key.toLowerCase();
    return skipFields.some(field => keyLower.includes(field));
  };

  // Helper function to group related fields
  const groupRelatedFields = (details: [string, any][]): [string, any][][] => {
    const groups: [string, any][][] = [];
    const processed = new Set<string>();

    const relatedPairs = [
      ['monthlyInHand', 'monthlyMaxPerformanceBasedVariable'],
      ['startTime', 'endTime'],
      ['ageAllowedLowerLimit', 'ageAllowedUpperLimit'],
      ['monthlyAverageOT', 'monthlyAverageOt'],
      ['monthlyPfHealthInsurance', 'monthlyPfEsicBenefits']
    ];

    relatedPairs.forEach(([field1, field2]) => {
      const field1Entry = details.find(([key]) => key === field1);
      const field2Entry = details.find(([key]) => key === field2);
      
      if (field1Entry && field2Entry) {
        groups.push([field1Entry, field2Entry]);
        processed.add(field1);
        processed.add(field2);
      } else if (field1Entry) {
        groups.push([field1Entry]);
        processed.add(field1);
      } else if (field2Entry) {
        groups.push([field2Entry]);
        processed.add(field2);
      }
    });

    details.forEach(([key, value]) => {
      if (!processed.has(key)) {
        groups.push([[key, value]]);
      }
    });

    return groups;
  };

  const renderJobDetailsTable = () => {
    if (!jobData?.jobDetails || Object.keys(jobData.jobDetails).length === 0) {
      return null;
    }

    const detailsArray = Object.entries(jobData.jobDetails).filter(([key, value]) => {
      return !shouldSkipField(key, value);
    });

    if (detailsArray.length === 0) {
      return null;
    }

    const groupedDetails = groupRelatedFields(detailsArray);
    const flattenedDetails: [string, any][] = [];
    groupedDetails.forEach(group => {
      group.forEach(([key, value]) => {
        flattenedDetails.push([key, value]);
      });
    });

    const rows = [];
    for (let i = 0; i < flattenedDetails.length; i += 2) {
      const row = flattenedDetails.slice(i, i + 2);
      rows.push(row);
    }

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Job Details</h4>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b last:border-b-0">
                  {row.map(([key, value], colIndex) => (
                    <td key={colIndex} className="p-2 sm:p-3 text-xs sm:text-sm">
                      <div className="font-medium text-muted-foreground">
                        {formatFieldName(key)}
                      </div>
                      <div className="text-foreground font-semibold">
                        {formatFieldValue(value)}
                      </div>
                    </td>
                  ))}
                  {row.length === 1 && (
                    <td className="p-2 sm:p-3"></td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Fetch job details
  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!providerId || !jobId) {
        setError('Invalid job link');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await apiClient.selectJob(providerId, jobId);
        
        if (!data?.message?.order?.items?.[0]) {
          throw new Error('Job not found');
        }

        const item = data.message.order.items[0];
        const provider = data.message.order.provider;
        const tags = item.tags;

        // Transform the response to match our JobItem interface
        const transformedJob: SharedJobData = {
          id: item.id,
          title: item.descriptor?.name || 'Unknown Job',
          company: tags?.basicInfo?.jobProviderName || provider.descriptor?.name || 'Unknown Company',
          location: formatLocation(tags?.basicInfo?.jobProviderLocation),
          salary: 'Salary not specified',
          workingHours: tags?.jobDetails?.workingHoursPerDay?.toString(),
          monthlyInHand: tags?.jobDetails?.maxMonthlyInHand?.toString(),
          monthlyPfEsic: tags?.jobDetails?.monthlyPfEsicBenefits?.toString(),
          monthlyOvertime: tags?.jobDetails?.monthlyAverageOt?.toString(),
          costPerSharingBed: tags?.jobDetails?.costPerSharingBed?.toString(),
          stayProvided: tags?.jobDetails?.stayProvided === 'yes',
          trustScore: tags?.assessment?.trustScore || 0,
          matchScore: tags?.assessment?.matchScore || 0,
          verified: true,
          openings: tags?.jobDetails?.positions || 1,
          description: tags?.jobDetails?.jobDetailsParagraph,
          industry: tags?.industry,
          experience: 'Experience not specified',
          positions: tags?.jobDetails?.positions || 1,
          status: tags?.status || 'open',
          contactPerson: tags?.contactPerson,
          jobProviderName: tags?.basicInfo?.jobProviderName || provider.descriptor?.name,
          jobProviderLocation: tags?.basicInfo?.jobProviderLocation,
          jobDetails: tags?.jobDetails || {},
          tags,
          media: []
        };

        // Extract media from job details
        const media: Array<{
          type: 'image' | 'video';
          url: string;
          thumbnail?: string;
          alt?: string;
          duration?: string;
        }> = [];

        // Add job details video
        if (tags?.jobDetails?.jobDetailsVideo) {
          media.push({
            type: 'video',
            url: tags.jobDetails.jobDetailsVideo,
            alt: 'Job Details Video'
          });
        }

        // Add job location photos
        if (tags?.jobDetails?.jobLocationPhotos && Array.isArray(tags.jobDetails.jobLocationPhotos)) {
          tags.jobDetails.jobLocationPhotos.forEach((url: string, index: number) => {
            media.push({
              type: 'image',
              url,
              alt: `Job Location Photo ${index + 1}`
            });
          });
        }

        transformedJob.media = media;
        setJobData(transformedJob);

      } catch (error) {
        console.error('Error fetching job details:', error);
        setError('Failed to load job details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [providerId, jobId]);

  const handleApply = () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    setShowApplicationDialog(true);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/${providerId}/${jobId}`;
    
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
            title: jobData?.title || 'Job Opportunity',
            text: `Check out this job opportunity: ${jobData?.title}`,
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

  const handleApplicationSubmit = async (applicationData: any) => {
    if (!user?.id || !providerId || !jobId) {
      toast({
        title: "Error",
        description: "Please log in to apply for this job.",
        variant: "destructive"
      });
      return;
    }

    setApplying(true);

    try {
      const response = await apiClient.applyToJobBAP({
        providerId,
        jobId,
        userId: user.id,
        userData: applicationData,
        profileData: applicationData.profileData
      });

      toast({
        title: "Application Submitted!",
        description: "Your job application has been successfully submitted.",
      });

      setShowApplicationDialog(false);
    } catch (error: any) {
      console.error('Job application error:', error);
      toast({
        title: "Application Failed",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !jobData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <Building className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
          <p className="text-muted-foreground mb-6">{error || 'The job you are looking for does not exist or has been removed.'}</p>
          <Button onClick={() => navigate('/seeker?tab=discover')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Browse Jobs
          </Button>
        </div>
      </div>
    );
  }

  // Determine if we should show real trust scores
  const shouldShowRealScores = user && user.profile;
  const displayTrustScore = shouldShowRealScores ? jobData.trustScore : 0;
  const displayMatchScore = shouldShowRealScores ? jobData.matchScore : 0;

  // Get location from the new BAP API format
  const jobLocation = jobData.tags?.basicInfo?.jobProviderLocation || jobData.jobProviderLocation || jobData.location;
  const formattedLocation = formatLocation(jobLocation);

  // Get positions from the new BAP API format
  const positions = jobData.tags?.jobDetails?.positions || jobData.positions || jobData.openings || 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/seeker?tab=discover')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Jobs
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Link
            </Button>
          </div>
        </div>
      </div>

      {/* Job Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <div className="space-y-4">
              {/* Job Title */}
              <div className="space-y-2">
                <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground">
                  {jobData.title}
                  {positions && positions > 0 && (
                    <span className="text-muted-foreground font-normal"> ({positions})</span>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {formattedLocation}
                </div>
              </div>

              {/* Company Info */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <Building className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-medium text-lg text-foreground truncate">
                    {jobData.tags?.basicInfo?.jobProviderName || jobData.company}
                  </span>
                  {jobData.verified && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs flex-shrink-0">
                      ✓ Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Job Details Video & Photos Carousel */}
            {jobData.media && jobData.media.length > 0 && (
              <div className="w-full">
                <JobMediaCarousel 
                  media={jobData.media} 
                  title={jobData.title}
                  className="w-full"
                />
              </div>
            )}

            {/* Job Details Table */}
            {renderJobDetailsTable()}

            {/* Trust Score & Match Score */}
            <div className="flex gap-4">
              <div className="bg-blue-50 rounded-lg p-4 flex-1 text-center">
                <div className="text-sm text-blue-600">Trust Score</div>
                <div className="text-xl font-bold text-blue-700">{displayTrustScore}/10</div>
                {!shouldShowRealScores && (
                  <div className="text-xs text-blue-500 mt-1">Login to see</div>
                )}
              </div>
              <div className="bg-green-50 rounded-lg p-4 flex-1 text-center">
                <div className="text-sm text-green-600">Match Score</div>
                <div className="text-xl font-bold text-green-700">{displayMatchScore}/10</div>
                {!shouldShowRealScores && (
                  <div className="text-xs text-green-500 mt-1">Login to see</div>
                )}
              </div>
            </div>

            {/* Apply Now Button */}
            <Button 
              className="w-full bg-primary hover:bg-primary/90 h-12 text-lg font-medium"
              onClick={handleApply}
              size="lg"
            >
              Apply Now
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Application Dialog */}
      {showApplicationDialog && jobData && (
        <JobApplicationDialog
          job={jobData}
          isOpen={showApplicationDialog}
          onClose={() => setShowApplicationDialog(false)}
          onSubmit={handleApplicationSubmit}
          applying={applying}
        />
      )}

      {/* Auth Dialog */}
      <UnifiedAuthDialog
        isOpen={showAuthDialog}
        onClose={() => {
          setShowAuthDialog(false);
          // If user is now authenticated, show the application dialog
          if (user) {
            setShowApplicationDialog(true);
          }
        }}
        defaultRole="individual"
      />
    </div>
  );
};

export default SharedJob; 