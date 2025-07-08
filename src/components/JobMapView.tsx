
import React, { useState } from 'react';
import { toast } from 'sonner';
import MapContainer from './map/MapContainer';
import MapControls from './map/MapControls';
import MapLegend from './map/MapLegend';
import LocationDetailCard from './map/LocationDetailCard';
import JobApplicationDialog from './JobApplicationDialog';

interface JobMapViewProps {
  searchQuery: string;
}

const JobMapView: React.FC<JobMapViewProps> = ({ searchQuery }) => {
  const [zoomLevel, setZoomLevel] = useState(6);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Mock job data
  const jobLocations = [
    { id: 1, name: 'Mumbai', state: 'Maharashtra', jobs: 15420, lat: 19.0760, lng: 72.8777, density: 'high' },
    { id: 2, name: 'Delhi', state: 'Delhi', jobs: 12350, lat: 28.6139, lng: 77.2090, density: 'high' },
    { id: 3, name: 'Bangalore', state: 'Karnataka', jobs: 9870, lat: 12.9716, lng: 77.5946, density: 'high' },
    { id: 4, name: 'Chennai', state: 'Tamil Nadu', jobs: 8450, lat: 13.0827, lng: 80.2707, density: 'medium' },
    { id: 5, name: 'Hyderabad', state: 'Telangana', jobs: 7230, lat: 17.3850, lng: 78.4867, density: 'medium' },
    { id: 6, name: 'Pune', state: 'Maharashtra', jobs: 6540, lat: 18.5204, lng: 73.8567, density: 'medium' },
    { id: 7, name: 'Ahmedabad', state: 'Gujarat', jobs: 5320, lat: 23.0225, lng: 72.5714, density: 'medium' },
    { id: 8, name: 'Surat', state: 'Gujarat', jobs: 4120, lat: 21.1702, lng: 72.8311, density: 'low' },
    { id: 9, name: 'Jaipur', state: 'Rajasthan', jobs: 3890, lat: 26.9124, lng: 75.7873, density: 'low' },
    { id: 10, name: 'Lucknow', state: 'Uttar Pradesh', jobs: 3450, lat: 26.8467, lng: 80.9462, density: 'low' },
  ];

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(10, prev + 1));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(1, prev - 1));
  };

  const handleToggleLayers = () => {
    toast.info('Layer controls coming soon!');
  };

  const handleFindMyLocation = () => {
    toast.success('Finding your location...');
    // Simulate location finding
    setTimeout(() => {
      setZoomLevel(8);
      toast.success('Location found!');
    }, 1000);
  };

  const handleLocationClick = (location: any) => {
    setSelectedLocation(location);
  };

  const handleViewJobs = (location: any) => {
    const mockJob = {
      id: 1,
      title: "Electrician",
      company: "PowerTech Solutions",
      location: `${location.name}, ${location.state}`,
      salary: "₹25,000 - ₹35,000",
      salaryPeriod: "monthly",
      type: "Full-time",
      experience: "2-5 years",
      description: "We are looking for a skilled electrician to join our team...",
      requirements: ["2+ years experience", "Valid electrical license", "Safety certification"],
      benefits: ["Health insurance", "Transportation", "Accommodation"]
    };
    setSelectedJob(mockJob);
  };

  const handleSetAlert = () => {
    toast.success('Job alert set for this location!');
  };

  const handleFilterClick = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
    toast.info(`Filter ${activeFilters.includes(filter) ? 'removed' : 'applied'}: ${filter}`);
  };

  return (
    <div className="relative h-[calc(100vh-140px)] bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
      {/* Map Container */}
      <MapContainer
        zoomLevel={zoomLevel}
        onLocationClick={handleLocationClick}
        jobLocations={jobLocations}
        selectedLocation={selectedLocation}
      />

      {/* Map Controls */}
      <MapControls
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onToggleLayers={handleToggleLayers}
        onFindMyLocation={handleFindMyLocation}
        searchQuery={mapSearchQuery}
        onSearchChange={setMapSearchQuery}
      />

      {/* Map Legend */}
      <MapLegend
        activeFilters={activeFilters}
        onFilterClick={handleFilterClick}
      />

      {/* Location Detail Card */}
      {selectedLocation && (
        <LocationDetailCard
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
          onViewJobs={handleViewJobs}
          onSetAlert={handleSetAlert}
        />
      )}

      {/* Job Application Dialog */}
      {selectedJob && (
        <JobApplicationDialog 
          job={selectedJob} 
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </div>
  );
};

export default JobMapView;
