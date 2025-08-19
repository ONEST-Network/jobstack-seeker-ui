import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

export interface DraftApplication {
  jobId: string;
  providerId: string;
  raw: Record<string, unknown>;
}

interface ProfileData {
  whoIAm?: Record<string, unknown>;
  whatIHave?: Record<string, unknown>;
  whatIWant?: Record<string, unknown>;
  profileId?: string;
  id?: string;
  name?: string;
  age?: string | number;
  gender?: string;
  phone?: string;
  email?: string;
  [key: string]: unknown;
}

interface DraftData {
  metadata?: {
    message?: {
      order?: {
        fulfillments?: Array<{
          customer?: {
            person?: Record<string, unknown>;
            contact?: { phone?: string; email?: string };
            location?: {
              gps?: { lat?: number; lng?: number };
              address?: string;
              city?: { name?: string };
              state?: { name?: string };
              country?: { name?: string };
            };
          };
        }>;
        provider?: { id?: string };
        items?: Array<{ id?: string }>;
      };
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface ApplicationItem {
  status: string;
  raw?: DraftData;
}

export const useDraftProfileSync = () => {
  const { user, getSelectedCandidate } = useAuth();
  const { toast } = useToast();

  /**
   * Extract profile data from a user's profile for updating drafts
   */
  const extractProfileDataForDraft = useCallback((profile: ProfileData) => {
    if (!profile) return {};

    return {
      whoIAm: {
        name: profile.name || '',
        age: profile.age || '',
        gender: profile.gender || '',
        hometown: profile.hometown || '',
        aadharNumber: profile.aadharNumber || '',
        phone: profile.phone || '',
        currentLocation: profile.currentLocation || '',
        desiredLocation: profile.desiredLocation || '',
        isNameVerified: profile.isNameVerified || false,
        isAgeVerified: profile.isAgeVerified || false,
        isGenderVerified: profile.isGenderVerified || false,
        isHometownVerified: profile.isHometownVerified || false,
        isAadharVerified: profile.isAadharVerified || false,
        ...profile.whoIAm
      },
      whatIHave: {
        age: profile.age || '',
        basicLiteracy: profile.basicLiteracy || '',
        skillProofVideo: profile.skillProofVideo || '',
        qualityProofImage: profile.qualityProofImage || '',
        hasWorkExperience: profile.hasWorkExperience || false,
        previousCompany: profile.previousCompany || '',
        previousLocation: profile.previousLocation || '',
        experienceMonths: profile.experienceMonths || '',
        machinesOperated: profile.machinesOperated || [],
        totalYearsOfExperience: profile.totalYearsOfExperience || '',
        currentMonthlySalary: profile.currentMonthlySalary || '',
        ...profile.whatIHave
      },
      whatIWant: {
        salaryFrequency: profile.salaryFrequency || '',
        advanceMonthsAvailable: profile.advanceMonthsAvailable || '',
        advanceFrequency: profile.advanceFrequency || '',
        monthlySalary: profile.monthlySalary || '',
        pfDeduction: profile.pfDeduction || '',
        esicDeduction: profile.esicDeduction || '',
        inHandSalary: profile.inHandSalary || '',
        housingFacility: profile.housingFacility || false,
        foodFacility: profile.foodFacility || false,
        workHoursPerDay: profile.workHoursPerDay || '',
        overtimeAvailable: profile.overtimeAvailable || false,
        overtimePayMultiplier: profile.overtimePayMultiplier || '',
        gradeUpgradation: profile.gradeUpgradation || false,
        factoryTrustScore: profile.factoryTrustScore || '',
        monthlyPFESIC: profile.monthlyPFESIC || '',
        preferredModeOfWork: profile.preferredModeOfWork || [],
        monthlyOTExpectation: profile.monthlyOTExpectation || '',
        monthlyInHandPreferred: profile.monthlyInHandPreferred || '',
        ...profile.whatIWant
      },
      // Include other profile sections
      education: profile.education || [],
      experience: profile.experience || [],
      skills: profile.skills || [],
      certificates: profile.certificates || [],
      skillCertifications: profile.skillCertifications || [],
      workExperience: profile.workExperience || [],
      assessmentScores: profile.assessmentScores || [],
      documentVerificationStatus: profile.documentVerificationStatus || [],
      profileId: profile.profileId || profile.id || 'default'
    };
  }, []);

  /**
   * Update a single draft with new profile data
   */
  const updateSingleDraft = useCallback(async (
    draftApplication: DraftApplication,
    updatedProfile: ProfileData
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: "User not authenticated" };
    }

    try {
      const draftData = draftApplication.raw as DraftData;
      
      // Handle both draft structures: direct order or message.order
      const messageOrder = draftData?.metadata?.message?.order;
      const directOrder = draftData?.metadata?.order as Record<string, unknown>;
      const order = messageOrder || directOrder;
      
      const person = order?.fulfillments?.[0]?.customer?.person;
      
      if (!person) {
        return { success: false, error: "Unable to find application data in draft" };
      }

      // Extract job details from the draft
      const personMetadata = person as Record<string, unknown>;
      const jobDetails = (personMetadata.metadata as Record<string, unknown>)?.jobDetails || {};

      // Get the updated profile data formatted for draft
      const profileData = extractProfileDataForDraft(updatedProfile);

      // Merge with existing person data
      const existingMetadata = (personMetadata.metadata as Record<string, unknown>) || {};
      const mergedProfile = {
        ...existingMetadata,
        ...profileData,
        profileId: profileData.profileId
      };
      
      // Get tags safely
      const tags = (person as { tags?: Array<{ descriptor?: { code?: string }; value?: string }> }).tags || [];

      // Prepare the updated application data
      const applicationData = {
        name: (mergedProfile.whoIAm as Record<string, unknown>)?.name as string || (person as { name?: string }).name || '',
        age: ((mergedProfile.whatIHave as Record<string, unknown>)?.age?.toString() || (person as { age?: string }).age?.toString() || ''),
        gender: (mergedProfile.whoIAm as Record<string, unknown>)?.gender as string || (person as { gender?: string }).gender || '',
        skills: (person as { skills?: Array<{ code: string; name: string }> }).skills || [],
        languages: (person as { languages?: Array<{ code: string; name: string }> }).languages || [],
        expectedSalary: tags.find((tag) => tag.descriptor?.code === 'expected-salary')?.value || '1200000',
        totalExperience: tags.find((tag) => tag.descriptor?.code === 'total-experience')?.value || '5',
        phone: ((mergedProfile.whoIAm as Record<string, unknown>)?.phone as string || order?.fulfillments?.[0]?.customer?.contact?.phone || ''),
        email: ((mergedProfile.whoIAm as Record<string, unknown>)?.email as string || order?.fulfillments?.[0]?.customer?.contact?.email || ''),
        location: {
          lat: order?.fulfillments?.[0]?.customer?.location?.gps?.lat || 12.9716,
          lng: order?.fulfillments?.[0]?.customer?.location?.gps?.lng || 77.5946,
          address: ((mergedProfile.whoIAm as Record<string, unknown>)?.currentLocation as string || order?.fulfillments?.[0]?.customer?.location?.address || 'Bangalore'),
          city: order?.fulfillments?.[0]?.customer?.location?.city?.name || 'Bangalore',
          state: order?.fulfillments?.[0]?.customer?.location?.state?.name || 'Karnataka',
          country: order?.fulfillments?.[0]?.customer?.location?.country?.name || 'India'
        },
        profileData: mergedProfile,
        profileId: profileData.profileId as string
      };

      // Update the draft using the API
      
      const response = await apiClient.updateJobDraft(draftApplication.jobId, {
        providerId: draftApplication.providerId,
        userId: user.id,
        profileId: profileData.profileId as string,
        jobDetails,
        userData: applicationData,
        profileData: mergedProfile,
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating draft:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update draft";
      return { success: false, error: errorMessage };
    }
  }, [user?.id, extractProfileDataForDraft]);

  /**
   * Update all drafts for the current user/profile with new profile data
   */
  const updateAllDraftsWithProfile = useCallback(async (updatedProfile: ProfileData) => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to update drafts.",
        variant: "destructive",
      });
      return { success: false, error: "User not authenticated" };
    }

    try {
      // Get the current selected candidate/profile
      const selectedCandidate = getSelectedCandidate();
      const profileId = selectedCandidate?.id || updatedProfile?.profileId || updatedProfile?.id || 'default';

      // Get all draft applications using the profile ID (not user ID)
      const draftsResponse = await apiClient.getBAPJobDrafts(profileId) as { data?: ApplicationItem[] };
      
      if (!draftsResponse?.data) {
        // No drafts found, which is fine
        return { success: true, updatedCount: 0 };
      }

      // All responses from drafts endpoint are drafts, but filter by profile ID
      const draftApplications = draftsResponse.data.filter((app: ApplicationItem) => {
        // Check if this draft belongs to the current profile
        // Drafts can have different structures: app.metadata.order or app.metadata.message.order
        const messageOrder = app.raw?.metadata?.message?.order as Record<string, unknown>;
        const directOrder = app.raw?.metadata?.order as Record<string, unknown>;
        const order = messageOrder || directOrder;
        
        const person = order?.fulfillments?.[0]?.customer?.person as Record<string, unknown>;
        const metadata = person?.metadata as Record<string, unknown>;
        const draftProfileId = metadata?.profileId;
        const belongsToProfile = draftProfileId === profileId || (!draftProfileId && profileId === 'default');
        
        return belongsToProfile;
      });

      if (draftApplications.length === 0) {
        // No drafts to update
        return { success: true, updatedCount: 0 };
      }

      // Update each draft
      let successCount = 0;
      let failureCount = 0;
      const errors: string[] = [];

      for (const draftApp of draftApplications) {
        try {
          const draftToUpdate: DraftApplication = {
            // Handle both draft structures for job ID extraction
            jobId: (() => {
              const messageOrder = draftApp.raw?.metadata?.message?.order as Record<string, unknown>;
              const directOrder = draftApp.raw?.metadata?.order as Record<string, unknown>;
              const order = messageOrder || directOrder;
              return (order?.items as any)?.[0]?.id || '';
            })(),
            // Handle both draft structures for provider ID extraction  
            providerId: (() => {
              const messageOrder = draftApp.raw?.metadata?.message?.order as Record<string, unknown>;
              const directOrder = draftApp.raw?.metadata?.order as Record<string, unknown>;
              const order = messageOrder || directOrder;
              return (order?.provider as any)?.id || '';
            })(),
            raw: draftApp.raw
          };

          if (draftToUpdate.jobId && draftToUpdate.providerId) {
            const result = await updateSingleDraft(draftToUpdate, updatedProfile);
            if (result.success) {
              successCount++;
            } else {
              failureCount++;
              if (result.error) errors.push(result.error);
            }
          } else {
            failureCount++;
            errors.push('Missing job or provider ID in draft');
          }
        } catch (error) {
          failureCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(errorMessage);
        }
      }

      // Show appropriate toast messages
      if (successCount > 0 && failureCount === 0) {
        toast({
          title: "Drafts Updated Successfully",
          description: `${successCount} draft application${successCount > 1 ? 's' : ''} updated with your new profile information.`,
        });
      } else if (successCount > 0 && failureCount > 0) {
        toast({
          title: "Drafts Partially Updated",
          description: `${successCount} draft${successCount > 1 ? 's' : ''} updated successfully, ${failureCount} failed to update.`,
        });
      } else if (failureCount > 0) {
        toast({
          title: "Draft Update Failed",
          description: `Failed to update ${failureCount} draft application${failureCount > 1 ? 's' : ''}. ${errors[0] || 'Please try again.'}`,
          variant: "destructive",
        });
      }

      return { 
        success: successCount > 0, 
        updatedCount: successCount, 
        failedCount: failureCount,
        errors 
      };

    } catch (error) {
      console.error('Error updating drafts with profile:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update drafts";
      toast({
        title: "Draft Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  }, [user?.id, getSelectedCandidate, updateSingleDraft, toast]);

  return {
    updateAllDraftsWithProfile,
    updateSingleDraft,
    extractProfileDataForDraft
  };
};
