import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MapPin, Calendar, Star, Award, UserCheck, X } from 'lucide-react';
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
  avatar?: string;
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
    criteriaFulfilled: ['Age >18', 'Electrical Degree', 'Safety Certified', 'Experience >2yr']
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
    criteriaFulfilled: ['Age >18', 'Welding Diploma', 'Experience >3yr', 'Health Certificate']
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
    criteriaFulfilled: ['Age >21', 'Physical Fitness', 'No Criminal Record']
  }
];

interface CandidateListViewProps {
  searchQuery: string;
}

const CandidateListView: React.FC<CandidateListViewProps> = ({ searchQuery }) => {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

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

  const filteredCandidates = mockCandidates.filter(candidate =>
    candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.appliedFor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCardClick = (candidate: Candidate, event: React.MouseEvent) => {
    // Don't open dialog if clicking on action buttons
    const target = event.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    setSelectedCandidate(candidate);
  };

  const handleShortlist = (candidateId: string) => {
    console.log('Shortlisting candidate:', candidateId);
    // Add shortlist logic here
  };

  const handleReject = (candidateId: string) => {
    console.log('Rejecting candidate:', candidateId);
    // Add reject logic here
  };

  return (
    <TooltipProvider>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCandidates.map((candidate) => (
            <Card 
              key={candidate.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={(e) => handleCardClick(candidate, e)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                      {candidate.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold">{candidate.name}</h3>
                      <p className="text-sm text-muted-foreground">{candidate.appliedFor}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(candidate.status)}>
                    {candidate.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {candidate.location}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Applied on {new Date(candidate.applicationDate).toLocaleDateString()}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Award className="h-4 w-4" />
                  {candidate.experience} experience
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Trust: NA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Match: {candidate.matchScore}%</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Criteria Met:</p>
                  <CriteriaLabels criteria={candidate.criteriaFulfilled} maxVisible={2} />
                </div>

                <div className="flex flex-wrap gap-1">
                  {candidate.skills.slice(0, 2).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {candidate.skills.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{candidate.skills.length - 2} more
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleShortlist(candidate.id)}
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Shortlist Candidate</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleReject(candidate.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reject Application</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedCandidate && (
          <CandidateDetailDialog
            candidate={selectedCandidate}
            isOpen={!!selectedCandidate}
            onClose={() => setSelectedCandidate(null)}
          />
        )}
      </div>
    </TooltipProvider>
  );
};

export default CandidateListView;
