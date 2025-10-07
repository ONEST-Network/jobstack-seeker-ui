import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
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
  onLocationSearch?: (searchQuery: string) => void;
  searchingLocation?: boolean;
  onClearSearch?: () => void;
  showIndividualJobs?: boolean;
  onToggleIndividualJobs?: () => void;
  onJobClick?: (jobOrJobs: any | any[]) => void;
  allJobs?: any[];
}

// Create custom icons for different job densities
const createCustomIcon = (density: 'high' | 'medium' | 'low', jobCount: number) => {
  // Use different shades of blue for job density
  const color = density === 'high' ? '#1e3a8a' : density === 'medium' ? '#2563eb' : '#3b82f6';
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

// Create individual job marker icon with briefcase and job count
const createJobIcon = (jobCount: number = 1) => {
  const size = jobCount > 1 ? 32 : 28; // Increased size for better visibility
  const fontSize = jobCount > 1 ? '12px' : '10px';
  const borderWidth = 3; // Thicker border for better contrast
  
  return L.divIcon({
    className: 'individual-job-marker',
    html: `
      <div style="
        background-color: #1d4ed8;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: ${borderWidth}px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 0 0 2px rgba(29, 78, 216, 0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        transition: all 0.2s ease;
      ">
        ${jobCount > 1 ? `
          <span style="
            color: white;
            font-weight: bold;
            font-size: ${fontSize};
            line-height: 1;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
          ">${jobCount}</span>
        ` : `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));">
            <path d="M10 2v2H8v2H6v2H4v12h16V8h-2V6h-2V4h-2V2h-4zm2 2h2v2h2v2h2v10H6V8h2V6h2V4h2zm-2 4v2h4V8h-4zm0 4v2h4v-2h-4z"/>
          </svg>
        `}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};
// Create user location icon - changed to red color
const createUserIcon = () => {
  return L.divIcon({
    className: 'user-marker',
    html: `
      <div style="
        background-color: #f97316;
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
          background: #f97316;
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

// Custom cluster icon function
const createClusterIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  let size = 40;
  let color = '#3b82f6';
  
  if (count >= 50) {
    size = 60;
    color = '#1e3a8a';
  } else if (count >= 20) {
    size = 50;
    color = '#2563eb';
  } else if (count >= 10) {
    size = 45;
    color = '#1d4ed8';
  }
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 4px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: ${size > 45 ? '14px' : '12px'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      ">
        ${count}
      </div>
    `,
    className: 'custom-cluster',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
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
  loading = false,
  onLocationSearch,
  searchingLocation = false,
  onClearSearch,
  showIndividualJobs = false,
  onToggleIndividualJobs,
  onJobClick,
  allJobs = []
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const jobMarkersRef = useRef<L.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create map instance
    const map = L.map(mapRef.current, {
      zoomControl: false
    }).setView([mapCenter.lat, mapCenter.lng], zoom);

    // Add conditional tile layer based on environment
    const useGoogleMaps = import.meta.env.VITE_USE_GOOGLE_MAPS === 'true';
    const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (useGoogleMaps && googleApiKey) {
      // Google Maps tile layer
      L.tileLayer(`https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${googleApiKey}`, {
        attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a>',
        maxZoom: 20,
      }).addTo(map);
    } else {
      // OpenStreetMap tile layer (existing)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
    }

    // Create marker cluster group
    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: true,
      zoomToBoundsOnClick: true,
      iconCreateFunction: createClusterIcon,
      animate: true,
      animateAddingMarkers: true,
    });

    clusterGroupRef.current = clusterGroup;
    map.addLayer(clusterGroup);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapCenter.lat, mapCenter.lng, zoom]);

  // Update map center and zoom
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([mapCenter.lat, mapCenter.lng], zoom, { animate: true });
    }
  }, [mapCenter.lat, mapCenter.lng, zoom]);

  // Update job markers
  useEffect(() => {
    if (!mapInstanceRef.current || !clusterGroupRef.current) return;

    // Clear existing markers from cluster group
    clusterGroupRef.current.clearLayers();
    markersRef.current = [];

    // Add job location markers to cluster group
    jobLocations.forEach(location => {
      const marker = L.marker([location.lat, location.lng], {
        icon: createCustomIcon(location.density, location.jobCount)
      });

      // Add popup
      const popupContent = `
        <div style="padding: 8px; min-width: 200px; max-width: 280px;">
          <h3 style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${location.name}</h3>
          <p style="font-size: 12px; color: #666; margin-bottom: 8px;">${location.state}</p>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 14px; font-weight: 500;">${location.jobCount} job${location.jobCount !== 1 ? 's' : ''}</span>
            <span style="font-size: 12px; padding: 2px 8px; border-radius: 4px; background-color: ${
              location.density === 'high' ? '#dbeafe; color: #1e3a8a' :
              location.density === 'medium' ? '#dbeafe; color: #2563eb' :
              '#dbeafe; color: #3b82f6'
            };">
              ${location.density} density
            </span>
          </div>
          <div style="font-size: 12px; color: #666; margin-bottom: 8px; max-height: 80px; overflow-y: auto;">
            ${location.jobs.slice(0, 3).map(job => `• ${job.title} at ${job.company || job.jobProviderName || 'Company'}`).join('<br>')}
            ${location.jobs.length > 3 ? `<br>• +${location.jobs.length - 3} more roles` : ''}
          </div>
          <div style="border-top: 1px solid #eee; padding-top: 8px;">
            <a href="https://www.google.com/maps?q=${location.lat},${location.lng}" 
               target="_blank" 
               rel="noopener noreferrer"
               style="
                 display: inline-flex;
                 align-items: center;
                 gap: 4px;
                 color: #2563eb;
                 text-decoration: none;
                 font-size: 12px;
                 font-weight: 500;
                 padding: 4px 8px;
                 border-radius: 4px;
                 background-color: #eff6ff;
                 border: 1px solid #dbeafe;
                 transition: all 0.2s;
               "
               onmouseover="this.style.backgroundColor='#dbeafe'; this.style.borderColor='#93c5fd';"
               onmouseout="this.style.backgroundColor='#eff6ff'; this.style.borderColor='#dbeafe';"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink: 0;">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              Open in Google Maps
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      // Add click handler
      marker.on('click', () => {
        onLocationClick?.(location);
      });

      clusterGroupRef.current.addLayer(marker);
      markersRef.current.push(marker);
    });

    // Clear existing individual job markers
    jobMarkersRef.current.forEach(marker => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(marker);
      }
    });
    jobMarkersRef.current = [];

    if (showIndividualJobs && allJobs.length > 0) {
      // Show individual job markers without clustering
      // Filter jobs that have GPS coordinates first
      const jobsWithGPS = allJobs.filter(job => {
        const gps = job.jobProviderLocation?.gps || 
                   job.tags?.basicInfo?.jobProviderLocation?.gps ||
                   job.locations?.gps; // Also check direct locations.gps from API
        return gps && gps.lat && gps.lng;
      });
      
      // Limit number of markers for performance at low zoom levels
      const maxMarkers = zoom < 8 ? 200 : zoom < 12 ? 500 : jobsWithGPS.length;
      const jobsToShow = jobsWithGPS.slice(0, maxMarkers);
      
      console.log(`🗺️ Individual mode: Showing ${jobsToShow.length} job markers from ${jobsWithGPS.length} jobs with GPS coordinates`);
      
      // Group jobs by location to handle multiple jobs at same coordinates
      const jobsByLocation = new Map<string, any[]>();
      
      jobsToShow.forEach((job, index) => {
        // Extract GPS coordinates from multiple possible locations in the job data
        const gps = job.jobProviderLocation?.gps || 
                   job.tags?.basicInfo?.jobProviderLocation?.gps ||
                   job.locations?.gps; // Direct from API response locations
        
        if (!gps || !gps.lat || !gps.lng) {
          console.warn('Job missing GPS coordinates:', job.id || job.descriptor?.name);
          return; // Skip jobs without GPS coordinates
        }
        
        // Ensure coordinates are numbers
        const lat = parseFloat(gps.lat);
        const lng = parseFloat(gps.lng);
        
        if (isNaN(lat) || isNaN(lng)) {
          console.warn('Invalid GPS coordinates:', gps);
          return;
        }
        
        // Create location key for grouping (rounded to 4 decimal places for grouping nearby jobs)
        const locationKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
        
        if (!jobsByLocation.has(locationKey)) {
          jobsByLocation.set(locationKey, []);
        }
        jobsByLocation.get(locationKey)!.push(job);
      });

      // Create markers for each location group
      jobsByLocation.forEach((jobs, locationKey) => {
        const [latStr, lngStr] = locationKey.split(',');
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);
        const jobCount = jobs.length;
        
        // Log first few locations for verification
        if (jobsByLocation.size <= 3) {
          console.log(`📍 Location with ${jobCount} job(s) at GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          jobs.forEach((job, index) => {
            console.log(`  - Job ${index + 1}: "${job.descriptor?.name || job.title}"`);
          });
        }

        const marker = L.marker([lat, lng], {
          icon: createJobIcon(jobCount)
        });
        
        // Store additional data in marker object
        (marker as any).jobCount = jobCount;
        (marker as any).jobs = jobs;

        // Add popup for location with job count
        const firstJob = jobs[0];
        const company = firstJob.company || firstJob.jobProviderName || 
                       firstJob.tags?.basicInfo?.jobProviderName || 
                       firstJob.descriptor?.name || 'Company';
        const city = firstJob.jobProviderLocation?.city || 
                    firstJob.tags?.basicInfo?.jobProviderLocation?.city ||
                    firstJob.locations?.city || 'Unknown City';
        const state = firstJob.jobProviderLocation?.state || 
                     firstJob.tags?.basicInfo?.jobProviderLocation?.state ||
                     firstJob.locations?.state || 'Unknown State';
        
        const popupContent = `
          <div style="min-width: 200px; padding: 8px;">
            <h3 style="margin: 0 0 4px 0; font-weight: bold; font-size: 14px;">${company}</h3>
            <p style="margin: 0 0 8px 0; color: #666; font-size: 12px;">${city}, ${state}</p>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <span style="font-weight: bold; font-size: 13px;">${jobCount} job${jobCount !== 1 ? 's' : ''}</span>
            </div>
            <div style="font-size: 12px; color: #666;">
              ${jobs.slice(0, 2).map((job, index) => 
                `<div>• ${job.title || job.descriptor?.name || 'Job Position'}</div>`
              ).join('')}
              ${jobs.length > 2 ? `<div>• +${jobs.length - 2} more roles</div>` : ''}
            </div>
          </div>
        `;
        
        marker.bindPopup(popupContent, {
          closeOnClick: false,
          autoClose: false
        });

        // Add click handler for job selection
        marker.on('click', () => {
          if (jobCount > 1) {
            // Show job selection modal for multiple jobs
            onJobClick?.(jobs); // Pass all jobs to parent component
          } else {
            // Single job - directly show job details
            onJobClick?.(jobs[0]);
          }
        });

        // Add hover effects for better interactivity
        marker.on('mouseover', () => {
          const icon = marker.getIcon() as L.DivIcon;
          if (icon && icon.options && 'html' in icon.options && typeof icon.options.html === 'string') {
            const currentHtml = icon.options.html;
            const hoveredHtml = currentHtml.replace(
              'box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 0 0 2px rgba(29, 78, 216, 0.3);',
              'box-shadow: 0 6px 16px rgba(0,0,0,0.5), 0 0 0 3px rgba(29, 78, 216, 0.5); transform: scale(1.1);'
            );
            icon.options.html = hoveredHtml;
            marker.setIcon(icon);
          }
        });

        marker.on('mouseout', () => {
          const icon = marker.getIcon() as L.DivIcon;
          if (icon && icon.options && 'html' in icon.options && typeof icon.options.html === 'string') {
            const currentHtml = icon.options.html;
            const normalHtml = currentHtml.replace(
              'box-shadow: 0 6px 16px rgba(0,0,0,0.5), 0 0 0 3px rgba(29, 78, 216, 0.5); transform: scale(1.1);',
              'box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 0 0 2px rgba(29, 78, 216, 0.3);'
            );
            icon.options.html = normalHtml;
            marker.setIcon(icon);
          }
        });

        marker.addTo(mapInstanceRef.current);
        jobMarkersRef.current.push(marker);
      });
    }

    // Add user location marker if available (outside cluster group)
    if (userLocation) {
      // Remove existing user marker if any
      if (userMarkerRef.current) {
        mapInstanceRef.current.removeLayer(userMarkerRef.current);
      }

      const userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: createUserIcon()
      });

      userMarker.bindPopup(`
        <div style="padding: 8px; text-align: center;">
          <div style="font-size: 14px; font-weight: 500; color: #dc2626;">Your Location</div>
        </div>
      `);

      userMarker.addTo(mapInstanceRef.current);
      userMarkerRef.current = userMarker;
    }
  }, [jobLocations, userLocation, onLocationClick, showIndividualJobs, allJobs, onJobClick, zoom]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Map Search Controls - Inside Map Container */}
      <div className={`absolute z-[1000] ${
        showLocationCard 
          ? (zoom >= 10 ? 'top-2 left-80 w-64' : 'top-4 left-4 w-80')
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
              onKeyPress={(e) => {
                if (e.key === 'Enter' && mapSearchQuery.trim()) {
                  onLocationSearch?.(mapSearchQuery);
                }
              }}
              className={`pl-10 pr-12 ${zoom >= 10 ? 'text-xs h-8' : 'text-sm'}`}
              disabled={loading || searchingLocation}
            />
            {/* Search button or loading indicator */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              {loading ? (
                <Loader2 className={`animate-spin text-muted-foreground ${
                  zoom >= 10 ? 'h-3 w-3' : 'h-4 w-4'
                }`} />
              ) : searchingLocation ? (
                <Loader2 className={`animate-spin text-blue-600 ${
                  zoom >= 10 ? 'h-3 w-3' : 'h-4 w-4'
                }`} />
              ) : (
                <>
                  {mapSearchQuery.trim() && (
                    <button
                      onClick={onClearSearch}
                      className="p-1 rounded hover:bg-gray-100 transition-colors text-muted-foreground hover:text-gray-600"
                      title="Clear search"
                    >
                      <svg className={zoom >= 10 ? 'h-3 w-3' : 'h-4 w-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (mapSearchQuery.trim()) {
                        onLocationSearch?.(mapSearchQuery);
                      }
                    }}
                    disabled={!mapSearchQuery.trim() || loading}
                    className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                      mapSearchQuery.trim() && !loading ? 'text-blue-600' : 'text-muted-foreground'
                    }`}
                    title="Search location"
                  >
                    <Search className={zoom >= 10 ? 'h-3 w-3' : 'h-4 w-4'} />
                  </button>
                </>
              )}
            </div>
          </div>
          {/* Show job count */}
          <div className={`mt-2 text-gray-600 ${
            zoom >= 10 ? 'text-xs' : 'text-xs'
          }`}>
            {filteredJobLocations.length} location{filteredJobLocations.length !== 1 ? 's' : ''} • {' '}
            {filteredJobLocations.reduce((sum, loc) => sum + loc.jobCount, 0)} job{filteredJobLocations.reduce((sum, loc) => sum + loc.jobCount, 0) !== 1 ? 's' : ''}
            {zoom < 8 && (
              <span className="text-blue-600 ml-1">• Zoom in to see individual locations</span>
            )}
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
        <Button
          variant="outline"
          size={zoom >= 10 ? "sm" : "icon"}
          className="bg-white shadow-lg"
          onClick={onToggleIndividualJobs}
          title={showIndividualJobs ? "Switch to Clustered View" : "Switch to Individual View"}
        >
          <svg className={zoom >= 10 ? 'h-3 w-3' : 'h-4 w-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
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
            {showIndividualJobs ? (
              <>
                <div className="flex items-center gap-2">
                  <div className={`rounded-full ${
                    zoom >= 10 ? 'w-2 h-2' : 'w-3 h-3'
                  }`} style={{ backgroundColor: '#1d4ed8' }}></div>
                  <span className={`text-gray-600 ${
                    zoom >= 10 ? 'text-xs' : 'text-xs'
                  }`}>Individual Job</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`rounded-full bg-orange-600 ${
                    zoom >= 10 ? 'w-2 h-2' : 'w-3 h-3'
                  }`}></div>
                  <span className={`text-gray-600 ${
                    zoom >= 10 ? 'text-xs' : 'text-xs'
                  }`}>Your Location</span>
                </div>
                <div className="pt-1 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className={`rounded-full bg-blue-600 ${
                      zoom >= 10 ? 'w-2 h-2' : 'w-3 h-3'
                    }`} style={{ background: 'linear-gradient(45deg, #3b82f6, #1e3a8a)' }}></div>
                    <span className={`text-gray-600 ${
                      zoom >= 10 ? 'text-xs' : 'text-xs'
                    }`}>Clusters (zoom out)</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className={`rounded-full bg-blue-800 ${
                    zoom >= 10 ? 'w-2 h-2' : 'w-3 h-3'
                  }`}></div>
                  <span className={`text-gray-600 ${
                    zoom >= 10 ? 'text-xs' : 'text-xs'
                  }`}>High (10+ jobs)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`rounded-full bg-blue-600 ${
                    zoom >= 10 ? 'w-2 h-2' : 'w-3 h-3'
                  }`}></div>
                  <span className={`text-gray-600 ${
                    zoom >= 10 ? 'text-xs' : 'text-xs'
                  }`}>Medium (3-9 jobs)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`rounded-full bg-blue-400 ${
                    zoom >= 10 ? 'w-2 h-2' : 'w-3 h-3'
                  }`}></div>
                  <span className={`text-gray-600 ${
                    zoom >= 10 ? 'text-xs' : 'text-xs'
                  }`}>Low (1-2 jobs)</span>
                </div>
                <div className="pt-1 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className={`rounded-full bg-orange-600 ${
                      zoom >= 10 ? 'w-2 h-2' : 'w-3 h-3'
                    }`}></div>
                    <span className={`text-gray-600 ${
                      zoom >= 10 ? 'text-xs' : 'text-xs'
                    }`}>Your Location</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Location Detail Card - Inside Map Container */}
      {showLocationCard && locationCardData && (
        <div className={`absolute z-[1000] ${
          zoom >= 10 ? 'top-2 left-2 w-72' : 'top-20 left-4 w-80'
        }`}>
          <div className="bg-white/95 backdrop-blur-sm border-0 shadow-xl rounded-lg animate-fade-in max-h-[calc(100vh-120px)] overflow-hidden">
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
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{locationCardData.name}</h3>
                      <p className="text-blue-100 text-sm">{locationCardData.state}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <svg className="h-4 w-4 text-blue-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                        </svg>
                        <span className="text-xl font-bold text-white">
                          {locationCardData.jobCount}
                        </span>
                      </div>
                      <p className="text-blue-100 text-xs">Job{locationCardData.jobCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(100vh-200px)]">
              {/* Available Jobs */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Available roles</p>
                <div className="space-y-1 overflow-y-auto max-h-40 pr-2">
                  {locationCardData.jobs.map((job, index) => (
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
                </div>
              </div>
              
              {/* Google Maps Link */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <a
                  href={`https://www.google.com/maps?q=${locationCardData.lat},${locationCardData.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  Open in Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SimpleLeafletMap; 