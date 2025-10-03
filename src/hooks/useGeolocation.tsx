import { useState, useEffect, useCallback } from 'react';

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  autoRequest?: boolean;
}

interface UseGeolocationReturn {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  permissionStatus: PermissionState | null;
  getCurrentPosition: () => Promise<void>;
}

export const useGeolocation = (options: GeolocationOptions = {}): UseGeolocationReturn => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 300000, // 5 minutes
    autoRequest = false
  } = options;

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null);

  // Check permission status
  const checkPermission = useCallback(async () => {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionStatus(permission.state);
        
        // Listen for permission changes
        permission.addEventListener('change', () => {
          setPermissionStatus(permission.state);
        });
      } catch (err) {
        console.warn('Could not check geolocation permission:', err);
      }
    }
  }, []);

  // Get current position
  const getCurrentPosition = useCallback(async (): Promise<void> => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return Promise.reject(new Error('Geolocation not supported'));
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          setLatitude(lat);
          setLongitude(lng);
          setError(null);
          setLoading(false);
          resolve();
        },
        (err) => {
          let errorMessage = 'Unable to retrieve your location';
          
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable';
              break;
            case err.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
            default:
              errorMessage = 'An unknown error occurred while retrieving location';
              break;
          }
          
          setError(errorMessage);
          setLoading(false);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      );
    });
  }, [enableHighAccuracy, timeout, maximumAge]);

  // Auto-request location if enabled
  useEffect(() => {
    checkPermission();
    
    if (autoRequest) {
      getCurrentPosition().catch(() => {
        // Error is already handled in getCurrentPosition
      });
    }
  }, [autoRequest, getCurrentPosition, checkPermission]);

  return {
    latitude,
    longitude,
    error,
    loading,
    permissionStatus,
    getCurrentPosition,
  };
};

export default useGeolocation;
