
import React, { useState, useRef, useEffect } from 'react';
import { MapPin } from 'lucide-react';

interface MapContainerProps {
  zoomLevel: number;
  onLocationClick: (location: any) => void;
  jobLocations: any[];
  selectedLocation: any;
}

const MapContainer: React.FC<MapContainerProps> = ({ 
  zoomLevel, 
  onLocationClick, 
  jobLocations, 
  selectedLocation 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [mapPosition, setMapPosition] = useState({ x: 0, y: 0 });
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;
    
    setMapPosition(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getDensityColor = (density: string) => {
    switch (density) {
      case 'high': return 'bg-red-500 hover:bg-red-600';
      case 'medium': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'low': return 'bg-green-500 hover:bg-green-600';
      default: return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  const getMarkerSize = (jobs: number, zoom: number) => {
    const baseSize = Math.min(Math.max(jobs / 1000, 1), 3);
    const zoomMultiplier = Math.max(zoom / 6, 0.5);
    const size = baseSize * zoomMultiplier;
    
    if (size > 2.5) return 'w-8 h-8 text-sm';
    if (size > 1.5) return 'w-6 h-6 text-xs';
    return 'w-4 h-4 text-xs';
  };

  return (
    <div 
      ref={mapRef}
      className="relative w-full h-full bg-gradient-to-br from-blue-50 via-green-50 to-slate-100 overflow-hidden cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        transform: `scale(${Math.max(zoomLevel / 6, 0.5)}) translate(${mapPosition.x}px, ${mapPosition.y}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* India Map SVG Background */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none" 
        viewBox="0 0 1000 800"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern id="mapGrid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="0.5" opacity="0.3"/>
          </pattern>
          <filter id="mapShadow">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.1"/>
          </filter>
          <linearGradient id="indiaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.12)" />
            <stop offset="50%" stopColor="rgba(16, 185, 129, 0.08)" />
            <stop offset="100%" stopColor="rgba(245, 158, 11, 0.10)" />
          </linearGradient>
        </defs>
        
        {/* Grid Background */}
        <rect width="100%" height="100%" fill="url(#mapGrid)" />
        
        {/* Detailed India Map Outline */}
        <g fill="url(#indiaGradient)" stroke="#64748b" strokeWidth="1.5" filter="url(#mapShadow)">
          {/* Main India Outline */}
          <path d="M 320 120 
                   L 340 115 L 360 112 L 380 110 L 400 108 L 420 107 L 440 106 L 460 105 L 480 104 L 500 103 
                   L 520 102 L 540 101 L 560 100 L 580 99 L 600 98 L 620 97 L 640 96 L 660 95 
                   L 680 94 L 700 93 L 720 94 L 740 96 L 750 100 L 760 105 L 770 112 L 780 120 
                   L 785 130 L 790 140 L 795 152 L 800 165 L 805 180 L 810 195 L 815 210 
                   L 820 225 L 822 240 L 824 255 L 825 270 L 826 285 L 827 300 L 828 315 
                   L 829 330 L 830 345 L 831 360 L 832 375 L 833 390 L 834 405 L 835 420 
                   L 834 435 L 832 450 L 830 465 L 826 480 L 820 495 L 812 510 L 802 525 
                   L 790 540 L 776 555 L 760 570 L 742 585 L 722 600 L 700 615 L 676 630 
                   L 650 645 L 622 660 L 592 675 L 560 690 L 526 705 L 490 720 L 452 735 
                   L 412 750 L 370 765 L 326 780 L 280 795 L 250 790 L 230 780 L 215 765 
                   L 205 745 L 200 720 L 198 695 L 200 670 L 205 645 L 212 620 L 220 595 
                   L 230 570 L 242 545 L 256 520 L 272 495 L 290 470 L 310 445 L 315 420 
                   L 318 395 L 320 370 L 319 345 L 318 320 L 316 295 L 314 270 L 312 245 
                   L 310 220 L 308 195 L 306 170 L 308 145 L 312 130 Z" />
          
          {/* Kashmir Region */}
          <path d="M 320 120 L 340 110 L 360 105 L 380 100 L 400 95 L 420 92 L 440 90 
                   L 460 88 L 480 86 L 500 85 L 520 84 L 540 83 L 560 82 L 580 81 
                   L 600 80 L 620 79 L 640 78 L 660 77 L 680 76 L 700 75 L 720 76 
                   L 740 78 L 750 82 L 760 87 L 770 94 L 780 102 L 785 112 L 790 122 
                   L 780 130 L 770 135 L 750 140 L 730 142 L 710 144 L 690 145 
                   L 670 146 L 650 147 L 630 148 L 610 149 L 590 150 L 570 151 
                   L 550 152 L 530 153 L 510 154 L 490 155 L 470 156 L 450 157 
                   L 430 158 L 410 159 L 390 160 L 370 161 L 350 162 L 330 163 
                   L 325 155 L 322 145 L 320 135 L 320 125 Z" />
          
          {/* Northeast States */}
          <path d="M 700 200 L 720 195 L 740 190 L 760 185 L 780 180 L 800 175 
                   L 820 170 L 840 165 L 860 160 L 880 155 L 900 150 L 920 145 
                   L 940 140 L 960 135 L 980 130 L 975 150 L 970 170 L 965 190 
                   L 960 210 L 955 230 L 950 250 L 945 270 L 940 290 L 935 310 
                   L 930 330 L 920 350 L 900 360 L 880 365 L 860 370 L 840 375 
                   L 820 380 L 800 385 L 780 390 L 760 395 L 740 400 L 720 405 
                   L 700 410 L 705 390 L 710 370 L 715 350 L 720 330 L 725 310 
                   L 730 290 L 735 270 L 740 250 L 745 230 L 750 210 L 745 200 
                   L 725 200 L 700 200 Z" />
          
          {/* Sri Lanka */}
          <path d="M 380 780 L 400 775 L 420 770 L 440 765 L 460 760 L 480 755 
                   L 500 750 L 520 745 L 540 740 L 560 735 L 580 730 L 600 725 
                   L 620 720 L 640 715 L 660 710 L 680 705 L 700 700 L 720 695 
                   L 740 690 L 760 685 L 780 680 L 790 700 L 795 720 L 800 740 
                   L 805 760 L 810 780 L 815 800 L 810 820 L 800 835 L 785 845 
                   L 765 850 L 745 855 L 725 860 L 705 865 L 685 870 L 665 875 
                   L 645 880 L 625 885 L 605 890 L 585 895 L 565 900 L 545 905 
                   L 525 910 L 505 915 L 485 920 L 465 925 L 445 930 L 425 935 
                   L 405 940 L 385 945 L 365 950 L 345 955 L 325 960 L 305 965 
                   L 285 970 L 265 975 L 245 980 L 225 985 L 205 990 L 185 995 
                   L 165 1000 L 170 980 L 175 960 L 180 940 L 185 920 L 190 900 
                   L 195 880 L 200 860 L 205 840 L 210 820 L 215 800 L 220 785 
                   L 240 785 L 260 785 L 280 785 L 300 785 L 320 785 L 340 785 
                   L 360 785 L 380 785 Z" />
        </g>
        
        {/* State Boundaries with more detail */}
        <g stroke="#94a3b8" strokeWidth="0.8" fill="none" opacity="0.4">
          {/* Rajasthan */}
          <path d="M 280 200 L 350 210 L 420 220 L 480 230 L 450 290 L 380 300 L 310 290 L 280 240 Z" />
          {/* Gujarat */}
          <path d="M 200 300 L 280 310 L 350 320 L 380 380 L 320 400 L 240 390 L 180 360 L 180 320 Z" />
          {/* Maharashtra */}
          <path d="M 350 350 L 450 360 L 520 370 L 550 430 L 480 480 L 380 470 L 320 430 L 330 380 Z" />
          {/* Karnataka */}
          <path d="M 380 480 L 480 490 L 550 500 L 580 560 L 520 620 L 430 610 L 360 580 L 360 520 Z" />
          {/* Tamil Nadu */}
          <path d="M 480 620 L 570 630 L 620 680 L 580 740 L 500 750 L 420 740 L 380 690 L 420 640 Z" />
          {/* Kerala */}
          <path d="M 360 620 L 420 630 L 480 640 L 500 700 L 460 760 L 400 770 L 340 760 L 320 700 L 340 650 Z" />
          {/* Andhra Pradesh */}
          <path d="M 520 470 L 600 480 L 670 490 L 700 550 L 650 610 L 570 620 L 500 600 L 480 530 Z" />
          {/* Odisha */}
          <path d="M 600 350 L 680 360 L 720 420 L 680 480 L 600 470 L 540 450 L 550 390 Z" />
          {/* West Bengal */}
          <path d="M 680 280 L 750 290 L 780 350 L 750 410 L 680 400 L 630 370 L 650 320 Z" />
          {/* Jharkhand */}
          <path d="M 620 290 L 680 300 L 720 330 L 690 380 L 630 370 L 580 350 L 590 320 Z" />
          {/* Bihar */}
          <path d="M 580 250 L 650 260 L 700 270 L 720 320 L 670 330 L 610 320 L 560 300 Z" />
          {/* Uttar Pradesh */}
          <path d="M 480 200 L 580 210 L 650 220 L 700 250 L 650 300 L 550 290 L 480 270 L 460 230 Z" />
          {/* Madhya Pradesh */}
          <path d="M 420 270 L 520 280 L 600 290 L 650 330 L 580 380 L 480 370 L 400 350 L 380 310 Z" />
          {/* Chhattisgarh */}
          <path d="M 550 350 L 620 360 L 670 380 L 650 430 L 580 440 L 520 420 L 510 380 Z" />
          {/* Punjab */}
          <path d="M 380 150 L 450 160 L 500 170 L 520 210 L 470 220 L 410 210 L 360 190 Z" />
          {/* Haryana */}
          <path d="M 450 170 L 520 180 L 580 190 L 600 230 L 540 240 L 480 230 L 440 210 Z" />
          {/* Delhi */}
          <path d="M 520 190 L 540 195 L 560 200 L 570 220 L 550 230 L 530 225 L 510 210 Z" />
        </g>
      </svg>

      {/* Job Location Markers */}
      {jobLocations.map((location) => (
        <div
          key={location.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
          style={{
            left: `${(location.lng - 65) * 8 + 30}%`,
            top: `${(35 - location.lat) * 8 + 20}%`,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onLocationClick(location);
          }}
        >
          {/* Marker Pin */}
          <div className={`${getMarkerSize(location.jobs, zoomLevel)} ${getDensityColor(location.density)} 
                         rounded-full border-2 border-white shadow-lg flex items-center justify-center
                         transform transition-all duration-200 group-hover:scale-125 group-hover:shadow-xl
                         ${selectedLocation?.id === location.id ? 'scale-125 ring-2 ring-blue-400' : ''}`}>
            <MapPin className="w-3 h-3 text-white" />
          </div>
          
          {/* Hover Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                          bg-white rounded-lg px-3 py-2 shadow-xl border
                          opacity-0 group-hover:opacity-100 transition-all duration-200 z-20
                          min-w-max">
            <div className="text-sm font-semibold text-gray-900">{location.name}</div>
            <div className="text-xs text-gray-600">{location.jobs.toLocaleString()} jobs</div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 
                           border-4 border-transparent border-t-white"></div>
          </div>
          
          {/* Pulse Animation for High Density */}
          {location.density === 'high' && (
            <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20"></div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MapContainer;
