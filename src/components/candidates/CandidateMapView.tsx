import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Star, Award } from 'lucide-react';
import CandidateDetailDialog from './CandidateDetailDialog';
import CriteriaLabels from './CriteriaLabels';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  appliedFor: string;
  applicationDate: string;
  status: 'applied' | 'reviewed' | 'shortlisted' | 'interview' | 'hired' | 'rejected';
  trustScore: number;
  matchScore: number;
  experience: string;
  skills: string[];
  criteriaFulfilled: string[];
  coordinates: [number, number];
}

const mockCandidates: Candidate[] = [
  {
    id: '1',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@email.com',
    phone: '+91 9876543210',
    location: 'Mumbai, Maharashtra',
    appliedFor: 'Electrical Technician',
    applicationDate: '2024-06-10',
    status: 'applied',
    trustScore: 92,
    matchScore: 88,
    experience: '3 years',
    skills: ['Electrical Wiring', 'Motor Repair', 'Safety Protocols'],
    criteriaFulfilled: ['Age >18', 'Electrical Degree', 'Safety Certified', 'Experience >2yr'],
    coordinates: [72.8777, 19.0760]
  },
  {
    id: '2',
    name: 'Priya Patel',
    email: 'priya.patel@email.com',
    phone: '+91 9876543211',
    location: 'Ahmedabad, Gujarat',
    appliedFor: 'Welder',
    applicationDate: '2024-06-09',
    status: 'shortlisted',
    trustScore: 95,
    matchScore: 92,
    experience: '5 years',
    skills: ['Arc Welding', 'MIG Welding', 'Blueprint Reading'],
    criteriaFulfilled: ['Age >18', 'Welding Diploma', 'Experience >3yr', 'Health Certificate'],
    coordinates: [72.5714, 23.0225]
  },
  {
    id: '3',
    name: 'Amit Kumar',
    email: 'amit.kumar@email.com',
    phone: '+91 9876543212',
    location: 'Delhi, Delhi',
    appliedFor: 'Security Guard',
    applicationDate: '2024-06-08',
    status: 'interview',
    trustScore: 89,
    matchScore: 85,
    experience: '2 years',
    skills: ['Security Protocols', 'CCTV Monitoring', 'Physical Fitness'],
    criteriaFulfilled: ['Age >21', 'Physical Fitness', 'No Criminal Record'],
    coordinates: [77.1025, 28.7041]
  }
];

interface CandidateMapViewProps {
  searchQuery: string;
}

const CandidateMapView: React.FC<CandidateMapViewProps> = ({ searchQuery }) => {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [hoveredCandidate, setHoveredCandidate] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted': return 'bg-green-100 text-green-800';
      case 'interview': return 'bg-purple-100 text-purple-800';
      case 'hired': return 'bg-emerald-100 text-emerald-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCandidates = mockCandidates.filter(candidate => {
    if (!searchQuery.trim()) return true;
    
    const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(term => term.length > 0);
    if (searchTerms.length === 0) return true;

    const searchableFields = [
      candidate.name || '',
      candidate.appliedFor || '',
      candidate.location || '',
      candidate.email || '',
      candidate.phone || '',
      candidate.experience || '',
      ...(candidate.skills || [])
    ].map(field => field.toLowerCase());

    // Check if all search terms are found in any of the searchable fields
    return searchTerms.every(term => 
      searchableFields.some(field => field.includes(term))
    );
  });

  const handleCandidateCardClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Candidate Locations
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full p-0">
              <div className="relative w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center p-8">
                  <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Interactive Map View</p>
                  <p className="text-sm text-gray-500">
                    Candidate locations would be displayed here with markers
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-2">
                    {filteredCandidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        className={`p-2 bg-white rounded border cursor-pointer transition-colors ${
                          hoveredCandidate === candidate.id ? 'bg-blue-50 border-blue-300' : ''
                        }`}
                        onMouseEnter={() => setHoveredCandidate(candidate.id)}
                        onMouseLeave={() => setHoveredCandidate(null)}
                        onClick={() => handleCandidateCardClick(candidate)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{candidate.name}</span>
                          <span className="text-xs text-gray-500">{candidate.location}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Candidate List Section */}
        <div className="space-y-4 overflow-y-auto">
          <h3 className="font-semibold">Candidates ({filteredCandidates.length})</h3>
          {filteredCandidates.map((candidate) => (
            <Card 
              key={candidate.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                hoveredCandidate === candidate.id ? 'ring-2 ring-blue-300' : ''
              }`}
              onMouseEnter={() => setHoveredCandidate(candidate.id)}
              onMouseLeave={() => setHoveredCandidate(null)}
              onClick={() => handleCandidateCardClick(candidate)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                      {candidate.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{candidate.name}</h4>
                      <p className="text-xs text-muted-foreground">{candidate.appliedFor}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(candidate.status)}>
                    {candidate.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {candidate.location}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Award className="h-3 w-3" />
                    {candidate.experience} experience
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span>Trust: 0/10</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-green-500" />
                      <span>Match: {candidate.matchScore}%</span>
                    </div>
                  </div>

                  <div className="mt-2">
                    <CriteriaLabels criteria={candidate.criteriaFulfilled} maxVisible={2} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {selectedCandidate && (
        <CandidateDetailDialog
          candidate={selectedCandidate}
          isOpen={!!selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </div>
  );
};

export default CandidateMapView;
