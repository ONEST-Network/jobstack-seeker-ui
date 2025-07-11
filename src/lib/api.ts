const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

// API Client configuration
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Only set Content-Type if we have a body
    const headers: Record<string, string> = {
      ...options.headers as Record<string, string>,
    };
    
    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }
    
    const config: RequestInit = {
      headers,
      credentials: 'include', // Important for cookies
      ...options,
    };

    console.log('🌐 API Request:', {
      url,
      method: config.method,
      endpoint,
      hasBody: !!config.body
    });

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Authentication methods
  async signUp(data: {
    email: string;
    name: string;
    password: string;
    callbackURL?: string;
  }) {
    return this.request('/auth/sign-up/email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async signIn(data: {
    email: string;
    password: string;
  }) {
    return this.request('/auth/sign-in/email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async signOut() {
    return this.request('/auth/sign-out', {
      method: 'POST',
    });
  }

  async getSession() {
    return this.request('/auth/get-session', {
      method: 'GET',
    });
  }

  async forgotPassword(data: {
    email: string;
    callbackURL?: string;
  }) {
    return this.request('/auth/forget-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resetPassword(data: {
    newPassword: string;
    token: string;
  }) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Profile creation method
  async createProfile(profileData: {
    type: string;
    metadata: {
      notes?: string;
      role?: string;
      industry?: string;
      [key: string]: any;
    };
    location: {
      tag: string;
      address: string;
      city: string;
      state: string;
      country: string;
      gps?: {
        lat: number;
        lng: number;
      };
    };
    contact: {
      tag: string;
      email: string;
      phoneNumber: string[];
      website?: string[];
    };
  }) {
    return this.request('/profile/', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  // Profile fetching method
  async getProfile(): Promise<ProfileResponse> {
    return this.request('/profile', {
      method: 'GET',
    });
  }

  // Profile update method
  async updateProfile(profileId: string, profileData: {
    type: string;
    metadata: {
      notes?: string;
      role?: string;
      industry?: string;
      [key: string]: any;
    };
    location?: {
      tag: string;
      address: string;
      city: string;
      state: string;
      country: string;
      gps?: {
        lat: number;
        lng: number;
      };
    };
    contact?: {
      tag: string;
      email: string;
      phoneNumber: string[];
      website?: string[];
    };
  }) {
    console.log('🔧 updateProfile called with:', {
      profileId,
      method: 'PUT',
      endpoint: `/profile/${profileId}`,
      profileData
    });
    
    return this.request(`/profile/${profileId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Get all profiles for the user
  async getProfiles(): Promise<ProfilesResponse> {
    return this.request('/profile', {
      method: 'GET',
    });
  }

  // Job-related methods (for future use)
  async createJobPost(organizationId: string, jobData: any) {
    return this.request(`/jobs/${organizationId}`, {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  }

  async getJobPostings(organizationId: string) {
    return this.request(`/jobs/${organizationId}`, {
      method: 'GET',
    });
  }

  async applyToJob(jobData: any) {
    return this.request('/jobs/seeker/apply', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  }

  // BAP Job Search API
  async searchJobs() {
    const BAP_URL = import.meta.env.VITE_BAP_URL || 'https://onest-lite-bap.dhiway.net';
    const url = `${BAP_URL}/api/v1/search`;
    
    const payload = {
      message: {
        intent: {}
      }
    };

    try {
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Validate the response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from BAP API');
      }

      return data;
    } catch (error) {
      console.error('BAP API Error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      throw error;
    }
  }

  // BAP Job Apply API
  async applyToJobBAP(applyData: {
    providerId: string;
    jobId: string;
    userId: string;
    userData: {
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
    };
    profileData?: {
      whoIAm?: Record<string, any>;
      whatIHave?: Record<string, any>;
      whatIWant?: Record<string, any>;
      [key: string]: any;
    };
  }) {
    const BAP_URL = import.meta.env.VITE_BAP_URL || 'https://onest-lite-bap.dhiway.net';
    const url = `${BAP_URL}/api/v1/apply`;
    
    // Generate a unique transaction ID
    const transactionId = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const payload = {
      context: {
        bpp_id: "bpp1.dhiway.com",
        bpp_uri: "https://beckn-adapter.dhiway.net/bpp/receiver",
        transaction_id: transactionId
      },
      message: {
        order: {
          provider: {
            id: applyData.providerId
          },
          items: [
            {
              id: applyData.jobId,
              fulfillment_ids: [applyData.userId]
            }
          ],
          fulfillments: [
            {
              id: applyData.userId,
              customer: {
                person: {
                  id: applyData.userId,
                  name: applyData.userData.name,
                  age: applyData.userData.age,
                  gender: applyData.userData.gender,
                  skills: applyData.userData.skills || [
                    {
                      code: "UI",
                      name: "UI Design"
                    }
                  ],
                  languages: applyData.userData.languages || [
                    {
                      code: "en",
                      name: "English"
                    }
                  ],
                  metadata: applyData.profileData ? {
                    whoIAm: applyData.profileData.whoIAm || {},
                    whatIHave: applyData.profileData.whatIHave || {},
                    whatIWant: applyData.profileData.whatIWant || {},
                    ...applyData.profileData
                  } : undefined,
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
                          value: applyData.userData.expectedSalary || "1200000"
                        },
                        {
                          descriptor: {
                            code: "total-experience",
                            name: "Total Experience"
                          },
                          value: applyData.userData.totalExperience || "5"
                        }
                      ]
                    }
                  ]
                },
                contact: {
                  phone: applyData.userData.phone,
                  email: applyData.userData.email
                },
                location: {
                  gps: {
                    lat: applyData.userData.location.lat,
                    lng: applyData.userData.location.lng
                  },
                  address: applyData.userData.location.address,
                  city: {
                    name: applyData.userData.location.city,
                    code: "std:080"
                  },
                  state: {
                    name: applyData.userData.location.state,
                    code: "IN-KA"
                  },
                  country: {
                    name: applyData.userData.location.country,
                    code: "IN"
                  }
                }
              }
            }
          ]
        }
      }
    };

    try {
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Validate the response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from BAP API');
      }

      return data;
    } catch (error) {
      console.error('BAP Apply API Error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      throw error;
    }
  }

  // Storage/Presigned URL methods
  async getPresignedUrl(request: {
    bucketName: string;
    contentType: string;
    objectKey: string;
  }) {
    console.log('🚀 Getting presigned URL:', request);
    
    try {
      const response = await fetch(`${this.baseUrl}/storage/presigned-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        credentials: 'include'
      });

      console.log('📡 Presigned URL response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to get presigned URL:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`Failed to get presigned URL: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Presigned URL response:', data);
      return data;
    } catch (error) {
      console.error('❌ Presigned URL error:', error);
      throw error;
    }
  }

  async uploadFileToPresignedUrl(uploadUrl: string, file: File) {
    console.log('🚀 Uploading file to presigned URL:', {
      uploadUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    try {
      // Try direct upload first
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      console.log('📡 Upload response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Upload failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`Failed to upload file: ${response.status} ${response.statusText} - ${errorText}`);
      }

      console.log('✅ File uploaded successfully');
    } catch (error) {
      console.error('❌ Upload error:', error);
      
      // If CORS error, try server-side upload as fallback
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.log('🔄 CORS error detected, trying server-side upload...');
        await this.uploadFileThroughServer(file);
        return;
      }
      
      throw error;
    }
  }

  // Fallback method to upload through API server
  private async uploadFileThroughServer(file: File) {
    console.log('🚀 Uploading file through server:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${this.baseUrl}/storage/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      console.log('✅ File uploaded successfully through server');
    } catch (error) {
      console.error('❌ Server upload error:', error);
      throw new Error('Upload failed due to CORS restrictions. Please contact support to configure CORS for the storage bucket.');
    }
  }
}

// Utility function to transform profile data for API
export const transformProfileForAPI = (profile: any, userEmail?: string) => {
  // Extract location information - check both legacy and nested structures
  const currentLocation = profile.currentLocation || profile.whoIAm?.location || '';
  const locationParts = currentLocation?.split(', ') || [];
  const city = locationParts[0] || '';
  const state = locationParts[1] || '';
  
  // Extract phone number - check both legacy and nested structures
  const phoneNumber = (profile.phone || profile.whoIAm?.phone) ? [profile.phone || profile.whoIAm?.phone] : [];
  
  // Use user email if available, otherwise use profile email or a placeholder
  const email = userEmail || profile.email || 'user@jobbridge.in';
  
  // Get name from both legacy and nested structures
  const name = profile.name || profile.whoIAm?.name;
  
  // Build metadata object with all profile details
  const metadata: Record<string, any> = {
    notes: "Profile created via JobBridge platform",
    role: profile.interestedRole,
    industry: profile.interestedIndustry,
    // Who I Am data
    name: name,
    dateOfBirth: profile.dateOfBirth || profile.whoIAm?.dateOfBirth,
    age: profile.age || profile.whoIAm?.age,
    gender: profile.gender || profile.whoIAm?.gender,
    hometown: profile.hometown || profile.whoIAm?.hometown,
    aadharNumber: profile.aadharNumber || profile.whoIAm?.aadharNumber,
    // What I Have data
    basicLiteracy: profile.basicLiteracy || profile.whatIHave?.basicLiteracy,
    skillProofVideo: profile.skillProofVideo || profile.whatIHave?.skillProofVideo,
    qualityProofImage: profile.qualityProofImage || profile.whatIHave?.qualityProofImage,
    hasWorkExperience: profile.hasWorkExperience || profile.whatIHave?.hasWorkExperience,
    previousCompany: profile.previousCompany || profile.whatIHave?.previousCompany,
    previousLocation: profile.previousLocation || profile.whatIHave?.previousLocation,
    experienceMonths: profile.experienceMonths || profile.whatIHave?.experienceMonths,
    machinesOperated: profile.machinesOperated || profile.whatIHave?.machinesOperated,
    // What I Want data
    salaryFrequency: profile.salaryFrequency || profile.whatIWant?.salaryFrequency,
    advanceMonthsAvailable: profile.advanceMonthsAvailable || profile.whatIWant?.advanceMonthsAvailable,
    advanceFrequency: profile.advanceFrequency || profile.whatIWant?.advanceFrequency,
    monthlySalary: profile.monthlySalary || profile.whatIWant?.monthlySalary,
    pfDeduction: profile.pfDeduction || profile.whatIWant?.pfDeduction,
    esicDeduction: profile.esicDeduction || profile.whatIWant?.esicDeduction,
    inHandSalary: profile.inHandSalary || profile.whatIWant?.inHandSalary,
    housingFacility: profile.housingFacility || profile.whatIWant?.housingFacility,
    foodFacility: profile.foodFacility || profile.whatIWant?.foodFacility,
    workHoursPerDay: profile.workHoursPerDay || profile.whatIWant?.workHoursPerDay,
    overtimeAvailable: profile.overtimeAvailable || profile.whatIWant?.overtimeAvailable,
    overtimePayMultiplier: profile.overtimePayMultiplier || profile.whatIWant?.overtimePayMultiplier,
    gradeUpgradation: profile.gradeUpgradation || profile.whatIWant?.gradeUpgradation,
    factoryTrustScore: profile.factoryTrustScore || profile.whatIWant?.factoryTrustScore,
    // Legacy fields
    experience: profile.experience,
    skills: profile.skills,
    certificates: profile.certificates,
    // Unified schema data
    whoIAm: profile.whoIAm,
    whatIHave: profile.whatIHave,
    whatIWant: profile.whatIWant,
    // Education and certifications
    education: profile.education,
    skillCertifications: profile.skillCertifications,
    workExperience: profile.workExperience,
    // Verification status
    isNameVerified: profile.isNameVerified,
    isAgeVerified: profile.isAgeVerified,
    isGenderVerified: profile.isGenderVerified,
    isAadharVerified: profile.isAadharVerified,
    isHometownVerified: profile.isHometownVerified,
  };

  return {
    type: "personal",
    metadata,
    location: {
      tag: "home",
      address: currentLocation || "",
      city: city,
      state: state,
      country: "India",
      gps: {
        lat: 19.0760, // Default to Mumbai coordinates
        lng: 72.8777
      }
    },
    contact: {
      tag: "personal",
      email: email,
      phoneNumber: phoneNumber,
      website: []
    }
  };
};

// Create a singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export types for better TypeScript support
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name?: string;
    emailVerified: boolean;
    image?: string;
    createdAt: string;
    updatedAt: string;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: string;
    token: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface SignUpResponse {
  user: {
    id: string;
    email: string;
    name?: string;
    emailVerified: boolean;
    image?: string;
    createdAt: string;
    updatedAt: string;
  };
  session?: {
    id: string;
    userId: string;
    expiresAt: string;
    token: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface SessionResponse {
  session: {
    id: string;
    userId: string;
    expiresAt: string;
    token: string;
    ipAddress?: string;
    userAgent?: string;
  } | null;
  user: {
    id: string;
    email: string;
    name?: string;
    emailVerified: boolean;
    image?: string;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export interface ProfileResponse {
  data: {
    id: string;
    type: string;
    metadata: {
      notes?: string;
      role?: string;
      industry?: string;
      name?: string;
      dateOfBirth?: string;
      age?: number;
      gender?: string;
      hometown?: string;
      aadharNumber?: string;
      basicLiteracy?: string;
      skillProofVideo?: string;
      qualityProofImage?: string;
      hasWorkExperience?: boolean;
      previousCompany?: string;
      previousLocation?: string;
      experienceMonths?: number;
      machinesOperated?: string[];
      salaryFrequency?: string;
      advanceMonthsAvailable?: number;
      advanceFrequency?: string;
      monthlySalary?: number;
      pfDeduction?: number;
      esicDeduction?: number;
      inHandSalary?: number;
      housingFacility?: boolean;
      foodFacility?: boolean;
      workHoursPerDay?: number;
      overtimeAvailable?: boolean;
      overtimePayMultiplier?: number;
      gradeUpgradation?: boolean;
      factoryTrustScore?: number;
      experience?: any[];
      skills?: string[];
      certificates?: any[];
      assessmentScores?: any[];
      documentVerificationStatus?: any[];
      isNameVerified?: boolean;
      isAgeVerified?: boolean;
      desiredLocation?: string;
      [key: string]: any;
    };
    location: {
      tag: string;
      address: string;
      city: string;
      state: string;
      country: string;
      gps?: {
        lat: number;
        lng: number;
      };
    };
    contact: {
      tag: string;
      email: string;
      phoneNumber: string[];
      website?: string[];
    };
  };
} 

export interface ProfilesResponse {
  statusCode: number;
  message: string;
  data: Array<{
    id: string;
    userId: string;
    type: string;
    metadata: {
      name?: string;
      role?: string;
      industry?: string;
      notes?: string;
      skills?: string[];
      whoIAm?: {
        name?: string;
        phone?: string;
        location?: string;
        [key: string]: any;
      };
      whatIHave?: {
        age?: number;
        qualityScore?: number;
        stitchingSpeed?: number;
        jukiMachineExperience?: string;
        [key: string]: any;
      };
      whatIWant?: {
        monthlyPFESIC?: string;
        readyToMigrate?: string;
        stayPreferences?: string;
        workHoursPerDay?: number;
        maxCostPerSharingBed?: number;
        monthlyOTExpectation?: number;
        monthlyInHandPreferred?: number;
        [key: string]: any;
      };
      education?: any[];
      experience?: any[];
      certificates?: any[];
      workExperience?: any[];
      skillCertifications?: any[];
      isAgeVerified?: boolean;
      isNameVerified?: boolean;
      isAadharVerified?: boolean;
      isGenderVerified?: boolean;
      isHometownVerified?: boolean;
      [key: string]: any;
    };
    createdAt: string;
    updatedAt: string;
  }>;
} 