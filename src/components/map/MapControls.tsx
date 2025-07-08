
import React from 'react';
import { ZoomIn, ZoomOut, Layers, Navigation, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MapControlsProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleLayers: () => void;
  onFindMyLocation: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const MapControls: React.FC<MapControlsProps> = ({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onToggleLayers,
  onFindMyLocation,
  searchQuery,
  onSearchChange
}) => {
  return (
    <>
      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-30">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search locations, companies..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-white/95 backdrop-blur-sm border-0 shadow-lg"
          />
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-20 right-4 flex flex-col gap-1 z-30">
        <Button
          size="icon"
          variant="outline"
          className="bg-white/95 backdrop-blur-sm border-0 shadow-lg hover:bg-white"
          onClick={onZoomIn}
          disabled={zoomLevel >= 10}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="bg-white/95 backdrop-blur-sm border-0 shadow-lg hover:bg-white"
          onClick={onZoomOut}
          disabled={zoomLevel <= 1}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Layer Controls */}
      <div className="absolute bottom-20 right-4 flex flex-col gap-1 z-30">
        <Button
          size="icon"
          variant="outline"
          className="bg-white/95 backdrop-blur-sm border-0 shadow-lg hover:bg-white"
          onClick={onToggleLayers}
        >
          <Layers className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="bg-white/95 backdrop-blur-sm border-0 shadow-lg hover:bg-white"
          onClick={onFindMyLocation}
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      {/* Zoom Level Indicator */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg z-30">
        <div className="text-xs text-muted-foreground">
          Zoom: {zoomLevel}/10
        </div>
      </div>
    </>
  );
};

export default MapControls;
