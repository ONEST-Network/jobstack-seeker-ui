
import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Plus, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CandidateSelectorProps {
  onAddCandidate: () => void;
}

const CandidateSelector: React.FC<CandidateSelectorProps> = ({ onAddCandidate }) => {
  const { user, selectCandidate, getSelectedCandidate } = useAuth();
  const selectedCandidate = getSelectedCandidate();

  if (!user || user.role !== 'individual' || user.managedCandidates.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <User className="h-4 w-4" />
          <span className="font-medium">
            {selectedCandidate?.nickname || selectedCandidate?.name || 'Select Profile'}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="p-2">
          <div className="text-sm font-medium text-muted-foreground mb-2">Switch Profile</div>
          {user.managedCandidates.map((candidate) => (
            <DropdownMenuItem
              key={candidate.id}
              onClick={() => selectCandidate(candidate.id)}
              className={`flex items-center justify-between p-2 ${
                selectedCandidate?.id === candidate.id ? 'bg-accent' : ''
              }`}
            >
              <div className="flex flex-col">
                <span className="font-medium">{candidate.nickname || candidate.name}</span>
                <span className="text-xs text-muted-foreground">
                  {candidate.interestedRole || 'No role specified'}
                </span>
              </div>
              {selectedCandidate?.id === candidate.id && (
                <Badge variant="secondary" className="text-xs">Active</Badge>
              )}
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onAddCandidate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Profile
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CandidateSelector;
