import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MapPin, 
  Search, 
  Crosshair, 
  CheckCircle, 
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { LocationData } from '@/lib/utils';
import { mapService } from '@/services/mapService';
import { useIsMobile } from '@/hooks/use-mobile';

// Type declarations for Google Maps
declare global {
  interface Window {
    google: any;
  }
}

interface MapLocationSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: LocationData | null;
  title?: string;
}

interface MapClickLocation {
  lat: number;
  lng: number;
  address?: string;
}

const MapLocationSelector: React.FC<MapLocationSelectorProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  initialLocation,
  title = "Select Location"
}) => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [selectedLocation, setSelectedLocation] = useState<MapClickLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 20.5937, lng: 78.9629 });
  const [mapZoom, setMapZoom] = useState(10);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize map when dialog opens
  useEffect(() => {
    if (isOpen) {
      initializeMap();
    }
  }, [isOpen]);

  // Set initial location if provided
  useEffect(() => {
    if (isMapLoaded && mapInstanceRef.current && initialLocation) {
      const location = {
        lat: initialLocation.lat || 20.5937,
        lng: initialLocation.lng || 78.9629,
        address: initialLocation.address
      };
      setSelectedLocation(location);
      setMapCenter({ lat: location.lat, lng: location.lng });
      setMapZoom(15);
      updateMarker(location);
    }
  }, [initialLocation, isMapLoaded]);

  const initializeMap = async () => {
    try {
      setIsLoading(true);
      
      // Wait a bit to ensure the container is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!mapRef.current) return;

      // Clear existing map instance if it exists
      if (mapInstanceRef.current) {
        if (mapRef.current) {
          mapRef.current.innerHTML = '';
        }
        mapInstanceRef.current = null;
      }
      
      // Clear marker reference
      if (markerRef.current) {
        markerRef.current = null;
      }
      
      // Check if Google Maps should be used
      const useGoogleMaps = import.meta.env.VITE_USE_GOOGLE_MAPS === 'true';
      
      if (useGoogleMaps) {
        await initializeGoogleMaps();
      } else {
        await initializeLeafletMap();
      }
      
      setIsMapLoaded(true);
    } catch (error) {
      console.error('Failed to initialize map:', error);
      toast({
        title: "Failed to load map",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const initializeGoogleMaps = async () => {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        throw new Error('Google Maps API key not configured');
      }

      // Load Google Maps script if not already loaded
      if (!(window as any).google || !(window as any).google.maps) {
        await loadGoogleMapsScript(apiKey);
      }

      if (!mapRef.current) return;

      // Create map instance
      const map = new (window as any).google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: mapZoom,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
        restriction: {
          latLngBounds: {
            north: 37.09024,
            south: 8.0883064,
            west: 68.1766451,
            east: 97.4025619,
          },
          strictBounds: false,
        },
      });

      mapInstanceRef.current = map;

      // Add click listener for location selection
      map.addListener('click', (event: any) => {
        if (event.latLng) {
          const location = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };
          handleMapClick(location);
        }
      });

      // Add listeners to track map center and zoom changes
      map.addListener('center_changed', () => {
        const center = map.getCenter();
        if (center) {
          setMapCenter({ lat: center.lat(), lng: center.lng() });
        }
      });

      map.addListener('zoom_changed', () => {
        setMapZoom(map.getZoom() || 10);
      });

      // Add marker for selected location
      markerRef.current = new (window as any).google.maps.Marker({
        map: map,
        draggable: true,
        title: 'Selected Location',
        visible: false,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#3b82f6" stroke="white" stroke-width="3"/>
              <circle cx="16" cy="16" r="6" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 16)
        }
      });

      // Add drag listener to marker
      markerRef.current.addListener('dragend', (event: any) => {
        if (event.latLng) {
          const location = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };
          handleMapClick(location);
        }
      });

    } catch (error) {
      console.error('Failed to initialize Google Maps:', error);
      throw error;
    }
  };

  const loadGoogleMapsScript = async (apiKey: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if ((window as any).google && (window as any).google.maps) {
        resolve();
        return;
      }

      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', reject);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&v=weekly&region=IN&language=en`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => resolve();
      script.onerror = (error) => reject(new Error('Failed to load Google Maps script'));
      
      document.head.appendChild(script);
    });
  };

  const initializeLeafletMap = async () => {
    try {
      // Dynamically import Leaflet
      const L = await import('leaflet');
      
      // Fix for default markers in Leaflet
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      if (!mapRef.current) return;

      // Create map instance
      const map = L.map(mapRef.current, {
        center: [mapCenter.lat, mapCenter.lng],
        zoom: mapZoom,
        zoomControl: true,
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Add click listener for location selection
      map.on('click', (e: L.LeafletMouseEvent) => {
        const location = {
          lat: e.latlng.lat,
          lng: e.latlng.lng
        };
        handleMapClick(location);
      });

      // Track map center and zoom changes
      map.on('moveend', () => {
        const center = map.getCenter();
        setMapCenter({ lat: center.lat, lng: center.lng });
      });

      map.on('zoomend', () => {
        setMapZoom(map.getZoom());
      });

      // Create marker (will be added when location is selected)
      markerRef.current = L.marker([mapCenter.lat, mapCenter.lng], {
        draggable: true,
        icon: L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        })
      });

      // Add drag listener to marker
      markerRef.current.on('dragend', (e: L.DragEndEvent) => {
        const location = {
          lat: e.target.getLatLng().lat,
          lng: e.target.getLatLng().lng
        };
        handleMapClick(location);
      });

    } catch (error) {
      console.error('Failed to initialize Leaflet map:', error);
      throw error;
    }
  };

  const handleMapClick = async (location: MapClickLocation) => {
    setSelectedLocation(location);
    updateMarker(location);
    
    // Reverse geocode to get address
    try {
      const result = await mapService.reverseGeocode(location.lat, location.lng);
      if (result) {
        setSelectedLocation({
          ...location,
          address: result.address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
        });
      }
    } catch (error) {
      console.error('Failed to get address:', error);
    }
  };

  const updateMarker = (location: MapClickLocation) => {
    if (!mapInstanceRef.current) return;

    const useGoogleMaps = import.meta.env.VITE_USE_GOOGLE_MAPS === 'true';

    if (useGoogleMaps && markerRef.current) {
      // Google Maps
      markerRef.current.setPosition({ lat: location.lat, lng: location.lng });
      markerRef.current.setVisible(true);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo({ lat: location.lat, lng: location.lng });
      }
    } else if (markerRef.current && mapInstanceRef.current) {
      // Leaflet - marker is already a Leaflet marker instance
      try {
        (markerRef.current as any).setLatLng([location.lat, location.lng]);
        if (!(mapInstanceRef.current as any).hasLayer(markerRef.current)) {
          (markerRef.current as any).addTo(mapInstanceRef.current);
        }
        (mapInstanceRef.current as any).panTo([location.lat, location.lng]);
      } catch (error) {
        console.error('Failed to update Leaflet marker:', error);
      }
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const predictions = await mapService.getPlacePredictions(query);
      setSearchResults(predictions || []);
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: "Search failed",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchResultSelect = async (result: any) => {
    try {
      const useGoogleMaps = import.meta.env.VITE_USE_GOOGLE_MAPS === 'true';
      
      let location: MapClickLocation;
      
      if (useGoogleMaps && result.place_id) {
        const placeDetails = await mapService.getPlaceDetails(result.place_id);
        if (placeDetails) {
          location = {
            lat: placeDetails.lat,
            lng: placeDetails.lng,
            address: placeDetails.address
          };
        } else {
          // Fallback: geocode the description
          const coords = await mapService.geocodeLocation(result.description);
          if (coords) {
            location = {
              lat: coords.lat,
              lng: coords.lng,
              address: result.description
            };
          } else {
            throw new Error('Failed to get location');
          }
        }
      } else {
        // For Nominatim/OSM results or when place_id is not available
        const coords = await mapService.geocodeLocation(result.description || result.display_name);
        if (coords) {
          location = {
            lat: coords.lat,
            lng: coords.lng,
            address: result.description || result.display_name
          };
        } else {
          throw new Error('Failed to get location');
        }
      }
      
      setSelectedLocation(location);
      setMapCenter({ lat: location.lat, lng: location.lng });
      setMapZoom(15);
      updateMarker(location);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to select search result:', error);
      toast({
        title: "Failed to select location",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser does not support geolocation.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    mapService.getCurrentLocation()
      .then(async (locationData) => {
        const location = {
          lat: locationData.lat || 20.5937,
          lng: locationData.lng || 78.9629,
          address: locationData.address
        };
        setSelectedLocation(location);
        setMapCenter({ lat: location.lat, lng: location.lng });
        setMapZoom(15);
        updateMarker(location);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Geolocation error:', error);
        toast({
          title: "Failed to get location",
          description: "Please try selecting a location on the map.",
          variant: "destructive"
        });
        setIsLoading(false);
      });
  };

  const handleConfirmSelection = async () => {
    if (!selectedLocation) {
      toast({
        title: "No location selected",
        description: "Please select a location on the map",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Get structured address data using reverse geocoding
      const result = await mapService.reverseGeocode(selectedLocation.lat, selectedLocation.lng);
      
      const locationData: LocationData = {
        address: result?.address || selectedLocation.address || `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`,
        city: result?.city || '',
        state: result?.state || '',
        country: result?.country || 'India',
        lat: selectedLocation.lat,
        lng: selectedLocation.lng
      };

      onLocationSelect(locationData);
      handleClose();
    } catch (error) {
      console.error('Failed to get structured location data:', error);
      // Fallback to basic location data
      const locationData: LocationData = {
        address: selectedLocation.address || `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`,
        city: '',
        state: '',
        country: 'India',
        lat: selectedLocation.lat,
        lng: selectedLocation.lng
      };
      onLocationSelect(locationData);
      handleClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedLocation(null);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setIsLoading(false);
    setIsMapLoaded(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] h-[95vh]' : 'max-w-4xl h-[80vh]'} p-0 overflow-hidden flex flex-col`}>
        <DialogHeader className={`${isMobile ? 'p-4 pb-0' : 'p-6 pb-0'}`}>
          <DialogTitle className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>{title}</DialogTitle>
        </DialogHeader>

        <div className={`flex-1 flex flex-col ${isMobile ? 'p-4 pt-2' : 'p-6 pt-4'}`}>
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                placeholder="Search for a location..."
                className={`pl-10 pr-20 ${isMobile ? 'h-12 text-base' : ''}`}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                {isSearching && <Loader2 className="h-4 w-4 animate-spin" />}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGetCurrentLocation}
                  disabled={isLoading}
                  className={`${isMobile ? 'h-10 px-3' : 'h-8 px-2'}`}
                >
                  <Crosshair className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className={`px-4 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 ${isMobile ? 'py-4 min-h-[48px]' : 'py-3'}`}
                    onClick={() => handleSearchResultSelect(result)}
                  >
                    <div className={`${isMobile ? 'text-base' : 'text-sm'} font-medium`}>
                      {result.description || result.display_name}
                    </div>
                    {result.structured_formatting && (
                      <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-500 mt-1`}>
                        {result.structured_formatting.secondary_text}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Map Container */}
          <div className="flex-1 relative border border-gray-200 rounded-lg overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Loading map...</span>
                </div>
              </div>
            )}
            
            <div
              ref={mapRef}
              className="w-full h-full"
              style={{ minHeight: isMobile ? '300px' : '400px' }}
            />

            {/* Map Instructions */}
            {!selectedLocation && !isLoading && (
              <div className={`absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg ${isMobile ? 'max-w-[280px]' : 'max-w-xs'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className={`${isMobile ? 'text-base' : 'text-sm'} font-medium`}>Select Location</span>
                </div>
                <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-600`}>
                  {isMobile 
                    ? "Tap anywhere on the map to select the location, or search for a specific address."
                    : "Click anywhere on the map to select the location, or search for a specific address."
                  }
                </p>
              </div>
            )}

            {/* Selected Location Info */}
            {selectedLocation && (
              <div className={`absolute z-20 bg-white/95 backdrop-blur-sm shadow-lg rounded-lg border ${isMobile ? 'bottom-16 left-4 right-4' : 'bottom-4 left-4 right-4'} max-w-sm`}>
                <div className="p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate" title={selectedLocation.address}>
                        {selectedLocation.address}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className={`${isMobile ? 'p-3 pt-0 flex-col gap-2' : 'p-4 pt-0 flex-row gap-3'} flex-shrink-0`}>
          <Button 
            onClick={handleConfirmSelection}
            disabled={!selectedLocation || isLoading}
            size={isMobile ? "sm" : "default"}
            className={`flex items-center gap-2 ${isMobile ? 'w-full h-10' : 'flex-1 min-w-0'}`}
          >
            <MapPin className="h-4 w-4" />
            Use This Location
          </Button>
          <Button 
            variant="outline" 
            onClick={handleClose} 
            size={isMobile ? "sm" : "default"}
            className={`${isMobile ? 'w-full h-10' : 'flex-1 min-w-0'}`}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MapLocationSelector;

