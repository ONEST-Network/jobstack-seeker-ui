// Wallet VC API utilities
const VC_WALLET_URL = import.meta.env.VITE_VC_WALLET_URL;

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
  metadata: {
    pdf?: string;
    iKey?: string;
    verify?: string;
    publicId?: string;
    templateId?: string;
  };
  validFrom: string;
  validUntil: string;
  issuanceDate: string;
  credentialHash: string;
  expirationDate: string;
  credentialSchema: Record<string, { type: string }>;
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

class WalletAPI {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
      },
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Fetch verified credentials from wallet
   * @param identifier - Email or phone number
   * @param page - Page number (default: 1)
   * @param limit - Number of items per page (default: 5)
   * @returns Promise with verified credentials
   */
  async getVerifiedCredentials(identifier: string, page: number = 1, limit: number = 5): Promise<WalletResponse> {
    const endpoint = `/api/v1/verified-credentials?identifier=${encodeURIComponent(identifier)}&page=${page}&limit=${limit}`;
    return this.request<WalletResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Transform wallet credential data to profile format
   * @param credentialSubject - Raw credential data from wallet
   * @returns Transformed profile data
   */
  transformCredentialData(credentialSubject: WalletCredentialSubject) {
    const transformedData: Record<string, string | number | boolean | undefined> = {};

    // Map common fields
    if (credentialSubject.name) {
      transformedData.name = credentialSubject.name;
    }

    if (credentialSubject.email) {
      transformedData.email = credentialSubject.email;
    }

    if (credentialSubject.phone_number) {
      transformedData.phone = credentialSubject.phone_number.toString();
    }

    // Calculate age from dates if available
    if (credentialSubject.start_date || credentialSubject.issue_date) {
      const dateStr = credentialSubject.start_date || credentialSubject.issue_date;
      if (dateStr) {
        try {
          const date = new Date(dateStr);
          const today = new Date();
          const age = today.getFullYear() - date.getFullYear();
          transformedData.age = age;
        } catch (error) {
          // Ignore date parsing errors
        }
      }
    }

    // Map certificate-related fields
    if (credentialSubject.cert_name) {
      transformedData.certificationName = credentialSubject.cert_name;
    }

    if (credentialSubject.cert_id) {
      transformedData.certificationId = credentialSubject.cert_id;
    }

    if (credentialSubject.grade) {
      transformedData.grade = credentialSubject.grade;
    }

    if (credentialSubject.usn) {
      transformedData.universitySerialNumber = credentialSubject.usn;
    }

    if (credentialSubject.duration) {
      transformedData.courseDuration = credentialSubject.duration;
    }

    if (credentialSubject.event) {
      transformedData.event = credentialSubject.event;
    }

    // Add verification flags
    transformedData.isNameVerified = !!credentialSubject.name;
    transformedData.isEmailVerified = !!credentialSubject.email;
    transformedData.isPhoneVerified = !!credentialSubject.phone_number;

    return transformedData;
  }

  /**
   * Extract all unique data from multiple credentials
   */
  extractAllCredentialData(credentials: WalletCredentialData[]): Record<string, string | number | boolean | undefined> {
    const allData: Record<string, string | number | boolean | undefined> = {};
    const verificationFlags: Record<string, boolean> = {};

    credentials.forEach(credentialData => {
      credentialData.credentials.forEach(credential => {
        const transformedData = this.transformCredentialData(credential.credentialSubject);
        
        // Merge data, giving preference to non-empty values
        Object.keys(transformedData).forEach(key => {
          if (transformedData[key] && (!allData[key] || allData[key] === '')) {
            allData[key] = transformedData[key];
          }
          
          // Track verification flags
          if (key.includes('Verified') && typeof transformedData[key] === 'boolean') {
            verificationFlags[key] = verificationFlags[key] || (transformedData[key] as boolean);
          }
        });
      });
    });

    // Apply verification flags
    Object.keys(verificationFlags).forEach(key => {
      allData[key] = verificationFlags[key];
    });

    return allData;
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
  return !!VC_WALLET_URL;
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
