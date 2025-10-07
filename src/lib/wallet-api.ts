// Wallet VC API utilities
const VC_WALLET_URL = import.meta.env.VITE_VC_WALLET_URL;
const VC_WALLET_API_KEY = import.meta.env.VITE_VC_WALLET_API_KEY;

export interface WalletCredentialSubject {
  id?: string;
  name?: string;
  email?: string;
  phone_number?: number;
  usn?: string;
  grade?: string;
  cert_id?: string;
  duration?: string;
  end_date?: string;
  cert_name?: string;
  issue_date?: string;
  start_date?: string;
  event?: string;
  '@context'?: string;
  [key: string]: string | number | boolean | undefined; // Allow additional fields
}

export interface WalletCredential {
  id: string;
  type: string[];
  proof: Record<string, unknown>[];
  issuer: string;
  '@context': string[];
  metadata: Record<string, unknown>;
  validFrom: string;
  validUntil: string;
  issuanceDate: string;
  credentialHash: string;
  expirationDate?: string;
  credentialSchema: {
    $id: string;
    type: string;
    title: string;
    $schema: string;
    required?: string[];
    properties: Record<string, { type: string }>;
    description?: string;
    additionalProperties: boolean;
  };
  credentialSubject: WalletCredentialSubject;
}

export interface WalletCredentialData {
  id: number;
  orgId: string;
  credentials: WalletCredential[];
  metadata: {
    orgName: string;
    issuedBy: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SelectedVC {
  credentialData: WalletCredentialData;
  credential: WalletCredential;
  orgName: string;
  issuedBy: string;
}

export interface WalletResponse {
  identifier: string;
  total: number;
  totalOrganizations: number;
  page: number;
  limit: number;
  totalPages: number;
  credentials: WalletCredentialData[];
}

export interface IdentifierOption {
  value: string;
  label: string;
  type: 'email' | 'phone';
}

export interface RequestCodeResponse {
  success: boolean;
  message: string;
}

export interface VerifyCodeResponse {
  message: string;
  token?: string;
}

class WalletAPI {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeApiKey: boolean = false,
    includeAuthToken: boolean = false
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    // Add API key header if required and available
    if (includeApiKey && VC_WALLET_API_KEY) {
      headers['x-api-key'] = VC_WALLET_API_KEY;
    }

    // Add Authorization header if required and token is available
    if (includeAuthToken && this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    
    const config: RequestInit = {
      ...options,
      headers,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Request authentication code for wallet access
   * @param identifier - Email or phone number
   * @param type - Type of identifier ('email' or 'phoneNumber')
   * @returns Promise with request response
   */
  async requestCode(identifier: string, type: 'email' | 'phone'): Promise<RequestCodeResponse> {
    const endpoint = '/api/v1/auth/request-code';
    return this.request<RequestCodeResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        identifier,
        type
      }),
    });
  }

  /**
   * Verify authentication code for wallet access
   * @param identifier - Email or phone number
   * @param code - Verification code
   * @returns Promise with verification response
   */
  async verifyCode(identifier: string, code: string): Promise<VerifyCodeResponse> {
    const endpoint = '/api/v1/auth/verify-code';
    return this.request<VerifyCodeResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        identifier,
        code
      }),
    });
  }

  /**
   * Fetch verified credentials from wallet
   * @param identifier - Email or phone number
   * @param page - Page number (default: 1)
   * @param limit - Number of items per page (default: 50)
   * @returns Promise with verified credentials
   */
  async getVerifiedCredentials(identifier: string, page: number = 1, limit: number = 50): Promise<WalletResponse> {
    const endpoint = `/api/v1/verified-credentials?identifier=${identifier}&page=${page}&limit=${limit}`;
    return this.request<WalletResponse>(endpoint, {
      method: 'GET',
    }, true, true); // Include API key and auth token for credential fetch
  }

  /**
   * Transform wallet credential data to profile format
   * @param credentialSubject - Raw credential data from wallet
   * @returns Transformed profile data organized by sections
   */
  transformCredentialData(credentialSubject: WalletCredentialSubject) {
    const transformedData: Record<string, any> = {
      whoIAm: {},
      whatIHave: {},
      whatIWant: {},
      importedFromWallet: true
    };

    // Who I Am section
    if (credentialSubject.name) {
      transformedData.whoIAm.name = credentialSubject.name;
      transformedData.whoIAm.isNameVerified = true;
    }

    if (credentialSubject.email) {
      transformedData.whoIAm.email = credentialSubject.email;
      transformedData.whoIAm.isEmailVerified = true;
    }

    if (credentialSubject.phone_number) {
      transformedData.whoIAm.phone = credentialSubject.phone_number.toString();
      transformedData.whoIAm.isPhoneVerified = true;
    }

    // Calculate age from dates if available
    if (credentialSubject.start_date || credentialSubject.issue_date) {
      const dateStr = credentialSubject.start_date || credentialSubject.issue_date;
      if (dateStr) {
        try {
          const date = new Date(dateStr);
          const today = new Date();
          const age = today.getFullYear() - date.getFullYear();
          transformedData.whoIAm.age = age;
          transformedData.whoIAm.isAgeVerified = true;
        } catch (error) {
          // Ignore date parsing errors
        }
      }
    }

    // What I Have section (Qualifications, Skills, Experience)
    if (credentialSubject.cert_name) {
      transformedData.whatIHave.certificationName = credentialSubject.cert_name;
    }

    if (credentialSubject.cert_id) {
      transformedData.whatIHave.certificationId = credentialSubject.cert_id;
    }

    if (credentialSubject.grade) {
      transformedData.whatIHave.grade = credentialSubject.grade;
    }

    if (credentialSubject.usn) {
      transformedData.whatIHave.universitySerialNumber = credentialSubject.usn;
    }

    if (credentialSubject.duration) {
      transformedData.whatIHave.courseDuration = credentialSubject.duration;
    }

    if (credentialSubject.event) {
      transformedData.whatIHave.event = credentialSubject.event;
    }

    // Map education credential if available
    if (credentialSubject.education_credential) {
      transformedData.whatIHave.educationCredential = credentialSubject.education_credential;
    }

    // What I Want section (Salary expectations and work preferences)
    // These would typically come from job-related credentials or user preferences
    // For now, we'll leave this section mostly empty as it's more user-specific

    return transformedData;
  }

  /**
   * Extract all unique data from multiple credentials
   */
  extractAllCredentialData(credentials: WalletCredentialData[]): Record<string, any> {
    const allData: Record<string, any> = {
      whoIAm: {},
      whatIHave: {},
      whatIWant: {},
      importedFromWallet: true
    };

    credentials.forEach(credentialData => {
      credentialData.credentials.forEach(credential => {
        const transformedData = this.transformCredentialData(credential.credentialSubject);
        
        // Merge whoIAm data
        if (transformedData.whoIAm) {
          Object.keys(transformedData.whoIAm).forEach(key => {
            if (transformedData.whoIAm[key] && (!allData.whoIAm[key] || allData.whoIAm[key] === '')) {
              allData.whoIAm[key] = transformedData.whoIAm[key];
            }
          });
        }

        // Merge whatIHave data
        if (transformedData.whatIHave) {
          Object.keys(transformedData.whatIHave).forEach(key => {
            if (transformedData.whatIHave[key] && (!allData.whatIHave[key] || allData.whatIHave[key] === '')) {
              allData.whatIHave[key] = transformedData.whatIHave[key];
            }
          });
        }

        // Merge whatIWant data
        if (transformedData.whatIWant) {
          Object.keys(transformedData.whatIWant).forEach(key => {
            if (transformedData.whatIWant[key] && (!allData.whatIWant[key] || allData.whatIWant[key] === '')) {
              allData.whatIWant[key] = transformedData.whatIWant[key];
            }
          });
        }
      });
    });

    return allData;
  }

  /**
   * Transform a single selected VC to profile format
   */
  transformSelectedVC(selectedVC: SelectedVC): Record<string, any> {
    const transformedData = this.transformCredentialData(selectedVC.credential.credentialSubject);
    
    // Add metadata about the VC
    transformedData.vcMetadata = {
      orgName: selectedVC.orgName,
      issuedBy: selectedVC.issuedBy,
      credentialId: selectedVC.credential.id,
      issuanceDate: selectedVC.credential.issuanceDate,
      validUntil: selectedVC.credential.validUntil,
      schemaTitle: selectedVC.credential.credentialSchema.title
    };

    return transformedData;
  }
}

// Create singleton instance if environment variable is available
export const walletAPI = VC_WALLET_URL 
  ? new WalletAPI(VC_WALLET_URL)
  : null;

// Export the class for custom instances
export { WalletAPI };

// Utility function to check if Wallet is configured
export const isWalletConfigured = (): boolean => {
  return !!VC_WALLET_URL && !!VC_WALLET_API_KEY;
};

// Error types for better error handling
export class WalletError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletError';
  }
}

export class WalletConfigurationError extends WalletError {
  constructor(message: string) {
    super(message);
    this.name = 'WalletConfigurationError';
  }
}
