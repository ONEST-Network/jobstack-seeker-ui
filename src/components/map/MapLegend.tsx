
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface MapLegendProps {
  showDensityLegend?: boolean;
  activeFilters?: string[];
  onFilterClick?: (filter: string) => void;
}

const MapLegend: React.FC<MapLegendProps> = ({ 
  showDensityLegend = true, 
  activeFilters = [],
  onFilterClick 
}) => {
  const quickFilters = [
    { label: 'Full-time', value: 'full-time' },
    { label: 'Part-time', value: 'part-time' },
    { label: 'Remote', value: 'remote' },
    { label: 'Entry Level', value: 'entry-level' }
  ];

  return (
    <>
      {/* Density Legend */}
      {showDensityLegend && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg z-30">
          <h3 className="font-semibold mb-3 text-sm">Job Density</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>High (10K+ jobs)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Medium (5K-10K jobs)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Low (Under 5K jobs)</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Filters */}
      <div className="absolute bottom-4 right-4 flex flex-wrap gap-2 z-30">
        {quickFilters.map((filter) => (
          <Badge
            key={filter.value}
            variant={activeFilters.includes(filter.value) ? 'default' : 'outline'}
            className="bg-white/95 backdrop-blur-sm cursor-pointer hover:bg-white transition-colors border-0 shadow-sm"
            onClick={() => onFilterClick?.(filter.value)}
          >
            {filter.label}
          </Badge>
        ))}
      </div>
    </>
  );
};

export default MapLegend;
