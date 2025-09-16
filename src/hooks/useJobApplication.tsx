import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

export interface JobApplicationData {
  name: string;
  age?: string;
  gender?: string;
  skills?: Array<{ code: string; name: string }>;
  languages?: Array<{ code: string; name: string }>;
  expectedSalary?: string;
  totalExperience?: string;
  phone: string;
  email: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    city: string;
    state: string;
    country: string;
  };
  profileData?: {
    whoIAm?: Record<string, any>;
    whatIHave?: Record<string, any>;
    whatIWant?: Record<string, any>;
    [key: string]: any;
  };
  profileId?: string; // Add profile ID to track which profile was used
}

export const useJobApplication = () => {
  const [applying, setApplying] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const { user, getSelectedCandidate } = useAuth();
  const { toast } = useToast();

  const applyToJob = async (
    jobId: string,
    providerId: string,
    applicationData: JobApplicationData,
    transactionId?: string,
    jobDetails?: any // Job details from BAP search API response
  ) => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to apply for this job.",
        variant: "destructive",
      });
      return { success: false, error: "User not authenticated" };
    }

    setApplying(true);

    try {
      // Get the selected candidate/profile ID
      const selectedCandidate = getSelectedCandidate();
      const profileId = selectedCandidate?.id || 'default';

      const response = await apiClient.applyToJobBAP({
        providerId,
        jobId,
        userId: user.id,
        profileId, // Use profile ID as the primary identifier for the application
        jobDetails, // Pass job details from BAP search API response
        userData: applicationData,
        profileData: applicationData.profileData,
        transactionId // Pass the transaction ID if provided (for draft conversion)
      });

      // If server indicates the user has already applied, show an info toast and short-circuit
      if (response?.message && typeof response.message === "string" && response.message.toLowerCase().includes("already applied")) {
        toast({
          title: "Already Applied",
          description: "You have already applied for this job with this profile.",
          // Keeping it neutral so it stands out but isn't marked destructive
          variant: "default",
        });
        return { success: false, data: response };
      }

      toast({
        title: "Application Submitted!",
        description: "Your job application has been successfully submitted. You can view it in My Applications.",
      });

      return { success: true, data: response };
    } catch (error) {
      console.error('Job application error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit application';
      
      // Show appropriate toast based on server error message
      if (typeof errorMessage === "string" && errorMessage.toLowerCase().includes("already applied")) {
        toast({
          title: "Already Applied",
          description: "You have already applied for this job with this profile.",
          variant: "default",
        });
      } else {
        toast({
          title: "Application Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }

      return { success: false, error: errorMessage };
    } finally {
      setApplying(false);
    }
  };

  const saveDraft = async (
    jobId: string,
    providerId: string,
    applicationData: JobApplicationData,
    jobDetails?: any // Job details from BAP search API response
  ) => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save a draft.",
        variant: "destructive",
      });
      return { success: false, error: "User not authenticated" };
    }

    setSavingDraft(true);

    try {
      // Get the selected candidate/profile ID
      const selectedCandidate = getSelectedCandidate();
      const profileId = selectedCandidate?.id || 'default';

      const response = await apiClient.saveJobDraft({
        providerId,
        jobId,
        userId: user.id,
        profileId, // Use profile ID as the primary identifier
        jobDetails, // Pass job details from BAP search API response
        userData: {
          name: applicationData.name,
          age: applicationData.age,
          gender: applicationData.gender,
          skills: applicationData.skills,
          languages: applicationData.languages,
          expectedSalary: applicationData.expectedSalary,
          totalExperience: applicationData.totalExperience,
          phone: applicationData.phone,
          email: applicationData.email,
          location: applicationData.location,
        },
        profileData: applicationData.profileData,
      });

      if (response) {
        toast({
          title: "Draft Saved!",
          description: "Your job application draft has been successfully saved.",
        });
        return { success: true, data: response };
      } else {
        throw new Error("Failed to save draft");
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save draft";
      toast({
        title: "Draft Save Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    } finally {
      setSavingDraft(false);
    }
  };

  const updateDraft = async (
    jobId: string,
    providerId: string,
    applicationData: JobApplicationData,
    jobDetails?: any // Job details from BAP search API response
  ) => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to update a draft.",
        variant: "destructive",
      });
      return { success: false, error: "User not authenticated" };
    }

    try {
      // Get the selected candidate/profile ID
      const selectedCandidate = getSelectedCandidate();
      const profileId = selectedCandidate?.id || 'default';

      const response = await apiClient.updateJobDraft(jobId, {
        providerId,
        userId: user.id,
        profileId, // Use profile ID as the primary identifier
        jobDetails, // Pass job details from BAP search API response
        userData: {
          name: applicationData.name,
          age: applicationData.age,
          gender: applicationData.gender,
          skills: applicationData.skills,
          languages: applicationData.languages,
          expectedSalary: applicationData.expectedSalary,
          totalExperience: applicationData.totalExperience,
          phone: applicationData.phone,
          email: applicationData.email,
          location: applicationData.location,
        },
        profileData: applicationData.profileData,
      });

      if (response) {
        toast({
          title: "Draft Updated!",
          description: "Your job application draft has been successfully updated.",
        });
        return { success: true, data: response };
      } else {
        throw new Error("Failed to update draft");
      }
    } catch (error) {
      console.error("Error updating draft:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update draft";
      toast({
        title: "Draft Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  };

  return {
    applyToJob,
    saveDraft,
    updateDraft,
    applying,
    savingDraft
  };
}; 