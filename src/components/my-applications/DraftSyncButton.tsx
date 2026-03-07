import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, User } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface DraftSyncButtonProps {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const DraftSyncButton: React.FC<DraftSyncButtonProps> = ({ 
  className = "", 
  variant = "outline", 
  size = "sm" 
}) => {
  const { user, getSelectedCandidate } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSyncDrafts = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to sync drafts.",
        variant: "destructive",
      });
      return;
    }

    // Get the current selected candidate/profile
    const selectedCandidate = getSelectedCandidate();
    if (!selectedCandidate) {
      toast({
        title: "No Profile Selected",
        description: "Please select a profile to sync drafts with.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);

    try {
      // Get the profile ID for API calls
      const profileId = selectedCandidate.id;
      if (!profileId) {
        toast({
          title: "Error",
          description: "Profile ID not found",
          variant: "destructive",
        });
        return;
      }

      // Fetch latest drafts using profile ID
      const draftsResponse = await apiClient.getBAPJobDrafts(profileId);

      // Handle both array and object responses
      const drafts = Array.isArray(draftsResponse) ? draftsResponse : (draftsResponse?.data || []);
      
      if (!drafts || drafts.length === 0) {
        toast({
          title: "No Drafts Found",
          description: "You don't have any draft applications to sync.",
        });
        return;
      }

      // Extract context from draft metadata if available, otherwise use default
      // Drafts saved after this update should have context in metadata.context
      const draftContext = drafts[0]?.metadata?.context;
      const context = draftContext && draftContext.bpp_id && draftContext.bpp_uri
        ? {
            bpp_id: draftContext.bpp_id,
            bpp_uri: draftContext.bpp_uri,
            transaction_id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }
        : {
            bpp_id: "bpp1.dhiway.com",
            bpp_uri: "https://beckn-adapter.dhiway.net/bpp/receiver",
            transaction_id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          };

      // Extract profile data sections for PATCH payload - use BAP protocol structure
      const profileData = {
        context,
        message: {
          order: {
            provider: {
              id: drafts[0]?.metadata?.message?.order?.provider?.id || ""
            },
            items: [
              {
                id: drafts[0]?.job_id || "", // Use the job_id from the draft
                fulfillment_ids: [profileId]
              }
            ],
            fulfillments: [
              {
                id: profileId,
                customer: {
                  person: {
                    id: profileId,
                    name: selectedCandidate.name || "",
                    age: selectedCandidate.age || "",
                    gender: selectedCandidate.gender || "",
                    skills: selectedCandidate.skills || [],
                    languages: selectedCandidate.whatIHave?.languages || [
                      {
                        code: "en",
                        name: "English"
                      }
                    ],
                    metadata: {
                      whoIAm: selectedCandidate.whoIAm || {
                        name: selectedCandidate.name,
                        phone: selectedCandidate.phone,
                        currentLocation: selectedCandidate.currentLocation,
                      },
                      whatIHave: selectedCandidate.whatIHave || {
                        age: selectedCandidate.age,
                      },
                      whatIWant: selectedCandidate.whatIWant || {},
                      profileId: profileId,
                      userId: user.id,
                      // Include job details from the existing draft - IMPORTANT for PATCH API
                      jobDetails: drafts[0]?.metadata?.order?.fulfillments?.[0]?.customer?.person?.metadata?.jobDetails || {},
                      name: selectedCandidate.name || "",
                      age: selectedCandidate.age || "",
                      currentLocation: selectedCandidate.currentLocation || "",
                      desiredLocation: selectedCandidate.desiredLocation || "",
                      isNameVerified: selectedCandidate.isNameVerified || false,
                      isAgeVerified: selectedCandidate.isAgeVerified || false,
                      isGenderVerified: selectedCandidate.isGenderVerified || false,
                      isAadharVerified: selectedCandidate.isAadharVerified || false,
                      isHometownVerified: selectedCandidate.isHometownVerified || false,
                      interestedRole: selectedCandidate.interestedRole || "",
                      interestedIndustry: selectedCandidate.interestedIndustry || "",
                      experience: selectedCandidate.experience || [],
                      skills: selectedCandidate.skills || [],
                      certificates: selectedCandidate.certificates || [],
                      education: selectedCandidate.education || [],
                      skillCertifications: selectedCandidate.skillCertifications || [],
                      workExperience: selectedCandidate.workExperience || [],
                      assessmentScores: selectedCandidate.assessmentScores || [],
                      documentVerificationStatus: selectedCandidate.documentVerificationStatus || []
                    },
                    tags: [
                      {
                        descriptor: {
                          code: "emp-details",
                          name: "Employee Details"
                        },
                        list: [
                          {
                            descriptor: {
                              code: "expected-salary",
                              name: "Expected Salary"
                            },
                            value: selectedCandidate.whatIWant?.monthlyInHandPreferred?.toString() || "0"
                          },
                          {
                            descriptor: {
                              code: "total-experience",
                              name: "Total Experience"
                            },
                            value: selectedCandidate.whatIHave?.totalYearsOfExperience?.toString() || "0"
                          },
                          {
                            descriptor: {
                              code: "profile-id",
                              name: "Profile ID"
                            },
                            value: profileId
                          },
                          {
                            descriptor: {
                              code: "user-id",
                              name: "User ID"
                            },
                            value: user.id
                          }
                        ]
                      }
                    ]
                  },
                  contact: {
                    phone: selectedCandidate.phone || "",
                    email: selectedCandidate.whoIAm?.email || user.email || ""
                  },
                  location: {
                    gps: {
                      lat: 12.9716,
                      lng: 77.5946
                    },
                    address: selectedCandidate.currentLocation || "",
                    city: {
                      name: selectedCandidate.whoIAm?.locationData?.city || "Bangalore",
                      code: "std:080"
                    },
                    state: {
                      name: selectedCandidate.whoIAm?.locationData?.state || "Karnataka",
                      code: "IN-KA"
                    },
                    country: {
                      name: selectedCandidate.whoIAm?.locationData?.country || "India",
                      code: "IN"
                    }
                  }
                }
              }
            ]
          }
        }
      };

      let updatedCount = 0;
      const errors = [];

      // Update each draft with latest profile data using PATCH API
      for (const draft of drafts) {
        let draftId = null;
        try {
          // Use the numeric ID from the draft response (not the job_id UUID)
          draftId = draft.id; // This is the numeric ID like 15, 16 from the GET response
                       
          if (!draftId) {
            errors.push(`Draft ${draft.job_id || 'unknown'}: No draft ID found`);
            continue;
          }

          // Call the PATCH API with the numeric draft ID
          const url = `${import.meta.env.VITE_BAP_URL}/api/v1/job-applications/drafts/${draftId}`;
          
          const response = await fetch(url, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(profileData),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();
          
          updatedCount++;
        } catch (error) {
          errors.push(`Draft ID ${draftId}: ${error}`);
        }
      }

      if (updatedCount > 0) {
        toast({
          title: "Drafts Synced Successfully",
          description: `${updatedCount} draft application${updatedCount > 1 ? 's' : ''} updated with your latest profile information.`,
        });
      }

      if (errors.length > 0) {
        toast({
          title: "Partial Success",
          description: `Updated ${updatedCount} drafts, but ${errors.length} failed. Check console for details.`,
          variant: "destructive",
        });
      }

    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync drafts with your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Button
      onClick={handleSyncDrafts}
      disabled={isUpdating || !user}
      variant={variant}
      size={size}
      className={className}
    >
      {isUpdating ? (
        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <User className="h-4 w-4 mr-2" />
      )}
      {isUpdating ? "Syncing..." : "Sync Profile"}
    </Button>
  );
};

export default DraftSyncButton;
