import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// URL utilities
export const buildOrgUrl = (orgSlug: string | undefined, path: string, params?: Record<string, string>): string => {
  const slug = orgSlug || '0';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  let url = `/${slug}/${cleanPath}`;
  
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  
  return url;
};

export const buildSeekerUrl = (orgSlug: string | undefined, tab?: string): string => {
  return buildOrgUrl(orgSlug, 'seeker', tab ? { tab } : undefined);
};

// Location utilities
export interface LocationData {
  address: string;
  city: string;
  state: string;
  country: string;
  lat?: number;
  lng?: number;
}

/**
 * Parse location string into structured data
 * Handles various formats like "Bangalore,Karnataka", "Bangalore, Karnataka", etc.
 */
export const parseLocationString = (locationString: string): LocationData => {
  if (!locationString || typeof locationString !== 'string') {
    return {
      address: '',
      city: '',
      state: '',
      country: 'India'
    };
  }

  // Clean the string and handle various separators
  const cleaned = locationString.trim();
  
  // Split by comma and clean each part
  const parts = cleaned.split(',').map(part => part.trim()).filter(part => part.length > 0);
  
  if (parts.length === 0) {
    return {
      address: cleaned,
      city: '',
      state: '',
      country: 'India'
    };
  }

  if (parts.length === 1) {
    // Single part - treat as city
    return {
      address: cleaned,
      city: parts[0],
      state: '',
      country: 'India'
    };
  }

  if (parts.length === 2) {
    // Two parts - city and state
    return {
      address: cleaned,
      city: parts[0],
      state: parts[1],
      country: 'India'
    };
  }

  // More than 2 parts - first is city, second is state, rest is additional info
  return {
    address: cleaned,
    city: parts[0],
    state: parts[1],
    country: 'India'
  };
};

/**
 * Reverse geocode coordinates to get address
 */
export const reverseGeocode = async (lat: number, lng: number): Promise<LocationData> => {
  try {
    // Use OpenStreetMap Nominatim API for reverse geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
    );
    
    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    const address = data.display_name || '';
    const addressParts = data.address || {};
    
    // Extract city and state from address components
    const city = addressParts.city || 
                 addressParts.town || 
                 addressParts.village || 
                 addressParts.county || 
                 addressParts.state_district || 
                 '';
    
    const state = addressParts.state || '';
    
    return {
      address,
      city,
      state,
      country: addressParts.country || 'India',
      lat,
      lng
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    
    // Fallback: return coordinates as address
    return {
      address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      city: '',
      state: '',
      country: 'India',
      lat,
      lng
    };
  }
};

/**
 * Get current location with full address
 */
export const getCurrentLocation = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const locationData = await reverseGeocode(latitude, longitude);
          resolve(locationData);
        } catch (error) {
          reject(error);
        }
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};

/**
 * Format location data for display
 */
export const formatLocationForDisplay = (locationData: LocationData): string => {
  const parts = [locationData.city, locationData.state].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : locationData.address;
};

/**
 * Validate location data for API requirements
 */
export const validateLocationForAPI = (locationData: LocationData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!locationData.city || locationData.city.length < 2) {
    errors.push('City must be at least 2 characters long');
  }
  
  if (!locationData.state || locationData.state.length < 2) {
    errors.push('State must be at least 2 characters long');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Fetches certificate data from a URL and extracts the certificate name
 * @param url - The certificate URL
 * @returns Promise<string> - The certificate name or the original URL if parsing fails
 */
export async function getCertificateName(url: string): Promise<string> {
  try {
    // Add .json extension to fetch the actual data
    const jsonUrl = url.endsWith('.json') ? url : `${url}.json`;
    
    // Use a proxy or handle CORS if needed
    const response = await fetch(jsonUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      // Add timeout and other fetch options if needed
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch certificate data: ${response.status} ${response.statusText}`);
    }
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      throw new Error('Invalid JSON response from certificate server');
    }
    
    // Look for the content object and extract certificate_name
    if (data.content && data.content.certificate_name) {
      return data.content.certificate_name;
    }
    
    // Fallback: try to find certificate_name in the root object
    if (data.certificate_name) {
      return data.certificate_name;
    }
    
    // Additional fallback: try other common field names
    if (data.content && data.content.certificateName) {
      return data.content.certificateName;
    }
    
    if (data.certificateName) {
      return data.certificateName;
    }
    
    // Try to find any field that might contain certificate information
    if (data.content) {
      const contentKeys = Object.keys(data.content);
      for (const key of contentKeys) {
        if (key.toLowerCase().includes('certificate') || key.toLowerCase().includes('name')) {
          const value = data.content[key];
          if (typeof value === 'string' && value.trim()) {
            return value.trim();
          }
        }
      }
    }
    
    // If no certificate name found, return the original URL
    return url;
  } catch (error) {
    console.error('Error fetching certificate data:', error);
    
    // Handle specific error types
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error or CORS issue');
    }
    
    // Return the original URL if there's an error
    return url;
  }
}

/**
 * Checks if a URL is a certificate URL
 * @param url - The URL to check
 * @returns boolean - True if it's a certificate URL
 */
export function isCertificateUrl(url: string): boolean {
  return url.includes('verify.jobs.onest.dhiway.net/jobs/');
}
