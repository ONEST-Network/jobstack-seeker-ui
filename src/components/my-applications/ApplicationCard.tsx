
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Send, Edit } from 'lucide-react';
import JobMediaCarousel from '@/components/JobMediaCarousel';
import ApplicationStatusBadge from './ApplicationStatusBadge';
import ApplicationDetailDialog from './ApplicationDetailDialog';
import ApplicationViewModal from './ApplicationViewModal';
import UserProfileDialog from '@/components/profile/UserProfileDialog';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useJobApplication } from '@/hooks/useJobApplication';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [updatingDraft, setUpdatingDraft] = useState(false);
  const isMobile = useIsMobile();
  const { applyToJob, updateDraft } = useJobApplication();
  const { toast } = useToast();
  const { user, getSelectedCandidate } = useAuth();
  
  const cardStyle = isCompleted 
    ? `hover:shadow-md transition-shadow ${
        application.status === 'shortlisted' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
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
      // Extract application data from the draft
      const draftData = application.raw;
      const person = draftData?.metadata?.order?.fulfillments?.[0]?.customer?.person;
      
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
        phone: draftData?.metadata?.order?.fulfillments?.[0]?.customer?.contact?.phone || '',
        email: draftData?.metadata?.order?.fulfillments?.[0]?.customer?.contact?.email || '',
        location: {
          lat: draftData?.metadata?.order?.fulfillments?.[0]?.customer?.location?.gps?.lat || 12.9716,
          lng: draftData?.metadata?.order?.fulfillments?.[0]?.customer?.location?.gps?.lng || 77.5946,
          address: draftData?.metadata?.order?.fulfillments?.[0]?.customer?.location?.address || 'Bangalore',
          city: draftData?.metadata?.order?.fulfillments?.[0]?.customer?.location?.city?.name || 'Bangalore',
          state: draftData?.metadata?.order?.fulfillments?.[0]?.customer?.location?.state?.name || 'Karnataka',
          country: draftData?.metadata?.order?.fulfillments?.[0]?.customer?.location?.country?.name || 'India'
        },
        profileData: person.metadata || {},
        profileId: person.metadata?.profileId || 'default'
      };

      // Get provider and job IDs from the draft structure
      // Provider ID is in the person's job details metadata
      const providerId = draftData?.metadata?.order?.fulfillments?.[0]?.customer?.person?.metadata?.jobDetails?.providerId ||
                        draftData?.metadata?.message?.order?.provider?.id || 
                        draftData?.metadata?.order?.provider?.id || 
                        draftData?.providerId;
      
      // Job ID is available at multiple locations
      const jobId = draftData?.job_id ||
                   draftData?.metadata?.order?.fulfillments?.[0]?.customer?.person?.metadata?.jobDetails?.jobId ||
                   draftData?.metadata?.order?.fulfillments?.[0]?.customer?.person?.metadata?.jobDetails?.id ||
                   draftData?.metadata?.message?.order?.items?.[0]?.id ||
                   draftData?.metadata?.order?.items?.[0]?.id || 
                   draftData?.jobId ||
                   application.jobId; // From processed application data



      if (!providerId || !jobId) {
        // Try alternative extraction paths as a last resort
        const altProviderId = draftData?.metadata?.order?.fulfillments?.[0]?.customer?.person?.metadata?.jobDetails?.providerId ||
                            draftData?.provider?.id || 
                            draftData?.order?.provider?.id ||
                            draftData?.message?.order?.provider?.id;
        const altJobId = draftData?.job_id ||
                        draftData?.metadata?.order?.fulfillments?.[0]?.customer?.person?.metadata?.jobDetails?.jobId ||
                        draftData?.items?.[0]?.id ||
                        draftData?.order?.items?.[0]?.id ||
                        draftData?.message?.order?.items?.[0]?.id ||
                        draftData?.id;
        
        // Use alternative values if found
        const finalProviderId = providerId || altProviderId;
        const finalJobId = jobId || altJobId;
        
        if (!finalProviderId || !finalJobId) {
          toast({
            title: "Error",
            description: `Unable to submit application. Missing: ${!finalProviderId ? 'Provider ID' : ''} ${!finalJobId ? 'Job ID' : ''}. Check console for data structure.`,
            variant: "destructive",
          });
          return;
        }
        
        // Use the alternative values for submission
        const result = await applyToJob(finalJobId, finalProviderId, applicationData);
        
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
        return;
      }

      // Submit the application - let the API generate a new transaction ID
      const result = await applyToJob(jobId, providerId, applicationData);

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

  const handleEditProfile = () => {
    const extractedProfile = extractProfileFromDraft(application.raw);
    setEditProfileOpen(true);
  };

  // Function to extract and transform draft data into proper profile format
  const extractProfileFromDraft = (draftData: any) => {
    if (!draftData) return {};
    
    // Try multiple possible paths to find the person data
    let person = draftData?.metadata?.message?.order?.fulfillments?.[0]?.customer?.person;
    let customerContact = draftData?.metadata?.message?.order?.fulfillments?.[0]?.customer?.contact;
    
    // If not found in the first path, try alternative paths
    if (!person) {
      person = draftData?.metadata?.order?.fulfillments?.[0]?.customer?.person;
      customerContact = draftData?.metadata?.order?.fulfillments?.[0]?.customer?.contact;
    }
    
    // If still not found, try another path
    if (!person) {
      person = draftData?.fulfillments?.[0]?.customer?.person;
      customerContact = draftData?.fulfillments?.[0]?.customer?.contact;
    }
    
    if (!person) {
      return {};
    }
    
    // Extract the role from the metadata
    const role = person.metadata?.interestedRole || 'In Store Promoter';
    
    // Extract basic profile information from whoIAm
    const basicProfile = {
      name: person.metadata?.whoIAm?.name || person.name || '',
      phone: person.metadata?.whoIAm?.phone || person.metadata?.phone || customerContact?.phone || '',
      email: customerContact?.email || '',
      currentLocation: person.metadata?.whoIAm?.currentLocation || person.metadata?.currentLocation || '',
      desiredLocation: person.metadata?.whoIAm?.desiredLocation || person.metadata?.desiredLocation || '',
      interestedRole: role,
      interestedIndustry: person.metadata?.interestedIndustry || '',
    };
    
    // Extract WhoIAm data from the metadata.whoIAm object
    const whoIAm = {
      name: person.metadata?.whoIAm?.name || person.name || '',
      phone: person.metadata?.whoIAm?.phone || person.metadata?.phone || customerContact?.phone || '',
      email: customerContact?.email || '',
      location: person.metadata?.whoIAm?.location || person.metadata?.whoIAm?.currentLocation || '',
      hometown: person.metadata?.whoIAm?.hometown || '',
      dateOfBirth: person.metadata?.whoIAm?.dateOfBirth || '',
      age: person.metadata?.whoIAm?.age || person.age || person.metadata?.age || '',
      gender: person.metadata?.gender || '',
      aadharNumber: person.metadata?.whoIAm?.aadharNumber || '',
      isNameVerified: person.metadata?.whoIAm?.isNameVerified || person.metadata?.isNameVerified || false,
      isAgeVerified: person.metadata?.whoIAm?.isAgeVerified || person.metadata?.isAgeVerified || false,
      isPhoneVerified: person.metadata?.whoIAm?.isPhoneVerified || person.metadata?.isPhoneVerified || false,
      isLocationVerified: person.metadata?.whoIAm?.isLocationVerified || person.metadata?.isLocationVerified || false,
      // Include location data if available
      locationData: person.metadata?.whoIAm?.locationData || {},
      // Include any additional whoIAm data that might be present
      ...person.metadata?.whoIAm
    };
    
    // Extract WhatIHave data from the metadata.whatIHave object
    const whatIHave = {
      age: person.metadata?.whatIHave?.age || person.age || person.metadata?.age || '',
      basicLiteracy: person.metadata?.basicLiteracy || '',
      skillProofVideo: person.metadata?.whatIHave?.skillProofVideo || '',
      qualityProofImage: person.metadata?.whatIHave?.qualityProofImage || '',
      hasWorkExperience: person.metadata?.hasWorkExperience || false,
      previousCompany: person.metadata?.whatIHave?.previousCompany || '',
      previousLocation: person.metadata?.whatIHave?.previousLocation || '',
      experienceMonths: person.metadata?.experienceMonths || 0,
      machinesOperated: person.metadata?.whatIHave?.machinesOperated || [],
      totalYearsOfExperience: person.metadata?.totalYearsOfExperience || 0,
      itiInstitute: person.metadata?.itiInstitute || '',
      itiSpecialization: person.metadata?.itiSpecialization || [],
      trainingDuration: person.metadata?.trainingDuration || 0,
      currentMonthlySalary: person.metadata?.currentMonthlySalary || 0,
      highestQualification: person.metadata?.whatIHave?.highestEducation || person.metadata?.highestQualification || [],
      languageSpoken: person.metadata?.whatIHave?.languagesKnown || person.metadata?.languageSpoken || [],
      // Additional whatIHave fields from the API response
      communicationSkillsScore: person.metadata?.whatIHave?.communicationSkillsScore || '',
      domainKnowledge: person.metadata?.whatIHave?.domainKnowledge || [],
      presentabilityScore: person.metadata?.whatIHave?.presentabilityScore || '',
      // Include any additional whatIHave data that might be present
      ...person.metadata?.whatIHave
    };
    
    // Extract WhatIWant data from the metadata.whatIWant object
    const whatIWant = {
      monthlyPFESIC: person.metadata?.monthlyPFESIC || '',
      workHoursPerDay: person.metadata?.whatIWant?.workHoursPerDay || 8,
      preferredModeOfWork: person.metadata?.whatIWant?.preferredWorkMode || person.metadata?.preferredModeOfWork || [],
      monthlyOTExpectation: person.metadata?.monthlyOTExpectation || 0,
      monthlyInHandPreferred: person.metadata?.whatIWant?.monthlyInHandPreferred || person.metadata?.monthlyInHandPreferred || 0,
      advanceMonthsAvailable: person.metadata?.advanceMonthsAvailable || 0,
      advanceFrequency: person.metadata?.advanceFrequency || 'monthly',
      pfDeduction: person.metadata?.pfDeduction || 0,
      esicDeduction: person.metadata?.esicDeduction || 0,
      housingFacility: person.metadata?.housingFacility || false,
      foodFacility: person.metadata?.foodFacility || false,
      overtimeAvailable: person.metadata?.overtimeAvailable || false,
      overtimePayMultiplier: person.metadata?.overtimePayMultiplier || 1,
      gradeUpgradation: person.metadata?.gradeUpgradation || false,
      // Additional whatIWant fields from the API response
      monthlyPFHealthInsurance: person.metadata?.whatIWant?.monthlyPFHealthInsurance || '',
      monthlyPerformanceVariable: person.metadata?.whatIWant?.monthlyPerformanceVariable || 0,
      // Include any additional whatIWant data that might be present
      ...person.metadata?.whatIWant
    };
    
    // Extract education, experience, and certificates
    const education = person.metadata?.education || [];
    const experience = person.metadata?.experience || [];
    const certificates = person.metadata?.certificates || [];
    const workExperience = person.metadata?.workExperience || [];
    const skillCertifications = person.metadata?.skillCertifications || [];
    
    // Extract assessment scores
    const assessmentScores = person.metadata?.assessmentScores || [];
    const documentVerificationStatus = person.metadata?.documentVerificationStatus || [];
    
    // Build the complete profile
    const completeProfile = {
      ...basicProfile,
      // Include any other metadata that might be present
      ...person.metadata,
      // Include the extracted sections to ensure they take precedence
      whoIAm,
      whatIHave,
      whatIWant,
      education,
      experience,
      certificates,
      workExperience,
      skillCertifications,
      assessmentScores,
      documentVerificationStatus
    };
    
    return completeProfile;
  };

  // Extract profile ID robustly from a draft (mirrors logic used in MyApplications)
  const extractProfileIdFromDraft = (draftData: any): string | undefined => {
    try {
      // Try primary path
      const person = draftData?.metadata?.message?.order?.fulfillments?.[0]?.customer?.person;
      const profileIdPrimary = person?.metadata?.profileId;
      if (profileIdPrimary && String(profileIdPrimary).trim() !== '') {
        return String(profileIdPrimary);
      }

      // Try tags structure for profile-id
      const tags = person?.tags;
      if (Array.isArray(tags)) {
        for (const tag of tags) {
          if (tag?.descriptor?.code === 'emp-details' && Array.isArray(tag.list)) {
            for (const item of tag.list) {
              if (item?.descriptor?.code === 'profile-id' && item?.value) {
                return String(item.value);
              }
            }
          }
        }
      }

      // Try alternative path
      const personAlt = draftData?.metadata?.order?.fulfillments?.[0]?.customer?.person;
      const profileIdAlt = personAlt?.metadata?.profileId;
      if (profileIdAlt && String(profileIdAlt).trim() !== '') {
        return String(profileIdAlt);
      }

      // Derive from transaction id if embedded (last hyphen-separated part that looks numeric)
      const transactionId = draftData?.metadata?.context?.transaction_id || draftData?.transaction_id;
      if (transactionId && String(transactionId).includes('-')) {
        const parts = String(transactionId).split('-');
        const lastPart = parts[parts.length - 1];
        if (lastPart && lastPart.length > 5 && !isNaN(parseInt(lastPart))) {
          return lastPart;
        }
      }
    } catch (e) {
      // Fallthrough to undefined
    }
    return undefined; // Unknown
  };

  const handleProfileUpdate = async (updatedProfile: Record<string, unknown>) => {
    if (!application.raw) {
      toast({
        title: "Error",
        description: "Unable to update draft. Draft data not found.",
        variant: "destructive",
      });
      return;
    }

    setUpdatingDraft(true);

    try {
      // Extract data from the draft application
      const draftData = application.raw;
      const person = draftData?.metadata?.message?.order?.fulfillments?.[0]?.customer?.person;
      
      if (!person) {
        toast({
          title: "Error",
          description: "Unable to update draft. Application data not found.",
          variant: "destructive",
        });
        return;
      }

      // Get provider and job IDs from the draft
      const providerId = draftData?.metadata?.message?.order?.provider?.id;
      const jobId = draftData?.metadata?.message?.order?.items?.[0]?.id;

      if (!providerId || !jobId) {
        toast({
          title: "Error",
          description: "Unable to update draft. Job details not found.",
          variant: "destructive",
        });
        return;
      }

      // Extract job details from the draft for the update API
      const jobDetails = person.metadata?.jobDetails || {};

      // Get the current profile data
      const currentProfile = extractProfileFromDraft(draftData);
      
      // Merge the updated profile with the current profile
      const mergedProfile = {
        ...currentProfile,
        ...updatedProfile
      };

      // Prepare the updated application data
      const applicationData = {
        name: mergedProfile.name || person.name || '',
        age: mergedProfile.age?.toString() || person.age?.toString() || '',
        gender: mergedProfile.gender || person.gender || '',
        skills: person.skills || [],
        languages: person.languages || [],
        expectedSalary: person.tags?.find((tag: any) => tag.descriptor?.code === 'expected-salary')?.value || '1200000',
        totalExperience: person.tags?.find((tag: any) => tag.descriptor?.code === 'total-experience')?.value || '5',
        phone: mergedProfile.phone || draftData?.metadata?.message?.order?.fulfillments?.[0]?.customer?.contact?.phone || '',
        email: mergedProfile.email || draftData?.metadata?.message?.order?.fulfillments?.[0]?.customer?.contact?.email || '',
        location: {
          lat: draftData?.metadata?.message?.order?.fulfillments?.[0]?.customer?.location?.gps?.lat || 12.9716,
          lng: draftData?.metadata?.message?.order?.fulfillments?.[0]?.customer?.location?.gps?.lng || 77.5946,
          address: mergedProfile.currentLocation || draftData?.metadata?.message?.order?.fulfillments?.[0]?.customer?.location?.address || 'Bangalore',
          city: draftData?.metadata?.message?.order?.fulfillments?.[0]?.customer?.location?.city?.name || 'Bangalore',
          state: draftData?.metadata?.message?.order?.fulfillments?.[0]?.customer?.location?.state?.name || 'Karnataka',
          country: draftData?.metadata?.message?.order?.fulfillments?.[0]?.customer?.location?.country?.name || 'India'
        },
        profileData: {
          ...mergedProfile,
          profileId: mergedProfile.profileId || person.metadata?.profileId || 'default'
        },
        profileId: mergedProfile.profileId || person.metadata?.profileId || 'default'
      };

      // Update the draft with the new profile data
      const result = await updateDraft(jobId, providerId, applicationData, jobDetails);

      if (result.success) {
        toast({
          title: "Profile Updated!",
          description: "Your profile has been updated and the draft has been refreshed.",
        });
        
        // Close the profile dialog
        setEditProfileOpen(false);
        
        // Call the callback to refresh the applications list
        if (onApplicationSubmitted) {
          onApplicationSubmitted();
        }
      }
    } catch (error) {
      console.error('Error updating draft:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingDraft(false);
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
                    onClick={handleEditProfile}
                    className="flex-1 h-10"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
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
                      <Button variant="outline" size="sm" onClick={handleEditProfile}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
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
      <UserProfileDialog
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        onComplete={handleProfileUpdate}
        mode="candidate"
        isUpdate={true}
        initialProfile={extractProfileFromDraft(application.raw)}
        profileId={extractProfileIdFromDraft(application.raw)}
        preSelectedRole={extractProfileFromDraft(application.raw)?.interestedRole || 'In Store Promoter'}
      />
    </Card>
  );
};

export default ApplicationCard;
