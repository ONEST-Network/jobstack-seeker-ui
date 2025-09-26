import { useState, useEffect } from 'react';

export type ViewType = 'list' | 'map';

interface ViewPreference {
  defaultView: ViewType;
  rememberPreference: boolean;
}

const DEFAULT_PREFERENCES: ViewPreference = {
  defaultView: 'map', // Default to map as mentioned in requirements
  rememberPreference: true
};

const STORAGE_KEY = 'jobViewPreference';

export const useViewPreference = () => {
  const [preferences, setPreferences] = useState<ViewPreference>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasAppliedInitialView, setHasAppliedInitialView] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedPreferences = JSON.parse(saved);
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...parsedPreferences
        });
      }
    } catch (error) {
      console.warn('Failed to load view preferences from localStorage:', error);
      // Keep default preferences
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save preferences to localStorage whenever they change
  const updatePreferences = (newPreferences: Partial<ViewPreference>) => {
    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPreferences));
    } catch (error) {
      console.warn('Failed to save view preferences to localStorage:', error);
    }
  };

  // Get the current default view
  const getDefaultView = (): ViewType => {
    return preferences.rememberPreference ? preferences.defaultView : 'map';
  };

  // Check if we should apply the default view (only on initial load)
  const shouldApplyDefaultView = (): boolean => {
    return isLoaded && preferences.rememberPreference && !hasAppliedInitialView;
  };

  // Mark that initial view has been applied
  const markInitialViewApplied = () => {
    setHasAppliedInitialView(true);
  };

  // Set the default view
  const setDefaultView = (view: ViewType) => {
    updatePreferences({ defaultView: view });
  };

  // Toggle remember preference
  const setRememberPreference = (remember: boolean) => {
    updatePreferences({ rememberPreference: remember });
  };

  // Reset to defaults
  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to remove view preferences from localStorage:', error);
    }
  };

  return {
    preferences,
    isLoaded,
    getDefaultView,
    shouldApplyDefaultView,
    markInitialViewApplied,
    setDefaultView,
    setRememberPreference,
    resetPreferences,
    updatePreferences
  };
};
