import React, { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default markers in React-Leaflet
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

interface LeafletMapProps {
  jobLocations?: JobLocation[];
  onLocationClick?: (location: JobLocation) => void;
  selectedLocation?: JobLocation | null;
  className?: string;
  mapCenter?: LatLng;
  userLocation?: LatLng | null;
  zoom?: number;
}

// Custom hook to update map center and zoom
function MapUpdater({ center, zoom }: { center: LatLng; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      map.setView([center.lat, center.lng], zoom, { animate: true });
    }
  }, [center.lat, center.lng, zoom, map]);
  
  return null;
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

const LeafletMap: React.FC<LeafletMapProps> = ({
  jobLocations = [],
  onLocationClick,
  selectedLocation,
  className = "w-full h-full",
  mapCenter = { lat: 20.5937, lng: 78.9629 }, // Center of India
  userLocation,
  zoom = 5
}) => {
  // Memoize the map key to force re-render when needed
  const mapKey = useMemo(() => `${mapCenter.lat}-${mapCenter.lng}-${zoom}`, [mapCenter, zoom]);

  return (
    <div className={className}>
      <MapContainer
        key={mapKey}
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        {/* Conditional Tile Layer */}
        {(() => {
          const useGoogleMaps = import.meta.env.VITE_USE_GOOGLE_MAPS === 'true';
          const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

          if (useGoogleMaps && googleApiKey) {
            return (
              <TileLayer
                attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
                url={`https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${googleApiKey}`}
                maxZoom={20}
              />
            );
          } else {
            return (
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
            );
          }
        })()}
        
        <MapUpdater center={mapCenter} zoom={zoom} />
        
        {/* Job Location Markers */}
        {jobLocations.map((location) => (
          <Marker
            key={location.id}
            position={[location.lat, location.lng]}
            icon={createCustomIcon(location.density, location.jobCount)}
            eventHandlers={{
              click: () => onLocationClick?.(location),
            }}
          >
            <Popup closeOnClick={false} autoClose={false}>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-sm mb-1">{location.name}</h3>
                <p className="text-xs text-gray-600 mb-2">{location.state}</p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{location.jobCount} job{location.jobCount !== 1 ? 's' : ''}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    location.density === 'high' ? 'bg-red-100 text-red-800' :
                    location.density === 'medium' ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {location.density} density
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  {location.jobs.slice(0, 2).map((job, index) => (
                    <div key={index}>• {job.title}</div>
                  ))}
                  {location.jobs.length > 2 && (
                    <div>• +{location.jobs.length - 2} more roles</div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={createUserIcon()}
          >
            <Popup>
              <div className="p-2 text-center">
                <div className="text-sm font-medium text-blue-600">Your Location</div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default LeafletMap; 