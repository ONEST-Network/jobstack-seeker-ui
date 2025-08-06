import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserCheck, X, Star, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
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

interface CandidateTableViewProps {
  searchQuery: string;
}

type SortField = 'trustScore' | 'matchScore' | null;
type SortDirection = 'asc' | 'desc';

const CandidateTableView: React.FC<CandidateTableViewProps> = ({ searchQuery }) => {
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (sortDirection === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCandidates(sortedCandidates.map(c => c.id));
    } else {
      setSelectedCandidates([]);
    }
  };

  const handleSelectCandidate = (candidateId: string, checked: boolean) => {
    if (checked) {
      setSelectedCandidates(prev => [...prev, candidateId]);
    } else {
      setSelectedCandidates(prev => prev.filter(id => id !== candidateId));
    }
  };

  const handleRowClick = (candidate: Candidate, event: React.MouseEvent) => {
    // Don't open dialog if clicking on checkbox or action buttons
    const target = event.target as HTMLElement;
    if (target.closest('input[type="checkbox"]') || target.closest('button')) {
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
        {/* Bulk Actions */}
        {selectedCandidates.length > 0 && (
          <div className="mb-4 p-4 bg-muted rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedCandidates.length} candidate(s) selected
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                Shortlist Selected
              </Button>
              <Button size="sm" variant="destructive">
                Reject Selected
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedCandidates.length === sortedCandidates.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Applied For</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead 
                  className="text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('trustScore')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Trust Score
                    {getSortIcon('trustScore')}
                  </div>
                </TableHead>
                <TableHead 
                  className="text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('matchScore')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Match Score
                    {getSortIcon('matchScore')}
                  </div>
                </TableHead>
                <TableHead>Criteria Met</TableHead>
                <TableHead>Applied Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCandidates.map((candidate) => (
                <TableRow 
                  key={candidate.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={(e) => handleRowClick(candidate, e)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedCandidates.includes(candidate.id)}
                      onCheckedChange={(checked) => 
                        handleSelectCandidate(candidate.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                        {candidate.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{candidate.name}</p>
                        <p className="text-sm text-muted-foreground">{candidate.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{candidate.appliedFor}</TableCell>
                  <TableCell>{candidate.location}</TableCell>
                  <TableCell>{candidate.experience}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(candidate.status)}>
                      {candidate.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">NA</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{candidate.matchScore}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <CriteriaLabels criteria={candidate.criteriaFulfilled} maxVisible={2} />
                  </TableCell>
                  <TableCell>
                    {new Date(candidate.applicationDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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

export default CandidateTableView;
