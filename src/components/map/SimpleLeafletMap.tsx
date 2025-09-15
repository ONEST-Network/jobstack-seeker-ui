import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Search, ZoomIn, ZoomOut, Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';

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
}

// Create custom icons for different job densities
const createCustomIcon = (density: 'high' | 'medium' | 'low', jobCount: number) => {
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

// User location marker
const createUserIcon = (t: any) => {
  return L.divIcon({
    className: 'user-marker',
    html: `
      <div style="
        background-color: #dc2626;
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
          background: #dc2626;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          white-space: nowrap;
        ">
          ${t('map.you')}
        </div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

// Cluster icon
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

const SimpleLeafletMap: React.FC<SimpleLeafletMapProps> = (props) => {
  const { t } = useTranslation("simplsleafletmap");
  const {
    jobLocations = [],
    onLocationClick,
    className = "w-full h-full",
    mapCenter = { lat: 20.5937, lng: 78.9629 },
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
    onClearSearch
  } = props;

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, { zoomControl: false }).setView([mapCenter.lat, mapCenter.lng], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: true,
      zoomToBoundsOnClick: true,
      iconCreateFunction: createClusterIcon,
      animate: true,
    });

    clusterGroupRef.current = clusterGroup;
    map.addLayer(clusterGroup);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapCenter, zoom]);

  // Job markers
  useEffect(() => {
    if (!mapInstanceRef.current || !clusterGroupRef.current) return;

    clusterGroupRef.current.clearLayers();

    jobLocations.forEach((loc) => {
      const marker = L.marker([loc.lat, loc.lng], {
        icon: createCustomIcon(loc.density, loc.jobCount),
      });

      marker.bindPopup(`
        <div style="padding: 8px;">
          <h3>${loc.name}</h3>
          <p>${loc.jobCount} ${t('map.jobs')}</p>
          <a href="https://www.google.com/maps?q=${loc.lat},${loc.lng}" target="_blank">
            ${t('map.openInGoogleMaps')}
          </a>
        </div>
      `);

      marker.on('click', () => onLocationClick?.(loc));
      clusterGroupRef.current?.addLayer(marker);
    });

    if (userLocation) {
      if (userMarkerRef.current) {
        mapInstanceRef.current.removeLayer(userMarkerRef.current);
      }
      const userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: createUserIcon(t),
      });
      userMarker.bindPopup(`<div>${t('map.yourLocation')}</div>`);
      userMarker.addTo(mapInstanceRef.current);
      userMarkerRef.current = userMarker;
    }
  }, [jobLocations, userLocation, t, onLocationClick]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full" />

      {/* Search Bar */}
      <div className="absolute top-4 left-4 bg-white p-2 rounded shadow">
        <Input
          placeholder={loading ? t('map.loading') : t('map.searchPlaceholder')}
          value={mapSearchQuery}
          onChange={(e) => onMapSearchChange?.(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && mapSearchQuery.trim()) {
              onLocationSearch?.(mapSearchQuery);
            }
          }}
        />
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button onClick={onZoomIn}><ZoomIn /></Button>
        <Button onClick={onZoomOut}><ZoomOut /></Button>
        <Button onClick={onFindMyLocation} disabled={locating}><Navigation /></Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-2 rounded shadow text-xs">
        <p className="font-semibold">{t('map.density')}</p>
        <p>{t('map.high')}</p>
        <p>{t('map.medium')}</p>
        <p>{t('map.low')}</p>
      </div>
    </div>
  );
};

export default SimpleLeafletMap;
