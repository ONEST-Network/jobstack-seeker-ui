
import React from 'react';
import { MapPin, X, Briefcase, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface LocationDetailCardProps {
  location: any;
  onClose: () => void;
  onViewJobs: (location: any) => void;
  onSetAlert: () => void;
}

const LocationDetailCard: React.FC<LocationDetailCardProps> = ({
  location,
  onClose,
  onViewJobs,
  onSetAlert
}) => {
  const getDensityBadgeColor = (density: string) => {
    switch (density) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getGrowthPercentage = () => {
    // Mock growth calculation based on density
    switch (location.density) {
      case 'high': return '+12%';
      case 'medium': return '+8%';
      case 'low': return '+5%';
      default: return '+3%';
    }
  };

  return (
    <Card className="absolute top-4 left-4 w-80 bg-white/95 backdrop-blur-sm border-0 shadow-xl z-40 animate-fade-in">
      <CardContent className="p-0">
        {/* Header */}
        <div className="relative p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{location.name}</h3>
              <p className="text-blue-100 text-sm">{location.state}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Job Stats */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="h-4 w-4 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">
                  {location.jobs.toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-600">Active job openings</p>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-1 text-green-600 mb-1">
                <TrendingUp className="h-3 w-3" />
                <span className="text-sm font-medium">{getGrowthPercentage()}</span>
              </div>
              <p className="text-xs text-gray-500">This month</p>
            </div>
          </div>

          {/* Density Badge */}
          <div className="flex items-center gap-2">
            <Badge className={getDensityBadgeColor(location.density)}>
              {location.density.charAt(0).toUpperCase() + location.density.slice(1)} density
            </Badge>
            <div className="h-1 flex-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  location.density === 'high' ? 'bg-red-500' :
                  location.density === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${location.density === 'high' ? 90 : location.density === 'medium' ? 60 : 30}%` }}
              />
            </div>
          </div>

          {/* Top Job Categories */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Popular roles</p>
            <div className="flex flex-wrap gap-1">
              {['Electrician', 'Driver', 'Security'].map((role) => (
                <Badge key={role} variant="outline" className="text-xs">
                  {role}
                </Badge>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              className="flex-1" 
              onClick={() => onViewJobs(location)}
            >
              View Jobs
            </Button>
            <Button 
              variant="outline" 
              onClick={onSetAlert}
              className="px-3"
            >
              Set Alert
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationDetailCard;
