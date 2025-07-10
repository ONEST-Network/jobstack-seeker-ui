// DigiLocker Agent API utilities
const AGENT_URL = import.meta.env.VITE_AGENT_URL;
const AGENT_TOKEN = import.meta.env.VITE_AGENT_TOKEN;

export interface DigiLockerCredentialSubject {
  uid: string;
  name: string;
  dob: string;
  gender: string;
  mobile: string;
  photo: string;
  location: string;
}

export interface DigiLockerResponse {
  data: {
    credentialSubject: DigiLockerCredentialSubject;
  };
  message: string;
}

export interface DigiLockerRequestResponse {
  url: string;
}

class DigiLockerAPI {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    const config: RequestInit = {
      headers,
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Initiate DigiLocker OAuth flow
   * @returns Promise with the DigiLocker OAuth URL
   */
  async initiateDigiLockerRequest(): Promise<DigiLockerRequestResponse> {
    return this.request<DigiLockerRequestResponse>('/api/v1/discover/digilocker-request', {
      method: 'GET',
    });
  }

  /**
   * Complete DigiLocker authentication with authorization code
   * @param code - Authorization code from DigiLocker redirect
   * @param doctype - Document type (default: 'aadhaar')
   * @returns Promise with user's verified credentials
   */
  async completeDigiLockerAuth(code: string, doctype: string = 'aadhaar'): Promise<DigiLockerResponse> {
    return this.request<DigiLockerResponse>('/api/v1/discover/digilocker-auth', {
      method: 'POST',
      body: JSON.stringify({
        code,
        doctype
      }),
    });
  }

  /**
   * Transform DigiLocker credential data to profile format
   * @param credentialSubject - Raw credential data from DigiLocker
   * @returns Transformed profile data
   */
  transformCredentialData(credentialSubject: DigiLockerCredentialSubject) {
    // Convert gender M/F to male/female
    const gender = credentialSubject.gender === 'M' ? 'male' : 
                   credentialSubject.gender === 'F' ? 'female' : 'other';

    // Convert date format from DD-MM-YYYY to YYYY-MM-DD
    const formatDate = (dateStr: string) => {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return dateStr;
    };

    const dateOfBirth = formatDate(credentialSubject.dob);
    
    // Calculate age more accurately by considering month and day
    let age: number | undefined;
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    return {
      name: credentialSubject.name,
      dateOfBirth,
      age,
      gender,
      hometown: credentialSubject.location,
      aadharNumber: credentialSubject.uid,
      isNameVerified: true,
      isAgeVerified: true,
      isGenderVerified: true,
      isAadharVerified: true,
      isHometownVerified: true
    };
  }
}

// Create singleton instance if environment variables are available
export const digiLockerAPI = AGENT_URL && AGENT_TOKEN 
  ? new DigiLockerAPI(AGENT_URL, AGENT_TOKEN)
  : null;

// Export the class for custom instances
export { DigiLockerAPI };

// Utility function to check if DigiLocker is configured
export const isDigiLockerConfigured = (): boolean => {
  return !!(AGENT_URL && AGENT_TOKEN);
};

// Error types for better error handling
export class DigiLockerError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'DigiLockerError';
  }
}

export class DigiLockerConfigurationError extends DigiLockerError {
  constructor() {
    super('DigiLocker API configuration is missing. Please check VITE_AGENT_URL and VITE_AGENT_TOKEN environment variables.');
    this.name = 'DigiLockerConfigurationError';
  }
} 