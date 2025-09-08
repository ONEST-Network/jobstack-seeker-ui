import { parseLocationString, LocationData, validateLocationForAPI } from './utils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

// API Client configuration
class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Try to get token from localStorage on initialization
    this.authToken = localStorage.getItem('authToken');
  }

  // Method to set auth token
  setAuthToken(token: string) {
    this.authToken = token;
    localStorage.setItem('authToken', token);
  }

  // Method to clear auth token
  clearAuthToken() {
    this.authToken = null;
    localStorage.removeItem('authToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Set up headers
    const headers: Record<string, string> = {
      ...options.headers as Record<string, string>,
    };
    
    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    // Add authorization header if we have a token
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    
    const config: RequestInit = {
      headers,
      credentials: 'include', // Keep for cookie-based auth as fallback
      ...options,
    };

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

  // New OTP-based authentication methods
  async requestOTP(data: {
    phoneNumber?: string;
    email?: string;
    name?: string;
  }): Promise<RequestOTPResponse> {
    return this.request('/auth/unified-otp/request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkUser(data: {
    phoneNumber?: string;
    email?: string;
  }): Promise<{ userExists: boolean }> {
    return this.request('/auth/unified-otp/check-user', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyOTP(data: {
    phoneNumber?: string;
    email?: string;
    otp: string;
    name?: string;
    rememberMe?: boolean;
    joinOrg?: {
      join: boolean;
      orgSlug: string;
      role: string;
    };
    createAdmin?: boolean;
  }) {
    const response = await this.request<{ token: string; user: any; redirect: string }>('/auth/unified-otp/verify', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        rememberMe: data.rememberMe ?? true

      }),
    });
    
    // Store the token from the response
    if (response && response.token) {
      this.setAuthToken(response.token);
    }
    
    return response;
  }

  async signOut() {
    try {
      const response = await this.request('/auth/sign-out', {
        method: 'POST',
      });
      
      // Clear the token on sign out
      this.clearAuthToken();
      
      return response;
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if the API call fails, clear the local token
      this.clearAuthToken();
      throw error;
    }
  }

  async getSession() {
    return this.request('/auth/get-session', {
      method: 'GET',
    });
  }

  // Note: Password reset is handled through email verification system
  // The forgotPassword endpoint doesn't exist, so we use sendVerificationEmail instead
  async sendPasswordResetEmail(data: {
    email: string;
    callbackURL?: string;
  }) {
    // Use the better-auth forgetPassword endpoint
    return this.request('/auth/forget-password', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        redirectTo: data.callbackURL || `${window.location.origin}/auth/reset-password`
      }),
    });
  }

  async resetPassword(data: {
    newPassword: string;
    token: string;
  }) {
    // Use the better-auth resetPassword endpoint
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: data.token,
        newPassword: data.newPassword,
      }),
    });
  }

  async sendVerificationEmail(data: {
    email: string;
    callbackURL?: string;
  }) {
    return this.request('/auth/send-verification-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyEmailToken(token: string) {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
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
    
    
    // Include profileId in the payload as required by the API
    const updatePayload = {
      profileId,
      ...profileData
    };
    
    // Update payload prepared for API
    
    return this.request(`/profile/`, {
      method: 'PUT',
      body: JSON.stringify(updatePayload),
    });
  }

  // Get all profiles for the user
  async getProfiles(): Promise<ProfilesResponse> {
    return this.request('/profile', {
      method: 'GET',
    });
  }

  // Get profiles with pagination support
  async getProfilesPaginated(page: number = 1, limit: number = 20, search?: string): Promise<ProfilesResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) {
      params.append('search', search);
    }
    
    const endpoint = `/profile?${params.toString()}`;
    return this.request(endpoint, {
      method: 'GET',
    });
  }

  // Delete profile method
  async deleteProfile(profileId: string): Promise<{ success: boolean; message: string }> {
    return this.request('/profile', {
      method: 'DELETE',
      body: JSON.stringify({ profileId }),
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

  async getJobApplications(userId: string) {
    return this.request(`/job-applications?user_id=${userId}`, {
      method: 'GET',
    });
  }

  // BAP Job Applications API - Get applications from BAP
  async getBAPJobApplications(userId: string) {
    const BAP_URL = import.meta.env.VITE_BAP_URL || 'https://onest-lite-bap.dhiway.net';
    const url = `${BAP_URL}/api/v1/job-applications?user_id=${userId}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data: data?.applications || [] };
    } catch (error) {
      console.error('Error fetching BAP job applications:', error);
      throw error;
    }
  }

  // BAP Job Drafts API - Get draft applications from BAP
  async getBAPJobDrafts(userId: string) {
    const BAP_URL = import.meta.env.VITE_BAP_URL || 'https://onest-lite-bap.dhiway.net';
    
    // Get profile ID the same way MyApplications does
    let profileUserId: string = userId;
    try {
      const profileResp = await this.getProfile();
      const profileDataAny = (profileResp as any)?.data;
      // Prefer explicit userId if provided by profile API, then other common fields, then fallbacks
      profileUserId = profileDataAny?.userId || profileDataAny?.user_id || profileDataAny?.user?.id || profileDataAny?.id || userId;
    } catch (err) {
      // Fallback to provided userId
      profileUserId = userId;
    }
    
    const url = `${BAP_URL}/api/v1/job-applications/drafts?user_id=${profileUserId}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data: data?.applications || data?.message?.applications || data?.results || data || [] };
    } catch (error) {
      console.error('Error fetching BAP job drafts:', error);
      throw error;
    }
  }

  async applyToJob(jobData: any) {
    return this.request('/jobs/seeker/apply', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  }

  // BAP Job Search API
  async searchJobs(intentOverrides?: Record<string, any>, page: number = 1, limit: number = 30) {
    const BAP_URL = import.meta.env.VITE_BAP_URL || 'https://onest-lite-bap.dhiway.net';
    const url = `${BAP_URL}/api/v1/search`;
    
    const payload: { message: { intent: Record<string, any>; pagination: { page: number; limit: number } } } = {
      message: {
        intent: {
          item: {
            tags: [
              {
                descriptor: {
                  code: "status",
                  name: "Status"
                },
                list: [
                  {
                    descriptor: {
                      code: "status",
                      name: "Status"
                    },
                    value: "open"
                  }
                ]
              }
            ]
          }
        },
        pagination: {
          page,
          limit
        }
      }
    };

    // Merge optional intent overrides from callers (e.g., org metadata filters)
    if (intentOverrides && typeof intentOverrides === 'object') {
      // Merge the overrides while preserving the item tags structure
      if (intentOverrides.item) {
        // If intentOverrides has item, merge it with existing item structure
        payload.message.intent.item = {
          ...payload.message.intent.item,
          ...intentOverrides.item,
          tags: [
            ...payload.message.intent.item.tags,
            ...(intentOverrides.item.tags || [])
          ]
        };
        delete intentOverrides.item;
      }
      payload.message.intent = { ...payload.message.intent, ...intentOverrides };
    }

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
        const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        if (response.status === 404) {
          throw new Error('Job service temporarily unavailable. Please try again later.');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again in a few moments.');
        } else if (response.status === 401) {
          throw new Error('Authentication required. Please log in and try again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. Please check your permissions and try again.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(`Request failed: ${errorMessage}`);
        }
      }

      const data = await response.json();
      
      // Validate the response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from job service');
      }

      // Check if the response has the expected structure
      // Note: Empty results array is valid - it means no jobs are available
      if (!data.results && !data.message) {
        throw new Error('No job data received from server');
      }

      // If results is an empty array, that's valid - it means no jobs are available
      if (data.results && Array.isArray(data.results) && data.results.length === 0) {
        console.log('API returned empty results array - no jobs available');
        return data; // Return the empty result as valid
      }

      return data;
    } catch (error) {
      console.error('BAP API Error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please check your internet connection and try again.');
        }
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        }
        
        // Re-throw the error if it's already a formatted error message
        if (error.message.includes('Job service') || 
            error.message.includes('Server error') || 
            error.message.includes('Authentication') || 
            error.message.includes('Access denied') ||
            error.message.includes('Request timed out') ||
            error.message.includes('Network error')) {
          throw error;
        }
      }
      
      throw new Error('Failed to fetch jobs. Please try again.');
    }
  }

  // BAP Job Search API with Query - Used for API-based search functionality
  async searchJobsWithQuery(searchQuery: string, intentOverrides?: Record<string, any>, page: number = 1, limit: number = 30) {
    const BAP_URL = import.meta.env.VITE_BAP_URL || 'https://onest-lite-bap.dhiway.net';
    const url = `${BAP_URL}/api/v1/search`;
    
    const payload: { message: { intent: Record<string, any>; pagination: { page: number; limit: number } } } = {
      message: {
        intent: {
          item: {
            descriptor: {
              name: searchQuery.trim()
            },
            tags: [
              {
                descriptor: {
                  code: "status",
                  name: "Status"
                },
                list: [
                  {
                    descriptor: {
                      code: "status",
                      name: "Status"
                    },
                    value: "open"
                  }
                ]
              }
            ]
          }
        },
        pagination: {
          page,
          limit
        }
      }
    };

    // Merge optional intent overrides from callers (e.g., org metadata filters)
    if (intentOverrides && typeof intentOverrides === 'object') {
      // Merge the overrides while preserving the item structure
      if (intentOverrides.item) {
        // If intentOverrides has item, merge it with existing item structure
        payload.message.intent.item = {
          ...payload.message.intent.item,
          ...intentOverrides.item,
          tags: [
            ...payload.message.intent.item.tags,
            ...(intentOverrides.item.tags || [])
          ]
        };
        delete intentOverrides.item;
      }
      payload.message.intent = { ...payload.message.intent, ...intentOverrides };
    }


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
        const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        if (response.status === 404) {
          throw new Error('Job service temporarily unavailable. Please try again later.');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again in a few moments.');
        } else if (response.status === 401) {
          throw new Error('Authentication required. Please log in and try again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. Please check your permissions and try again.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(`Request failed: ${errorMessage}`);
        }
      }

      const data = await response.json();
      
      // Validate the response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from job service');
      }

      // Check if the response has the expected structure
      // Note: Empty results array is valid - it means no jobs are available
      if (!data.results && !data.message) {
        throw new Error('No job data received from server');
      }

      // If results is an empty array, that's valid - it means no jobs are available
      if (data.results && Array.isArray(data.results) && data.results.length === 0) {
        console.log('API returned empty results array - no jobs available for search:', searchQuery);
        return data; // Return the empty result as valid
      }

      return data;
    } catch (error) {
      console.error('BAP Search API Error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please check your internet connection and try again.');
        }
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        }
        
        // Re-throw the error if it's already a formatted error message
        if (error.message.includes('Job service') || 
            error.message.includes('Server error') || 
            error.message.includes('Authentication') || 
            error.message.includes('Access denied') ||
            error.message.includes('Request timed out') ||
            error.message.includes('Network error')) {
          throw error;
        }
      }
      
      throw new Error('Failed to search jobs. Please try again.');
    }
  }

  // BAP Job Apply API
  async applyToJobBAP(applyData: {
    providerId: string;
    jobId: string;
    userId: string;
    profileId?: string; // Profile ID to use as the primary identifier for the application
    jobDetails?: any; // Job details from BAP search API response
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
    transactionId?: string; // Optional transaction ID for draft conversion
  }) {
    const BAP_URL = import.meta.env.VITE_BAP_URL || 'https://onest-lite-bap.dhiway.net';
    const url = `${BAP_URL}/api/v1/apply`;
    
    // Use provided transaction ID or generate a new one
    const transactionId = applyData.transactionId || `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Use profileId as the primary identifier for the application, fallback to userId if no profileId
    const applicationId = applyData.profileId || applyData.userId;
    
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
              fulfillment_ids: [applicationId]
            }
          ],
          fulfillments: [
            {
              id: applicationId,
              customer: {
                person: {
                  id: applicationId,
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
                    profileId: applyData.profileId, // Include profile ID in metadata
                    userId: applyData.userId, // Include user ID for reference
                    // Include job details from BAP search API response
                    jobDetails: applyData.jobDetails ? {
                      // Extract key job information from the BAP response
                      jobTitle: applyData.jobDetails.descriptor?.name || applyData.jobDetails.title,
                      jobId: applyData.jobDetails.id,
                      providerId: applyData.providerId,
                      // Include the complete tags object which contains all job metadata
                      tags: applyData.jobDetails.tags || {},
                      // Include specific job details if available
                      basicInfo: applyData.jobDetails.tags?.basicInfo || {},
                      jobDetails: applyData.jobDetails.tags?.jobDetails || {},
                      jobNeeds: applyData.jobDetails.tags?.jobNeeds || {},
                      industry: applyData.jobDetails.tags?.industry,
                      status: applyData.jobDetails.tags?.status,
                      role: applyData.jobDetails.tags?.role,
                      assessment: applyData.jobDetails.tags?.assessment || {},
                      contactPerson: applyData.jobDetails.tags?.contactPerson || {},
                      // Include any other relevant job information
                      ...applyData.jobDetails
                    } : {},
                    ...applyData.profileData
                  } : {
                    profileId: applyData.profileId, // Include profile ID even if no other profile data
                    userId: applyData.userId, // Include user ID for reference
                    // Include job details even if no profile data
                    jobDetails: applyData.jobDetails ? {
                      jobTitle: applyData.jobDetails.descriptor?.name || applyData.jobDetails.title,
                      jobId: applyData.jobDetails.id,
                      providerId: applyData.providerId,
                      tags: applyData.jobDetails.tags || {},
                      basicInfo: applyData.jobDetails.tags?.basicInfo || {},
                      jobDetails: applyData.jobDetails.tags?.jobDetails || {},
                      jobNeeds: applyData.jobDetails.tags?.jobNeeds || {},
                      industry: applyData.jobDetails.tags?.industry,
                      status: applyData.jobDetails.tags?.status,
                      role: applyData.jobDetails.tags?.role,
                      assessment: applyData.jobDetails.tags?.assessment || {},
                      contactPerson: applyData.jobDetails.tags?.contactPerson || {},
                      ...applyData.jobDetails
                    } : {}
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
                          value: applyData.userData.expectedSalary || "1200000"
                        },
                        {
                          descriptor: {
                            code: "total-experience",
                            name: "Total Experience"
                          },
                          value: applyData.userData.totalExperience || "5"
                        },
                        {
                          descriptor: {
                            code: "profile-id",
                            name: "Profile ID"
                          },
                          value: applyData.profileId || "default"
                        },
                        {
                          descriptor: {
                            code: "user-id",
                            name: "User ID"
                          },
                          value: applyData.userId
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

  // BAP Job Draft API - Same payload as apply but saves as draft
  async saveJobDraft(applyData: {
    providerId: string;
    jobId: string;
    userId: string;
    profileId?: string; // Profile ID to use as the primary identifier for the application
    jobDetails?: any; // Job details from BAP search API response
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
    // Use the job-applications drafts endpoint as requested
    const url = `${BAP_URL}/api/v1/job-applications/drafts`;

    // Generate a unique transaction ID
    const transactionId = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Use profileId as the primary identifier for the application, fallback to userId if no profileId
    const applicationId = applyData.profileId || applyData.userId;

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
              fulfillment_ids: [applicationId]
            }
          ],
          fulfillments: [
            {
              id: applicationId,
              customer: {
                person: {
                  id: applicationId,
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
                    profileId: applyData.profileId, // Include profile ID in metadata
                    userId: applyData.userId, // Include user ID for reference
                    // Include job details from BAP search API response
                    jobDetails: applyData.jobDetails ? {
                      // Extract key job information from the BAP response
                      jobTitle: applyData.jobDetails.descriptor?.name || applyData.jobDetails.title,
                      jobId: applyData.jobDetails.id,
                      providerId: applyData.providerId,
                      // Include the complete tags object which contains all job metadata
                      tags: applyData.jobDetails.tags || {},
                      // Include specific job details if available
                      basicInfo: applyData.jobDetails.tags?.basicInfo || {},
                      jobDetails: applyData.jobDetails.tags?.jobDetails || {},
                      jobNeeds: applyData.jobDetails.tags?.jobNeeds || {},
                      industry: applyData.jobDetails.tags?.industry,
                      status: applyData.jobDetails.tags?.status,
                      role: applyData.jobDetails.tags?.role,
                      assessment: applyData.jobDetails.tags?.assessment || {},
                      contactPerson: applyData.jobDetails.tags?.contactPerson || {},
                      // Include any other relevant job information
                      ...applyData.jobDetails
                    } : {},
                    ...applyData.profileData
                  } : {
                    profileId: applyData.profileId, // Include profile ID even if no other profile data
                    userId: applyData.userId, // Include user ID for reference
                    // Include job details even if no profile data
                    jobDetails: applyData.jobDetails ? {
                      jobTitle: applyData.jobDetails.descriptor?.name || applyData.jobDetails.title,
                      jobId: applyData.jobDetails.id,
                      providerId: applyData.providerId,
                      tags: applyData.jobDetails.tags || {},
                      basicInfo: applyData.jobDetails.tags?.basicInfo || {},
                      jobDetails: applyData.jobDetails.tags?.jobDetails || {},
                      jobNeeds: applyData.jobDetails.tags?.jobNeeds || {},
                      industry: applyData.jobDetails.tags?.industry,
                      status: applyData.jobDetails.tags?.status,
                      role: applyData.jobDetails.tags?.role,
                      assessment: applyData.jobDetails.tags?.assessment || {},
                      contactPerson: applyData.jobDetails.tags?.contactPerson || {},
                      ...applyData.jobDetails
                    } : {}
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
                          value: applyData.userData.expectedSalary || "1200000"
                        },
                        {
                          descriptor: {
                            code: "total-experience",
                            name: "Total Experience"
                          },
                          value: applyData.userData.totalExperience || "5"
                        },
                        {
                          descriptor: {
                            code: "profile-id",
                            name: "Profile ID"
                          },
                          value: applyData.profileId || "default"
                        },
                        {
                          descriptor: {
                            code: "user-id",
                            name: "User ID"
                          },
                          value: applyData.userId
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
      console.error('BAP Draft API Error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      throw error;
    }
  }

  // BAP Job Select API
  async selectJob(providerId: string, jobId: string) {
    const BAP_URL = import.meta.env.VITE_BAP_URL || 'https://onest-lite-bap.dhiway.net';
    const url = `${BAP_URL}/api/v1/select`;
    
    const payload = {
      context: {
        bpp_id: "bpp1.dhiway.com",
        bpp_uri: "https://beckn-adapter.dhiway.net/bpp/receiver",
        transaction_id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      },
      message: {
        order: {
          provider: {
            id: providerId
          },
          items: [
            {
              id: jobId
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
      console.error('BAP Select API Error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      throw error;
    }
  }

  // Trust Score API
  async getTrustScore(jobData: any, seekerData: any): Promise<{ trustScore: number; matchScore: number }> {
    const TRUST_SCORE_URL = import.meta.env.VITE_TRUST_MATCH_SCORE_URL;
    
    if (!TRUST_SCORE_URL) {
      console.warn('Trust score URL not configured, returning default scores');
      return { trustScore: 0, matchScore: 0 };
    }

    const url = `${TRUST_SCORE_URL}/trust-score-qr`;
    
    const payload = {
      job: jobData,
      seeker: seekerData
    };

    // Log the exact payload being sent to the API
    console.log('=== TRUST SCORE API PAYLOAD ===');
    console.log('URL:', url);
    console.log('Method: POST');
    console.log('Headers:', { 'Content-Type': 'application/json' });
    console.log('Full Payload:', JSON.stringify(payload, null, 2));
    console.log('Job Data:', JSON.stringify(jobData, null, 2));
    console.log('Seeker Data:', JSON.stringify(seekerData, null, 2));
    console.log('===============================');

    try {
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

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
        const errorText = await response.text();
        console.error('Trust Score API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Validate the response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from trust score API');
      }

      return {
        trustScore: data.totalScore || 0,
        matchScore: data.matchScore || 0
      };
    } catch (error) {
      console.error('Trust Score API Error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      // Return default scores on error
      return { trustScore: 0, matchScore: 0 };
    }
  }

  // Match Score API
  async getMatchScore(jobData: any, seekerData: any): Promise<{ trustScore: number; matchScore: number }> {
    const TRUST_SCORE_URL = import.meta.env.VITE_TRUST_MATCH_SCORE_URL;
    
    if (!TRUST_SCORE_URL) {
      console.warn('Trust score URL not configured, returning default scores');
      return { trustScore: 0, matchScore: 0 };
    }

    const url = `${TRUST_SCORE_URL}/match-score`;
    
    const payload = {
      job: jobData,
      seeker: seekerData
    };

    // Log the exact payload being sent to the API
    console.log('=== MATCH SCORE API PAYLOAD ===');
    console.log('URL:', url);
    console.log('Method: POST');
    console.log('Headers:', { 'Content-Type': 'application/json' });
    console.log('Full Payload:', JSON.stringify(payload, null, 2));
    console.log('Job Data:', JSON.stringify(jobData, null, 2));
    console.log('Seeker Data:', JSON.stringify(seekerData, null, 2));
    console.log('===============================');

    try {
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

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
        const errorText = await response.text();
        console.error('Match Score API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Validate the response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from match score API');
      }

      return {
        trustScore: data.score || 0,
        matchScore: data.score || data.matchScore || 0
      };
    } catch (error) {
      console.error('Match Score API Error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      // Return default scores on error
      return { trustScore: 0, matchScore: 0 };
    }
  }

  // Storage/Presigned URL methods
  async getPresignedUrl(request: {
    bucketName: string;
    contentType: string;
    objectKey: string;
  }): Promise<{ uploadUrl: string; accessUrl: string }> {
    console.log('🚀 Getting presigned URL:', request);
    
    try {
      const data = await this.request<{ uploadUrl: string; accessUrl: string }>('/storage/presigned-url', {
        method: 'POST',
        body: JSON.stringify(request),
      });

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
      
      // Use the request method to ensure authentication headers are included
      await this.request('/storage/upload', {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type for FormData, let the browser set it with boundary
        }
      });

      console.log('✅ File uploaded successfully through server');
    } catch (error) {
      console.error('❌ Server upload error:', error);
      throw new Error('Upload failed due to CORS restrictions. Please contact support to configure CORS for the storage bucket.');
    }
  }

  // Organization details API
  async getOrgDetails(orgSlug: string) {
    const API_ENDPOINT = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';
    const url = `${API_ENDPOINT}/admin/org-details?orgSlug=${orgSlug}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add API key if available
    const apiKey = import.meta.env.VITE_ORG_API_KEY;
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Outbound Call API
  async initiateOutboundCall(phoneNumber: string): Promise<OutboundCallResponse> {
    const outboundCallUrl = import.meta.env.VITE_OUTBOUND_CALL_URL;
    const apiKey = import.meta.env.VITE_OUTBOUND_API_KEY;
    
    if (!outboundCallUrl || !apiKey) {
      throw new Error('Outbound call API configuration missing');
    }

    const url = `${outboundCallUrl}/api/v1/agent/profile/outbound`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ phoneNumber }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  // Organization management APIs
  async getOrganizationList(): Promise<OrganizationListResponse> {
    return this.request('/auth/organization/list/', {
      method: 'GET',
    });
  }

  async setActiveOrganization(organizationId: string): Promise<SetActiveOrgResponse> {
    return this.request('/auth/organization/set-active', {
      method: 'POST',
      body: JSON.stringify({ organizationId }),
    });
  }

  async getActiveOrganizationMember(): Promise<ActiveMemberResponse> {
    return this.request('/auth/organization/get-active-member', {
      method: 'GET',
    });
  }

  // BAP Job Draft Update API - Update existing draft with new profile data
  async updateJobDraft(jobId: string, applyData: {
    providerId: string;
    userId: string;
    profileId?: string; // Profile ID to use as the primary identifier for the application
    jobDetails?: any; // Job details from BAP search API response
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
    // Use the job-applications drafts update endpoint
    const url = `${BAP_URL}/api/v1/job-applications/drafts/${jobId}`;

    // Generate a unique transaction ID
    const transactionId = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Use profileId as the primary identifier for the application, fallback to userId if no profileId
    const applicationId = applyData.profileId || applyData.userId;

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
              id: jobId,
              fulfillment_ids: [applicationId]
            }
          ],
          fulfillments: [
            {
              id: applicationId,
              customer: {
                person: {
                  id: applicationId,
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
                    profileId: applyData.profileId, // Include profile ID in metadata
                    userId: applyData.userId, // Include user ID for reference
                    // Include job details from BAP search API response
                    jobDetails: applyData.jobDetails ? {
                      // Extract key job information from the BAP response
                      jobTitle: applyData.jobDetails.descriptor?.name || applyData.jobDetails.title,
                      jobId: applyData.jobDetails.id,
                      providerId: applyData.providerId,
                      // Include the complete tags object which contains all job metadata
                      tags: applyData.jobDetails.tags || {},
                      // Include specific job details if available
                      basicInfo: applyData.jobDetails.tags?.basicInfo || {},
                      jobDetails: applyData.jobDetails.tags?.jobDetails || {},
                      jobNeeds: applyData.jobDetails.tags?.jobNeeds || {},
                      industry: applyData.jobDetails.tags?.industry,
                      status: applyData.jobDetails.tags?.status,
                      role: applyData.jobDetails.tags?.role,
                      assessment: applyData.jobDetails.tags?.assessment || {},
                      contactPerson: applyData.jobDetails.tags?.contactPerson || {},
                      // Include any other relevant job information
                      ...applyData.jobDetails
                    } : {},
                    ...applyData.profileData
                  } : {
                    profileId: applyData.profileId, // Include profile ID even if no other profile data
                    userId: applyData.userId, // Include user ID for reference
                    // Include job details even if no profile data
                    jobDetails: applyData.jobDetails ? {
                      jobTitle: applyData.jobDetails.descriptor?.name || applyData.jobDetails.title,
                      jobId: applyData.jobDetails.id,
                      providerId: applyData.providerId,
                      tags: applyData.jobDetails.tags || {},
                      basicInfo: applyData.jobDetails.tags?.basicInfo || {},
                      jobDetails: applyData.jobDetails.tags?.jobDetails || {},
                      jobNeeds: applyData.jobDetails.tags?.jobNeeds || {},
                      industry: applyData.jobDetails.tags?.industry,
                      status: applyData.jobDetails.tags?.status,
                      role: applyData.jobDetails.tags?.role,
                      assessment: applyData.jobDetails.tags?.assessment || {},
                      contactPerson: applyData.jobDetails.tags?.contactPerson || {},
                      ...applyData.jobDetails
                    } : {}
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
                          value: applyData.userData.expectedSalary || "1200000"
                        },
                        {
                          descriptor: {
                            code: "total-experience",
                            name: "Total Experience"
                          },
                          value: applyData.userData.totalExperience || "5"
                        },
                        {
                          descriptor: {
                            code: "profile-id",
                            name: "Profile ID"
                          },
                          value: applyData.profileId || "default"
                        },
                        {
                          descriptor: {
                            code: "user-id",
                            name: "User ID"
                          },
                          value: applyData.userId
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
        method: 'PATCH', // Use PATCH method for updates as requested
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
      console.error('BAP Draft Update API Error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      throw error;
    }
  }
}

// Utility function to transform profile data for API
export const transformProfileForAPI = (profile: any, userEmail?: string, locationTag?: string, contactTag?: string) => {
  // Extract location information - check both legacy and nested structures
  const currentLocation = profile.currentLocation || profile.whoIAm?.location || '';
  
  // Parse location string using the new utility function
  const locationData: LocationData = parseLocationString(currentLocation);
  
  // Validate location data for API requirements
  const locationValidation = validateLocationForAPI(locationData);
  if (!locationValidation.isValid) {
    console.warn('Location validation failed:', locationValidation.errors);
    // You might want to throw an error or handle this differently
  }
  
  // Extract phone number - check both legacy and nested structures
  const phoneNumber = (profile.phone || profile.whoIAm?.phone) ? [profile.phone || profile.whoIAm?.phone] : [];
  
  // Use user email if available, otherwise use profile email or a placeholder
  const email = userEmail || profile.email || 'user@jobbridge.in';
  
  // Get name from both legacy and nested structures
  const name = profile.name || profile.whoIAm?.name;
  
  // Helper function to clean schema data based on role
  const cleanSchemaDataForRole = (schemaData: Record<string, any>, sectionName: string, role?: string): Record<string, any> => {
    if (!schemaData || !role) return schemaData;

    try {
      // Import the schemas dynamically
      const { getUnifiedSchemaStep } = require('@/schemas');
      const stepSchema = getUnifiedSchemaStep(role, sectionName);
      
      if (!stepSchema?.properties) {
        // If no schema found for this role/section, return the data as-is
        return schemaData;
      }
      
      // Get allowed fields from the schema
      const allowedFields = Object.keys(stepSchema.properties);
      
      // Filter the data to only include fields defined in the schema
      const cleanedData: Record<string, any> = {};
      allowedFields.forEach(field => {
        if (schemaData[field] !== undefined) {
          cleanedData[field] = schemaData[field];
        }
      });
      
      console.log(`🧹 Cleaned ${sectionName} for role ${role}:`, {
        original: Object.keys(schemaData),
        allowed: allowedFields,
        filtered: Object.keys(cleanedData)
      });
      
      return cleanedData;
    } catch (error) {
      console.warn(`Warning: Could not clean schema data for role ${role}, section ${sectionName}:`, error);
      return schemaData; // Return original data if cleaning fails
    }
  };
  
  // Clean the unified schema data based on the selected role
  const cleanedWhoIAm = cleanSchemaDataForRole(profile.whoIAm || {}, 'whoIAm', profile.interestedRole);
  const cleanedWhatIHave = cleanSchemaDataForRole(profile.whatIHave || {}, 'whatIHave', profile.interestedRole);
  const cleanedWhatIWant = cleanSchemaDataForRole(profile.whatIWant || {}, 'whatIWant', profile.interestedRole);
  
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
    // Cleaned unified schema data (role-specific)
    whoIAm: cleanedWhoIAm,
    whatIHave: cleanedWhatIHave,
    whatIWant: cleanedWhatIWant,
    // ITI Institute information (for ITI-related roles)
    itiInstitute: profile.whatIHave?.itiInstitute || profile.itiInstitute,
    itiInstituteSlug: profile.whatIHave?.itiInstituteSlug || profile.itiInstituteSlug,
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
      tag: locationTag || "home",
      address: locationData.address || currentLocation || "",
      city: locationData.city,
      state: locationData.state,
      country: locationData.country || "India",
      gps: locationData.lat && locationData.lng ? {
        lat: locationData.lat,
        lng: locationData.lng
      } : {
        lat: 19.0760, // Default to Mumbai coordinates
        lng: 72.8777
      }
    },
    contact: {
      tag: contactTag || "personal",
      email: email,
      phoneNumber: phoneNumber,
      website: []
    }
  };
};

// Utility function to clean contaminated profile data
export const cleanContaminatedProfile = (profile: any): any => {
  if (!profile?.interestedRole) {
    console.warn('No interested role found in profile, cannot clean');
    return profile;
  }

  try {
    // Import the schemas dynamically
    const { getUnifiedSchemaStep } = require('@/schemas');
    
    // Clean each section
    const cleanedWhoIAm = profile.whoIAm ? (() => {
      const stepSchema = getUnifiedSchemaStep(profile.interestedRole, 'whoIAm');
      if (!stepSchema?.properties) return profile.whoIAm;
      
      const allowedFields = Object.keys(stepSchema.properties);
      const cleanedData: Record<string, any> = {};
      allowedFields.forEach(field => {
        if (profile.whoIAm[field] !== undefined) {
          cleanedData[field] = profile.whoIAm[field];
        }
      });
      return cleanedData;
    })() : {};

    const cleanedWhatIHave = profile.whatIHave ? (() => {
      const stepSchema = getUnifiedSchemaStep(profile.interestedRole, 'whatIHave');
      if (!stepSchema?.properties) return profile.whatIHave;
      
      const allowedFields = Object.keys(stepSchema.properties);
      const cleanedData: Record<string, any> = {};
      allowedFields.forEach(field => {
        if (profile.whatIHave[field] !== undefined) {
          cleanedData[field] = profile.whatIHave[field];
        }
      });
      return cleanedData;
    })() : {};

    const cleanedWhatIWant = profile.whatIWant ? (() => {
      const stepSchema = getUnifiedSchemaStep(profile.interestedRole, 'whatIWant');
      if (!stepSchema?.properties) return profile.whatIWant;
      
      const allowedFields = Object.keys(stepSchema.properties);
      const cleanedData: Record<string, any> = {};
      allowedFields.forEach(field => {
        if (profile.whatIWant[field] !== undefined) {
          cleanedData[field] = profile.whatIWant[field];
        }
      });
      return cleanedData;
    })() : {};

    console.log(`🧹 Cleaned contaminated profile for role ${profile.interestedRole}:`, {
      originalWhoIAm: Object.keys(profile.whoIAm || {}),
      cleanedWhoIAm: Object.keys(cleanedWhoIAm),
      originalWhatIHave: Object.keys(profile.whatIHave || {}),
      cleanedWhatIHave: Object.keys(cleanedWhatIHave),
      originalWhatIWant: Object.keys(profile.whatIWant || {}),
      cleanedWhatIWant: Object.keys(cleanedWhatIWant)
    });

    return {
      ...profile,
      whoIAm: cleanedWhoIAm,
      whatIHave: cleanedWhatIHave,
      whatIWant: cleanedWhatIWant
    };
  } catch (error) {
    console.warn('Warning: Could not clean contaminated profile:', error);
    return profile; // Return original profile if cleaning fails
  }
};

// Utility function to manually clean and update a contaminated profile
export const cleanAndUpdateProfile = async (profileId: string): Promise<void> => {
  try {
    console.log('🧹 Starting manual profile cleanup for profile:', profileId);
    
    // Fetch the current profile
    const profileResponse = await apiClient.getProfile() as ProfileResponse;
    if (!profileResponse?.data) {
      throw new Error('No profile found to clean');
    }
    
    const profileData = profileResponse.data;
    console.log('📥 Original profile data:', profileData);
    
    // Create a candidate-like object from profile data
    const candidateFromProfile = {
      id: profileData.id,
      interestedRole: profileData.metadata?.role,
      whoIAm: profileData.metadata?.whoIAm || {},
      whatIHave: profileData.metadata?.whatIHave || {},
      whatIWant: profileData.metadata?.whatIWant || {},
      name: profileData.metadata?.name,
      age: profileData.metadata?.age,
      // Other fields...
    };
    
    // Clean the contaminated data
    const cleanedProfile = cleanContaminatedProfile(candidateFromProfile);
    console.log('🧹 Cleaned profile data:', cleanedProfile);
    
    // Transform back to API format
    const cleanedApiPayload = transformProfileForAPI(cleanedProfile);
    console.log('📤 Cleaned API payload:', cleanedApiPayload);
    
    // Update the profile with clean data
    await apiClient.updateProfile(profileId, cleanedApiPayload);
    console.log('✅ Profile successfully cleaned and updated');
    
  } catch (error) {
    console.error('❌ Error cleaning profile:', error);
    throw error;
  }
};

// Expose this function globally for testing
(window as any).cleanAndUpdateProfile = cleanAndUpdateProfile;

// Utility function to test profile creation flow
export const testProfileCreation = () => {
  console.log('🧪 Testing profile creation flow...');
  
  // Test 1: Check if cleanContaminatedProfile is working
  const testProfile = {
    interestedRole: 'Fitter',
    whoIAm: {
      name: 'Test User',
      phone: '1234567890',
      location: 'Test Location'
    },
    whatIHave: {
      age: 25,
      hrKnowledge: ['HR Compliance'], // Should be removed for Fitter
      jukiMachineExperience: 'Yes', // Should be removed for Fitter
      fitterAssessmentScore: 90, // Should be kept for Fitter
      itiSpecialization: ['Fitter']
    },
    whatIWant: {
      monthlyPFESIC: 'Yes',
      workHoursPerDay: 8
    }
  };
  
  const cleanedProfile = cleanContaminatedProfile(testProfile);
  console.log('🧪 Test profile before cleaning:', testProfile);
  console.log('🧪 Test profile after cleaning:', cleanedProfile);
  
  return cleanedProfile;
};

// Expose this function globally for testing
(window as any).testProfileCreation = testProfileCreation;

// Create a singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export types for better TypeScript support
export interface RequestOTPResponse {
  ok: boolean;
  user: boolean;
  otp?: string;
}

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
    activeOrganizationId?: string;
    createdAt?: string;
    updatedAt?: string;
  } | null;
  user: {
    id: string;
    email: string | null;
    name?: string;
    emailVerified: boolean;
    phoneNumber?: string;
    phoneNumberVerified?: boolean;
    role?: string;
    banned?: boolean;
    banReason?: string;
    banExpires?: string | null;
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

// Organization management API types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  createdAt: string;
  metadata: string;
  type: string;
}

export type OrganizationListResponse = Organization[];

export interface SetActiveOrgResponse {
  success: boolean;
  message?: string;
}

export interface OutboundCallResponse {
  success: boolean;
  message?: string;
  data?: {
    callId: string;
    roomName: string;
    participantId: string;
    status: string;
    trunkId: string;
  };
}

export interface ActiveMemberResponse {
  organizationId: string;
  userId: string;
  role: 'admin' | 'member' | 'viewer' | 'owner';
  createdAt: string;
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}