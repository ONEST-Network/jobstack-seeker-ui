import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Search, ZoomIn, ZoomOut, Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface JobLocation {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  jobs: any[];
  jobCount: number;
  density: 'high' | 'medium' | 'low';
}

interface LatLng {
  lat: number;
  lng: number;
}

interface SimpleLeafletMapProps {
  jobLocations?: JobLocation[];
  onLocationClick?: (location: JobLocation) => void;
  selectedLocation?: JobLocation | null;
  className?: string;
  mapCenter?: LatLng;
  userLocation?: LatLng | null;
  zoom?: number;
  showLocationCard?: boolean;
  locationCardData?: JobLocation | null;
  onCloseLocationCard?: () => void;
  onViewJobsFromCard?: (location: JobLocation, specificJob?: any) => void;
  mapSearchQuery?: string;
  onMapSearchChange?: (query: string) => void;
  filteredJobLocations?: JobLocation[];
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFindMyLocation?: () => void;
  locating?: boolean;
  loading?: boolean;
}

// Create custom icons for different job densities
const createCustomIcon = (density: 'high' | 'medium' | 'low', jobCount: number) => {
  const color = density === 'high' ? '#dc2626' : density === 'medium' ? '#ea580c' : '#16a34a';
  const size = jobCount >= 10 ? 40 : jobCount >= 3 ? 32 : 24;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: ${size > 30 ? '12px' : '10px'};
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
      ">
        ${jobCount}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Create user location icon
const createUserIcon = () => {
  return L.divIcon({
    className: 'user-marker',
    html: `
      <div style="
        background-color: #2563eb;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="
          position: absolute;
          top: -25px;
          left: 50%;
          transform: translateX(-50%);
          background: #2563eb;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          white-space: nowrap;
        ">
          You
        </div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const SimpleLeafletMap: React.FC<SimpleLeafletMapProps> = ({
  jobLocations = [],
  onLocationClick,
  selectedLocation,
  className = "w-full h-full",
  mapCenter = { lat: 20.5937, lng: 78.9629 }, // Center of India
  userLocation,
  zoom = 5,
  showLocationCard = false,
  locationCardData,
  onCloseLocationCard,
  onViewJobsFromCard,
  mapSearchQuery = '',
  onMapSearchChange,
  filteredJobLocations = [],
  onZoomIn,
  onZoomOut,
  onFindMyLocation,
  locating = false,
  loading = false
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create map instance
    const map = L.map(mapRef.current).setView([mapCenter.lat, mapCenter.lng], zoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map center and zoom
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([mapCenter.lat, mapCenter.lng], zoom, { animate: true });
    }
  }, [mapCenter.lat, mapCenter.lng, zoom]);

  // Update job markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Add job location markers
    jobLocations.forEach(location => {
      const marker = L.marker([location.lat, location.lng], {
        icon: createCustomIcon(location.density, location.jobCount)
      });

      // Add popup
      const popupContent = `
        <div style="padding: 8px; min-width: 200px;">
          <h3 style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${location.name}</h3>
          <p style="font-size: 12px; color: #666; margin-bottom: 8px;">${location.state}</p>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 14px; font-weight: 500;">${location.jobCount} job${location.jobCount !== 1 ? 's' : ''}</span>
            <span style="font-size: 12px; padding: 2px 8px; border-radius: 4px; background-color: ${
              location.density === 'high' ? '#fef2f2; color: #991b1b' :
              location.density === 'medium' ? '#fff7ed; color: #9a3412' :
              '#f0fdf4; color: #166534'
            };">
              ${location.density} density
            </span>
          </div>
          <div style="font-size: 12px; color: #666;">
            ${location.jobs.slice(0, 2).map(job => `• ${job.title} at ${job.company || job.jobProviderName || 'Company'}`).join('<br>')}
            ${location.jobs.length > 2 ? `<br>• +${location.jobs.length - 2} more roles` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      // Add click handler
      marker.on('click', () => {
        onLocationClick?.(location);
      });

      marker.addTo(mapInstanceRef.current!);
      markersRef.current.push(marker);
    });

    // Add user location marker if available
    if (userLocation) {
      const userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: createUserIcon()
      });

      userMarker.bindPopup(`
        <div style="padding: 8px; text-align: center;">
          <div style="font-size: 14px; font-weight: 500; color: #2563eb;">Your Location</div>
        </div>
      `);

      userMarker.addTo(mapInstanceRef.current!);
      markersRef.current.push(userMarker);
    }
  }, [jobLocations, userLocation, onLocationClick]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Map Search Controls - Inside Map Container */}
      <div className={`absolute z-[1000] ${
        showLocationCard 
          ? (zoom >= 10 ? 'top-2 left-80 w-64' : 'top-80 left-4 w-80')
          : (zoom >= 10 ? 'top-2 left-4 w-64' : 'top-4 left-4 w-80')
      }`}>
        <div className={`bg-white rounded-lg shadow-lg border ${
          zoom >= 10 ? 'p-2' : 'p-3'
        }`}>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground ${
              zoom >= 10 ? 'h-3 w-3' : 'h-4 w-4'
            }`} />
            <Input
              placeholder={loading ? "Loading jobs..." : "Search locations on map..."}
              value={mapSearchQuery}
              onChange={(e) => onMapSearchChange?.(e.target.value)}
              className={`pl-10 ${zoom >= 10 ? 'text-xs h-8' : 'text-sm'}`}
              disabled={loading}
            />
            {/* Loading indicator in search bar */}
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className={`animate-spin text-muted-foreground ${
                  zoom >= 10 ? 'h-3 w-3' : 'h-4 w-4'
                }`} />
              </div>
            )}
          </div>
          {/* Show job count */}
          <div className={`mt-2 text-gray-600 ${
            zoom >= 10 ? 'text-xs' : 'text-xs'
          }`}>
            {filteredJobLocations.length} location{filteredJobLocations.length !== 1 ? 's' : ''} • {' '}
            {filteredJobLocations.reduce((sum, loc) => sum + loc.jobCount, 0)} job{filteredJobLocations.reduce((sum, loc) => sum + loc.jobCount, 0) !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Map Controls - Inside Map Container */}
      <div className={`absolute z-[1000] flex flex-col gap-2 ${
        zoom >= 10 ? 'top-2 right-2' : 'top-4 right-4'
      }`}>
        <Button
          variant="outline"
          size={zoom >= 10 ? "sm" : "icon"}
          className="bg-white shadow-lg"
          onClick={onZoomIn}
        >
          <ZoomIn className={zoom >= 10 ? 'h-3 w-3' : 'h-4 w-4'} />
        </Button>
        <Button
          variant="outline"
          size={zoom >= 10 ? "sm" : "icon"}
          className="bg-white shadow-lg"
          onClick={onZoomOut}
        >
          <ZoomOut className={zoom >= 10 ? 'h-3 w-3' : 'h-4 w-4'} />
        </Button>
        <Button
          variant="outline"
          size={zoom >= 10 ? "sm" : "icon"}
          className="bg-white shadow-lg"
          onClick={onFindMyLocation}
          disabled={locating}
        >
          <Navigation className={zoom >= 10 ? 'h-3 w-3' : 'h-4 w-4'} />
        </Button>
      </div>
      
      {/* Legend - Inside Map Container */}
      <div className={`absolute z-[1000] ${
        zoom >= 10 ? 'bottom-2 left-2' : 'bottom-4 left-4'
      }`}>
        <div className={`bg-white rounded-lg shadow-lg border ${
          zoom >= 10 ? 'p-2' : 'p-4'
        }`}>
          <h3 className={`font-semibold mb-2 ${
            zoom >= 10 ? 'text-xs' : 'text-sm'
          }`}>Job Density</h3>
          <div className={zoom >= 10 ? 'space-y-1' : 'space-y-2'}>
            <div className="flex items-center gap-2">
              <div className={`rounded-full bg-red-600 ${
                zoom >= 10 ? 'w-2 h-2' : 'w-3 h-3'
              }`}></div>
              <span className={`text-gray-600 ${
                zoom >= 10 ? 'text-xs' : 'text-xs'
              }`}>High (10+ jobs)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`rounded-full bg-orange-600 ${
                zoom >= 10 ? 'w-2 h-2' : 'w-3 h-3'
              }`}></div>
              <span className={`text-gray-600 ${
                zoom >= 10 ? 'text-xs' : 'text-xs'
              }`}>Medium (3-9 jobs)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`rounded-full bg-green-600 ${
                zoom >= 10 ? 'w-2 h-2' : 'w-3 h-3'
              }`}></div>
              <span className={`text-gray-600 ${
                zoom >= 10 ? 'text-xs' : 'text-xs'
              }`}>Low (1-2 jobs)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Location Detail Card - Inside Map Container */}
      {showLocationCard && locationCardData && (
        <div className={`absolute z-[1000] ${
          zoom >= 10 ? 'top-2 left-2 w-72' : 'top-4 left-4 w-80'
        }`}>
          <div className="bg-white/95 backdrop-blur-sm border-0 shadow-xl rounded-lg animate-fade-in">
            {/* Header */}
            <div className="relative p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
              <button
                onClick={onCloseLocationCard}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg">{locationCardData.name}</h3>
                  <p className="text-blue-100 text-sm">{locationCardData.state}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Job Stats */}
              <div className="flex items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                    </svg>
                    <span className="text-2xl font-bold text-gray-900">
                      {locationCardData.jobCount}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Job{locationCardData.jobCount !== 1 ? 's' : ''} available</p>
                </div>
              </div>

              {/* Density Badge */}
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  locationCardData.density === 'high' ? 'bg-red-100 text-red-800 border-red-200' :
                  locationCardData.density === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                  'bg-green-100 text-green-800 border-green-200'
                } border`}>
                  {locationCardData.density.charAt(0).toUpperCase() + locationCardData.density.slice(1)} density
                </span>
                <div className="h-1 flex-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      locationCardData.density === 'high' ? 'bg-red-500' :
                      locationCardData.density === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${locationCardData.density === 'high' ? 90 : locationCardData.density === 'medium' ? 60 : 30}%` }}
                  />
                </div>
              </div>

              {/* Available Jobs */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Available roles</p>
                <div className="space-y-1">
                  {locationCardData.jobs.slice(0, 3).map((job, index) => (
                    <div 
                      key={index} 
                      className="text-xs p-2 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded cursor-pointer transition-colors group"
                      onClick={() => onViewJobsFromCard?.(locationCardData, job)}
                    >
                      <div className="font-medium text-gray-800 group-hover:text-blue-700">
                        {job.title}
                      </div>
                      <div className="text-gray-600 group-hover:text-blue-600">
                        at {job.company || job.jobProviderName || 'Company Name'}
                      </div>
                    </div>
                  ))}
                  {locationCardData.jobs.length > 3 && (
                    <div 
                      className="text-xs p-2 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded cursor-pointer transition-colors"
                      onClick={() => onViewJobsFromCard?.(locationCardData)}
                    >
                      <div className="font-medium text-gray-800">
                        +{locationCardData.jobs.length - 3} more jobs
                      </div>
                      <div className="text-gray-600">
                        Click to view all jobs in this location
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SimpleLeafletMap; 