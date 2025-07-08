import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
}

export const useJobApplication = () => {
  const [applying, setApplying] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const applyToJob = async (
    jobId: string,
    providerId: string,
    applicationData: JobApplicationData
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
      const response = await apiClient.applyToJobBAP({
        providerId,
        jobId,
        userId: user.id,
        userData: applicationData
      });

      // If server indicates the user has already applied, show an info toast and short-circuit
      if (response?.message && typeof response.message === "string" && response.message.toLowerCase().includes("already applied")) {
        toast({
          title: "Already Applied",
          description: "You have already applied for this job.",
          // Keeping it neutral so it stands out but isn't marked destructive
          variant: "default",
        });
        return { success: false, data: response };
      }

      toast({
        title: "Application Submitted!",
        description: "Your job application has been successfully submitted.",
      });

      return { success: true, data: response };
    } catch (error) {
      console.error('Job application error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit application';
      
      // Show appropriate toast based on server error message
      if (typeof errorMessage === "string" && errorMessage.toLowerCase().includes("already applied")) {
        toast({
          title: "Already Applied",
          description: "You have already applied for this job.",
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

  return {
    applyToJob,
    applying
  };
}; 