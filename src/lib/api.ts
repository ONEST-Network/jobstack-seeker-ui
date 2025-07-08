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
}

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